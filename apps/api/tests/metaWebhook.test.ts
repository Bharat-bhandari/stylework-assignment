import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { disconnectDatabase, prismaClient } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import {
  AD_ID,
  FORM_ID,
  PAGE_ID,
  postWebhook,
  resetDatabase,
  samplePayload,
  waitFor,
  waitForLead,
} from './support/webhook.js';

type FieldChanges = Record<string, { from: unknown; to: unknown }>;

const app = buildApp();

const fields = {
  full_name: 'Arjun Menon',
  email: 'arjun.menon@example.com',
  phone_number: '+919845012345',
  city: 'Bengaluru',
};

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
});

describe('GET /webhook/meta-lead', () => {
  it('echoes the challenge when the verify token matches', async () => {
    const response = await request(app).get('/webhook/meta-lead').query({
      'hub.mode': 'subscribe',
      'hub.verify_token': env.META_VERIFY_TOKEN,
      'hub.challenge': '1158201444',
    });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/plain');
    expect(response.text).toBe('1158201444');
  });

  it('rejects a wrong verify token with 403', async () => {
    const response = await request(app).get('/webhook/meta-lead').query({
      'hub.mode': 'subscribe',
      'hub.verify_token': 'not-the-token',
      'hub.challenge': '1158201444',
    });

    expect(response.status).toBe(403);
  });

  it('rejects a handshake that is not a subscribe with 403', async () => {
    const response = await request(app).get('/webhook/meta-lead').query({
      'hub.mode': 'unsubscribe',
      'hub.verify_token': env.META_VERIFY_TOKEN,
      'hub.challenge': '1158201444',
    });

    expect(response.status).toBe(403);
  });
});

describe('POST /webhook/meta-lead signature verification', () => {
  it('rejects a delivery without a signature and stores nothing', async () => {
    const response = await request(app)
      .post('/webhook/meta-lead')
      .set('content-type', 'application/json')
      .send(JSON.stringify(samplePayload('7001', fields)));

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ message: expect.stringContaining('Testing the webhook') as string });
    expect(await prismaClient.webhookEvent.count()).toBe(0);
    expect(await prismaClient.lead.count()).toBe(0);
  });

  it('rejects a tampered signature and stores nothing', async () => {
    const response = await postWebhook(app, samplePayload('7002', fields), `sha256=${'a'.repeat(64)}`);

    expect(response.status).toBe(401);
    expect(await prismaClient.webhookEvent.count()).toBe(0);
    expect(await prismaClient.lead.count()).toBe(0);
  });
});

describe('POST /webhook/meta-lead ingestion', () => {
  it('stores the event, creates the lead and writes one LEAD_CREATED activity', async () => {
    const response = await postWebhook(app, samplePayload('7100', fields));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ success: true, data: { received: 1 } });

    const lead = await waitForLead('7100');

    expect(lead.fullName).toBe('Arjun Menon');
    expect(lead.email).toBe('arjun.menon@example.com');
    expect(lead.phone).toBe('+919845012345');
    expect(lead.pageId).toBe(PAGE_ID);
    expect(lead.formId).toBe(FORM_ID);
    expect(lead.adId).toBe(AD_ID);
    expect(lead.isTest).toBe(false);
    expect(lead.status).toBe('NEW');
    expect(lead.answers).toEqual({ ...fields });

    const activities = await prismaClient.leadActivity.findMany({ where: { leadId: lead.id } });

    expect(activities).toHaveLength(1);
    expect(activities[0]?.type).toBe('LEAD_CREATED');
    expect(activities[0]?.actor).toBe('meta-webhook');

    const event = await waitFor(async () => {
      const stored = await prismaClient.webhookEvent.findFirst({ where: { externalId: '7100' } });
      return stored?.status === 'PROCESSED' ? stored : null;
    });

    expect(event.attempts).toBe(1);
    expect(event.processedAt).not.toBeNull();
    expect(await prismaClient.webhookEvent.count()).toBe(1);
  });

  it('writes nothing for an identical redelivery', async () => {
    await postWebhook(app, samplePayload('7200', fields));
    const lead = await waitForLead('7200');

    await postWebhook(app, samplePayload('7200', fields));
    await waitFor(async () => {
      const events = await prismaClient.webhookEvent.count({ where: { status: 'PROCESSED' } });
      return events === 2 ? events : null;
    });

    const refreshed = await prismaClient.lead.findUniqueOrThrow({ where: { metaLeadId: '7200' } });

    expect(await prismaClient.lead.count()).toBe(1);
    expect(await prismaClient.leadActivity.count({ where: { leadId: lead.id } })).toBe(1);
    expect(refreshed.updatedAt.getTime()).toBe(lead.updatedAt.getTime());
  });

  it('records a LEAD_UPDATED diff when a redelivery changes a field', async () => {
    await postWebhook(app, samplePayload('7300', fields));
    const lead = await waitForLead('7300');

    await postWebhook(
      app,
      samplePayload('7300', { ...fields, phone_number: '+919845099999', city: 'Pune' }),
    );

    const activity = await waitFor(() =>
      prismaClient.leadActivity.findFirst({ where: { leadId: lead.id, type: 'LEAD_UPDATED' } }),
    );

    const changes = activity.changes as FieldChanges;

    expect(changes['phone']).toEqual({ from: '+919845012345', to: '+919845099999' });
    expect(changes['answers']).toMatchObject({
      from: { city: 'Bengaluru' },
      to: { city: 'Pune' },
    });
    expect(changes['email']).toBeUndefined();

    const refreshed = await prismaClient.lead.findUniqueOrThrow({ where: { metaLeadId: '7300' } });

    expect(refreshed.phone).toBe('+919845099999');
    expect(await prismaClient.lead.count()).toBe(1);
    expect(await prismaClient.leadActivity.count({ where: { leadId: lead.id } })).toBe(2);
  });

  it('falls back to the configured provider when the payload carries no field_data', async () => {
    await postWebhook(app, samplePayload('7400'));

    const lead = await waitForLead('7400');

    expect(lead.fullName).not.toBeNull();
    expect(lead.email).toMatch(/@example\.com$/);
    expect(lead.campaignId).toMatch(/^mock-campaign-/);
    expect(lead.platform).not.toBeNull();
  });

  it('flags Meta test leads', async () => {
    await postWebhook(
      app,
      samplePayload('7500', { full_name: '<test lead: Arjun>', email: 'test@meta.com' }),
    );

    const lead = await waitForLead('7500');

    expect(lead.isTest).toBe(true);
  });

  it('rejects a payload that is not a Meta page event with 400', async () => {
    const response = await postWebhook(app, { object: 'instagram', entry: [] });

    expect(response.status).toBe(400);
    expect(await prismaClient.webhookEvent.count()).toBe(0);
  });
});

describe('POST /dev/simulate-lead', () => {
  it('delivers a signed payload through the real webhook route', async () => {
    const response = await request(app)
      .post('/dev/simulate-lead')
      .send({ leadgenId: '7600', fields: { email: 'demo@example.com' } });

    expect(response.status).toBe(202);
    expect(response.body).toMatchObject({ data: { leadgenId: '7600' } });

    const lead = await waitForLead('7600');

    expect(lead.email).toBe('demo@example.com');
    expect(await prismaClient.leadActivity.count({ where: { leadId: lead.id } })).toBe(1);
  });
});
