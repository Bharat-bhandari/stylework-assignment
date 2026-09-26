import type { Express } from 'express';
import request from 'supertest';
import { prismaClient } from '../../src/config/db.js';
import { env } from '../../src/config/env.js';
import { buildLeadgenPayload } from '../../src/helper/metaLeadPayload.js';
import { createMetaSignature } from '../../src/helper/metaSignature.js';

export const PAGE_ID = '104729384756102';
export const FORM_ID = '873625194038271';
export const AD_ID = '239847561029384';

export const samplePayload = (leadgenId: string, fields?: Record<string, string>) =>
  buildLeadgenPayload({
    leadgenId,
    pageId: PAGE_ID,
    formId: FORM_ID,
    adId: AD_ID,
    createdTime: 1_759_000_000,
    ...(fields === undefined ? {} : { fields }),
  });

export const postWebhook = (app: Express, payload: unknown, signature?: string) => {
  const rawBody = JSON.stringify(payload);

  return request(app)
    .post('/webhook/meta-lead')
    .set('content-type', 'application/json')
    .set('x-hub-signature-256', signature ?? createMetaSignature(rawBody, env.META_APP_SECRET))
    .send(rawBody);
};

export const resetDatabase = async (): Promise<void> => {
  await prismaClient.leadActivity.deleteMany();
  await prismaClient.lead.deleteMany();
  await prismaClient.webhookEvent.deleteMany();
};

export const waitFor = async <T>(
  check: () => Promise<T | null>,
  timeoutMs = 5_000,
): Promise<T> => {
  const deadline = Date.now() + timeoutMs;

  for (;;) {
    const result = await check();
    if (result !== null) return result;

    if (Date.now() > deadline) {
      throw new Error('Timed out waiting for the webhook to be processed');
    }

    await new Promise((resolve) => setTimeout(resolve, 25));
  }
};

export const waitForLead = (metaLeadId: string) =>
  waitFor(() => prismaClient.lead.findUnique({ where: { metaLeadId } }));

export const waitForEventStatus = (eventId: string, status: string) =>
  waitFor(async () => {
    const event = await prismaClient.webhookEvent.findUniqueOrThrow({ where: { id: eventId } });
    return event.status === status ? event : null;
  });
