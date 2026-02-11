#!/bin/sh
set -e

echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h postgres -U postgres; do
  sleep 1
done

echo "Running database migrations..."
npm run db:migrate

echo "Seeding database..."
npm run db:seed || echo "Seed skipped or already exists"

echo "Starting application..."
exec npm run dev
