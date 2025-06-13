#!/bin/bash

# This script starts the development environment for Truspace
# Usage: ./start.sh [--local-frontend]
# If --local-frontend is passed, it will start the frontend locally

SCRIPT_DIR=$(dirname -- $0)
source $SCRIPT_DIR/.env
echo "INFO: Current script directory: $SCRIPT_DIR"

# Read param from command line
if [ "$1" == "--local-frontend" ]; then
    export FRONTEND_DEV="true"
    export FRONTEND_DOCKER_COMPOSE_FILE=""
else
    export FRONTEND_DEV="false"
    export FRONTEND_DOCKER_COMPOSE_FILE="-f docker-compose-frontend.yml"
fi

# check for necessary docker volumes, if they don't exist, generate them
dirs=(
  "./volumes"
  "./volumes/db"
  "./volumes/db0"
  "./volumes/db1"
  "./volumes/ipfs0"
  "./volumes/cluster0"
  "./volumes/ipfs1"
  "./volumes/cluster1"
  "./volumes/ollama"
  "./volumes/open-webui"
)

for d in "${dirs[@]}"; do
  if [ ! -d "$d" ]; then
    echo "Creating $d"
    mkdir -p "$d"
  fi
done

# generate env file if it does not exist
[[ -e .env ]] || cp .env.example .env

echo "INFO: Starting dev environment"

export LUID=$(id -u)
export LGID=$(id -g)

# remove previous docker instances
docker compose down --remove-orphans

# rebuilds frontend and backend
docker compose build backend frontend

# start new instance of docker network
if [ "$DISABLE_ALL_AI_FUNCTIONALITY" = "true" ]; then
    echo "AI functionality is disabled. Starting without 'ollama' and 'webui' service..."
    docker compose -f docker-compose.yml $FRONTEND_DOCKER_COMPOSE_FILE --env-file $SCRIPT_DIR/.env up -d
else
    # Check if OI has a newer image
    docker pull ghcr.io/open-webui/open-webui:ollama    
    docker compose -f docker-compose.yml $FRONTEND_DOCKER_COMPOSE_FILE -f docker-compose-ai.yml --env-file $SCRIPT_DIR/.env up -d
fi

# if frontend is in dev mode, start it
if [ "$FRONTEND_DEV" = "true" ]; then
    echo "INFO: Starting frontend in development mode"
    cd ./frontend
    npm i
    npm run dev
fi