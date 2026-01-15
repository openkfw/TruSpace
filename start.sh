#!/bin/bash

# This script starts the environment for TruSpace.
# Usage: ./start.sh [--local-frontend] [--remove-peers] [--help]
#   --dev             : starts the application in development mode
#   --local-frontend  : start the frontend locally instead of in Docker
#   --no-ai           : disable AI functionality (Ollama and Open-WebUI) when starting the application
#   --remove-peers    : after IPFS starts, remove default bootstrap peers via the IPFS API
#   --configure-env    : Generate .env file
#   --help, -h        : display this help message and exit

# Function to display usage/help
print_help() {
  echo "Script: $0 [USAGE] [OPTIONS]"
  echo "This script starts the TruSpace application environment."
  echo
  echo "Usage:"
  echo "  ./start.sh [--dev] [--local-frontend] [--remove-peers] [--configure-env] [--help]"
  echo
  echo "Options:"
  echo "  --dev               Start the application in development mode"
  echo "  --local-frontend    Start the frontend locally instead of in Docker, useful for debugging"
  echo "  --no-ai             Disable AI functionality (Ollama and Open-WebUI) when starting the application"
  echo "  --remove-peers      After IPFS starts, remove default bootstrap peers or any other peers that were added"
  echo "  --configure-env     Generate .env file"
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

#-----------------------------#
###--- SET DEFAULT FLAGS ---###
#-----------------------------#
DEV="false"
LOCAL_FRONTEND="false"
DISABLE_ALL_AI_FUNCTIONALITY="false"
REMOVE_PEERS="false"
CONFIGURE_ENV="false"

SCRIPT_DIR=$(dirname -- "$0")
ENV_FILE="$SCRIPT_DIR/.env"
CONFIGURE_ENV_SCRIPT="$SCRIPT_DIR/scripts/configure-env.sh"

# import echo_error, echo_warn, echo_success, echo_section and echo_info functions for uniform logging
source "$SCRIPT_DIR/scripts/libs/logging.sh"

#----------------------------------------#
###--- PARSE COMMAND-LINE ARGUMENTS ---###
#----------------------------------------#
while [[ "$#" -gt 0 ]]; do
  case "$1" in
    --dev)
      DEV="true"
      echo_info "Starting in development mode"
      shift
      ;;
    --local-frontend)
      LOCAL_FRONTEND="true"
      echo_info "Frontend will be started locally for development"
      shift
      ;;
    --no-ai)
      DISABLE_ALL_AI_FUNCTIONALITY="true"
      echo_info "AI functionality (Ollama and Open-WebUI) will be disabled"
      shift
      ;;
    --remove-peers)
      REMOVE_PEERS="true"
      echo_info "IPFS bootstrap peers will be removed after startup"
      shift
      ;;
    --configure-env)
      CONFIGURE_ENV="true"
      shift
      ;;
    -h|--help)
      print_help
      ;;
    *)
      echo_error "Unknown option: $1"
      echo_warn "Use -h or --help to see available options."
      exit 1
      ;;
  esac
done

#--------------------------------------#
###---- LOAD / GENERATE ENV FILE ----###
#--------------------------------------#

echo_section "Environment"

# If .env is missing OR --configure-env was given → run configure-env script
if [[ "$CONFIGURE_ENV" = "true" || ! -f "$ENV_FILE" ]]; then
  echo_info "Generating .env file using $CONFIGURE_ENV_SCRIPT"

  # Ensure script is executable
  chmod +x "$CONFIGURE_ENV_SCRIPT"

  # Execute script and wait for completion
  if [ "$DEV" = "true" ]; then
    if ! $CONFIGURE_ENV_SCRIPT --dev; then
    echo_error "Failed to generate .env file."
    exit 1
    fi
  else
    if ! $CONFIGURE_ENV_SCRIPT; then
        echo_error "Failed to generate .env file."
        exit 1
    fi
  fi

  echo_success ".env configuration completed"
else
  echo_success "Using existing .env file"
fi

# Load environment variables
if [[ -f "$ENV_FILE" ]]; then
  source "$ENV_FILE"
else
  echo_error ".env file is missing even after generation attempt"
  exit 1
fi

echo_success "Environment variables loaded"

#------------------------#
###--- DOCKER SETUP ---###
#------------------------#

echo_section "Docker Setup"

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
    echo_info "Creating volume directory $d"
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
  echo_info "\n🛠️  To be built containers:"
  for c in "${build_containers[@]}"; do
    echo_info "  ✅ $c"
  done
fi
if [ ${#pull_containers[@]} -gt 0 ]; then
  echo_info "\n📦 To be pulled containers:"
  for c in "${pull_containers[@]}"; do
    echo_info "  ✅ $c"
  done
fi
if [ ${#skip_containers[@]} -gt 0 ]; then
  echo_info "\n🚫 To be skipped containers:"
  for c in "${skip_containers[@]}"; do
    echo_info "  ⚪ $c"
  done
fi

# Remove any previous Docker containers (including orphans) if in dev mode
if [ "$DEV" = "true" ]; then
  echo_info
  echo_info "Stopping and removing existing Docker containers..."
  docker compose $DOCKER_BUILD_OR_PULL_DOWN --remove-orphans
else
  echo_info "Not stopping or rebuilding existing Docker containers"
fi

# DOCKER COMPOSE
echo_info "Starting Docker containers..."

# FIRST BUILD RELEVANT CONTAINERS
if [ "$DEV" = "true" ] || [ "$BUILD_OR_PULL_IMAGES" = "build" ]; then
    echo_info "Building Docker images from scratch (no cache)..."
    docker compose --env-file "$SCRIPT_DIR/.env" \
        -f docker-compose.yml $FRONTEND_DOCKER_COMPOSE_FILE \
        -f docker-compose.build.yml build --no-cache "${build_containers[@]}"
fi

# THEN PULL OR START THE REST
echo_info "Pulling necessary Docker images and starting containers..."
docker compose --env-file "$SCRIPT_DIR/.env" \
    -f docker-compose.yml $FRONTEND_DOCKER_COMPOSE_FILE $AI_DOCKER_COMPOSE_FILE \
    -f docker-compose.build.yml up -d "${pull_containers[@]}" "${build_containers[@]}"


#---------------------------------#
###--- CHECKS & MORE CONFIGS ---###
#---------------------------------#

echo_section "IPFS"

# Wait for IPFS API to be ready
until curl -s http://localhost:5001/api/v0/id > /dev/null 2>&1; do
  echo_info "Waiting for IPFS API to become available..."
  sleep 2
done

echo_success "IPFS API is ready"

# Conditionally remove default IPFS bootstrap peers
if [ "$REMOVE_PEERS" = "true" ]; then
  echo_info "Removing all IPFS peers (bootstrap and any that were added)"
  curl -X POST "http://localhost:5001/api/v0/bootstrap/rm/all"
else
  echo_info "Skipping removal of IPFS bootstrap peers"
fi

# If frontend was requested in dev mode, start it locally
if [ "$LOCAL_FRONTEND" = "true" ]; then
  echo_info "Starting frontend locally in development mode"
  cd ./frontend || exit 1
  npm install
  rm -rf .next # Clean previous builds
  npm run dev
fi
