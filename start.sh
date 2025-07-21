#!/bin/bash

# This script starts the development environment for TruSpace.
# Usage: ./start.sh [--local-frontend] [--remove-peers] [--help]
#   --local-frontend  : start the frontend locally instead of in Docker
#   --remove-peers    : after IPFS starts, remove default bootstrap peers via the IPFS API
#   --help, -h        : display this help message and exit

# Function to display usage/help
print_help() {
  echo "Usage: $0 [OPTIONS]"
  echo
  echo "Options:"
  echo "  --local-frontend    Start the frontend locally instead of in Docker, useful for debugging"
  echo "  --remove-peers      After IPFS starts, remove default bootstrap peers or any other peers that were added"
  echo "  -h, --help          Display this help message and exit"
  exit 0
}

# Generate .env file from example if none exists
[[ -e .env ]] || cp .env.example .env

SCRIPT_DIR=$(dirname -- "$0")
source "$SCRIPT_DIR/.env"
echo "INFO: Current script directory: $SCRIPT_DIR"

# Default flags
FRONTEND_DEV="false"
FRONTEND_DOCKER_COMPOSE_FILE="-f docker-compose-frontend.yml"
REMOVE_PEERS="false"

# Parse command-line arguments
while [[ "$#" -gt 0 ]]; do
  case "$1" in
    --local-frontend)
      FRONTEND_DEV="true"
      FRONTEND_DOCKER_COMPOSE_FILE=""
      shift
      ;;
    --remove-peers)
      REMOVE_PEERS="true"
      shift
      ;;
    -h|--help)
      print_help
      ;;
    *)
      echo "ERROR: Unknown option: $1"
      echo "Use -h or --help to see available options."
      exit 1
      ;;
  esac
done

# Ensure necessary Docker volume directories exist
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
    echo "INFO: Creating volume directory $d"
    mkdir -p "$d"
  fi
done

# INFO: Starting dev environment
echo "INFO: Starting dev environment"

# Capture current user/group IDs for Docker
export LUID=$(id -u)
export LGID=$(id -g)

# Remove any previous Docker containers (including orphans)
docker compose down --remove-orphans

# Rebuild backend and frontend images without cache
docker compose -f docker-compose.yml $FRONTEND_DOCKER_COMPOSE_FILE build --no-cache backend frontend

# Start Docker services, conditionally including AI components
if [ "$DISABLE_ALL_AI_FUNCTIONALITY" = "true" ]; then
  echo "INFO: AI functionality is disabled. Starting services without 'ollama' and 'webui'..."
  docker compose -f docker-compose.yml $FRONTEND_DOCKER_COMPOSE_FILE --env-file "$SCRIPT_DIR/.env" up -d
else
  echo "INFO: Pulling latest Open-WebUI/Ollama image and starting AI services..."
  docker pull ghcr.io/open-webui/open-webui:ollama
  docker compose -f docker-compose.yml $FRONTEND_DOCKER_COMPOSE_FILE -f docker-compose-ai.yml --env-file "$SCRIPT_DIR/.env" up -d
fi

# Wait for IPFS API to be ready
until curl -s http://localhost:5001/api/v0/id > /dev/null 2>&1; do
  echo "INFO: Waiting for IPFS API to become available..."
  sleep 2
done

echo "INFO: IPFS API is ready"

# Conditionally remove default IPFS bootstrap peers
if [ "$REMOVE_PEERS" = "true" ]; then
  echo "INFO: Removing all IPFS peers (bootstrap and any that were added)"
  curl -X POST "http://localhost:5001/api/v0/bootstrap/rm/all"
else
  echo "INFO: Skipping removal of IPFS bootstrap peers"
fi

# If frontend was requested in dev mode, start it locally
if [ "$FRONTEND_DEV" = "true" ]; then
  echo "INFO: Starting frontend in development mode"
  cd ./frontend || exit 1
  npm install
  npm run dev
fi
