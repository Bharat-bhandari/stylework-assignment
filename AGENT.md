# AGENT.md — AI Usage Log

## Tools used
- Claude (planning, scaffolding, review)

## Log
| # | Area | Prompt (summary) | AI-generated | Manually written / changed |
|---|------|------------------|--------------|----------------------------|
| 1 | Setup | Pick stack, bootstrap repo | Initial skeleton commands | Chose Express + Prisma over suggested Fastify + Drizzle |

## Architecture decisions
- Express + Prisma + PostgreSQL: familiar production stack; Postgres transactions keep lead writes and audit records atomic.
