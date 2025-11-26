#!/usr/bin/env bash
set -euo pipefail

#──────────────────────────────────────────────────────────────────────────────
# PATHS
#──────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
#TEMPLATE="${SCRIPT_DIR}/../.env.example"
ENVFILE="${SCRIPT_DIR}/../.env"

#──────────────────────────────────────────────────────────────────────────────
# SOURCES
#──────────────────────────────────────────────────────────────────────────────

# import error(), warn(), success(), section(), info() functions for uniform logging
source "${SCRIPT_DIR}/libs/logging.sh"

#──────────────────────────────────────────────────────────────────────────────
# PRE-CHECK
#──────────────────────────────────────────────────────────────────────────────

#if [[ ! -f "$TEMPLATE" ]]; then
#  error "Template file '$TEMPLATE' not found in $(pwd). Please place your template there."
#  exit 1
#fi

if [[ -f "$ENVFILE" ]]; then
  warn "An existing $ENVFILE was found."

  while :; do
    read -rp "Do you want to replace it? (Y/n): " REPLACE_ENV
    REPLACE_ENV=${REPLACE_ENV:-y}
    if [[ "$REPLACE_ENV" =~ ^[Yy]$ ]]; then
      rm -f "$ENVFILE"
      success "Removed old .env file so a new one can be created..."
      break
    elif [[ "$REPLACE_ENV" =~ ^[Nn]$ ]]; then
      info "Keeping existing .env. Nothing to do."
      exit 0
    else
      warn "Please enter y (yes) or n (no)."
    fi
  done
fi

#──────────────────────────────────────────────────────────────────────────────
# PROMPTS - GENERAL SETTINGS
#──────────────────────────────────────────────────────────────────────────────

section "Welcome! Let's configure your TruSpace environment step by step."
info "You can accept defaults by pressing ENTER."
info

# NODE_ENV
read -rp "01) NODE_ENV (e.g. development/production) [development]: " NODE_ENV
NODE_ENV=${NODE_ENV:-development}

# MASTER_PASSWORD
while :; do
  read -rsp "02) Master admin password for critical actions (min 8 chars) [Kennwort123]: " MASTER_PASSWORD
  info
  # Use default if empty
  MASTER_PASSWORD=${MASTER_PASSWORD:-Kennwort123}

  # Validate length
  if [[ ${#MASTER_PASSWORD} -lt 8 ]]; then
    warn "Password too short; must be at least 8 characters."
    continue
  fi

  # Prevent default in production
  if [[ "$NODE_ENV" == "production" && "$MASTER_PASSWORD" == "Kennwort123" ]]; then
    warn "Using the default master password in production is forbidden!"
    continue
  fi

  break
done

# JWT_SECRET
while :; do
  read -rsp "03) Secret used to sign JWT authentication tokens (min 12 chars) [auto-generate]: " JWT_SECRET
  info

  # Auto-generate if empty
  if [[ -z "$JWT_SECRET" ]]; then
    JWT_SECRET="$(openssl rand -hex 32)"
    success "Auto-generated JWT_SECRET"
  fi

  # Length check
  if [[ ${#JWT_SECRET} -lt 12 ]]; then
    warn "JWT_SECRET too short; must be ≥12 characters."
    continue
  fi
  break
done

#──────────────────────────────────────────────────────────────────────────────
# PROMPTS - DOMAIN
#──────────────────────────────────────────────────────────────────────────────

section "DOMAIN SETTINGS"

# PROTOCOL
while :; do
  read -rp "04) Use HTTPS for URLs? (Y/n): " USE_HTTPS
  USE_HTTPS=${USE_HTTPS:-y}
  if [[ "$USE_HTTPS" =~ ^[YyNn]$ ]]; then break; fi
  warn "Please enter y (yes) or n (no)."
done
PROTOCOL="http"
[[ "$USE_HTTPS" =~ ^[Yy]$ ]] && PROTOCOL="https"

# DOMAIN
while :; do
  read -rp "05) Your Public DOMAIN (e.g. example.com) [example.com]: " DOMAIN
  DOMAIN=${DOMAIN:-example.com}
  if [[ ${#DOMAIN} -ge 5 && "$DOMAIN" =~ [A-Za-z0-9.-]+ ]]; then break; fi
  warn "Domain must be at least 5 characters (letters, numbers, dots)."
done

# FRONTEND_PORT
read -rp "06) Frontend Port [3000]: " FRONTEND_PORT
FRONTEND_PORT=${FRONTEND_PORT:-3000}

# API_DOMAIN
while :; do
  read -rp "07) Your API DOMAIN (e.g. api.example.com) [api.${DOMAIN}]: " API_DOMAIN
  API_DOMAIN=${API_DOMAIN:-api.${DOMAIN}}
  if [[ ${#API_DOMAIN} -ge 5 ]]; then break; fi
  warn "Must be at least 5 characters."
done

# API_PORT
read -rp "08) Backend API Port [8000]: " API_PORT
API_PORT=${API_PORT:-8000}

#──────────────────────────────────────────────────────────────────────────────
# PROMPTS - IPFS
#──────────────────────────────────────────────────────────────────────────────

section "IPFS SETTINGS"

read -rp "09) SWARM Port [4001]: " SWARM_PORT
SWARM_PORT=${SWARM_PORT:-4001}

read -rp "10) IPFS API Port [5001]: " IPFS_API_PORT
IPFS_API_PORT=${IPFS_API_PORT:-5001}

read -rp "11) IPFS Gateway Port [8080]: " IPFS_GATEWAY_PORT
IPFS_GATEWAY_PORT=${IPFS_GATEWAY_PORT:-8080}

read -rp "12) Pinning Service Port [9097]: " PINNING_SERVICE_PORT
PINNING_SERVICE_PORT=${PINNING_SERVICE_PORT:-9097}

read -rp "13) Cluster Swarm Port [9096]: " CLUSTER_SWARM_PORT
CLUSTER_SWARM_PORT=${CLUSTER_SWARM_PORT:-9096}

#──────────────────────────────────────────────────────────────────────────────
# PROMPTS - OPENWEBUI
#──────────────────────────────────────────────────────────────────────────────

section "OPENWEBUI SETTINGS"

# ADMIN_USER_EMAIL (OpenWebUI admin email)
while :; do
  read -rp "14) OpenWebUI ADMIN email [admin@${DOMAIN}]: " ADMIN_USER_EMAIL
  ADMIN_USER_EMAIL=${ADMIN_USER_EMAIL:-admin@${DOMAIN}}

  # Basic email validation
  if [[ ! "$ADMIN_USER_EMAIL" =~ ^[^[:space:]]+@[^[:space:]]+\.[^[:space:]]+$ ]]; then
    warn "Invalid email format. Expected something like user@example.com."
    continue
  fi

  # Prevent default in production
  if [[ "$NODE_ENV" == "production" && "$ADMIN_USER_EMAIL" == "admin@example.com" ]]; then
    warn "Using the default admin@example.com in production is forbidden!"
    continue
  fi

  break
done

# ADMIN_USER_PASSWORD
while :; do
  read -rsp "15) OpenWebUI ADMIN password (min 8 chars) [Kennwort123]: " ADMIN_USER_PASSWORD
  ADMIN_USER_PASSWORD=${ADMIN_USER_PASSWORD:-Kennwort123}
  info
  if [[ ${#ADMIN_USER_PASSWORD} -ge 8 ]]; then break; fi
  warn "Password too short; needs ≥8 characters."
done

# WEBUI_SECRET_KEY
while :; do
  read -rsp "16) WEBUI_SECRET_KEY for OpenWebUI sessions (min 12 chars) [auto-generate]: " WEBUI_SECRET_KEY
  info

  # Auto-generate if empty
  if [[ -z "$WEBUI_SECRET_KEY" ]]; then
    WEBUI_SECRET_KEY="$(openssl rand -hex 32)"
    success "Auto-generated WEBUI_SECRET_KEY"
  fi

  # Length check
  if [[ ${#WEBUI_SECRET_KEY} -lt 12 ]]; then
    warn "WEBUI_SECRET_KEY too short; must be ≥12 characters."
    continue
  fi

  break
done

read -rp "17) OpenWebUI Port [3333]: " OPEN_WEBUI_PORT
OPEN_WEBUI_PORT=${OPEN_WEBUI_PORT:-3333}

read -rp "18) OpenAPI Port [9094]: " OPEN_API_PORT
OPEN_API_PORT=${OPEN_API_PORT:-9094}

#──────────────────────────────────────────────────────────────────────────────
# CORS
#──────────────────────────────────────────────────────────────────────────────

# Base CORS (production) values
CORS_ORIGIN_ARRAY=(
    "${PROTOCOL}://${DOMAIN}"
    "${PROTOCOL}://${API_DOMAIN}/api"
)

OI_CORS_ALLOW_ORIGIN_ARRAY=(
    "${PROTOCOL}://${DOMAIN}:${FRONTEND_PORT}"
    "${PROTOCOL}://${DOMAIN}:${API_PORT}"
    "${PROTOCOL}://backend:${API_PORT}"
)

# Add localhost entries only in development
if [[ "$NODE_ENV" == "development" ]]; then
    CORS_ORIGIN_ARRAY=(
        "http://localhost:${FRONTEND_PORT}"
        "${CORS_ORIGIN_ARRAY[@]}"
    )
    OI_CORS_ALLOW_ORIGIN_ARRAY=(
        "http://localhost:${FRONTEND_PORT}"
        "http://localhost:${API_PORT}"
        "${OI_CORS_ALLOW_ORIGIN_ARRAY[@]}"
    )
fi

# Join array into one line
CORS_ORIGIN=$(IFS=, ; echo "${CORS_ORIGIN_ARRAY[*]}")
OI_CORS_ALLOW_ORIGIN=$(IFS=\; ; echo "${OI_CORS_ALLOW_ORIGIN_ARRAY[*]}")

NEXT_PUBLIC_API_URL="${PROTOCOL}://${API_DOMAIN}/api"
EMAIL_SENDER="\"TruSpace <truspace@${DOMAIN}>\""

#──────────────────────────────────────────────────────────────────────────────
# WRITE ENV FILE
#──────────────────────────────────────────────────────────────────────────────

cat >"$ENVFILE" <<EOF
#──────────────────────────────────────────────────────────────────────────────
# 🔧 Configuration you are most likely to change
#    (Set these for your environment before running)
#──────────────────────────────────────────────────────────────────────────────

# Environment mode for the backend.
#   development → verbose logging, hot reload, dev defaults
#   production  → optimized build, no debug logs
NODE_ENV=${NODE_ENV}

# AI model used by the backend, start with a small model if unsure.
# A complete list is available https://ollama.com/search
# Example: gemma3:1b, llama2, mistral, etc.
OLLAMA_MODEL=gemma3:1b

# 🔑 Secret used to sign JWT authentication tokens.
# Must be at least 12 characters and unique in production!
# forbiddenInProdRegex:/^super-secret-key$/ regex:/[^[:space:]]{12,}/
JWT_SECRET=${JWT_SECRET}

# 🌐 Comma-separated list of allowed origins for CORS.
# Add your frontend URLs here, other URLs will not be able to access the website to prevent malicious attacks
# forbiddenInProdRegex:/^http://localhost:3000,https://example.com$/ regex:/[^[:space:]]{5,}/
CORS_ORIGIN=${CORS_ORIGIN}

# 🌍 URL that the frontend will use to call the backend API.
# forbiddenInProdRegex:/^http://localhost:8000/api$/ regex:/[^[:space:]]{5,}$/
NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# 🌐 Allowed CORS origins if you plan to access OpenWebUI directly, separated by semicolons.
OI_CORS_ALLOW_ORIGIN="${OI_CORS_ALLOW_ORIGIN}"

# 🛡️ Master admin password for critical actions.
# forbiddenInProdRegex:/^Kennwort123$/ regex:/[^[:space:]]{8,}/
MASTER_PASSWORD=${MASTER_PASSWORD}

#──────────────────────────────────────────────────────────────────────────────
# ⚙️ Configuration that rarely needs changing
#    (Defaults should work for most setups)
#──────────────────────────────────────────────────────────────────────────────

# Build container or pull image
#   build -> build containers from scratch
#   pull -> load published image (add version tag below if wanted)
BUILD_OR_PULL_IMAGES=build

# 🚀 Version tag for pulling backend/frontend images.
# Set to a specific version in production (e.g., 1.2.3).
VERSION=latest

# 🌐 If true, IPFS will NOT connect to the public network.
START_PRIVATE_NETWORK=true

# 📡 Backend API port
API_PORT=${API_PORT}

# Internal IPFS Cluster and gateway URLs
IPFS_CLUSTER_HOST=http://cluster0:9094
IPFS_PINSVC_HOST=http://cluster0:9097
IPFS_GATEWAY_HOST=http://ipfs0:8080

# 📜 Logging level (DEBUG, INFO, WARN, ERROR)
LOG_LEVEL=DEBUG

# URL where OpenWebUI backend is running
OPENWEBUI_HOST=http://webui:8080

# If true, AI models configured in this file will be auto-downloaded if missing in the docker volume
AUTO_DOWNLOAD=true

# If true, disables all AI-related functionality, i.e. if a document is uploaded, no AI processing will be executed
DISABLE_ALL_AI_FUNCTIONALITY=false

# Path to the backend SQLite database file
DATABASE_PATH=/app/data/truspace.db

# ⏳ JWT token expiration time (in seconds)
JWT_MAX_AGE=86400

# 🌐 Public frontend URL
FRONTEND_URL=http://localhost:3000

# 🛡️ Content Security Policy (CSP) settings
CONTENT_SECURITY_POLICY_DEFAULT_URLS=
CONTENT_SECURITY_POLICY_IMG_URLS=
CONTENT_SECURITY_POLICY_FRAME_URLS=
CONTENT_SECURITY_POLICY_SCRIPT_URLS=
CONTENT_SECURITY_POLICY_WORKER_URLS=

# ⏱️ API request limit per minute to prevent denial of service attacks
RATE_LIMIT_PER_MINUTE=200

# If true, new users must be approved before activation. You need to either change it in the sqlite DB or configure the SMTP server to get the activation email!
REGISTER_USERS_AS_INACTIVE=false

#──────────────────────────────────────────────────────────────────────────────
# 📧 SMTP Email Settings
#──────────────────────────────────────────────────────────────────────────────
SMTP_HOST="host.docker.internal"
SMTP_USER=
SMTP_PASSWORD=   # regex:/[^[:space:]]{8,}/
SMTP_PORT=1025
SMTP_SSL=false
SMTP_TLS=false
EMAIL_SENDER=${EMAIL_SENDER}

#──────────────────────────────────────────────────────────────────────────────
# 🖥️ OpenWebUI Admin Settings used for AI processing, see https://openwebui.com/
#──────────────────────────────────────────────────────────────────────────────

# Admin email for OpenWebUI
# forbiddenInProdRegex:/^admin@example.com$/ regex:/^[^[:space:]]+@[^[:space:]]+\.[^[:space:]]+$/
ADMIN_USER_EMAIL=${ADMIN_USER_EMAIL}

# Admin password for OpenWebUI
# forbiddenInProdRegex:/^admin@example.com$/ regex:/[^[:space:]]{8,}/
ADMIN_USER_PASSWORD=${ADMIN_USER_PASSWORD}

# Secret key for OpenWebUI sessions (min. 12 chars)
# forbiddenInProdRegex:/^admin@example.com$/ regex:/[^[:space:]]{12,}/
WEBUI_SECRET_KEY=${WEBUI_SECRET_KEY}

# Port for OpenWebUI service
OPEN_WEBUI_PORT=${OPEN_WEBUI_PORT}

#──────────────────────────────────────────────────────────────────────────────
# 🎨 Frontend Settings
#──────────────────────────────────────────────────────────────────────────────
FRONTEND_PORT=${FRONTEND_PORT}

#──────────────────────────────────────────────────────────────────────────────
# 🌐 IPFS Kubo Node Settings
#──────────────────────────────────────────────────────────────────────────────
SWARM_PORT=${SWARM_PORT}
IPFS_API_PORT=${IPFS_API_PORT}
IPFS_GATEWAY_PORT=${IPFS_GATEWAY_PORT}

#──────────────────────────────────────────────────────────────────────────────
# 📦 IPFS Cluster - General Settings
#──────────────────────────────────────────────────────────────────────────────

# Interval between cluster peer health checks
CLUSTER_MONITORPINGINTERVAL="2s"

# Multiaddresses for cluster APIs
CLUSTER_RESTAPI_HTTPLISTENMULTIADDRESS=/ip4/0.0.0.0/tcp/9094
CLUSTER_PINSVCAPI_HTTPLISTENMULTIADDRESS=/ip4/0.0.0.0/tcp/9097

# API & pinning service ports
OPEN_API_PORT=${OPEN_API_PORT}
PINNING_SERVICE_PORT=${PINNING_SERVICE_PORT}

# Cluster swarm port (peer-to-peer)
CLUSTER_SWARM_PORT=${CLUSTER_SWARM_PORT}

#──────────────────────────────────────────────────────────────────────────────
# 🔗 IPFS Cluster - Node 0
#──────────────────────────────────────────────────────────────────────────────
CLUSTER_PEERNAME_0=cluster0
CLUSTER_IPFSHTTP_NODEMULTIADDRESS_0=/dns4/ipfs0/tcp/5001
CLUSTER_CRDT_TRUSTEDPEERS_0="*"
EOF

success "Wrote $ENVFILE"

#──────────────────────────────────────────────────────────────────────────────
# NEXT STEPS
#──────────────────────────────────────────────────────────────────────────────

section "Next steps"
info " • Review and adjust any CONTENT_SECURITY_POLICY_* entries in $ENVFILE"
info " • For a more detailed configuration (e.g. email server), have a look at the configuration in $ENVFILE"
info " • Start TruSpace with ./start.sh"
info " • Connect to other TruSpace nodes with ./scripts/connectPeer-automatic.sh or ...-manual.sh"
