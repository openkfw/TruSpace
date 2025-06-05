#!/bin/sh

# Set NODE_ENV to development if not set
if [ -z "$NODE_ENV" ]; then
  echo "NODE_ENV environment variable not set. Defaulting to development."
  export NODE_ENV="development"
fi

if [ "$NODE_ENV" != "development" ] && [ "$NODE_ENV" != "production" ] && [ "$NODE_ENV" != "test" ]; then
  echo "Error: NODE_ENV must be one of: development, production, test"
  echo "Current value: $NODE_ENV"
  exit 1
fi

echo "Running in $NODE_ENV environment"

# Run migrations
echo "Running database migrations ..."
npx knex migrate:latest
MIGRATION_EXIT_CODE=$?

if [ $MIGRATION_EXIT_CODE -ne 0 ]; then
  echo "Error: Database migrations failed with exit code $MIGRATION_EXIT_CODE"
  exit $MIGRATION_EXIT_CODE
fi


if [ "$RUN_SEEDS" = "true" ]; then
  echo "Running seeds..."
  npx knex seed:run
fi

echo "Starting application in ${NODE_ENV} mode..."
if [ "$NODE_ENV" = "production" ]; then
  node dist/index.js
else
  exec npm run dev
fi