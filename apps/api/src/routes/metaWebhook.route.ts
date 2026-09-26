import express, { Router } from 'express';
import {
  receiveMetaLeadWebhook,
  verifyMetaWebhookSubscription,
} from '../controller/webhooks/metaLeadWebhook.js';
import { verifyMetaSignature } from '../middleware/verifyMetaSignature.middleware.js';

const router = Router();

router.get('/', verifyMetaWebhookSubscription);

// The signature covers the exact bytes Meta sent, so this route keeps the raw body.
router.post(
  '/',
  express.raw({ type: 'application/json', limit: '1mb' }),
  verifyMetaSignature,
  receiveMetaLeadWebhook,
);

export default router;
