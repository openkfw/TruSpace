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

# import echo_error, echo_warn, echo_success, echo_section, echo_info and prompt functions
source "${SCRIPT_DIR}/libs/logging.sh"

#──────────────────────────────────────────────────────────────────────────────
# PARSE ARGUMENTS
#──────────────────────────────────────────────────────────────────────────────

DEV="false"
while [[ "$#" -gt 0 ]]; do
  case "$1" in
    --dev) DEV="true"; shift ;;
    *) shift ;;
  esac
done

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

  # Skip if already set by a profile
  if [[ -n "${!var_name-}" ]]; then
    if [[ "${!var_name-}" == "$EMPTY" ]]; then
      printf -v "$var_name" '%s' ""
    fi
    echo_success "$var_name auto-set to ${!var_name:-"(empty)"}"
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
          y|yes) value="$true_value" ;;
          n|no)  value="$false_value" ;;
          *) echo_warn "Please enter y or n."; continue ;;
        esac
        ;;
      choice)
        echo_info "$var_name - $prompt_text"
        local -a choices=("${extra[@]}")
        for i in "${!choices[@]}"; do echo_info "  $((i+1))) ${choices[i]}"; done
        local default_index=0
        for i in "${!choices[@]}"; do
          [[ "${choices[i]}" == "$default_value" ]] && default_index=$((i+1))
        done
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
        else
          value="${value:-${default_value}}"
        fi
        ;;
    esac

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
  echo_success "$var_name set to ${value:-"(empty)"}"
}

# Auto-generate a hex secret and announce it
_gen_secret() {
  local var="$1"
  printf -v "$var" '%s' "$(openssl rand -hex 32)"
  echo_success "$var auto-generated"
}

#──────────────────────────────────────────────────────────────────────────────
# VALIDATORS
#──────────────────────────────────────────────────────────────────────────────

validate_password() {
  local val="$1" var_name="$2"
  [[ ${#val} -lt 8 ]] && { echo_warn "$var_name must be at least 8 characters."; return 1; }
  return 0
}

validate_secret() {
  local val="$1" var_name="$2"
  [[ ${#val} -lt 12 ]] && { echo_warn "$var_name must be at least 12 characters."; return 1; }
  return 0
}

validate_not_default_in_production() {
  local value="$1" var_name="$2" default_value="$3"
  if [[ "${NODE_ENV:-}" == "production" && "$value" == "$default_value" ]]; then
    echo_warn "$var_name: cannot use the default value in production!"
    return 1
  fi
  return 0
}

validate_domain() {
  local val="$1" var_name="$2"
  # Allow bare hostnames (e.g. "myserver"), mDNS names (e.g. "pi.local"), IPs, and FQDNs
  [[ ${#val} -lt 2 ]] && { echo_warn "$var_name must be at least 2 characters."; return 1; }
  [[ ! "$val" =~ ^[A-Za-z0-9._-]+$ ]] && {
    echo_warn "$var_name contains invalid characters (allowed: letters, digits, dots, hyphens, underscores)."
    return 1
  }
  [[ "$val" =~ \.\. ]] && { echo_warn "$var_name cannot contain consecutive dots."; return 1; }
  [[ "$val" =~ ^[.-] || "$val" =~ [.-]$ ]] && {
    echo_warn "$var_name cannot start or end with a dot or hyphen."
    return 1
  }
  return 0
}

validate_port() {
  local val="$1" var_name="$2"
  [[ ! "$val" =~ ^[0-9]+$ ]] && { echo_warn "$var_name must be a number."; return 1; }
  (( val < 1 || val > 65535 )) && { echo_warn "$var_name must be between 1 and 65535."; return 1; }
  return 0
}

validate_email() {
  local val="$1" var_name="${2:-Email}"
  [[ ! "$val" =~ ^[^[:space:]]+@[^[:space:]]+\.[^[:space:]]+$ ]] && {
    echo_warn "Invalid $var_name format. Expected: user@example.com"
    return 1
  }
  return 0
}

#──────────────────────────────────────────────────────────────────────────────
# PRE-CHECK
#──────────────────────────────────────────────────────────────────────────────

if [[ -f "$ENVFILE" ]]; then
  echo_warn "An existing $ENVFILE was found."
  prompt_var REPLACE_ENV bool "Replace it with a new configuration?" true
  if [[ "$REPLACE_ENV" = true ]]; then
    rm -f "$ENVFILE"
    echo_success "Removed old .env — creating a new one."
  else
    echo_success "Keeping existing .env. Nothing to do."
    exit 0
  fi
fi

#──────────────────────────────────────────────────────────────────────────────
# DEFAULT VALUES
#──────────────────────────────────────────────────────────────────────────────

DEFAULT_DATABASE_PATH="/app/data/truspace.db"
DEFAULT_MASTER_PASSWORD="Kennwort123"
DEFAULT_JWT_MAX_AGE=86400
DEFAULT_FRONTEND_PORT=3000
DEFAULT_API_PORT=8000
DEFAULT_DOMAIN="example.com"
DEFAULT_VERSION_BACKEND="latest"
DEFAULT_VERSION_FRONTEND="latest"
DEFAULT_VERSION_IPFS="v0.39.0"
DEFAULT_VERSION_IPFS_CLUSTER="v1.1.4"
DEFAULT_VERSION_WEBUI="ollama"
DEFAULT_IPFS_CLUSTER_HOST="http://cluster0:9094"
DEFAULT_IPFS_PINSVC_HOST="http://cluster0:9097"
DEFAULT_IPFS_GATEWAY_HOST="http://ipfs0:8080"
DEFAULT_CLUSTER_MONITORPINGINTERVAL="2s"
DEFAULT_CLUSTER_RESTAPI_HTTPLISTENMULTIADDRESS="/ip4/0.0.0.0/tcp/9094"
DEFAULT_CLUSTER_PINSVCAPI_HTTPLISTENMULTIADDRESS="/ip4/0.0.0.0/tcp/9097"
DEFAULT_CLUSTER_SWARM_PORT=9096
DEFAULT_OPEN_API_PORT=9094
DEFAULT_PINNING_SERVICE_PORT=9097
DEFAULT_CLUSTER_PEERNAME_0="cluster0"
DEFAULT_CLUSTER_IPFSHTTP_NODEMULTIADDRESS_0="/dns4/ipfs0/tcp/5001"
DEFAULT_CLUSTER_CRDT_TRUSTEDPEERS_0="*"
DEFAULT_SWARM_PORT=4001
DEFAULT_IPFS_API_PORT=5001
DEFAULT_IPFS_GATEWAY_PORT=8080
DEFAULT_OLLAMA_MODEL="gemma3:1b"
DEFAULT_OPENWEBUI_HOST="http://webui:8080"
DEFAULT_OPEN_WEBUI_PORT=3333
DEFAULT_ADMIN_USER_PASSWORD="Kennwort123"

#──────────────────────────────────────────────────────────────────────────────
# WELCOME
#──────────────────────────────────────────────────────────────────────────────

echo_section "Welcome to TruSpace Setup"
echo_info "This wizard creates your .env configuration file."
echo_info "Press ENTER to accept a default. Re-run anytime: ./start.sh --configure-env"
echo_info ""

#──────────────────────────────────────────────────────────────────────────────
# PROFILE SELECTION
#──────────────────────────────────────────────────────────────────────────────

echo_section "Deployment Profile"
echo_info "Choose the scenario that matches how you're running TruSpace:"
echo_info ""
echo_info "  1) local-dev    — On THIS machine only"
echo_info "                    (localhost, http, relaxed security, for development)"
echo_info ""
echo_info "  2) production   — Any server deployment: LAN/home server or internet-facing"
echo_info "                    (e.g. Raspberry Pi at smartspace.local, or truspace.example.com)"
echo_info "                    You choose http or https, with or without a reverse proxy."
echo_info ""
echo_info "  3) custom       — Configure everything manually (advanced)"
echo_info ""

_select_profile() {
  local choice
  prompt "Select profile [1]: " choice
  case "${choice:-1}" in
    1) echo "local-dev" ;;
    2) echo "production" ;;
    3) echo "custom" ;;
    *) echo_warn "Invalid — defaulting to local-dev."; echo "local-dev" ;;
  esac
}

if [[ "$DEV" == "true" ]]; then
  PROFILE_KEY="local-dev"
  echo_success "DEV flag detected — using 'local-dev' profile."
else
  PROFILE_KEY=$(_select_profile)
  echo_success "Profile: $PROFILE_KEY"
fi

#──────────────────────────────────────────────────────────────────────────────
# APPLY PROFILE PRESETS
# Variables left *unset* here will be prompted for in the sections below.
#──────────────────────────────────────────────────────────────────────────────

# Preset all shared IPFS internals (rarely changed)
_preset_ipfs_defaults() {
  IPFS_CLUSTER_HOST="$DEFAULT_IPFS_CLUSTER_HOST"
  IPFS_PINSVC_HOST="$DEFAULT_IPFS_PINSVC_HOST"
  IPFS_GATEWAY_HOST="$DEFAULT_IPFS_GATEWAY_HOST"
  CLUSTER_MONITORPINGINTERVAL="$DEFAULT_CLUSTER_MONITORPINGINTERVAL"
  CLUSTER_RESTAPI_HTTPLISTENMULTIADDRESS="$DEFAULT_CLUSTER_RESTAPI_HTTPLISTENMULTIADDRESS"
  CLUSTER_PINSVCAPI_HTTPLISTENMULTIADDRESS="$DEFAULT_CLUSTER_PINSVCAPI_HTTPLISTENMULTIADDRESS"
  CLUSTER_SWARM_PORT="$DEFAULT_CLUSTER_SWARM_PORT"
  OPEN_API_PORT="$DEFAULT_OPEN_API_PORT"
  PINNING_SERVICE_PORT="$DEFAULT_PINNING_SERVICE_PORT"
  CLUSTER_PEERNAME_0="$DEFAULT_CLUSTER_PEERNAME_0"
  CLUSTER_IPFSHTTP_NODEMULTIADDRESS_0="$DEFAULT_CLUSTER_IPFSHTTP_NODEMULTIADDRESS_0"
  CLUSTER_CRDT_TRUSTEDPEERS_0="$DEFAULT_CLUSTER_CRDT_TRUSTEDPEERS_0"
  SWARM_PORT="$DEFAULT_SWARM_PORT"
  IPFS_API_PORT="$DEFAULT_IPFS_API_PORT"
  IPFS_GATEWAY_PORT="$DEFAULT_IPFS_GATEWAY_PORT"
}

case "$PROFILE_KEY" in

  local-dev)
    # ── Everything pre-set for localhost development ──────────────────────────
    NODE_ENV="development"
    LOG_LEVEL="DEBUG"
    BUILD_OR_PULL_IMAGES="build"
    VERSION_BACKEND="$DEFAULT_VERSION_BACKEND"
    VERSION_FRONTEND="$DEFAULT_VERSION_FRONTEND"
    VERSION_IPFS="$DEFAULT_VERSION_IPFS"
    VERSION_IPFS_CLUSTER="$DEFAULT_VERSION_IPFS_CLUSTER"
    VERSION_WEBUI="$DEFAULT_VERSION_WEBUI"
    DATABASE_PATH="$DEFAULT_DATABASE_PATH"
    # Security (relaxed for dev)
    MASTER_PASSWORD="$DEFAULT_MASTER_PASSWORD"
    _gen_secret JWT_SECRET
    JWT_MAX_AGE="$DEFAULT_JWT_MAX_AGE"
    REGISTER_USERS_AS_INACTIVE=false
    RATE_LIMIT_PER_MINUTE=200
    # Network (localhost, no reverse proxy)
    PROTOCOL="http"
    DOMAIN="localhost"
    USE_REVERSE_PROXY=false
    FRONTEND_PORT="$DEFAULT_FRONTEND_PORT"
    API_PORT="$DEFAULT_API_PORT"
    # SMTP (maildev/fake SMTP on localhost)
    SMTP_HOST="host.docker.internal"
    SMTP_USER="$EMPTY"
    SMTP_PASSWORD="$EMPTY"
    SMTP_PORT=1025
    SMTP_SSL=false
    SMTP_TLS=false
    EMAIL_SENDER="\"TruSpace <truspace@localhost>\""
    # CSP (empty — no external resources)
    CONTENT_SECURITY_POLICY_DEFAULT_URLS="$EMPTY"
    CONTENT_SECURITY_POLICY_IMG_URLS="$EMPTY"
    CONTENT_SECURITY_POLICY_FRAME_URLS="$EMPTY"
    CONTENT_SECURITY_POLICY_SCRIPT_URLS="$EMPTY"
    CONTENT_SECURITY_POLICY_WORKER_URLS="$EMPTY"
    # IPFS
    START_PRIVATE_NETWORK=false
    _preset_ipfs_defaults
    # AI
    DISABLE_ALL_AI_FUNCTIONALITY=false
    OLLAMA_MODEL="$DEFAULT_OLLAMA_MODEL"
    AUTO_DOWNLOAD=true
    # Open WebUI
    OPENWEBUI_HOST="$DEFAULT_OPENWEBUI_HOST"
    OPEN_WEBUI_PORT="$DEFAULT_OPEN_WEBUI_PORT"
    ADMIN_USER_EMAIL="admin@localhost"
    ADMIN_USER_PASSWORD="$DEFAULT_ADMIN_USER_PASSWORD"
    _gen_secret WEBUI_SECRET_KEY
    echo_success "All local-dev defaults applied — no further prompts needed."
    ;;

  production)
    # ── Pre-set everything except domain, protocol, proxy, SMTP, and passwords ─
    # NOTE: NODE_ENV and LOG_LEVEL may be overridden below if HTTP is chosen.
    NODE_ENV="production"
    LOG_LEVEL="INFO"
    BUILD_OR_PULL_IMAGES="pull"
    VERSION_BACKEND="$DEFAULT_VERSION_BACKEND"
    VERSION_FRONTEND="$DEFAULT_VERSION_FRONTEND"
    VERSION_IPFS="$DEFAULT_VERSION_IPFS"
    VERSION_IPFS_CLUSTER="$DEFAULT_VERSION_IPFS_CLUSTER"
    VERSION_WEBUI="$DEFAULT_VERSION_WEBUI"
    DATABASE_PATH="$DEFAULT_DATABASE_PATH"
    _gen_secret JWT_SECRET
    JWT_MAX_AGE="$DEFAULT_JWT_MAX_AGE"
    RATE_LIMIT_PER_MINUTE=60
    FRONTEND_PORT="$DEFAULT_FRONTEND_PORT"
    API_PORT="$DEFAULT_API_PORT"
    # SMTP defaults — left unset so STARTTLS/SSL can follow the protocol choice
    SMTP_USER="$EMPTY"
    SMTP_PASSWORD="$EMPTY"
    CONTENT_SECURITY_POLICY_DEFAULT_URLS="$EMPTY"
    CONTENT_SECURITY_POLICY_IMG_URLS="$EMPTY"
    CONTENT_SECURITY_POLICY_FRAME_URLS="$EMPTY"
    CONTENT_SECURITY_POLICY_SCRIPT_URLS="$EMPTY"
    CONTENT_SECURITY_POLICY_WORKER_URLS="$EMPTY"
    START_PRIVATE_NETWORK=true
    _preset_ipfs_defaults
    DISABLE_ALL_AI_FUNCTIONALITY=false
    OLLAMA_MODEL="$DEFAULT_OLLAMA_MODEL"
    AUTO_DOWNLOAD=true
    OPENWEBUI_HOST="$DEFAULT_OPENWEBUI_HOST"
    OPEN_WEBUI_PORT="$DEFAULT_OPEN_WEBUI_PORT"
    _gen_secret WEBUI_SECRET_KEY
    # Left unset → will be prompted:
    #   PROTOCOL, USE_REVERSE_PROXY, DOMAIN,
    #   REGISTER_USERS_AS_INACTIVE,
    #   SMTP_HOST, SMTP_PORT, SMTP_SSL, SMTP_TLS, EMAIL_SENDER,
    #   MASTER_PASSWORD, ADMIN_USER_EMAIL, ADMIN_USER_PASSWORD
    echo_success "Production defaults applied."
    echo_info "You will be prompted for: protocol (http/https), domain, reverse proxy, passwords, SMTP settings."
    ;;

  custom)
    # ── Nothing preset — every prompt will be shown ───────────────────────────
    USE_REVERSE_PROXY=""   # will be prompted in Domain section
    echo_info "Custom mode — all settings will be prompted."
    echo_info "Tip: secrets are auto-generated if you press ENTER on those fields."
    ;;
esac

#──────────────────────────────────────────────────────────────────────────────
# GENERAL CONFIGURATION
#──────────────────────────────────────────────────────────────────────────────

echo_section "General Configuration"

prompt_var NODE_ENV choice "Application environment" "development" "development" "production"
prompt_var LOG_LEVEL choice "Logging verbosity (use DEBUG for development)" "INFO" "DEBUG" "INFO" "WARNING" "ERROR"
prompt_var BUILD_OR_PULL_IMAGES bool \
  "Build container images locally? (No = pull published image from registry)" "build" "build" "pull"
prompt_var VERSION_BACKEND       text "Backend image version tag (e.g. 1.2.3 or 'latest')" "$DEFAULT_VERSION_BACKEND"
prompt_var VERSION_FRONTEND      text "Frontend image version tag" "$DEFAULT_VERSION_FRONTEND"
prompt_var VERSION_IPFS          text "IPFS (Kubo) image version tag" "$DEFAULT_VERSION_IPFS"
prompt_var VERSION_IPFS_CLUSTER  text "IPFS Cluster image version tag" "$DEFAULT_VERSION_IPFS_CLUSTER"
prompt_var VERSION_WEBUI         text "Open WebUI image version tag" "$DEFAULT_VERSION_WEBUI"
prompt_var DATABASE_PATH         text "Path to the SQLite database file (inside the container)" "$DEFAULT_DATABASE_PATH"

#──────────────────────────────────────────────────────────────────────────────
# SECURITY CONFIGURATION
#──────────────────────────────────────────────────────────────────────────────

echo_section "Security Configuration"

prompt_var MASTER_PASSWORD text \
  "Master admin password for critical operations (min 8 chars)" \
  "$DEFAULT_MASTER_PASSWORD" validate_password validate_not_default_in_production
prompt_var JWT_SECRET text \
  "JWT signing secret — press ENTER to auto-generate (min 12 chars)" \
  "$AUTO_GENERATE" validate_secret
prompt_var JWT_MAX_AGE text \
  "JWT token expiry in seconds (86400 = 24 h)" "$DEFAULT_JWT_MAX_AGE"
prompt_var REGISTER_USERS_AS_INACTIVE bool \
  "Require admin approval before new accounts are activated? (Requires SMTP or manual DB edit)" false
prompt_var RATE_LIMIT_PER_MINUTE text \
  "Max API requests per IP per minute (anti-DoS)" 200

#──────────────────────────────────────────────────────────────────────────────
# DOMAIN & URL CONFIGURATION
#──────────────────────────────────────────────────────────────────────────────

echo_section "Domain & URL Configuration"

prompt_var PROTOCOL bool \
  "Use HTTPS? (Choose No for LAN/local deployments without a certificate)" \
  "https" "https" "http"

# ── Override NODE_ENV and related settings when HTTP is chosen in production ──
# Plain HTTP cannot support secure cookies, HSTS, or other production-grade
# security mechanisms. Downgrade to NODE_ENV=development so the application
# behaves correctly and validators do not block sensible LAN defaults.
if [[ "$PROFILE_KEY" == "production" && "$PROTOCOL" == "http" ]]; then
  NODE_ENV="development"
  LOG_LEVEL="DEBUG"
  RATE_LIMIT_PER_MINUTE=200
  echo_warn "┌─────────────────────────────────────────────────────────────────┐"
  echo_warn "│  HTTP selected on the production profile.                       │"
  echo_warn "│                                                                 │"
  echo_warn "│  NODE_ENV        → development  (secure cookies require HTTPS) │"
  echo_warn "│  LOG_LEVEL       → DEBUG                                        │"
  echo_warn "│  RATE_LIMIT      → 200/min      (relaxed for LAN use)          │"
  echo_warn "│                                                                 │"
  echo_warn "│  Only use this on a trusted private network.                   │"
  echo_warn "└─────────────────────────────────────────────────────────────────┘"
fi
# ─────────────────────────────────────────────────────────────────────────────

if [[ "$PROFILE_KEY" != "local-dev" ]]; then
  prompt_var DOMAIN text \
    "Hostname or domain where TruSpace is reachable (e.g. truspace.example.com, smartspace.local, 192.168.1.10)" \
    "$DEFAULT_DOMAIN" validate_domain validate_not_default_in_production
fi

prompt_var FRONTEND_PORT text "Frontend container port" "$DEFAULT_FRONTEND_PORT" validate_port
prompt_var API_PORT       text "Backend API container port" "$DEFAULT_API_PORT" validate_port

# For production and custom modes, USE_REVERSE_PROXY is unset — prompt for it
if [[ -z "${USE_REVERSE_PROXY-}" ]]; then
  prompt_var USE_REVERSE_PROXY bool \
    "Are you using a reverse proxy (nginx, Caddy, Traefik) that terminates SSL and routes traffic?" \
    false
fi

# Build URLs — reverse proxy mode means no port numbers in external URLs,
# and /api is routed by the proxy to the backend container.
if [[ "$USE_REVERSE_PROXY" == "true" ]]; then
  FRONTEND_URL="${PROTOCOL}://${DOMAIN}"
  NEXT_PUBLIC_API_URL="${PROTOCOL}://${DOMAIN}/api"
  CORS_ORIGIN="${PROTOCOL}://${DOMAIN}"
  OI_CORS_ALLOW_ORIGIN="${PROTOCOL}://${DOMAIN};${PROTOCOL}://backend:${API_PORT}"
  echo_info "ℹ️  Reverse proxy mode: URLs contain no port numbers."
  echo_info "   Your proxy must route  /api  →  backend:${API_PORT}"
  echo_info "                          /     →  frontend:${FRONTEND_PORT}"
else
  _cors_origins=("${PROTOCOL}://${DOMAIN}:${FRONTEND_PORT}" "${PROTOCOL}://${DOMAIN}:${API_PORT}")
  _oi_origins=("${PROTOCOL}://${DOMAIN}:${FRONTEND_PORT}" "${PROTOCOL}://${DOMAIN}:${API_PORT}" "${PROTOCOL}://backend:${API_PORT}")
  # Add localhost variants in development to avoid CORS errors when running the frontend locally
  if [[ "${NODE_ENV}" == "development" ]]; then
    _cors_origins+=("http://localhost:${FRONTEND_PORT}" "http://localhost:${API_PORT}")
    _oi_origins+=("http://localhost:${FRONTEND_PORT}" "http://localhost:${API_PORT}")
  fi
  FRONTEND_URL="${PROTOCOL}://${DOMAIN}:${FRONTEND_PORT}"
  NEXT_PUBLIC_API_URL="${PROTOCOL}://${DOMAIN}:${API_PORT}/api"
  CORS_ORIGIN=$(IFS=,; echo "${_cors_origins[*]}")
  OI_CORS_ALLOW_ORIGIN=$(IFS=\;; echo "${_oi_origins[*]}")
fi

echo_success "FRONTEND_URL        → $FRONTEND_URL"
echo_success "NEXT_PUBLIC_API_URL → $NEXT_PUBLIC_API_URL"
echo_success "CORS_ORIGIN         → $CORS_ORIGIN"

#──────────────────────────────────────────────────────────────────────────────
# SMTP SETTINGS
#──────────────────────────────────────────────────────────────────────────────

echo_section "SMTP Settings"
echo_info "(Used for registration confirmation and password-reset emails)"
echo_info "(Leave all at defaults if you don't have an SMTP server yet)"

prompt_var SMTP_HOST     text "SMTP server hostname" "host.docker.internal"
prompt_var SMTP_PORT     text "SMTP server port (common: 25, 465, 587)" 587 validate_port
prompt_var SMTP_SSL      bool "Use implicit SSL/TLS on connect? (typically port 465)" false
prompt_var SMTP_TLS      bool "Use STARTTLS after connecting? (typically port 587)" false
prompt_var SMTP_USER     text "SMTP username (leave blank if not required)" "$EMPTY"
prompt_var SMTP_PASSWORD text "SMTP password (leave blank if not required)" "$EMPTY"
prompt_var EMAIL_SENDER  text "Sender name and address shown in emails" \
  "\"TruSpace <truspace@${DOMAIN:-localhost}>\""

#──────────────────────────────────────────────────────────────────────────────
# CSP CONFIGURATION
#──────────────────────────────────────────────────────────────────────────────

echo_section "Content Security Policy (CSP)"
echo_info "(Leave blank unless TruSpace is embedded in another site or loads assets from external URLs)"

prompt_var CONTENT_SECURITY_POLICY_DEFAULT_URLS text "Extra default-src URLs (comma-separated)" "$EMPTY"
prompt_var CONTENT_SECURITY_POLICY_IMG_URLS     text "Extra img-src URLs"    "$EMPTY"
prompt_var CONTENT_SECURITY_POLICY_FRAME_URLS   text "Extra frame-src URLs"  "$EMPTY"
prompt_var CONTENT_SECURITY_POLICY_SCRIPT_URLS  text "Extra script-src URLs" "$EMPTY"
prompt_var CONTENT_SECURITY_POLICY_WORKER_URLS  text "Extra worker-src URLs" "$EMPTY"

#──────────────────────────────────────────────────────────────────────────────
# IPFS & CLUSTER CONFIGURATION
#──────────────────────────────────────────────────────────────────────────────

echo_section "IPFS & Cluster Configuration"
echo_info "(Internal Docker service addresses — only change these if you've customised the Compose topology)"

prompt_var START_PRIVATE_NETWORK bool \
  "Isolate IPFS from the public internet? (Recommended for production, required for private data)" false

prompt_var IPFS_CLUSTER_HOST text \
  "IPFS Cluster REST API address (internal Docker address)" "$DEFAULT_IPFS_CLUSTER_HOST"
prompt_var IPFS_PINSVC_HOST  text \
  "IPFS Cluster Pinning Service address (internal Docker address)" "$DEFAULT_IPFS_PINSVC_HOST"
prompt_var IPFS_GATEWAY_HOST text \
  "IPFS Gateway address (internal Docker address)" "$DEFAULT_IPFS_GATEWAY_HOST"
prompt_var CLUSTER_MONITORPINGINTERVAL text \
  "How often cluster peers check each other's health (e.g. 2s)" "$DEFAULT_CLUSTER_MONITORPINGINTERVAL"
prompt_var CLUSTER_RESTAPI_HTTPLISTENMULTIADDRESS text \
  "Cluster REST API listen address" "$DEFAULT_CLUSTER_RESTAPI_HTTPLISTENMULTIADDRESS"
prompt_var CLUSTER_PINSVCAPI_HTTPLISTENMULTIADDRESS text \
  "Cluster Pinning Service listen address" "$DEFAULT_CLUSTER_PINSVCAPI_HTTPLISTENMULTIADDRESS"
prompt_var CLUSTER_SWARM_PORT   text "Cluster peer-to-peer swarm port" "$DEFAULT_CLUSTER_SWARM_PORT" validate_port
prompt_var OPEN_API_PORT        text "Cluster REST API port (exposed on host)" "$DEFAULT_OPEN_API_PORT" validate_port
prompt_var PINNING_SERVICE_PORT text "Cluster Pinning Service port (exposed on host)" "$DEFAULT_PINNING_SERVICE_PORT" validate_port

echo_section "IPFS Kubo Node Configuration"

prompt_var SWARM_PORT        text "IPFS swarm port for peer-to-peer connections" "$DEFAULT_SWARM_PORT" validate_port
prompt_var IPFS_API_PORT     text "IPFS API port (used for pinning and data operations)" "$DEFAULT_IPFS_API_PORT" validate_port
prompt_var IPFS_GATEWAY_PORT text "IPFS Gateway port (used to retrieve files)" "$DEFAULT_IPFS_GATEWAY_PORT" validate_port

echo_section "IPFS Cluster — Node 0 (this node)"

prompt_var CLUSTER_PEERNAME_0 text \
  "Human-readable name for this cluster peer (unique per peer in a multi-node setup)" \
  "$DEFAULT_CLUSTER_PEERNAME_0"
prompt_var CLUSTER_IPFSHTTP_NODEMULTIADDRESS_0 text \
  "Multiaddress of the local IPFS (Kubo) node this cluster peer talks to" \
  "$DEFAULT_CLUSTER_IPFSHTTP_NODEMULTIADDRESS_0"
prompt_var CLUSTER_CRDT_TRUSTEDPEERS_0 text \
  "Peers trusted for CRDT datastore operations ('*' = trust all connected peers)" \
  "$DEFAULT_CLUSTER_CRDT_TRUSTEDPEERS_0"

#──────────────────────────────────────────────────────────────────────────────
# AI INTEGRATION
#──────────────────────────────────────────────────────────────────────────────

echo_section "AI Integration"

prompt_var DISABLE_ALL_AI_FUNCTIONALITY bool \
  "Disable all AI features? (Documents will not be analysed by AI)" false
prompt_var OLLAMA_MODEL text \
  "Ollama model for document analysis — see https://ollama.com/search (e.g. gemma3:1b, llama3.2, mistral)" \
  "$DEFAULT_OLLAMA_MODEL"
prompt_var AUTO_DOWNLOAD bool \
  "Automatically download the model if it is not present in the Docker volume?" true

#──────────────────────────────────────────────────────────────────────────────
# OPEN WEBUI CONFIGURATION
#──────────────────────────────────────────────────────────────────────────────

echo_section "Open WebUI Configuration"
echo_info "(Browser-based admin interface for AI models — https://openwebui.com/)"

prompt_var OPENWEBUI_HOST  text \
  "Open WebUI address as seen by the backend (internal Docker service URL)" "$DEFAULT_OPENWEBUI_HOST"
prompt_var OPEN_WEBUI_PORT text \
  "Open WebUI port (exposed on host)" "$DEFAULT_OPEN_WEBUI_PORT" validate_port
prompt_var ADMIN_USER_EMAIL text \
  "Open WebUI admin account email" "admin@${DOMAIN:-localhost}" validate_email
prompt_var ADMIN_USER_PASSWORD text \
  "Open WebUI admin password (min 8 chars)" \
  "$DEFAULT_ADMIN_USER_PASSWORD" validate_password validate_not_default_in_production
prompt_var WEBUI_SECRET_KEY text \
  "Open WebUI session secret — press ENTER to auto-generate (min 12 chars)" \
  "$AUTO_GENERATE" validate_secret

#──────────────────────────────────────────────────────────────────────────────
# WRITING .env FILE
#──────────────────────────────────────────────────────────────────────────────

echo_section "Writing .env File"

# Determine a human-readable note for the HTTP+production override case
_env_note=""
if [[ "$PROFILE_KEY" == "production" && "$PROTOCOL" == "http" ]]; then
  _env_note="  # overridden from 'production' — HTTP does not support secure cookies"
fi

cat > "$ENVFILE" <<EOF
# Generated by configure-env.sh  |  Profile: ${PROFILE_KEY}
# Reconfigure anytime: ./start.sh --configure-env

#──────────────────────────────────────────────────────────────────────────────
# 🔧 Settings most likely to need customisation
#──────────────────────────────────────────────────────────────────────────────

# Application environment: development | production
NODE_ENV=${NODE_ENV}${_env_note}

# AI model for document analysis (https://ollama.com/search)
# Examples: gemma3:1b  llama3.2  mistral  phi4-mini
OLLAMA_MODEL=${OLLAMA_MODEL}

# 🔑 JWT signing secret — keep this private and out of version control!
# forbiddenInProdRegex:/^super-secret-key$/ regex:/[^[:space:]]{12,}/
JWT_SECRET=${JWT_SECRET}

# 🌐 Allowed CORS origins for the API (comma-separated)
# Add every URL users might access the frontend from.
# forbiddenInProdRegex:/^http://localhost:3000,https://example.com$/ regex:/[^[:space:]]{5,}/
CORS_ORIGIN=${CORS_ORIGIN}

# 🌍 URL the browser uses to call the backend API
# forbiddenInProdRegex:/^http://localhost:8000/api$/ regex:/[^[:space:]]{5,}$/
NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# 🌐 Allowed CORS origins for Open WebUI (semicolon-separated)
OI_CORS_ALLOW_ORIGIN="${OI_CORS_ALLOW_ORIGIN}"

# 🛡️ Master admin password for critical operations
# forbiddenInProdRegex:/^Kennwort123$/ regex:/[^[:space:]]{8,}/
MASTER_PASSWORD=${MASTER_PASSWORD}

#──────────────────────────────────────────────────────────────────────────────
# 📦 Container images
#──────────────────────────────────────────────────────────────────────────────

# build → compile from source locally
# pull  → use a published image (set specific version tags below for production)
BUILD_OR_PULL_IMAGES=${BUILD_OR_PULL_IMAGES}

VERSION_BACKEND=${VERSION_BACKEND}
VERSION_FRONTEND=${VERSION_FRONTEND}
VERSION_IPFS=${VERSION_IPFS}
VERSION_IPFS_CLUSTER=${VERSION_IPFS_CLUSTER}
VERSION_WEBUI=${VERSION_WEBUI}

#──────────────────────────────────────────────────────────────────────────────
# 🔒 Security
#──────────────────────────────────────────────────────────────────────────────

# JWT expiry in seconds (86400 = 24 h)
JWT_MAX_AGE=${JWT_MAX_AGE}

# When true, new registrations are inactive until approved by an admin.
# Requires a working SMTP server or manual approval via the SQLite database.
REGISTER_USERS_AS_INACTIVE=${REGISTER_USERS_AS_INACTIVE}

# Max API requests per IP per minute (protects against DoS)
RATE_LIMIT_PER_MINUTE=${RATE_LIMIT_PER_MINUTE}

# Path to the SQLite database file (inside the backend container)
DATABASE_PATH=${DATABASE_PATH}

#──────────────────────────────────────────────────────────────────────────────
# 🌐 URLs & Networking
#──────────────────────────────────────────────────────────────────────────────

# Public frontend URL (used in email links and redirects)
FRONTEND_URL=${FRONTEND_URL}

# Internal container ports (the ports Docker binds inside the containers)
FRONTEND_PORT=${FRONTEND_PORT}
API_PORT=${API_PORT}

#──────────────────────────────────────────────────────────────────────────────
# 📜 Logging
#──────────────────────────────────────────────────────────────────────────────

LOG_LEVEL=${LOG_LEVEL}

#──────────────────────────────────────────────────────────────────────────────
# 📧 SMTP — Email delivery
#──────────────────────────────────────────────────────────────────────────────

SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT}
SMTP_SSL=${SMTP_SSL}
SMTP_TLS=${SMTP_TLS}
SMTP_USER=${SMTP_USER}
SMTP_PASSWORD=${SMTP_PASSWORD}
EMAIL_SENDER=${EMAIL_SENDER}

#──────────────────────────────────────────────────────────────────────────────
# 🛡️ Content Security Policy
#──────────────────────────────────────────────────────────────────────────────

CONTENT_SECURITY_POLICY_DEFAULT_URLS=${CONTENT_SECURITY_POLICY_DEFAULT_URLS}
CONTENT_SECURITY_POLICY_IMG_URLS=${CONTENT_SECURITY_POLICY_IMG_URLS}
CONTENT_SECURITY_POLICY_FRAME_URLS=${CONTENT_SECURITY_POLICY_FRAME_URLS}
CONTENT_SECURITY_POLICY_SCRIPT_URLS=${CONTENT_SECURITY_POLICY_SCRIPT_URLS}
CONTENT_SECURITY_POLICY_WORKER_URLS=${CONTENT_SECURITY_POLICY_WORKER_URLS}

#──────────────────────────────────────────────────────────────────────────────
# 🧠 AI Integration
#──────────────────────────────────────────────────────────────────────────────

# Set to true to disable all AI processing (uploads will not be analysed)
DISABLE_ALL_AI_FUNCTIONALITY=${DISABLE_ALL_AI_FUNCTIONALITY}

# Auto-download the Ollama model if it is absent from the Docker volume
AUTO_DOWNLOAD=${AUTO_DOWNLOAD}

# Open WebUI backend address (internal Docker service URL)
OPENWEBUI_HOST=${OPENWEBUI_HOST}

#──────────────────────────────────────────────────────────────────────────────
# 🖥️ Open WebUI — AI Admin Interface
#──────────────────────────────────────────────────────────────────────────────

# forbiddenInProdRegex:/^admin@example.com$/ regex:/^[^[:space:]]+@[^[:space:]]+\.[^[:space:]]+$/
ADMIN_USER_EMAIL=${ADMIN_USER_EMAIL}
# forbiddenInProdRegex:/^Kennwort123$/ regex:/[^[:space:]]{8,}/
ADMIN_USER_PASSWORD=${ADMIN_USER_PASSWORD}
# forbiddenInProdRegex:/^change-me-in-production$/ regex:/[^[:space:]]{12,}/
WEBUI_SECRET_KEY=${WEBUI_SECRET_KEY}
OPEN_WEBUI_PORT=${OPEN_WEBUI_PORT}

#──────────────────────────────────────────────────────────────────────────────
# 🌐 IPFS Kubo Node
#──────────────────────────────────────────────────────────────────────────────

# Prevent this node from connecting to the public IPFS network
START_PRIVATE_NETWORK=${START_PRIVATE_NETWORK}

SWARM_PORT=${SWARM_PORT}
IPFS_API_PORT=${IPFS_API_PORT}
IPFS_GATEWAY_PORT=${IPFS_GATEWAY_PORT}

#──────────────────────────────────────────────────────────────────────────────
# 📦 IPFS Cluster — General
#──────────────────────────────────────────────────────────────────────────────

# Internal Docker addresses for the cluster APIs
IPFS_CLUSTER_HOST=${IPFS_CLUSTER_HOST}
IPFS_PINSVC_HOST=${IPFS_PINSVC_HOST}
IPFS_GATEWAY_HOST=${IPFS_GATEWAY_HOST}

CLUSTER_MONITORPINGINTERVAL=${CLUSTER_MONITORPINGINTERVAL}
CLUSTER_RESTAPI_HTTPLISTENMULTIADDRESS=${CLUSTER_RESTAPI_HTTPLISTENMULTIADDRESS}
CLUSTER_PINSVCAPI_HTTPLISTENMULTIADDRESS=${CLUSTER_PINSVCAPI_HTTPLISTENMULTIADDRESS}
OPEN_API_PORT=${OPEN_API_PORT}
PINNING_SERVICE_PORT=${PINNING_SERVICE_PORT}
CLUSTER_SWARM_PORT=${CLUSTER_SWARM_PORT}

#──────────────────────────────────────────────────────────────────────────────
# 🔗 IPFS Cluster — Node 0 (this node)
#──────────────────────────────────────────────────────────────────────────────

CLUSTER_PEERNAME_0=${CLUSTER_PEERNAME_0}
CLUSTER_IPFSHTTP_NODEMULTIADDRESS_0=${CLUSTER_IPFSHTTP_NODEMULTIADDRESS_0}
CLUSTER_CRDT_TRUSTEDPEERS_0=${CLUSTER_CRDT_TRUSTEDPEERS_0}
EOF

echo_success "Wrote $ENVFILE"

#──────────────────────────────────────────────────────────────────────────────
# NEXT STEPS
#──────────────────────────────────────────────────────────────────────────────

echo_section "Next Steps"

case "$PROFILE_KEY" in
  local-dev)
    echo_info " • Start TruSpace:   ./start.sh"
    echo_info " • Frontend:         http://localhost:${FRONTEND_PORT}"
    echo_info " • API:              http://localhost:${API_PORT}/api"
    echo_info " • Open WebUI:       http://localhost:${OPEN_WEBUI_PORT}"
    ;;
  production)
    if [[ "$USE_REVERSE_PROXY" == "true" ]]; then
      echo_info " • Configure your reverse proxy:"
      echo_info "     /api  →  localhost:${API_PORT}   (backend)"
      echo_info "     /     →  localhost:${FRONTEND_PORT}  (frontend)"
      echo_info " • Start TruSpace:   ./start.sh"
      echo_info " • Site:             ${PROTOCOL}://${DOMAIN}"
    else
      echo_info " • Ensure ports ${FRONTEND_PORT} and ${API_PORT} are open in your server's firewall."
      echo_info " • Start TruSpace:   ./start.sh"
      echo_info " • Frontend:         ${PROTOCOL}://${DOMAIN}:${FRONTEND_PORT}"
      echo_info " • API:              ${PROTOCOL}://${DOMAIN}:${API_PORT}/api"
      echo_info " • Open WebUI:       ${PROTOCOL}://${DOMAIN}:${OPEN_WEBUI_PORT}"
    fi
    if [[ "$PROTOCOL" == "http" ]]; then
      echo_warn " ⚠  Running over HTTP on a trusted LAN. Do not expose this server to the internet."
    fi
    echo_info " • Review CONTENT_SECURITY_POLICY_* in $ENVFILE if you load external resources."
    ;;
  custom)
    echo_info " • Review all settings in $ENVFILE before starting."
    echo_info " • Start TruSpace:   ./start.sh"
    ;;
esac
echo_info ""
echo_info " • Add more TruSpace nodes:  ./scripts/connectPeer-automatic.sh  or  ...-manual.sh"
echo_info " • Reconfigure anytime:      ./start.sh --configure-env"