#!/bin/bash

# This script starts the environment for TruSpace.
# Usage: ./start.sh [--local-frontend] [--remove-peers] [--help]
#   --dev             : starts the application in development mode
#   --local-frontend  : start the frontend locally instead of in Docker
#   --no-ai           : disable AI functionality (Ollama and Open-WebUI) when starting the application
#   --remove-peers    : after IPFS starts, remove default bootstrap peers via the IPFS API
#   --help, -h        : display this help message and exit

# Function to display usage/help
print_help() {
  echo "Script: $0 [USAGE] [OPTIONS]"
  echo "This script starts the TruSpace application environment."
  echo
  echo "Usage:"
  echo "  ./start.sh [--dev] [--local-frontend] [--remove-peers] [--help]"
  echo
  echo "Options:"
  echo "  --dev               Start the application in development mode"
  echo "  --local-frontend    Start the frontend locally instead of in Docker, useful for debugging"
  echo "  --no-ai             Disable AI functionality (Ollama and Open-WebUI) when starting the application"
  echo "  --remove-peers      After IPFS starts, remove default bootstrap peers or any other peers that were added"
  echo "  -h, --help          Display this help message and exit"
  exit 0
}

echo " "
echo "████████╗██████╗ ██╗   ██╗███████╗██████╗  █████╗  ██████╗███████╗ "
echo "╚══██╔══╝██╔══██╗██║   ██║██╔════╝██╔══██╗██╔══██╗██╔════╝██╔════╝ "
echo "   ██║   ██████╔╝██║   ██║███████╗██████╔╝███████║██║     █████╗   "
echo "   ██║   ██╔══██╗██║   ██║╚════██║██╔═══╝ ██╔══██║██║     ██╔══╝   "
echo "   ██║   ██║  ██║╚██████╔╝███████║██║     ██║  ██║╚██████╗███████╗ "
echo "   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝     ╚═╝  ╚═╝ ╚═════╝╚══════╝ "
echo "                                                                   "


#--------------------------------------#
###--- LOAD ENVIRONMENT VARIABLES ---###
#--------------------------------------#
# Generate .env file from example if none exists
[[ -e .env ]] || cp .env.example .env

# Read .env file
SCRIPT_DIR=$(dirname -- "$0")
source "$SCRIPT_DIR/.env"

# Print current script directory
echo "INFO: Current script directory: $SCRIPT_DIR"

echo


#-----------------------------#
###--- SET DEFAULT FLAGS ---###
#-----------------------------#
DEV="false"
LOCAL_FRONTEND="false"
DISABLE_ALL_AI_FUNCTIONALITY="false"
REMOVE_PEERS="false"


#----------------------------------------#
###--- PARSE COMMAND-LINE ARGUMENTS ---###
#----------------------------------------#
while [[ "$#" -gt 0 ]]; do
  case "$1" in
    --dev)
      DEV="true"
      echo "INFO: Starting in development mode"
      shift
      ;;
    --local-frontend)
      LOCAL_FRONTEND="true"
      echo "INFO: Frontend will be started locally for development"
      shift
      ;;
    --no-ai)
      DISABLE_ALL_AI_FUNCTIONALITY="true"
      echo "INFO: AI functionality (Ollama and Open-WebUI) will be disabled"
      shift
      ;;
    --remove-peers)
      REMOVE_PEERS="true"
      echo "INFO: IPFS bootstrap peers will be removed after startup"
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


#------------------------#
###--- DOCKER SETUP ---###
#------------------------#
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

# Capture current user/group IDs for Docker
export LUID=$(id -u)
export LGID=$(id -g)


#----------------------#
###--- DOCKER RUN ---###
#----------------------#
# Initialize print variables to display which service is run in which way
build_containers=()
pull_containers=()
skip_containers=()

# Backend
if [ "$DEV" = "true" ] || [ "$BUILD_OR_PULL_IMAGES" = "build" ]; then
    build_containers+=(backend)
    DOCKER_BUILD_OR_PULL_DOWN="-f docker-compose.build.yml down"
else
    pull_containers+=(backend)
    DOCKER_BUILD_OR_PULL_DOWN="-f docker-compose.load.yml down"
fi

# Frontend
if [ "$LOCAL_FRONTEND" = "true" ]; then
    skip_containers+=(frontend)
    FRONTEND_DOCKER_COMPOSE_FILE=""
elif [ "$DEV" = "true" ] || [ "$BUILD_OR_PULL_IMAGES" = "build" ]; then
    build_containers+=(frontend)
    FRONTEND_DOCKER_COMPOSE_FILE="-f docker-compose-frontend.yml"
else
    pull_containers+=(frontend)
    FRONTEND_DOCKER_COMPOSE_FILE="-f docker-compose-frontend.yml"
fi

# IPFS and IPFS Cluster containers (always pulled)
pull_containers+=(ipfs0 cluster0)

# OpenWebUI (AI)
if [ "$DISABLE_ALL_AI_FUNCTIONALITY" = true ]; then
  skip_containers+=(webui)
  AI_DOCKER_COMPOSE_FILE=""
else
  pull_containers+=(webui)
  AI_DOCKER_COMPOSE_FILE="-f docker-compose-ai.yml"
fi

# Pretty print results
if [ ${#build_containers[@]} -gt 0 ]; then
  echo -e "\n🛠️  To be built containers:"
  for c in "${build_containers[@]}"; do
    echo "  ✅ $c"
  done
fi
if [ ${#pull_containers[@]} -gt 0 ]; then
  echo -e "\n📦 To be pulled containers:"
  for c in "${pull_containers[@]}"; do
    echo "  ✅ $c"
  done
fi
if [ ${#skip_containers[@]} -gt 0 ]; then
  echo -e "\n🚫 To be skipped containers:"
  for c in "${skip_containers[@]}"; do
    echo "  ⚪ $c"
  done
fi

exit 0

# Remove any previous Docker containers (including orphans) if in dev mode
if [ "$DEV" = "true" ]; then
  echo
  echo "INFO: Stopping and removing existing Docker containers..."
  docker compose $DOCKER_BUILD_OR_PULL_DOWN --remove-orphans
else
  echo "INFO: Not stopping or rebuilding existing Docker containers"
fi

# DOCKER COMPOSE
echo "INFO: Starting Docker containers..."

# FIRST BUILD RELEVANT CONTAINERS
if [ "$DEV" = "true" ] || [ "$BUILD_OR_PULL_IMAGES" = "build" ]; then
    echo "INFO: Building Docker images from scratch (no cache)..."
    docker compose --env-file "$SCRIPT_DIR/.env" \
        -f docker-compose.yml $FRONTEND_DOCKER_COMPOSE_FILE \
        -f docker-compose.build.yml build --no-cache "${build_containers[@]}"
fi

# THEN PULL OR START THE REST
echo "INFO: Pulling necessary Docker images and starting containers..."
docker compose --env-file "$SCRIPT_DIR/.env" \
    -f docker-compose.yml $FRONTEND_DOCKER_COMPOSE_FILE $AI_DOCKER_COMPOSE_FILE \
    -f docker-compose.build.yml up -d "${pull_containers[@]}" "${build_containers[@]}"


#---------------------------------#
###--- CHECKS & MORE CONFIGS ---###
#---------------------------------#

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
if [ "$LOCAL_FRONTEND" = "true" ]; then
  echo "INFO: Starting frontend locally in development mode"
  cd ./frontend || exit 1
  npm install
  rm -rf .next # Clean previous builds
  npm run dev
fi
