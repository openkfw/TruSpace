#!/usr/bin/env bash
set -euo pipefail

#──────────────────────────────────────────────────────────────────────────────
# PATHS & CONSTANTS
#──────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENVFILE="${SCRIPT_DIR}/../.env"
AUTO_GENERATE="auto-generate"
EMPTY="empty"

#──────────────────────────────────────────────────────────────────────────────
# SOURCES
#──────────────────────────────────────────────────────────────────────────────

# import echo_error, echo_warn, echo_success, echo_section, echo_info and prompt functions for uniform logging
source "${SCRIPT_DIR}/libs/logging.sh"

#──────────────────────────────────────────────────────────────────────────────
# FUNCTIONS
#──────────────────────────────────────────────────────────────────────────────

prompt_var() {
  local var_name=$1
  local type=$2
  local prompt_text=$3
  local default_value=$4
  shift 4
  local extra=("$@")
  local value input normalized

  # Skip if already set
  if [[ -n "${!var_name-}" ]]; then
    if [[ "${!var_name-}" == "$EMPTY" ]]; then
      printf -v "$var_name" '%s' ""
    fi
    echo_success "$var_name auto-set to ${!var_name:-"be empty"}"
    return
  fi

  while :; do
    case "$type" in
      bool)
        local true_value=${extra[0]:-true}
        local false_value=${extra[1]:-false}
        local suffix="[y/N]"
        local default_choice="n"
        [[ "$default_value" == "$true_value" ]] && { suffix="[Y/n]"; default_choice="y"; }
        prompt "$var_name - $prompt_text $suffix: " input
        input=${input:-$default_choice}
        normalized=$(echo "$input" | tr '[:upper:]' '[:lower:]')
        case "$normalized" in
          y|yes) value="$true_value";;
          n|no) value="$false_value";;
          *) echo_warn "Invalid input. Please enter y or n."; continue;;
        esac
        ;;
      choice)
        echo_info "$var_name - $prompt_text"
        local -a choices=("${extra[@]}")
        # Display numbered choices with descriptions
        for i in "${!choices[@]}"; do echo_info "  $((i+1))) ${choices[i]}"; done
        # Determine default index if default_value is a value
        local default_index=0
        for i in "${!choices[@]}"; do [[ "${choices[i]}" == "$default_value" ]] && default_index=$((i+1)); done
        prompt "Enter choice by number [${default_index}]: " input
        if [[ -z "$input" ]]; then
          value="$default_value"
        elif ! [[ "$input" =~ ^[0-9]+$ ]] || (( input < 1 || input > ${#choices[@]} )); then
          echo_warn "Invalid choice."
          continue
        else
          value="${choices[input-1]}"
        fi
        ;;
      *)
        prompt "$var_name - $prompt_text [${default_value}]: " value
        if [[ -z "$value" && "$default_value" == "$AUTO_GENERATE" ]]; then
            value=$(openssl rand -hex 32)
            echo_success "$var_name auto-generated"
        elif [[ -z "$value" && "$default_value" == "$EMPTY" ]]; then
            value=""
        fi
        ;;
    esac

    # Run validators if any
    local valid=true
    if [[ "$type" != "choice" && "$type" != "bool" ]]; then
      for validator in "${extra[@]}"; do
        if ! "$validator" "$value" "$var_name" "$default_value"; then
          valid=false
          break
        fi
      done
    fi
    $valid && break
  done

  printf -v "$var_name" '%s' "$value"
  echo_success "$var_name set to ${value:-"be empty"}"
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
  prompt_var REPLACE_ENV bool "Do you want to replace it?" true
  if [[ "$REPLACE_ENV" = true ]]; then
    rm -f "$ENVFILE"
    echo_success "Removed old .env file so a new one can be created..."
  else
    echo_success "Keeping existing .env. Nothing to do."
    exit 0
  fi
fi

#──────────────────────────────────────────────────────────────────────────────
# DEFAULT VALUES
#──────────────────────────────────────────────────────────────────────────────

# General Configuration
DEFAULT_NODE_ENV="development"
DEFAULT_LOG_LEVEL="DEBUG"
DEFAULT_BUILD_OR_PULL_IMAGES="build"
DEFAULT_VERSION="latest"
DEFAULT_DATABASE_PATH="/app/data/truspace.db"
# Security Configuration
DEFAULT_MASTER_PASSWORD="Kennwort123"
DEFAULT_JWT_SECRET="$AUTO_GENERATE"
DEFAULT_JWT_MAX_AGE=86400
DEFAULT_REGISTER_USERS_AS_INACTIVE=false
DEFAULT_RATE_LIMIT_PER_MINUTE=200
# Domain Configuration
DEFAULT_PROTOCOL="https"
DEFAULT_DOMAIN="example.com"
DEFAULT_FRONTEND_PORT=3000
DEFAULT_API_PORT=8000
# SMTP Configuration
DEFAULT_SMTP_HOST="host.docker.internal"
DEFAULT_SMTP_USER="$EMPTY"
DEFAULT_SMTP_PASSWORD="$EMPTY"
DEFAULT_SMTP_PORT=1025
DEFAULT_SMTP_SSL=false
DEFAULT_SMTP_TLS=false
# CSP Configuration
DEFAULT_CONTENT_SECURITY_POLICY_DEFAULT_URLS="$EMPTY"
DEFAULT_CONTENT_SECURITY_POLICY_IMG_URLS="$EMPTY"
DEFAULT_CONTENT_SECURITY_POLICY_FRAME_URLS="$EMPTY"
DEFAULT_CONTENT_SECURITY_POLICY_SCRIPT_URLS="$EMPTY"
DEFAULT_CONTENT_SECURITY_POLICY_WORKER_URLS="$EMPTY"
# IPFS & Cluster Configuration
DEFAULT_START_PRIVATE_NETWORK=false
DEFAULT_IPFS_CLUSTER_HOST="http://cluster0:9094"
DEFAULT_IPFS_PINSVC_HOST="http://cluster0:9097"
DEFAULT_IPFS_GATEWAY_HOST="http://ipfs0:8080"
DEFAULT_CLUSTER_MONITORPINGINTERVAL="2s"
DEFAULT_CLUSTER_RESTAPI_HTTPLISTENMULTIADDRESS="/ip4/0.0.0.0/tcp/9094"
DEFAULT_CLUSTER_PINSVCAPI_HTTPLISTENMULTIADDRESS="/ip4/0.0.0.0/tcp/9097"
DEFAULT_CLUSTER_SWARM_PORT=9096
DEFAULT_OPEN_API_PORT=9094
DEFAULT_PINNING_SERVICE_PORT=9097
# Cluster 0
DEFAULT_CLUSTER_PEERNAME_0="cluster0"
DEFAULT_CLUSTER_IPFSHTTP_NODEMULTIADDRESS_0="/dns4/ipfs0/tcp/5001"
DEFAULT_CLUSTER_CRDT_TRUSTEDPEERS_0="*"
# IPFS Kubo Node
DEFAULT_SWARM_PORT=4001
DEFAULT_IPFS_API_PORT=5001
DEFAULT_IPFS_GATEWAY_PORT=8080
# AI Integration
DEFAULT_DISABLE_ALL_AI_FUNCTIONALITY=false
DEFAULT_OLLAMA_MODEL="gemma3:1b"
DEFAULT_AUTO_DOWNLOAD=true
# OpenWebUI Configuration
DEFAULT_OPENWEBUI_HOST="http://webui:8080"
DEFAULT_OPEN_WEBUI_PORT=3333
DEFAULT_ADMIN_USER_PASSWORD="Kennwort123"
DEFAULT_WEBUI_SECRET_KEY="$AUTO_GENERATE"

#──────────────────────────────────────────────────────────────────────────────
# WELCOME
#──────────────────────────────────────────────────────────────────────────────
echo_section "Welcome! Let's configure your TruSpace environment step by step."
echo_info "You can accept defaults by pressing ENTER."
echo_info "You can re-run this setup anytime using:    ./start.sh --configure-env    or    ./scripts/configure-env.sh"
echo_info "You may also manually edit the generated .env file after setup if preferred."

#──────────────────────────────────────────────────────────────────────────────
# PROFILES
#──────────────────────────────────────────────────────────────────────────────
echo_section "Profile"
PROFILE_DEVELOPMENT="development - Prefills everything for a local environment"
PROFILE_PRODUCTION="production - Prefills stable, reliable defaults that work in most standalone environments."
PROFILE_CUSTOM="custom - No defaults; you can specify every value"

# PROFILE
prompt_var PROFILE choice "Specify an environment profile to prefill selected settings" "$PROFILE_DEVELOPMENT" "$PROFILE_DEVELOPMENT" "$PROFILE_PRODUCTION" "$PROFILE_CUSTOM"

case "$PROFILE" in
  "$PROFILE_DEVELOPMENT")
    # General Configuration
    NODE_ENV="$DEFAULT_NODE_ENV"
    LOG_LEVEL="$DEFAULT_LOG_LEVEL"
    BUILD_OR_PULL_IMAGES="$DEFAULT_BUILD_OR_PULL_IMAGES"
    VERSION="$DEFAULT_VERSION"
    DATABASE_PATH="$DEFAULT_DATABASE_PATH"
    # Security Configuration
    MASTER_PASSWORD="$DEFAULT_MASTER_PASSWORD"
    JWT_SECRET=$(openssl rand -hex 32) && echo_success "JWT_SECRET auto-generated"
    JWT_MAX_AGE="$DEFAULT_JWT_MAX_AGE"
    REGISTER_USERS_AS_INACTIVE="$DEFAULT_REGISTER_USERS_AS_INACTIVE"
    RATE_LIMIT_PER_MINUTE="$DEFAULT_RATE_LIMIT_PER_MINUTE"
    # Domain Configuration
    PROTOCOL="$DEFAULT_PROTOCOL"
    DOMAIN="$DEFAULT_DOMAIN"
    FRONTEND_PORT="$DEFAULT_FRONTEND_PORT"
    API_DOMAIN="api.$DOMAIN"
    API_PORT="$DEFAULT_API_PORT"
    # SMTP Configuration
    SMTP_HOST="$DEFAULT_SMTP_HOST"
    SMTP_USER="$DEFAULT_SMTP_USER"
    SMTP_PASSWORD="$DEFAULT_SMTP_PASSWORD"
    SMTP_PORT="$DEFAULT_SMTP_PORT"
    SMTP_SSL="$DEFAULT_SMTP_SSL"
    SMTP_TLS="$DEFAULT_SMTP_TLS"
    EMAIL_SENDER="\"TruSpace <truspace@${DOMAIN}>\""
    # CSP Configuration
    CONTENT_SECURITY_POLICY_DEFAULT_URLS="$DEFAULT_CONTENT_SECURITY_POLICY_DEFAULT_URLS"
    CONTENT_SECURITY_POLICY_IMG_URLS="$DEFAULT_CONTENT_SECURITY_POLICY_IMG_URLS"
    CONTENT_SECURITY_POLICY_FRAME_URLS="$DEFAULT_CONTENT_SECURITY_POLICY_FRAME_URLS"
    CONTENT_SECURITY_POLICY_SCRIPT_URLS="$DEFAULT_CONTENT_SECURITY_POLICY_SCRIPT_URLS"
    CONTENT_SECURITY_POLICY_WORKER_URLS="$DEFAULT_CONTENT_SECURITY_POLICY_WORKER_URLS"
    # IPFS & Cluster Configuration
    START_PRIVATE_NETWORK="$DEFAULT_START_PRIVATE_NETWORK"
    IPFS_CLUSTER_HOST="$DEFAULT_IPFS_CLUSTER_HOST"
    IPFS_PINSVC_HOST="$DEFAULT_IPFS_PINSVC_HOST"
    IPFS_GATEWAY_HOST="$DEFAULT_IPFS_GATEWAY_HOST"
    CLUSTER_MONITORPINGINTERVAL="$DEFAULT_CLUSTER_MONITORPINGINTERVAL"
    CLUSTER_RESTAPI_HTTPLISTENMULTIADDRESS="$DEFAULT_CLUSTER_RESTAPI_HTTPLISTENMULTIADDRESS"
    CLUSTER_PINSVCAPI_HTTPLISTENMULTIADDRESS="$DEFAULT_CLUSTER_PINSVCAPI_HTTPLISTENMULTIADDRESS"
    CLUSTER_SWARM_PORT="$DEFAULT_CLUSTER_SWARM_PORT"
    OPEN_API_PORT="$DEFAULT_OPEN_API_PORT"
    PINNING_SERVICE_PORT="$DEFAULT_PINNING_SERVICE_PORT"
    # Cluster 0
    CLUSTER_PEERNAME_0="$DEFAULT_CLUSTER_PEERNAME_0"
    CLUSTER_IPFSHTTP_NODEMULTIADDRESS_0="$DEFAULT_CLUSTER_IPFSHTTP_NODEMULTIADDRESS_0"
    CLUSTER_CRDT_TRUSTEDPEERS_0="$DEFAULT_CLUSTER_CRDT_TRUSTEDPEERS_0"
    # IPFS Kubo Node
    SWARM_PORT="$DEFAULT_SWARM_PORT"
    IPFS_API_PORT="$DEFAULT_IPFS_API_PORT"
    IPFS_GATEWAY_PORT="$DEFAULT_IPFS_GATEWAY_PORT"
    # AI Integration
    DISABLE_ALL_AI_FUNCTIONALITY="$DEFAULT_DISABLE_ALL_AI_FUNCTIONALITY"
    OLLAMA_MODEL="$DEFAULT_OLLAMA_MODEL"
    AUTO_DOWNLOAD="$DEFAULT_AUTO_DOWNLOAD"
    # OpenWebUI Configuration
    OPENWEBUI_HOST="$DEFAULT_OPENWEBUI_HOST"
    OPEN_WEBUI_PORT="$DEFAULT_OPEN_WEBUI_PORT"
    ADMIN_USER_EMAIL="admin@$DOMAIN"
    ADMIN_USER_PASSWORD="$DEFAULT_ADMIN_USER_PASSWORD"
    WEBUI_SECRET_KEY=$(openssl rand -hex 32) && echo_success "WEBUI_SECRET_KEY auto-generated"
    ;;
  "$PROFILE_PRODUCTION")
    # General Configuration
    NODE_ENV="production"
    LOG_LEVEL="INFO"
    DATABASE_PATH="$DEFAULT_DATABASE_PATH"
    # Security Configuration
    JWT_SECRET=$(openssl rand -hex 32) && echo_success "JWT_SECRET auto-generated"
    JWT_MAX_AGE="$DEFAULT_JWT_MAX_AGE"
    REGISTER_USERS_AS_INACTIVE="$DEFAULT_REGISTER_USERS_AS_INACTIVE"
    RATE_LIMIT_PER_MINUTE="$DEFAULT_RATE_LIMIT_PER_MINUTE"
    # Domain Configuration
    PROTOCOL="https"
    FRONTEND_PORT="$DEFAULT_FRONTEND_PORT"
    API_PORT="$DEFAULT_API_PORT"
    # IPFS & Cluster Configuration
    START_PRIVATE_NETWORK="$DEFAULT_START_PRIVATE_NETWORK"
    IPFS_CLUSTER_HOST="$DEFAULT_IPFS_CLUSTER_HOST"
    IPFS_PINSVC_HOST="$DEFAULT_IPFS_PINSVC_HOST"
    IPFS_GATEWAY_HOST="$DEFAULT_IPFS_GATEWAY_HOST"
    CLUSTER_MONITORPINGINTERVAL="$DEFAULT_CLUSTER_MONITORPINGINTERVAL"
    CLUSTER_RESTAPI_HTTPLISTENMULTIADDRESS="$DEFAULT_CLUSTER_RESTAPI_HTTPLISTENMULTIADDRESS"
    CLUSTER_PINSVCAPI_HTTPLISTENMULTIADDRESS="$DEFAULT_CLUSTER_PINSVCAPI_HTTPLISTENMULTIADDRESS"
    CLUSTER_SWARM_PORT="$DEFAULT_CLUSTER_SWARM_PORT"
    OPEN_API_PORT="$DEFAULT_OPEN_API_PORT"
    PINNING_SERVICE_PORT="$DEFAULT_PINNING_SERVICE_PORT"
    # Cluster 0
    CLUSTER_PEERNAME_0="$DEFAULT_CLUSTER_PEERNAME_0"
    CLUSTER_IPFSHTTP_NODEMULTIADDRESS_0="$DEFAULT_CLUSTER_IPFSHTTP_NODEMULTIADDRESS_0"
    CLUSTER_CRDT_TRUSTEDPEERS_0="$DEFAULT_CLUSTER_CRDT_TRUSTEDPEERS_0"
    # IPFS Kubo Node
    SWARM_PORT="$DEFAULT_SWARM_PORT"
    IPFS_API_PORT="$DEFAULT_IPFS_API_PORT"
    IPFS_GATEWAY_PORT="$DEFAULT_IPFS_GATEWAY_PORT"
    # AI Integration
    DISABLE_ALL_AI_FUNCTIONALITY="$DEFAULT_DISABLE_ALL_AI_FUNCTIONALITY"
    OLLAMA_MODEL="$DEFAULT_OLLAMA_MODEL"
    AUTO_DOWNLOAD="$DEFAULT_AUTO_DOWNLOAD"
    # OpenWebUI Configuration
    OPENWEBUI_HOST="$DEFAULT_OPENWEBUI_HOST"
    OPEN_WEBUI_PORT="$DEFAULT_OPEN_WEBUI_PORT"
    WEBUI_SECRET_KEY=$(openssl rand -hex 32) && echo_success "WEBUI_SECRET_KEY auto-generated"
    ;;
  "$PROFILE_CUSTOM")
    ;;
esac

#──────────────────────────────────────────────────────────────────────────────
# General Configuration
#──────────────────────────────────────────────────────────────────────────────
echo_section "General Configuration"

prompt_var NODE_ENV choice "Specifies the environment in which the application is running." "$DEFAULT_NODE_ENV" "development" "production"
prompt_var LOG_LEVEL choice "Logging verbosity. Use DEBUG during development for detailed logs." "$DEFAULT_LOG_LEVEL" "DEBUG" "INFO" "WARNING" "ERROR"
prompt_var BUILD_OR_PULL_IMAGES bool "Build the container locally? (Otherwise the published image will be pulled)" "$DEFAULT_BUILD_OR_PULL_IMAGES" "build" "pull"
prompt_var VERSION text "Version tag for pulling backend/frontend images - Set to a specific version in production (e.g., 1.2.3)" "$DEFAULT_VERSION"
prompt_var DATABASE_PATH text "Path to the SQLite database file which stores user credentials and other sensitive data that is not decentralized." "$DEFAULT_DATABASE_PATH"

#──────────────────────────────────────────────────────────────────────────────
# Security Configuration
#──────────────────────────────────────────────────────────────────────────────
echo_section "Security Configuration"

prompt_var MASTER_PASSWORD text "Master admin password for critical actions (min 8 chars)" "$DEFAULT_MASTER_PASSWORD" validate_password validate_not_default_in_production
prompt_var JWT_SECRET text "Secret used to sign JWT authentication tokens (min 12 chars)" "$DEFAULT_JWT_SECRET" validate_secret
prompt_var JWT_MAX_AGE text "JWT token expiration time (in seconds)" "$DEFAULT_JWT_MAX_AGE"
prompt_var REGISTER_USERS_AS_INACTIVE bool "If true, new users must be approved before activation. You need to either change it in the sqlite DB or configure the SMTP server to get the activation email!" "$DEFAULT_REGISTER_USERS_AS_INACTIVE"
prompt_var RATE_LIMIT_PER_MINUTE text "API request limit per minute to prevent denial of service attacks" "$DEFAULT_RATE_LIMIT_PER_MINUTE"

#──────────────────────────────────────────────────────────────────────────────
# Domain Configuration
#──────────────────────────────────────────────────────────────────────────────
echo_section "Domain Configuration"

prompt_var PROTOCOL bool "Use HTTPS for URLs?" "$DEFAULT_PROTOCOL" "https" "http"
prompt_var DOMAIN text "Your Public DOMAIN (e.g. example.com)" "$DEFAULT_DOMAIN" validate_domain validate_not_default_in_production
prompt_var FRONTEND_PORT text "Port for your Frontend" "$DEFAULT_FRONTEND_PORT" validate_port
FRONTEND_URL="${PROTOCOL}://${DOMAIN}:${FRONTEND_PORT}"
echo_success "FRONTEND_URL auto-set to $FRONTEND_URL"
prompt_var API_DOMAIN text "Your API DOMAIN (e.g. api.example.com)" "api.${DOMAIN}" validate_domain
prompt_var API_PORT text "Port for your API" "$DEFAULT_API_PORT" validate_port
NEXT_PUBLIC_API_URL="${PROTOCOL}://${API_DOMAIN}:${API_PORT}/api"
echo_success "NEXT_PUBLIC_API_URL auto-set to $NEXT_PUBLIC_API_URL"

# CORS
CORS_ORIGIN_ARRAY=("${PROTOCOL}://${DOMAIN}:${FRONTEND_PORT}" "${PROTOCOL}://${API_DOMAIN}:${API_PORT}")
OI_CORS_ALLOW_ORIGIN_ARRAY=("${PROTOCOL}://${DOMAIN}:${FRONTEND_PORT}" "${PROTOCOL}://${API_DOMAIN}:${API_PORT}" "${PROTOCOL}://backend:${API_PORT}")
# Add localhost entries only in development
if [[ "$NODE_ENV" == "development" ]]; then
  CORS_ORIGIN_ARRAY=("${CORS_ORIGIN_ARRAY[@]}" "http://localhost:${FRONTEND_PORT}")
  OI_CORS_ALLOW_ORIGIN_ARRAY=("${OI_CORS_ALLOW_ORIGIN_ARRAY[@]}" "http://localhost:${FRONTEND_PORT}" "http://localhost:${API_PORT}")
fi
CORS_ORIGIN=$(IFS=, ; echo "${CORS_ORIGIN_ARRAY[*]}") # Join array into one line
echo_success "CORS_ORIGIN auto-set to $CORS_ORIGIN"
OI_CORS_ALLOW_ORIGIN=$(IFS=\; ; echo "${OI_CORS_ALLOW_ORIGIN_ARRAY[*]}")
echo_success "OI_CORS_ALLOW_ORIGIN auto-set to $OI_CORS_ALLOW_ORIGIN"

#──────────────────────────────────────────────────────────────────────────────
# SMTP Settings
#──────────────────────────────────────────────────────────────────────────────
echo_section "SMTP Settings"

prompt_var SMTP_HOST text "SMTP server address" "$DEFAULT_SMTP_HOST"
prompt_var SMTP_USER text "SMTP server user " "$DEFAULT_SMTP_USER"
prompt_var SMTP_PASSWORD text "SMTP server password (min 8 chars)" "$DEFAULT_SMTP_PASSWORD"
prompt_var SMTP_PORT text "SMTP server port" "$DEFAULT_SMTP_PORT" validate_port
prompt_var SMTP_SSL bool "SMTP server secure access" "$DEFAULT_SMTP_SSL"
prompt_var SMTP_TLS bool "SMTP server start insecure, upgrade to TLS (typically on port 587, set 'SMTP_SSL' to false then in this setup)" "$DEFAULT_SMTP_TLS"
prompt_var EMAIL_SENDER text "Email address that appears as a sender in notification emails" "\"TruSpace <truspace@${DOMAIN}>\""

#──────────────────────────────────────────────────────────────────────────────
# CSP Configuration
#──────────────────────────────────────────────────────────────────────────────
echo_section "CSP Configuration"

prompt_var CONTENT_SECURITY_POLICY_DEFAULT_URLS text "Comma-separated list of default-src URLs for the Content Security Policy." "$DEFAULT_CONTENT_SECURITY_POLICY_DEFAULT_URLS"
prompt_var CONTENT_SECURITY_POLICY_IMG_URLS text "Comma-separated list of img-src URLs for the Content Security Policy." "$DEFAULT_CONTENT_SECURITY_POLICY_IMG_URLS"
prompt_var CONTENT_SECURITY_POLICY_FRAME_URLS text "Comma-separated list of frame-src URLs for the Content Security Policy." "$DEFAULT_CONTENT_SECURITY_POLICY_FRAME_URLS"
prompt_var CONTENT_SECURITY_POLICY_SCRIPT_URLS text "Comma-separated list of script-src URLs for the Content Security Policy." "$DEFAULT_CONTENT_SECURITY_POLICY_SCRIPT_URLS"
prompt_var CONTENT_SECURITY_POLICY_WORKER_URLS text "Comma-separated list of worker-src URLs for the Content Security Policy." "$DEFAULT_CONTENT_SECURITY_POLICY_WORKER_URLS"

#──────────────────────────────────────────────────────────────────────────────
# IPFS & Cluster Configuration
#──────────────────────────────────────────────────────────────────────────────
echo_section "IPFS & Cluster Configuration"

prompt_var START_PRIVATE_NETWORK bool "Option to allow or disable connection to public IPFS nodes" "$DEFAULT_START_PRIVATE_NETWORK"
prompt_var IPFS_CLUSTER_HOST text "" "$DEFAULT_IPFS_CLUSTER_HOST"
prompt_var IPFS_PINSVC_HOST text "" "$DEFAULT_IPFS_PINSVC_HOST"
prompt_var IPFS_GATEWAY_HOST text "" "$DEFAULT_IPFS_GATEWAY_HOST"
prompt_var CLUSTER_MONITORPINGINTERVAL text "" "$DEFAULT_CLUSTER_MONITORPINGINTERVAL"
prompt_var CLUSTER_RESTAPI_HTTPLISTENMULTIADDRESS text "" "$DEFAULT_CLUSTER_RESTAPI_HTTPLISTENMULTIADDRESS"
prompt_var CLUSTER_PINSVCAPI_HTTPLISTENMULTIADDRESS text "" "$DEFAULT_CLUSTER_PINSVCAPI_HTTPLISTENMULTIADDRESS"
prompt_var CLUSTER_SWARM_PORT text "CLUSTER_SWARM_PORT" "$DEFAULT_CLUSTER_SWARM_PORT" validate_port
prompt_var OPEN_API_PORT text "OPEN_API_PORT" "$DEFAULT_OPEN_API_PORT" validate_port
prompt_var PINNING_SERVICE_PORT text "PINNING_SERVICE_PORT" "$DEFAULT_PINNING_SERVICE_PORT" validate_port

#──────────────────────────────────────────────────────────────────────────────
# IPFS Kubo Node Configuration
#──────────────────────────────────────────────────────────────────────────────
echo_section "IPFS Kubo Node Configuration"

prompt_var SWARM_PORT text "Swarm port for IPFS peer-to-peer networking" "$DEFAULT_SWARM_PORT" validate_port
prompt_var IPFS_API_PORT text "Port used for pinning and data manipulation" "$DEFAULT_IPFS_API_PORT" validate_port
prompt_var IPFS_GATEWAY_PORT text "Port used for fetching files from IPFS)" "$DEFAULT_IPFS_GATEWAY_PORT" validate_port

#──────────────────────────────────────────────────────────────────────────────
# AI Integration
#──────────────────────────────────────────────────────────────────────────────
echo_section "AI Integration"

prompt_var DISABLE_ALL_AI_FUNCTIONALITY bool "disable all AI functionality?" "$DEFAULT_DISABLE_ALL_AI_FUNCTIONALITY"
prompt_var OLLAMA_MODEL text "AI model used by the backend, a complete list is available at https://ollama.com/search (Example: gemma3:1b, llama2, mistral)" "$DEFAULT_OLLAMA_MODEL"
prompt_var AUTO_DOWNLOAD bool "Auto download" "$DEFAULT_AUTO_DOWNLOAD"

#──────────────────────────────────────────────────────────────────────────────
# OpenWebUI Configuration
#──────────────────────────────────────────────────────────────────────────────
echo_section "OpenWebUI Configuration"

prompt_var OPENWEBUI_HOST text "OOPENWEBUI_HOST" "$DEFAULT_OPENWEBUI_HOST"
prompt_var OPEN_WEBUI_PORT text "OPEN_WEBUI_PORT" "$DEFAULT_OPEN_WEBUI_PORT" validate_port
prompt_var ADMIN_USER_EMAIL text "OpenWebUI ADMIN email" "admin@${DOMAIN}" validate_email
prompt_var ADMIN_USER_PASSWORD text "OpenWebUI ADMIN password (min 8 chars)" "$DEFAULT_ADMIN_USER_PASSWORD" validate_password validate_not_default_in_production
prompt_var WEBUI_SECRET_KEY text "Secret key for WebUI session security. Use a strong value in production. (min 12 chars)" "$DEFAULT_WEBUI_SECRET_KEY" validate_secret

#──────────────────────────────────────────────────────────────────────────────
# WRITING ENV FILE
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
BUILD_OR_PULL_IMAGES=${BUILD_OR_PULL_IMAGES}

# 🚀 Version tag for pulling backend/frontend images.
# Set to a specific version in production (e.g., 1.2.3).
VERSION=${VERSION}

# 📜 Logging level (DEBUG, INFO, WARN, ERROR)
LOG_LEVEL=${LOG_LEVEL}

# 🌐 If true, IPFS will NOT connect to the public network.
START_PRIVATE_NETWORK=${START_PRIVATE_NETWORK}

# 📡 Backend API port
API_PORT=${API_PORT}

# Internal IPFS Cluster and gateway URLs
IPFS_CLUSTER_HOST=${IPFS_CLUSTER_HOST}
IPFS_PINSVC_HOST=${IPFS_PINSVC_HOST}
IPFS_GATEWAY_HOST=${IPFS_GATEWAY_HOST}

# URL where OpenWebUI backend is running
OPENWEBUI_HOST=${OPENWEBUI_HOST}

# If true, AI models configured in this file will be auto-downloaded if missing in the docker volume
AUTO_DOWNLOAD=${AUTO_DOWNLOAD}

# If true, disables all AI-related functionality, i.e. if a document is uploaded, no AI processing will be executed
DISABLE_ALL_AI_FUNCTIONALITY=${DISABLE_ALL_AI_FUNCTIONALITY}

# Path to the backend SQLite database file
DATABASE_PATH=${DATABASE_PATH}

# ⏳ JWT token expiration time (in seconds)
JWT_MAX_AGE=${JWT_MAX_AGE}

# 🌐 Public frontend URL
FRONTEND_URL=${FRONTEND_URL}

# 🛡️ Content Security Policy (CSP) settings
CONTENT_SECURITY_POLICY_DEFAULT_URLS=${CONTENT_SECURITY_POLICY_DEFAULT_URLS}
CONTENT_SECURITY_POLICY_IMG_URLS=${CONTENT_SECURITY_POLICY_IMG_URLS}
CONTENT_SECURITY_POLICY_FRAME_URLS=${CONTENT_SECURITY_POLICY_FRAME_URLS}
CONTENT_SECURITY_POLICY_SCRIPT_URLS=${CONTENT_SECURITY_POLICY_SCRIPT_URLS}
CONTENT_SECURITY_POLICY_WORKER_URLS=${CONTENT_SECURITY_POLICY_WORKER_URLS}

# ⏱️ API request limit per minute to prevent denial of service attacks
RATE_LIMIT_PER_MINUTE=${RATE_LIMIT_PER_MINUTE}

# If true, new users must be approved before activation. You need to either change it in the sqlite DB or configure the SMTP server to get the activation email!
REGISTER_USERS_AS_INACTIVE=${REGISTER_USERS_AS_INACTIVE}

#──────────────────────────────────────────────────────────────────────────────
# 📧 SMTP Email Settings
#──────────────────────────────────────────────────────────────────────────────
SMTP_HOST=${SMTP_HOST}
SMTP_USER=${SMTP_USER}
SMTP_PASSWORD=${SMTP_PASSWORD}   # regex:/[^[:space:]]{8,}/
SMTP_PORT=${SMTP_PORT}
SMTP_SSL=${SMTP_SSL}
SMTP_TLS=${SMTP_SSL}
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
CLUSTER_MONITORPINGINTERVAL=${CLUSTER_MONITORPINGINTERVAL}

# Multiaddresses for cluster APIs
CLUSTER_RESTAPI_HTTPLISTENMULTIADDRESS=${CLUSTER_RESTAPI_HTTPLISTENMULTIADDRESS}
CLUSTER_PINSVCAPI_HTTPLISTENMULTIADDRESS=${CLUSTER_PINSVCAPI_HTTPLISTENMULTIADDRESS}

# API & pinning service ports
OPEN_API_PORT=${OPEN_API_PORT}
PINNING_SERVICE_PORT=${PINNING_SERVICE_PORT}

# Cluster swarm port (peer-to-peer)
CLUSTER_SWARM_PORT=${CLUSTER_SWARM_PORT}

#──────────────────────────────────────────────────────────────────────────────
# 🔗 IPFS Cluster - Node 0
#──────────────────────────────────────────────────────────────────────────────
CLUSTER_PEERNAME_0=${CLUSTER_PEERNAME_0}
CLUSTER_IPFSHTTP_NODEMULTIADDRESS_0=${CLUSTER_IPFSHTTP_NODEMULTIADDRESS_0}
CLUSTER_CRDT_TRUSTEDPEERS_0=${CLUSTER_CRDT_TRUSTEDPEERS_0}
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
