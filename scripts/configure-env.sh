#!/usr/bin/env bash
set -euo pipefail

#──────────────────────────────────────────────────────────────────────────────
# PATHS
#──────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENVFILE="${SCRIPT_DIR}/../.env"

#──────────────────────────────────────────────────────────────────────────────
# SOURCES
#──────────────────────────────────────────────────────────────────────────────

# import echo_error, echo_warn, echo_success, echo_section, echo_info and prompt functions for uniform logging
source "${SCRIPT_DIR}/libs/logging.sh"

#──────────────────────────────────────────────────────────────────────────────
# FUNCTIONS
#──────────────────────────────────────────────────────────────────────────────

prompt_until_valid() {
  local var_name=$1
  local prompt_text=$2
  local default_value=$3
  shift 3   # remove first 3 parameters so that "$@" now only contains validator functions
  local validators=("$@")   # array of validator functions
  local value

  if [[ -n "${!var_name-}" ]]; then # check if value is already set by profile
    echo_success "$var_name set by profile to ${!var_name}"
    return
  fi

  while :; do
    prompt "$var_name - $prompt_text [$default_value]: " value
    value=${value:-$default_value}

    local valid=true
    for validator in "${validators[@]}"; do
      if ! "$validator" "$value" "$var_name" "$default_value"; then
        valid=false
        break
      fi
    done
    $valid && break
  done

  # assign to caller's variable
  printf -v "$var_name" '%s' "$value"
  echo_success "${var_name} set to ${value}"
}

prompt_secret_until_valid() {
  local var_name=$1
  local prompt_text=$2
  shift 2   # remove first 2 parameters so that "$@" now only contains validator functions
  local validators=("$@")   # array of validator functions
  local value

  while :; do
    prompt "$var_name - $prompt_text [auto-generate]: " value

    if [[ -z "$value" ]]; then
      value="$(openssl rand -hex 32)"
      echo_success "$var_name auto-generated"
    fi

    local valid=true
    for validator in "${validators[@]}"; do
      if ! "$validator" "$value" "$var_name"; then
        valid=false
        break
      fi
    done

    $valid && break
  done

  # assign to caller's variable
  printf -v "$var_name" '%s' "$value"
  echo_success "${var_name} set to ${value}"
}

prompt_choice_until_valid() {
  local var_name=$1  # variable to assign
  local prompt_text=$2   # text to display
  local default_value=$3   # default choice
  shift 3  # remove first 3 arguments
  local -a choices=("$@")  # remaining args are allowed choices
  local value

  # If value already preset by profile, skip
  if [[ -n "${!var_name-}" ]]; then
    echo_success "$var_name set by profile to ${!var_name}"
    return
  fi

  while :; do
    echo_info "$var_name - $prompt_text"
    # Display numbered choices
    for i in "${!choices[@]}"; do
      local index=$((i+1))
      echo_info "  $index) ${choices[i]}"
    done

    prompt "Enter choice [$default_value]: " value
    value=${value:-$default_value}

    # Check if input is one of the allowed choices
    if ! [[ "$value" =~ ^[0-9]+$ ]] || (( value < 1 || value > ${#choices[@]} )); then
      echo_warn "Invalid choice. Enter a number between 1 and ${#choices[@]}."
      continue
    fi
    break
  done

  # Assign final value
  printf -v "$var_name" '%s' "$value"
  echo_success "${var_name} set to ${value}"
}

#──────────────────────────────────────────────────────────────────────────────
# VALIDATORS
#──────────────────────────────────────────────────────────────────────────────

validate_password() {
  local val="$1"
  local var_name="$2"

  if [[ ${#val} -lt 8 ]]; then
    echo_warn "$var_name too short; must be at least 8 characters."
    return 1
  fi
  return 0
}

validate_secret() {
  local val="$1"
  local var_name="$2"

  if [[ ${#val} -lt 12 ]]; then
    echo_warn "$var_name too short; must be at least 12 characters."
    return 1
  fi
  return 0
}

validate_not_default_in_production() {
  local value="$1"
  local var_name="$2"
  local default_value="$3"

  if [[ "$NODE_ENV" == "production" && "$value" == "$default_value" ]]; then
    echo_warn "Using the default $var_name in production is forbidden!"
    return 1
  fi
  return 0
}

validate_domain() {
  local val="$1"
  local var_name="$2"

  # Length check
  [[ ${#val} -lt 5 ]] && { echo_warn "$var_name must be at least 5 characters."; return 1; }

  # Allowed characters
  [[ ! "$val" =~ ^[A-Za-z0-9.-]+$ ]] && { echo_warn "$var_name contains invalid characters."; return 1; }

  # No consecutive dots or hyphens
  [[ "$val" =~ \.\. || "$val" =~ -- ]] && { echo_warn "$var_name cannot contain consecutive dots or hyphens."; return 1; }

  # Cannot start or end with dot or hyphen
  [[ "$val" =~ ^[.-] || "$val" =~ [.-]$ ]] && { echo_warn "$var_name cannot start or end with a dot or hyphen."; return 1; }

  # Must contain at least one dot
  [[ "$val" != *.* ]] && { echo_warn "$var_name must contain at least one dot."; return 1; }

  return 0
}

validate_port() {
  local val="$1"
  local var_name="$2"

  # Check if numeric
  if ! [[ "$val" =~ ^[0-9]+$ ]]; then
    echo_warn "$var_name must be a number."
    return 1
  fi

  # Check range
  if (( val < 1 || val > 65535 )); then
    echo_warn "$var_name must be between 1 and 65535."
    return 1
  fi

  return 0
}

validate_email() {
  local val="$1"
  local var_name="${2:-Email}"

  # Basic format check
  if [[ ! "$val" =~ ^[^[:space:]]+@[^[:space:]]+\.[^[:space:]]+$ ]]; then
    echo_warn "Invalid $var_name format. Expected something like user@example.com."
    return 1
  fi

  return 0
}

#──────────────────────────────────────────────────────────────────────────────
# PRE-CHECK
#──────────────────────────────────────────────────────────────────────────────

if [[ -f "$ENVFILE" ]]; then
  echo_warn "An existing $ENVFILE was found."

  while :; do
    prompt "Do you want to replace it? (Y/n): " REPLACE_ENV
    REPLACE_ENV=${REPLACE_ENV:-y}
    if [[ "$REPLACE_ENV" =~ ^[Yy]$ ]]; then
      rm -f "$ENVFILE"
      echo_success "Removed old .env file so a new one can be created..."
      break
    elif [[ "$REPLACE_ENV" =~ ^[Nn]$ ]]; then
      echo_success "Keeping existing .env. Nothing to do."
      exit 0
    else
      echo_warn "Please enter y (yes) or n (no)."
    fi
  done
fi

#──────────────────────────────────────────────────────────────────────────────
# DEFAULT VALUES
#──────────────────────────────────────────────────────────────────────────────

DEFAULT_MASTER_PASSWORD="Kennwort123"
DEFAULT_DOMAIN="example.com"
DEFAULT_FRONTEND_PORT=3000
DEFAULT_API_PORT=8000
DEFAULT_SWARM_PORT=4001
DEFAULT_IPFS_API_PORT=5001
DEFAULT_IPFS_GATEWAY_PORT=8080
DEFAULT_PINNING_SERVICE_PORT=9097
DEFAULT_CLUSTER_SWARM_PORT=9096
DEFAULT_ADMIN_USER_PASSWORD="Kennwort123"
DEFAULT_OPEN_WEBUI_PORT=3333
DEFAULT_OPEN_API_PORT=9094
DEFAULT_OLLAMA_MODEL="gemma3:1b"

#──────────────────────────────────────────────────────────────────────────────
# PROFILES
#──────────────────────────────────────────────────────────────────────────────

echo_section "Welcome! Let's configure your TruSpace environment step by step."
echo_info "You can accept defaults by pressing ENTER.\n"

# PROFILE
prompt_choice_until_valid PROFILE "Specify an environment profile to prefill selected settings." 1 \
  "development - pre-fills everything for a local environment." \
  "domain - pre-fills most values but prompts for the domain" \
  "production - requires the user to specify all values"

case "$PROFILE" in
  1)
    NODE_ENV="development"
    MASTER_PASSWORD=$DEFAULT_MASTER_PASSWORD
    DOMAIN=$DEFAULT_DOMAIN
    FRONTEND_PORT=$DEFAULT_FRONTEND_PORT
    API_DOMAIN="api.$DOMAIN"
    API_PORT=$DEFAULT_API_PORT
    SWARM_PORT=$DEFAULT_SWARM_PORT
    IPFS_API_PORT=$DEFAULT_IPFS_API_PORT
    IPFS_GATEWAY_PORT=$DEFAULT_IPFS_GATEWAY_PORT
    PINNING_SERVICE_PORT=$DEFAULT_PINNING_SERVICE_PORT
    CLUSTER_SWARM_PORT=$DEFAULT_CLUSTER_SWARM_PORT
    ADMIN_USER_EMAIL="admin@$DOMAIN"
    ADMIN_USER_PASSWORD=$DEFAULT_ADMIN_USER_PASSWORD
    OPEN_WEBUI_PORT=$DEFAULT_OPEN_WEBUI_PORT
    OPEN_API_PORT=$DEFAULT_OPEN_API_PORT
    OLLAMA_MODEL=$DEFAULT_OLLAMA_MODEL
    ;;
  2)
    NODE_ENV="development"
    MASTER_PASSWORD=$DEFAULT_MASTER_PASSWORD
    SWARM_PORT=$DEFAULT_SWARM_PORT
    IPFS_API_PORT=$DEFAULT_IPFS_API_PORT
    IPFS_GATEWAY_PORT=$DEFAULT_IPFS_GATEWAY_PORT
    PINNING_SERVICE_PORT=$DEFAULT_PINNING_SERVICE_PORT
    CLUSTER_SWARM_PORT=$DEFAULT_CLUSTER_SWARM_PORT
    ADMIN_USER_PASSWORD=$DEFAULT_ADMIN_USER_PASSWORD
    OPEN_WEBUI_PORT=$DEFAULT_OPEN_WEBUI_PORT
    OPEN_API_PORT=$DEFAULT_OPEN_API_PORT
    OLLAMA_MODEL=$DEFAULT_OLLAMA_MODEL
    ;;
  3)
    NODE_ENV="production"
    ;;
esac

#──────────────────────────────────────────────────────────────────────────────
# GENERAL SETTINGS
#──────────────────────────────────────────────────────────────────────────────

echo_section "GENERAL SETTINGS"

# NODE_ENV
prompt_choice_until_valid NODE_ENV "Specifies the environment in which the application is running." 1 \
  "development" \
  "production"

# MASTER_PASSWORD
prompt_until_valid MASTER_PASSWORD "Master admin password for critical actions (min 8 chars)" $DEFAULT_MASTER_PASSWORD validate_password validate_not_default_in_production

# JWT_SECRET
prompt_secret_until_valid JWT_SECRET "Secret used to sign JWT authentication tokens (min 12 chars)" validate_secret

#──────────────────────────────────────────────────────────────────────────────
# DOMAIN SETTINGS
#──────────────────────────────────────────────────────────────────────────────

echo_section "DOMAIN SETTINGS"

# PROTOCOL
while :; do
  prompt "PROTOCOL - Use HTTPS for URLs? (Y/n): " USE_HTTPS
  USE_HTTPS=${USE_HTTPS:-y}
  if [[ "$USE_HTTPS" =~ ^[YyNn]$ ]]; then break; fi
  echo_warn "Please enter y (yes) or n (no)."
done
PROTOCOL="http"
[[ "$USE_HTTPS" =~ ^[Yy]$ ]] && PROTOCOL="https"
echo_success "PROTOCOL set to ${PROTOCOL}"

# DOMAIN
prompt_until_valid DOMAIN "Your Public DOMAIN (e.g. example.com)" $DEFAULT_DOMAIN validate_domain validate_not_default_in_production

# FRONTEND_PORT
prompt_until_valid FRONTEND_PORT "Port for your Frontend" $DEFAULT_FRONTEND_PORT validate_port

# FRONTEND_URL
FRONTEND_URL="${PROTOCOL}://${DOMAIN}:${FRONTEND_PORT}"
echo_success "FRONTEND_URL set to ${FRONTEND_URL}"

# API_DOMAIN
prompt_until_valid API_DOMAIN "Your API DOMAIN (e.g. api.example.com)" "api.${DOMAIN}" validate_domain

# API_PORT
prompt_until_valid API_PORT "Port for your API" $DEFAULT_API_PORT validate_port

# NEXT_PUBLIC_API_URL
NEXT_PUBLIC_API_URL="${PROTOCOL}://${API_DOMAIN}:${API_PORT}/api"
echo_success "NEXT_PUBLIC_API_URL set to ${NEXT_PUBLIC_API_URL}"

# CORS
CORS_ORIGIN_ARRAY=(
  "${PROTOCOL}://${DOMAIN}:${FRONTEND_PORT}"
  "${PROTOCOL}://${API_DOMAIN}:${API_PORT}"
)

OI_CORS_ALLOW_ORIGIN_ARRAY=(
  "${PROTOCOL}://${DOMAIN}:${FRONTEND_PORT}"
  "${PROTOCOL}://${API_DOMAIN}:${API_PORT}"
  "${PROTOCOL}://backend:${API_PORT}"
)

# Add localhost entries only in development
if [[ "$NODE_ENV" == "development" ]]; then
  CORS_ORIGIN_ARRAY=(
    "${CORS_ORIGIN_ARRAY[@]}"
    "http://localhost:${FRONTEND_PORT}"
  )
  OI_CORS_ALLOW_ORIGIN_ARRAY=(
    "${OI_CORS_ALLOW_ORIGIN_ARRAY[@]}"
    "http://localhost:${FRONTEND_PORT}"
    "http://localhost:${API_PORT}"
  )
fi

# CORS_ORIGIN
CORS_ORIGIN=$(IFS=, ; echo "${CORS_ORIGIN_ARRAY[*]}") # Join array into one line
echo_success "CORS_ORIGIN set to ${CORS_ORIGIN}"

# OI_CORS_ALLOW_ORIGIN
OI_CORS_ALLOW_ORIGIN=$(IFS=\; ; echo "${OI_CORS_ALLOW_ORIGIN_ARRAY[*]}")
echo_success "OI_CORS_ALLOW_ORIGIN set to ${OI_CORS_ALLOW_ORIGIN}"

#──────────────────────────────────────────────────────────────────────────────
# IPFS SETTINGS
#──────────────────────────────────────────────────────────────────────────────

echo_section "IPFS SETTINGS"

# SWARM_PORT
prompt_until_valid SWARM_PORT "SWARM_PORT" $DEFAULT_SWARM_PORT validate_port

# IPFS_API_PORT
prompt_until_valid IPFS_API_PORT "IPFS_API_PORT" $DEFAULT_IPFS_API_PORT validate_port

# IPFS_GATEWAY_PORT
prompt_until_valid IPFS_GATEWAY_PORT "IPFS_GATEWAY_PORT" $DEFAULT_IPFS_GATEWAY_PORT validate_port

# PINNING_SERVICE_PORT
prompt_until_valid PINNING_SERVICE_PORT "PINNING_SERVICE_PORT" $DEFAULT_PINNING_SERVICE_PORT validate_port

# CLUSTER_SWARM_PORT
prompt_until_valid CLUSTER_SWARM_PORT "CLUSTER_SWARM_PORT" $DEFAULT_CLUSTER_SWARM_PORT validate_port

#──────────────────────────────────────────────────────────────────────────────
# OPENWEBUI SETTINGS
#──────────────────────────────────────────────────────────────────────────────

echo_section "OPENWEBUI SETTINGS"

# ADMIN_USER_EMAIL (OpenWebUI admin email)
prompt_until_valid ADMIN_USER_EMAIL "OpenWebUI ADMIN email" "admin@${DOMAIN}" validate_email

# ADMIN_USER_PASSWORD
prompt_until_valid ADMIN_USER_PASSWORD "OpenWebUI ADMIN password (min 8 chars)" $DEFAULT_ADMIN_USER_PASSWORD validate_password validate_not_default_in_production

# WEBUI_SECRET_KEY
prompt_secret_until_valid WEBUI_SECRET_KEY "Secret Key for OpenWebUI sessions (min 12 chars)"

# OPEN_WEBUI_PORT
prompt_until_valid OPEN_WEBUI_PORT "OPEN_WEBUI_PORT" $DEFAULT_OPEN_WEBUI_PORT validate_port

# OPEN_API_PORT
prompt_until_valid OPEN_API_PORT "OPEN_API_PORT" $DEFAULT_OPEN_API_PORT validate_port

# OLLAMA_MODEL
prompt_until_valid OLLAMA_MODEL "AI model used by the backend, a complete list is available at https://ollama.com/search (Example: gemma3:1b, llama2, mistral)" $DEFAULT_OLLAMA_MODEL

#──────────────────────────────────────────────────────────────────────────────
# SMTP Settings
#──────────────────────────────────────────────────────────────────────────────

echo_section "SMTP Settings"

EMAIL_SENDER="\"TruSpace <truspace@${DOMAIN}>\""
echo_success "EMAIL_SENDER set to $EMAIL_SENDER"

#──────────────────────────────────────────────────────────────────────────────
# WRITE ENV FILE
#──────────────────────────────────────────────────────────────────────────────

echo_section "WRITING ENV FILE"

cat >"$ENVFILE" <<EOF
#──────────────────────────────────────────────────────────────────────────────
# 🔧 Configuration you are most likely to change
#  (Set these for your environment before running)
#──────────────────────────────────────────────────────────────────────────────

# Environment mode for the backend.
#   development → verbose logging, hot reload, dev defaults
#   production  → optimized build, no debug logs
NODE_ENV=${NODE_ENV}

# AI model used by the backend, start with a small model if unsure.
# A complete list is available https://ollama.com/search
# Example: gemma3:1b, llama2, mistral, etc.
OLLAMA_MODEL=${OLLAMA_MODEL}

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
#  (Defaults should work for most setups)
#──────────────────────────────────────────────────────────────────────────────

# Build container or pull image
#   build -> build containers from scratch
#   pull -> load published image (add version tag below if wanted)
BUILD_OR_PULL_IMAGES=build

# 🚀 Version tag for pulling backend/frontend images.
# Set to a specific version in production (e.g., 1.2.3).
VERSION=latest

# 📜 Logging level (DEBUG, INFO, WARN, ERROR)
LOG_LEVEL=DEBUG

# 🌐 If true, IPFS will NOT connect to the public network.
START_PRIVATE_NETWORK=true

# 📡 Backend API port
API_PORT=${API_PORT}

# Internal IPFS Cluster and gateway URLs
IPFS_CLUSTER_HOST=http://cluster0:9094
IPFS_PINSVC_HOST=http://cluster0:9097
IPFS_GATEWAY_HOST=http://ipfs0:8080

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
FRONTEND_URL=${FRONTEND_URL}

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

echo_success "Wrote $ENVFILE"

#──────────────────────────────────────────────────────────────────────────────
# NEXT STEPS
#──────────────────────────────────────────────────────────────────────────────

echo_section "Next steps"
echo_info " • Review and adjust any CONTENT_SECURITY_POLICY_* entries in $ENVFILE"
echo_info " • For a more detailed configuration (e.g. email server), have a look at the configuration in $ENVFILE"
echo_info " • Start TruSpace with ./start.sh"
echo_info " • Connect to other TruSpace nodes with ./scripts/connectPeer-automatic.sh or ...-manual.sh"
