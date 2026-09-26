import { parseArgs } from 'node:util';
import { config as loadDotenv } from 'dotenv';
import { buildLeadgenPayload } from '../src/helper/metaLeadPayload.js';
import { createMetaSignature } from '../src/helper/metaSignature.js';

loadDotenv({ quiet: true });

const { values } = parseArgs({
  options: {
    url: { type: 'string', default: 'http://localhost:4000/webhook/meta-lead' },
    'leadgen-id': { type: 'string' },
    set: { type: 'string', multiple: true, default: [] },
    'print-curl': { type: 'boolean', default: false },
  },
});

const appSecret = process.env['META_APP_SECRET'];

if (!appSecret) {
  console.error('META_APP_SECRET is not set. Copy .env.example to .env first.');
  process.exit(1);
}

const overrides = Object.fromEntries(
  values.set.map((pair) => {
    const separator = pair.indexOf('=');

    if (separator === -1) {
      console.error(`Invalid --set value "${pair}". Use --set field=value.`);
      process.exit(1);
    }

    return [pair.slice(0, separator), pair.slice(separator + 1)];
  }),
);

const payload = buildLeadgenPayload({
  leadgenId: values['leadgen-id'] ?? `9${Date.now()}`,
  pageId: '104729384756102',
  formId: '873625194038271',
  adId: '239847561029384',
  fields: {
    full_name: 'Arjun Menon',
    email: 'arjun.menon@example.com',
    phone_number: '+919845012345',
    city: 'Bengaluru',
    team_size: '16-40',
    ...overrides,
  },
});

const rawBody = JSON.stringify(payload);
const signature = createMetaSignature(rawBody, appSecret);

if (values['print-curl']) {
  process.stdout.write(
    [
      `curl -i -X POST '${values.url}' \\`,
      `  -H 'Content-Type: application/json' \\`,
      `  -H 'X-Hub-Signature-256: ${signature}' \\`,
      `  -d '${rawBody}'`,
      '',
    ].join('\n'),
  );
  process.exit(0);
}

const response = await fetch(values.url, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-hub-signature-256': signature },
  body: rawBody,
});

process.stdout.write(`${response.status} ${await response.text()}\n`);

if (!response.ok) {
  process.exit(1);
}
