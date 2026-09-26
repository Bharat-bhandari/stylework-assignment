import type { Prisma } from '@prisma/client';
import { prismaClient } from '../config/db.js';
import { diffLeadFields } from '../helper/leadActivity.js';
import { mapLeadFields } from '../helper/metaLeadMapper.js';
import { leadgenChangeValueSchema, type LeadgenChangeValue } from '../schema/metaWebhook.schema.js';
import { logger } from '../utils/logger.js';
import { getLeadProvider, type LeadDetails } from './leadProvider/index.js';

const WEBHOOK_ACTOR = 'meta-webhook';
const MAX_ATTEMPTS = 5;
const RETRY_AFTER_MS = 30_000;
const SWEEP_BATCH_SIZE = 25;

type ComparableLead = {
  pageId: string;
  formId: string;
  adId: string | null;
  campaignId: string | null;
  platform: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  answers: Record<string, string>;
  isTest: boolean;
};

const resolveLeadDetails = async (value: LeadgenChangeValue): Promise<LeadDetails> => {
  if (!value.field_data) {
    return getLeadProvider().fetchLead(value.leadgen_id, value);
  }

  return {
    leadgenId: value.leadgen_id,
    formId: value.form_id,
    adId: value.ad_id ?? null,
    campaignId: null,
    platform: null,
    createdTime: new Date(value.created_time * 1000),
    fieldData: value.field_data,
    raw: value,
  };
};

const toComparable = (value: LeadgenChangeValue, details: LeadDetails): ComparableLead => ({
  pageId: value.page_id,
  formId: details.formId ?? value.form_id,
  adId: details.adId ?? value.ad_id ?? null,
  campaignId: details.campaignId,
  platform: details.platform,
  ...mapLeadFields(details.fieldData),
});

const applyLeadDetails = async (
  value: LeadgenChangeValue,
  details: LeadDetails,
): Promise<void> => {
  const next = toComparable(value, details);
  const existing = await prismaClient.lead.findUnique({ where: { metaLeadId: value.leadgen_id } });

  if (!existing) {
    // The lead row and its first activity row are written together or not at all.
    const created = await prismaClient.$transaction(async (tx) => {
      const lead = await tx.lead.create({
        data: {
          metaLeadId: value.leadgen_id,
          ...next,
          rawData: details.raw,
          createdAt: details.createdTime,
        },
      });

      await tx.leadActivity.create({
        data: {
          leadId: lead.id,
          type: 'LEAD_CREATED',
          actor: WEBHOOK_ACTOR,
          toStatus: lead.status,
        },
      });

      return lead;
    });

    logger.info({ leadId: created.id, leadgenId: value.leadgen_id }, 'Lead created from webhook');
    return;
  }

  const current: ComparableLead = {
    pageId: existing.pageId,
    formId: existing.formId,
    adId: existing.adId,
    campaignId: existing.campaignId,
    platform: existing.platform,
    fullName: existing.fullName,
    email: existing.email,
    phone: existing.phone,
    answers: existing.answers as Record<string, string>,
    isTest: existing.isTest,
  };

  const changes = diffLeadFields(current, next);

  if (Object.keys(changes).length === 0) {
    logger.info({ leadId: existing.id, leadgenId: value.leadgen_id }, 'Redelivery changed nothing');
    return;
  }

  await prismaClient.$transaction(async (tx) => {
    await tx.lead.update({
      where: { id: existing.id },
      data: { ...next, rawData: details.raw },
    });

    await tx.leadActivity.create({
      data: {
        leadId: existing.id,
        type: 'LEAD_UPDATED',
        actor: WEBHOOK_ACTOR,
        changes: changes as Prisma.InputJsonValue,
      },
    });
  });

  logger.info(
    { leadId: existing.id, leadgenId: value.leadgen_id, fields: Object.keys(changes) },
    'Lead updated from webhook',
  );
};

export const processWebhookEvent = async (eventId: string): Promise<void> => {
  // Atomic claim: whichever caller flips the row out of RECEIVED/FAILED owns this event.
  const claim = await prismaClient.webhookEvent.updateMany({
    where: { id: eventId, status: { in: ['RECEIVED', 'FAILED'] } },
    data: { status: 'PROCESSING', attempts: { increment: 1 } },
  });

  if (claim.count === 0) return;

  try {
    const event = await prismaClient.webhookEvent.findUniqueOrThrow({ where: { id: eventId } });
    const value = leadgenChangeValueSchema.parse(event.payload);

    await applyLeadDetails(value, await resolveLeadDetails(value));

    await prismaClient.webhookEvent.update({
      where: { id: eventId },
      data: { status: 'PROCESSED', processedAt: new Date(), lastError: null },
    });
  } catch (error) {
    const lastError = error instanceof Error ? error.message : 'Unknown processing error';

    await prismaClient.webhookEvent.update({
      where: { id: eventId },
      data: { status: 'FAILED', lastError },
    });

    logger.error({ eventId, lastError }, 'Webhook event processing failed');
  }
};

export const sweepPendingWebhookEvents = async (): Promise<void> => {
  const events = await prismaClient.webhookEvent.findMany({
    where: {
      status: { in: ['RECEIVED', 'FAILED'] },
      attempts: { lt: MAX_ATTEMPTS },
      receivedAt: { lt: new Date(Date.now() - RETRY_AFTER_MS) },
    },
    orderBy: { receivedAt: 'asc' },
    take: SWEEP_BATCH_SIZE,
    select: { id: true },
  });

  if (events.length === 0) return;

  logger.info({ pending: events.length }, 'Retrying webhook events');

  // Sequential so a backlog cannot burst through the Graph API rate limit.
  for (const event of events) {
    await processWebhookEvent(event.id);
  }
};
