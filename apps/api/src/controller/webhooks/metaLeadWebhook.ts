import type { Request, Response } from 'express';
import { prismaClient } from '../../config/db.js';
import { env } from '../../config/env.js';
import {
  extractLeadgenValues,
  metaHandshakeQuerySchema,
  metaWebhookPayloadSchema,
} from '../../schema/metaWebhook.schema.js';
import { processWebhookEvent } from '../../service/webhookEvent.service.js';
import ApiError from '../../utils/apiError.js';
import ApiResponse from '../../utils/apiResponse.js';
import { logger } from '../../utils/logger.js';

const parseRawBody = (body: unknown) => {
  if (!Buffer.isBuffer(body)) {
    throw new ApiError(400, 'Webhook body must be JSON');
  }

  try {
    return metaWebhookPayloadSchema.parse(JSON.parse(body.toString('utf8')));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ApiError(400, 'Webhook body must be JSON');
    }
    throw error;
  }
};

export const verifyMetaWebhookSubscription = (req: Request, res: Response) => {
  const parsed = metaHandshakeQuerySchema.safeParse(req.query);

  if (!parsed.success || parsed.data['hub.verify_token'] !== env.META_VERIFY_TOKEN) {
    throw new ApiError(403, 'Webhook verification failed');
  }

  res.status(200).type('text/plain').send(parsed.data['hub.challenge']);
};

export const receiveMetaLeadWebhook = async (req: Request, res: Response) => {
  const values = extractLeadgenValues(parseRawBody(req.body));

  const events = await prismaClient.$transaction(
    values.map((value) =>
      prismaClient.webhookEvent.create({
        data: { externalId: value.leadgen_id, payload: value },
        select: { id: true },
      }),
    ),
  );

  logger.info(
    { eventIds: events.map((event) => event.id), leadgenIds: values.map((v) => v.leadgen_id) },
    'Webhook events stored',
  );

  res.status(200).json(new ApiResponse(200, { received: events.length }, 'Webhook received'));

  // Meta retries anything it cannot deliver within seconds, so the work happens after the 200.
  setImmediate(() => {
    for (const event of events) {
      void processWebhookEvent(event.id);
    }
  });
};
