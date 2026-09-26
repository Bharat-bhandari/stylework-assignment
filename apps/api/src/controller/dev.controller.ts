import { randomInt } from 'node:crypto';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { buildLeadgenPayload } from '../helper/metaLeadPayload.js';
import { createMetaSignature } from '../helper/metaSignature.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';

const DEMO_PAGE_ID = '104729384756102';
const DEMO_FORM_ID = '873625194038271';
const DEMO_AD_ID = '239847561029384';

const DEMO_FIELDS = {
  full_name: 'Priya Raghavan',
  email: 'priya.raghavan@example.com',
  phone_number: '+919812345678',
  city: 'Bengaluru',
  team_size: '6-15',
};

const simulateLeadSchema = z.object({
  leadgenId: z.string().min(1).optional(),
  fields: z.record(z.string(), z.string()).optional(),
});

const randomMetaId = (): string => `${randomInt(1_000_000_000, 9_999_999_999)}${randomInt(100, 999)}`;

export const simulateLead = async (req: Request, res: Response) => {
  const { leadgenId = randomMetaId(), fields } = simulateLeadSchema.parse(req.body);

  const payload = buildLeadgenPayload({
    leadgenId,
    pageId: DEMO_PAGE_ID,
    formId: DEMO_FORM_ID,
    adId: DEMO_AD_ID,
    fields: { ...DEMO_FIELDS, ...fields },
  });

  const rawBody = JSON.stringify(payload);

  // Posted back to this service so the demo runs through signature verification and the
  // raw-body route rather than shortcutting into the database. Addressed over loopback on the
  // port this request arrived on, so it never leaves the process behind a proxy or TLS.
  const response = await fetch(
    `http://127.0.0.1:${req.socket.localPort ?? env.PORT}/webhook/meta-lead`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': createMetaSignature(rawBody, env.META_APP_SECRET),
      },
      body: rawBody,
    },
  );

  await response.text();

  if (!response.ok) {
    throw new ApiError(502, `Webhook rejected the simulated delivery with ${response.status}`);
  }

  res
    .status(202)
    .json(new ApiResponse(202, { leadgenId }, 'Simulated lead delivered to the webhook'));
};
