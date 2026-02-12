#!/bin/sh
set -e

echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h postgres -U ${POSTGRES_USER:-postgres}; do
  sleep 1
done

echo "Running database migrations..."
npm run db:migrate

echo "Seeding database..."
ADMIN_USERNAME="${ADMIN_USERNAME:-superadmin}" \
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin123!}" \
ADMIN_NAME="${ADMIN_NAME:-Super Admin}" \
SEED_DEMO_DATA="${SEED_DEMO_DATA:-false}" \
npm run db:seed || echo "Seed skipped or already exists"

echo "Starting application..."
if [ "$NODE_ENV" = "production" ]; then
  exec npm start
else
  exec npm run dev
fi
