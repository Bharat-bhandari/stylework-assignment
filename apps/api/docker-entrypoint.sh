#!/bin/sh
set -e

# The container owns its schema: compose starts it once the database is healthy, so the
# migration runs before the server accepts traffic.
node_modules/.bin/prisma migrate deploy

exec "$@"
