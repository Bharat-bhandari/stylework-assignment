# AI usage

## How I worked

I designed the system first: the stack, the webhook inbox, the audit rules, the provider
abstraction and the deployment. I used Claude in chat as a sounding board while working these out,
and made the calls myself.

Then I used Claude Code as a fast coding agent to implement it. I split the work into six phases
and gave it clear rules for each:

- A plan with acceptance checks per phase, so every session had one scope.
- My own code conventions from my production projects: layered folders, `ApiError` and
  `ApiResponse`, arrow-function controllers, no comment noise.
- Rules it could not break: a lead write and its activity in one transaction, an append-only
  activity log, the event stored before the 200, no PII in logs, Zod at every boundary, no new
  dependencies without asking.
- A gate before I reviewed anything: typecheck, lint and tests must pass, and no test is weakened
  to get there.

The code was written by the agent from these specs. I reviewed every phase, sent back what didn't
match, and did every commit myself.

## Prior work

I built Meta lead capture earlier for a client project in production, so I used that as the
reference. For this version I hardened it:

- Signature check over the raw body with `timingSafeEqual`. The old version didn't enforce it.
- A `WebhookEvent` inbox. The event is saved before responding to Meta and retried if processing
  fails. The old version processed after the 200, so a crash lost the lead.
- An audit row in the same transaction as every lead write.
- Logs with IDs only. The old version logged full payloads.
- A mock provider and an inline `field_data` path, so it can be tested without a Meta app.

## Prompts

1. Backend foundation: Express 5, Prisma, schema, health check, error handling. Then a second pass
   to restructure it into my own layout.
2. Webhook: handshake, signature check, inbox, providers, processor with an atomic claim, retry
   sweeper, simulate route, signed test script, integration tests.
3. Lead APIs: list with filters, detail, status change with a transition map and a concurrency
   guard, tests.
4. Frontend: list, detail, activity timeline, status control, loading and error states, tests.
5. Docker, CI and deployment to my VPS.
6. README and this file.

## Where I changed direction

- Express over Fastify, which was suggested first. It's what I run in production.
- Prisma over Drizzle. Its transaction API is what the audit rule depends on.
- Restructured the first phase's output into my own conventions before building on it.
- One subdomain instead of separate `api.` and `app.`: one config, one certificate, no CORS.
- Seed data goes through the real webhook processor, so the seeded audit trail is real.

Deployment on the server (DNS, host nginx, certbot) I did by hand.