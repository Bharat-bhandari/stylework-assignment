import type { LeadStatus } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { disconnectDatabase, prismaClient } from '../src/config/db.js';
import { updateLeadStatus } from '../src/service/lead.service.js';
import {
  activitiesOf,
  dataOf,
  errorOf,
  seedLead,
  type LeadDetailData,
  type LeadListData,
  type LeadStatusData,
} from './support/lead.js';
import { resetDatabase } from './support/webhook.js';

const app = buildApp();

const seedLeads = async (count: number): Promise<void> => {
  for (let index = 0; index < count; index += 1) {
    await seedLead();
  }
};

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
});

describe('GET /leads', () => {
  it('defaults to the first page of 20, newest first', async () => {
    await seedLeads(25);

    const response = await request(app).get('/leads');
    const { leads, pagination } = dataOf<LeadListData>(response);

    expect(response.status).toBe(200);
    expect(leads).toHaveLength(20);
    expect(pagination).toEqual({ page: 1, limit: 20, total: 25, totalPages: 2 });

    const timestamps = leads.map((lead) => lead.createdAt);

    expect([...timestamps].sort().reverse()).toEqual(timestamps);
  });

  it('returns the requested page', async () => {
    await seedLeads(25);

    const response = await request(app).get('/leads').query({ page: 3, limit: 10 });
    const { leads, pagination } = dataOf<LeadListData>(response);

    expect(response.status).toBe(200);
    expect(leads).toHaveLength(5);
    expect(pagination).toEqual({ page: 3, limit: 10, total: 25, totalPages: 3 });
  });

  it('rejects a limit above 100', async () => {
    const response = await request(app).get('/leads').query({ limit: 101 });

    expect(response.status).toBe(400);
    expect(errorOf(response).errors).toContainEqual(expect.objectContaining({ path: 'limit' }));
  });

  it('filters by status', async () => {
    await seedLead({ status: 'NEW' });
    await seedLead({ status: 'CONTACTED' });
    await seedLead({ status: 'CONTACTED' });

    const response = await request(app).get('/leads').query({ status: 'CONTACTED' });
    const { leads, pagination } = dataOf<LeadListData>(response);

    expect(response.status).toBe(200);
    expect(pagination.total).toBe(2);
    expect(leads.every((lead) => lead.status === 'CONTACTED')).toBe(true);
  });

  it('rejects an unknown status', async () => {
    const response = await request(app).get('/leads').query({ status: 'ARCHIVED' });

    expect(response.status).toBe(400);
  });

  it.each([
    ['name', 'meNON'],
    ['email', 'ARJUN.MENON@EXAMPLE'],
    ['phone', '9845012345'],
  ])('searches case-insensitively by %s', async (_field, term) => {
    await seedLead();
    await seedLead({
      fullName: 'Sana Gill',
      email: 'sana.gill@example.com',
      phone: '+919000000001',
    });

    const response = await request(app).get('/leads').query({ q: term });
    const { leads, pagination } = dataOf<LeadListData>(response);

    expect(response.status).toBe(200);
    expect(pagination.total).toBe(1);
    expect(leads[0]?.fullName).toBe('Arjun Menon');
  });

  it('hides test leads unless includeTest is set', async () => {
    await seedLead();
    await seedLead({ isTest: true });

    const hidden = dataOf<LeadListData>(await request(app).get('/leads'));

    expect(hidden.pagination.total).toBe(1);
    expect(hidden.leads[0]?.isTest).toBe(false);

    const included = dataOf<LeadListData>(
      await request(app).get('/leads').query({ includeTest: 'true' }),
    );

    expect(included.pagination.total).toBe(2);
  });

  it('combines the status filter with the search term', async () => {
    await seedLead({ status: 'CONTACTED' });
    await seedLead({ fullName: 'Sana Gill', status: 'CONTACTED' });
    await seedLead({ fullName: 'Sana Gill', status: 'NEW' });

    const response = await request(app).get('/leads').query({ q: 'sana', status: 'CONTACTED' });

    expect(dataOf<LeadListData>(response).pagination.total).toBe(1);
  });
});

describe('GET /leads/:id', () => {
  it('returns the lead, its activities newest first and the allowed next statuses', async () => {
    const lead = await seedLead({ status: 'CONTACTED' });

    await prismaClient.leadActivity.create({
      data: { leadId: lead.id, type: 'LEAD_CREATED', actor: 'meta-webhook', toStatus: 'NEW' },
    });
    await prismaClient.leadActivity.create({
      data: {
        leadId: lead.id,
        type: 'STATUS_CHANGED',
        actor: 'dashboard',
        fromStatus: 'NEW',
        toStatus: 'CONTACTED',
      },
    });

    const response = await request(app).get(`/leads/${lead.id}`);
    const detail = dataOf<LeadDetailData>(response);

    expect(response.status).toBe(200);
    expect(detail.lead.id).toBe(lead.id);
    expect(detail.allowedNextStatuses).toEqual(['QUALIFIED', 'LOST']);
    expect(detail.activities.map((activity) => activity.type)).toEqual([
      'STATUS_CHANGED',
      'LEAD_CREATED',
    ]);
  });

  it('rejects an id that is not a uuid with 400', async () => {
    const response = await request(app).get('/leads/not-a-uuid');

    expect(response.status).toBe(400);
    expect(errorOf(response).errors).toContainEqual(expect.objectContaining({ path: 'id' }));
  });

  it('returns 404 for an unknown id', async () => {
    const response = await request(app).get('/leads/3f1c4a52-6f2e-4a7f-9c0b-2d5a1e8b7c40');

    expect(response.status).toBe(404);
    expect(errorOf(response)).toMatchObject({ success: false, message: 'Lead not found' });
  });
});

describe('PATCH /leads/:id/status', () => {
  it.each([
    ['NEW', 'CONTACTED'],
    ['CONTACTED', 'QUALIFIED'],
    ['QUALIFIED', 'CONVERTED'],
    ['NEW', 'LOST'],
    ['CONTACTED', 'LOST'],
    ['QUALIFIED', 'LOST'],
  ] as [LeadStatus, LeadStatus][])('moves a lead from %s to %s', async (from, to) => {
    const lead = await seedLead({ status: from });

    const response = await request(app).patch(`/leads/${lead.id}/status`).send({ status: to });

    expect(response.status).toBe(200);
    expect(dataOf<LeadStatusData>(response).lead.status).toBe(to);

    const activities = await activitiesOf(lead.id);

    expect(activities).toHaveLength(1);
    expect(activities[0]).toMatchObject({
      type: 'STATUS_CHANGED',
      actor: 'dashboard',
      fromStatus: from,
      toStatus: to,
    });
  });

  it('stores an optional note on the activity', async () => {
    const lead = await seedLead();

    const response = await request(app)
      .patch(`/leads/${lead.id}/status`)
      .send({ status: 'CONTACTED', note: 'Called, asked for a callback on Monday' });

    expect(response.status).toBe(200);

    const activities = await activitiesOf(lead.id);

    expect(activities[0]?.changes).toEqual({ note: 'Called, asked for a callback on Monday' });
  });

  it('rejects a skipped step with 409 and writes no activity', async () => {
    const lead = await seedLead({ status: 'NEW' });

    const response = await request(app)
      .patch(`/leads/${lead.id}/status`)
      .send({ status: 'CONVERTED' });

    expect(response.status).toBe(409);
    expect(errorOf(response)).toMatchObject({
      success: false,
      message: 'Cannot change status from NEW to CONVERTED',
      data: { allowedNextStatuses: ['CONTACTED', 'LOST'] },
    });

    const refreshed = await prismaClient.lead.findUniqueOrThrow({ where: { id: lead.id } });

    expect(refreshed.status).toBe('NEW');
    expect(await activitiesOf(lead.id)).toHaveLength(0);
  });

  it.each(['CONVERTED', 'LOST'] as LeadStatus[])('locks %s as terminal', async (status) => {
    const lead = await seedLead({ status });

    const response = await request(app).patch(`/leads/${lead.id}/status`).send({ status: 'NEW' });

    expect(response.status).toBe(409);
    expect(errorOf(response).data).toEqual({ allowedNextStatuses: [] });
    expect(await activitiesOf(lead.id)).toHaveLength(0);
  });

  it('accepts the current status without writing an activity', async () => {
    const lead = await seedLead({ status: 'CONTACTED' });

    const response = await request(app)
      .patch(`/leads/${lead.id}/status`)
      .send({ status: 'CONTACTED' });

    expect(response.status).toBe(200);
    expect(dataOf<LeadStatusData>(response).allowedNextStatuses).toEqual(['QUALIFIED', 'LOST']);
    expect(await activitiesOf(lead.id)).toHaveLength(0);

    const refreshed = await prismaClient.lead.findUniqueOrThrow({ where: { id: lead.id } });

    expect(refreshed.updatedAt.getTime()).toBe(lead.updatedAt.getTime());
  });

  it('rejects an unknown status with 400', async () => {
    const lead = await seedLead();

    const response = await request(app).patch(`/leads/${lead.id}/status`).send({ status: 'DONE' });

    expect(response.status).toBe(400);
    expect(await activitiesOf(lead.id)).toHaveLength(0);
  });

  it('returns 404 for an unknown lead', async () => {
    const response = await request(app)
      .patch('/leads/3f1c4a52-6f2e-4a7f-9c0b-2d5a1e8b7c40/status')
      .send({ status: 'CONTACTED' });

    expect(response.status).toBe(404);
  });

  // Driven through the service: over HTTP the first request finishes before the second reads,
  // so the two would never overlap on the row the conditional update guards.
  it('lets only one of two concurrent transitions from the same status win', async () => {
    const lead = await seedLead({ status: 'NEW' });

    const results = await Promise.allSettled([
      updateLeadStatus(lead.id, { status: 'CONTACTED' }),
      updateLeadStatus(lead.id, { status: 'LOST' }),
    ]);

    expect(results.map((result) => result.status).sort()).toEqual(['fulfilled', 'rejected']);

    const rejected = results.find((result) => result.status === 'rejected');

    expect(rejected?.reason).toMatchObject({
      statusCode: 409,
      message: 'Lead status was changed by another request',
    });

    const activities = await activitiesOf(lead.id);

    expect(activities).toHaveLength(1);
    expect(activities[0]?.fromStatus).toBe('NEW');

    const refreshed = await prismaClient.lead.findUniqueOrThrow({ where: { id: lead.id } });

    expect(refreshed.status).toBe(activities[0]?.toStatus);
  });
});
