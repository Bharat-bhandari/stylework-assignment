import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { pino } from 'pino';
import { pinoHttp } from 'pino-http';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'lead-intake-api' },
  formatters: { level: (label) => ({ level: label }) },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-hub-signature-256"]',
      'req.body',
      'payload',
      'fullName',
      'email',
      'phone',
    ],
    remove: true,
  },
  ...(env.NODE_ENV === 'development'
    ? {
        transport: {
          target: 'pino-pretty',
          options: { translateTime: 'SYS:HH:MM:ss.l', ignore: 'pid,hostname,service' },
        },
      }
    : {}),
});

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req: IncomingMessage, res: ServerResponse) => {
    const header = req.headers['x-request-id'];
    const inbound = Array.isArray(header) ? header[0] : header;
    const requestId = inbound && inbound.length <= 128 ? inbound : randomUUID();
    res.setHeader('x-request-id', requestId);
    return requestId;
  },
  serializers: {
    // Path without the query string: a search query can carry PII.
    req: (req: IncomingMessage & { id?: unknown }) => ({
      id: req.id,
      method: req.method,
      path: (req.url ?? '').split('?')[0],
    }),
    res: (res: ServerResponse) => ({ statusCode: res.statusCode }),
  },
  autoLogging: {
    ignore: (req) => (req.url ?? '').split('?')[0] === '/health',
  },
});
