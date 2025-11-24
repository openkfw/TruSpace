#!/usr/bin/env bash
set -euo pipefail

#──────────────────────────────────────────────────────────────────────────────
# PATHS
#──────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE="${SCRIPT_DIR}/../.env.example"
ENVFILE="${SCRIPT_DIR}/../.env"

#──────────────────────────────────────────────────────────────────────────────
# SOURCES
#──────────────────────────────────────────────────────────────────────────────

# import error(), warn(), success(), section(), info() functions for uniform logging
source "${SCRIPT_DIR}/libs/logging.sh"

#──────────────────────────────────────────────────────────────────────────────
# PRE-CHECK
#──────────────────────────────────────────────────────────────────────────────

if [[ ! -f "$TEMPLATE" ]]; then
  error "Template file '$TEMPLATE' not found in $(pwd). Please place your template there."
  exit 1
fi

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
  read -rp "04) Use HTTPS for URLs? (Y/n): "
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

# OPENWEBUI ADMIN PASSWORD
while :; do
  read -rsp "15) OpenWebUI ADMIN password (min 8 chars) [Kennwort123]: " ADMIN_USER_PASSWORD
  ADMIN_USER_PASSWORD=${ADMIN_USER_PASSWORD:-Kennwort123}
  info
  if [[ ${#ADMIN_USER_PASSWORD} -ge 8 ]]; then break; fi
  warn "Password too short; needs ≥8 characters."
done

# OPENWEBUI SECRET KEY
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
# CREATE .env FROM TEMPLATE
#──────────────────────────────────────────────────────────────────────────────

section "CREATING ENV FILE"

cp "$TEMPLATE" "$ENVFILE"
success "Copied $TEMPLATE → $ENVFILE"

#──────────────────────────────────────────────────────────────────────────────
# CORS
#──────────────────────────────────────────────────────────────────────────────

# Base CORS (production) values
CORS_ORIGIN="\
        ${PROTOCOL}://${DOMAIN},\
        ${PROTOCOL}://${API_DOMAIN}/api"

OI_CORS_ALLOW_ORIGIN="\
        ${PROTOCOL}://${DOMAIN}:${FRONTEND_PORT};\
        ${PROTOCOL}://${DOMAIN}:${API_PORT};\
        ${PROTOCOL}://backend:${API_PORT}"

# Add localhost entries only in development
if [[ "$NODE_ENV" == "development" ]]; then
  CORS_ORIGIN="\
          ${PROTOCOL}://localhost:${FRONTEND_PORT},\
          ${CORS_ORIGIN}"

  OI_CORS_ALLOW_ORIGIN="\
          ${PROTOCOL}://localhost:${FRONTEND_PORT};\
          ${PROTOCOL}://localhost:${API_PORT};\
          ${OI_CORS_ALLOW_ORIGIN}"
fi

NEXT_PUBLIC_API_URL="${PROTOCOL}://${API_DOMAIN}/api"
EMAIL_SENDER="\"TruSpace <truspace@${DOMAIN}>\""

#──────────────────────────────────────────────────────────────────────────────
# SED CONFIG
#──────────────────────────────────────────────────────────────────────────────

if [[ "$OSTYPE" == "darwin"* ]]; then
        SED_EXT=(-i '')
else
        SED_EXT=(-i)
fi

#──────────────────────────────────────────────────────────────────────────────
# SUBSTITUTE PLACEHOLDERS
#──────────────────────────────────────────────────────────────────────────────

sed "${SED_EXT[@]}" \
  -e "s|NODE_ENV=development|NODE_ENV=${NODE_ENV}|g" \
  -e "s|JWT_SECRET=super-secret-key|JWT_SECRET=${JWT_SECRET}|g" \
  -e "s|MASTER_PASSWORD=Kennwort123|MASTER_PASSWORD=${MASTER_PASSWORD}|g" \
  -e "s|CORS_ORIGIN=http://localhost:3000,https://example.com|CORS_ORIGIN=${CORS_ORIGIN}|g" \
  -e "s|NEXT_PUBLIC_API_URL=http://localhost:8000/api|NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}|g" \
  -e "s|API_PORT=8000|API_PORT=${API_PORT}|g" \
  -e "s|FRONTEND_PORT=3000|FRONTEND_PORT=${FRONTEND_PORT}|g" \
  -e "s|OPEN_WEBUI_PORT=3333|OPEN_WEBUI_PORT=${OPEN_WEBUI_PORT}|g" \
  -e "s|SWARM_PORT=4001|SWARM_PORT=${SWARM_PORT}|g" \
  -e "s|IPFS_API_PORT=5001|IPFS_API_PORT=${IPFS_API_PORT}|g" \
  -e "s|IPFS_GATEWAY_PORT=8080|IPFS_GATEWAY_PORT=${IPFS_GATEWAY_PORT}|g" \
  -e "s|OPEN_API_PORT=9094|OPEN_API_PORT=${OPEN_API_PORT}|g" \
  -e "s|PINNING_SERVICE_PORT=9097|PINNING_SERVICE_PORT=${PINNING_SERVICE_PORT}|g" \
  -e "s|CLUSTER_SWARM_PORT=9096|CLUSTER_SWARM_PORT=${CLUSTER_SWARM_PORT}|g" \
  -e "s|OI_CORS_ALLOW_ORIGIN=.*|OI_CORS_ALLOW_ORIGIN=\"${OI_CORS_ALLOW_ORIGIN}\"|g" \
  -e "s|EMAIL_SENDER=\"TruSpace <truspace@truspace.com>\"|EMAIL_SENDER=${EMAIL_SENDER}|g" \
  -e "s|ADMIN_USER_EMAIL=admin@example.com|ADMIN_USER_EMAIL=${ADMIN_USER_EMAIL}|g" \
  -e "s|ADMIN_USER_PASSWORD=admin|ADMIN_USER_PASSWORD=${ADMIN_USER_PASSWORD}|g" \
  -e "s|WEBUI_SECRET_KEY=\"t0p-s3cr3t\"|WEBUI_SECRET_KEY=\"${WEBUI_SECRET_KEY}\"|g" \
  "$ENVFILE"

success ".env file has been created and all placeholders replaced!"
info
section "Next steps"
info " • Review and adjust any CONTENT_SECURITY_POLICY_* entries in $ENVFILE"
info " • For a more detailed configuration (e.g. email server), have a look at the configuration in $ENVFILE"
info " • Start TruSpace with ./start.sh"
info " • Connect to other TruSpace nodes with ./scripts/connectPeer-automatic.sh or ...-manual.sh"