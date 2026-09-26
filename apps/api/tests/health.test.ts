import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { disconnectDatabase } from '../src/config/db.js';

type HealthData = { database: string; uptimeSeconds: number; demoTools: boolean };

type SuccessBody = { statusCode: number; data: HealthData; message: string; success: boolean };

type ErrorBody = {
  success: boolean;
  message: string;
  statusCode: number;
  errors: unknown[];
  requestId: string;
};

const app = buildApp();

afterAll(async () => {
  await disconnectDatabase();
});

describe('GET /health', () => {
  it('reports the database as up against the real test database', async () => {
    const response = await request(app).get('/health');
    const body = response.body as SuccessBody;

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.statusCode).toBe(200);
    expect(body.message).toBe('OK');
    expect(body.data.database).toBe('up');
    expect(typeof body.data.uptimeSeconds).toBe('number');
    expect(typeof body.data.demoTools).toBe('boolean');
  });

  it('returns a generated request id header', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['x-request-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('echoes a caller-supplied request id so logs can be correlated', async () => {
    const response = await request(app).get('/health').set('x-request-id', 'trace-abc-123');

    expect(response.headers['x-request-id']).toBe('trace-abc-123');
  });
});

describe('unknown routes', () => {
  it('return 404 in the standard error shape', async () => {
    const response = await request(app).get('/does-not-exist');
    const body = response.body as ErrorBody;

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.statusCode).toBe(404);
    expect(body.message).toContain('/does-not-exist');
    expect(body.errors).toEqual([]);
    expect(typeof body.requestId).toBe('string');
    expect(response.text).not.toContain('at ');
  });
});
