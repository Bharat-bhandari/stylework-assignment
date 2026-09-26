import { createHmac } from 'node:crypto';

export const createMetaSignature = (rawBody: Buffer | string, appSecret: string): string =>
  `sha256=${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
