#!/bin/sh
set -e

echo "🔧 Running Prisma setup..."
npx prisma generate
npx prisma db push --accept-data-loss

echo "🚀 Starting server..."
exec "$@"
