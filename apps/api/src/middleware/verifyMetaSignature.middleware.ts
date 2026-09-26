import { timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';
import { env } from '../config/env.js';
import { createMetaSignature } from '../helper/metaSignature.js';
import ApiError from '../utils/apiError.js';

export const INVALID_SIGNATURE_MESSAGE =
  'Invalid or missing X-Hub-Signature-256. See README "Testing the webhook".';

export const verifyMetaSignature: RequestHandler = (req, _res, next) => {
  const header = req.get('x-hub-signature-256');
  const rawBody: unknown = req.body;

  // express.raw only yields a Buffer for application/json, so anything else is unverifiable.
  if (!header || !Buffer.isBuffer(rawBody)) {
    next(new ApiError(401, INVALID_SIGNATURE_MESSAGE));
    return;
  }

  const received = Buffer.from(header);
  const expected = Buffer.from(createMetaSignature(rawBody, env.META_APP_SECRET));

  // timingSafeEqual throws when the lengths differ, so that case is rejected first.
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    next(new ApiError(401, INVALID_SIGNATURE_MESSAGE));
    return;
  }

  next();
};
