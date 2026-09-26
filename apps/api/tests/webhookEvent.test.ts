import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { disconnectDatabase, prismaClient } from '../src/config/db.js';
import { mockLeadProvider } from '../src/service/leadProvider/mock.js';
import {
  processWebhookEvent,
  sweepPendingWebhookEvents,
} from '../src/service/webhookEvent.service.js';
import { AD_ID, FORM_ID, PAGE_ID, resetDatabase } from './support/webhook.js';

const storeEvent = async (
  leadgenId: string,
  fields?: Record<string, string>,
  receivedAt?: Date,
) => {
  const event = await prismaClient.webhookEvent.create({
    data: {
      externalId: leadgenId,
      ...(receivedAt === undefined ? {} : { receivedAt }),
      payload: {
        leadgen_id: leadgenId,
        page_id: PAGE_ID,
        form_id: FORM_ID,
        ad_id: AD_ID,
        created_time: 1_759_000_000,
        ...(fields === undefined
          ? {}
          : {
              field_data: Object.entries(fields).map(([name, value]) => ({
                name,
                values: [value],
              })),
            }),
      },
    },
    select: { id: true },
  });

  return event.id;
};

beforeEach(async () => {
  await resetDatabase();
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await disconnectDatabase();
});

describe('processWebhookEvent', () => {
  it('marks the event FAILED when the provider throws, then succeeds on the next run', async () => {
    const eventId = await storeEvent('8100');

    vi.spyOn(mockLeadProvider, 'fetchLead').mockRejectedValueOnce(
      new Error('Graph API responded 503 for lead 8100'),
    );

    await processWebhookEvent(eventId);

    const failed = await prismaClient.webhookEvent.findUniqueOrThrow({ where: { id: eventId } });

    expect(failed.status).toBe('FAILED');
    expect(failed.attempts).toBe(1);
    expect(failed.lastError).toBe('Graph API responded 503 for lead 8100');
    expect(await prismaClient.lead.count()).toBe(0);

    await processWebhookEvent(eventId);

    const processed = await prismaClient.webhookEvent.findUniqueOrThrow({ where: { id: eventId } });

    expect(processed.status).toBe('PROCESSED');
    expect(processed.attempts).toBe(2);
    expect(processed.lastError).toBeNull();
    expect(await prismaClient.lead.count()).toBe(1);
    expect(await prismaClient.leadActivity.count()).toBe(1);
  });

  it('processes an event once when two callers claim it concurrently', async () => {
    const eventId = await storeEvent('8200', {
      full_name: 'Sana Gill',
      email: 'sana.gill@example.com',
    });

    await Promise.all([processWebhookEvent(eventId), processWebhookEvent(eventId)]);

    const event = await prismaClient.webhookEvent.findUniqueOrThrow({ where: { id: eventId } });

    expect(event.status).toBe('PROCESSED');
    expect(event.attempts).toBe(1);
    expect(await prismaClient.lead.count()).toBe(1);
    expect(await prismaClient.leadActivity.count()).toBe(1);
  });

  it('leaves an event that is already processed untouched', async () => {
    const eventId = await storeEvent('8300', { email: 'meera.nair@example.com' });

    await processWebhookEvent(eventId);
    await processWebhookEvent(eventId);

    const event = await prismaClient.webhookEvent.findUniqueOrThrow({ where: { id: eventId } });

    expect(event.attempts).toBe(1);
    expect(await prismaClient.leadActivity.count()).toBe(1);
  });
});

describe('sweepPendingWebhookEvents', () => {
  it('picks up a stale event and leaves a fresh one for its own processing run', async () => {
    const stale = await storeEvent(
      '8400',
      { email: 'kabir.bose@example.com' },
      new Date(Date.now() - 60_000),
    );
    const fresh = await storeEvent('8500', { email: 'diya.iyer@example.com' });

    await sweepPendingWebhookEvents();

    expect(
      (await prismaClient.webhookEvent.findUniqueOrThrow({ where: { id: stale } })).status,
    ).toBe('PROCESSED');
    expect(
      (await prismaClient.webhookEvent.findUniqueOrThrow({ where: { id: fresh } })).status,
    ).toBe('RECEIVED');
    expect(await prismaClient.lead.count()).toBe(1);
  });

  it('gives up on an event that has exhausted its attempts', async () => {
    const eventId = await storeEvent(
      '8600',
      { email: 'rohan.mehta@example.com' },
      new Date(Date.now() - 60_000),
    );

    await prismaClient.webhookEvent.update({
      where: { id: eventId },
      data: { status: 'FAILED', attempts: 5, lastError: 'Graph API responded 500 for lead 8600' },
    });

    await sweepPendingWebhookEvents();

    const event = await prismaClient.webhookEvent.findUniqueOrThrow({ where: { id: eventId } });

    expect(event.status).toBe('FAILED');
    expect(event.attempts).toBe(5);
    expect(await prismaClient.lead.count()).toBe(0);
  });
});
