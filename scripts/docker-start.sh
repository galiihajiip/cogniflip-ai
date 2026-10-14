#!/bin/sh
# Container entrypoint (D-017): migrate the database, then start Next.js.
set -e
if [ -n "$DATABASE_URL" ]; then
  node scripts/db.mts migrate
else
  echo "docker-start: DATABASE_URL is not set; skipping migrations"
fi
exec node_modules/.bin/next start -H 0.0.0.0 -p "${PORT:-3000}"
