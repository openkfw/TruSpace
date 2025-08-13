#!/usr/bin/env bash
set -e

# .env Wizard
# This script will guide you through creating a .env file interactively.
# It prompts for each configuration setting with explanations and sensible defaults.
# Generated secrets for IPFS when needed.

# Exit if .env already exists
echo "Checking for existing .env file..."
if [ -f ".env" ]; then
  echo ".env file already exists in this directory. Wizard aborted to avoid overwriting."
  exit 0
fi

# Introduction
cat <<'INFO'
Welcome to the TruSpace .env Wizard!

This interactive script will ask you a series of questions about your environment configuration,
provide defaults (you can hit Enter to accept), and generate a complete .env file.

If a prompt offers to "generate new", a secure random key will be created automatically.
INFO

echo
# -- Helper functions for default secrets --

generate_swarm_key_secret() {
  # Generate a 64-character hexadecimal IPFS swarm key
  openssl rand -hex 32
}

generate_cluster_secret() {
  # Generate a 64-character hexadecimal IPFS cluster secret
  openssl rand -hex 32
}

# -- Core settings --

echo "VERSION: Version to download for frontend/backend images (default: latest)."
read -rp "  VERSION [latest]: " VERSION
test -z "$VERSION" && VERSION=latest

echo

echo "START_PRIVATE_NETWORK: 'true' to avoid public IPFS network (default: true)."
read -rp "  START_PRIVATE_NETWORK [true]: " START_PRIVATE_NETWORK
test -z "$START_PRIVATE_NETWORK" && START_PRIVATE_NETWORK=true

echo

echo "SWARM_KEY_SECRET: 64-char hex string for private IPFS swarm key."
read -rp "  SWARM_KEY_SECRET [generate new]: " SWARM_KEY_SECRET
test -z "$SWARM_KEY_SECRET" && SWARM_KEY_SECRET=$(generate_swarm_key_secret)

# -- Backend settings --

echo

echo "NODE_ENV: Application environment (development or production, default: development)."
read -rp "  NODE_ENV [development]: " NODE_ENV
test -z "$NODE_ENV" && NODE_ENV=development

echo

echo "API_PORT: Port for backend API (default: 8000)."
read -rp "  API_PORT [8000]: " API_PORT
test -z "$API_PORT" && API_PORT=8000

echo

echo "IPFS_CLUSTER_HOST: URL of IPFS Cluster REST API (default: http://cluster0:9094)."
read -rp "  IPFS_CLUSTER_HOST [http://cluster0:9094]: " IPFS_CLUSTER_HOST
test -z "$IPFS_CLUSTER_HOST" && IPFS_CLUSTER_HOST=http://cluster0:9094

echo

echo "IPFS_PINSVC_HOST: URL of IPFS Cluster Pinning Service (default: http://cluster0:9097)."
read -rp "  IPFS_PINSVC_HOST [http://cluster0:9097]: " IPFS_PINSVC_HOST
test -z "$IPFS_PINSVC_HOST" && IPFS_PINSVC_HOST=http://cluster0:9097

echo

echo "IPFS_GATEWAY_HOST: URL of IPFS HTTP Gateway (default: http://ipfs0:8080)."
read -rp "  IPFS_GATEWAY_HOST [http://ipfs0:8080]: " IPFS_GATEWAY_HOST
test -z "$IPFS_GATEWAY_HOST" && IPFS_GATEWAY_HOST=http://ipfs0:8080

echo

echo "OLLAMA_MODEL: Ollama AI model (default: gemma3:1b)."
read -rp "  OLLAMA_MODEL [gemma3:1b]: " OLLAMA_MODEL
test -z "$OLLAMA_MODEL" && OLLAMA_MODEL=gemma3:1b

echo

echo "LOG_LEVEL: Logging level (DEBUG, INFO, WARN, ERROR, default: DEBUG)."
read -rp "  LOG_LEVEL [DEBUG]: " LOG_LEVEL
test -z "$LOG_LEVEL" && LOG_LEVEL=DEBUG

echo

echo "OPENWEBUI_HOST: URL of WebUI service (default: http://webui:8080)."
read -rp "  OPENWEBUI_HOST [http://webui:8080]: " OPENWEBUI_HOST
test -z "$OPENWEBUI_HOST" && OPENWEBUI_HOST=http://webui:8080

echo

echo "AUTO_DOWNLOAD: Auto-download AI models on startup (true/false, default: true)."
read -rp "  AUTO_DOWNLOAD [true]: " AUTO_DOWNLOAD
test -z "$AUTO_DOWNLOAD" && AUTO_DOWNLOAD=true

echo

echo "DISABLE_ALL_AI_FUNCTIONALITY: Disable AI features (true/false, default: false)."
read -rp "  DISABLE_ALL_AI_FUNCTIONALITY [false]: " DISABLE_ALL_AI_FUNCTIONALITY
test -z "$DISABLE_ALL_AI_FUNCTIONALITY" && DISABLE_ALL_AI_FUNCTIONALITY=false

echo

echo "DATABASE_PATH: Path for SQLite DB (default: /app/data/truspace.db)."
read -rp "  DATABASE_PATH [/app/data/truspace.db]: " DATABASE_PATH
test -z "$DATABASE_PATH" && DATABASE_PATH=/app/data/truspace.db

echo

echo "JWT_SECRET: Secret for JWT tokens (min 12 chars, default: super-secret-key)."
read -rp "  JWT_SECRET [super-secret-key]: " JWT_SECRET
test -z "$JWT_SECRET" && JWT_SECRET=super-secret-key

echo

echo "JWT_MAX_AGE: Expiration (seconds, default: 86400)."
read -rp "  JWT_MAX_AGE [86400]: " JWT_MAX_AGE
test -z "$JWT_MAX_AGE" && JWT_MAX_AGE=86400

echo

echo "CORS_ORIGIN: Allowed frontend origins (comma-separated, default: http://localhost:3000,https://example.com)."
read -rp "  CORS_ORIGIN [http://localhost:3000,https://example.com]: " CORS_ORIGIN
test -z "$CORS_ORIGIN" && CORS_ORIGIN=http://localhost:3000,https://example.com
read -rp "  (Optional) Override domain (replace example.com): " FRONTEND_DOMAIN
if [ -n "$FRONTEND_DOMAIN" ]; then CORS_ORIGIN=${CORS_ORIGIN//example.com/$FRONTEND_DOMAIN}; fi

echo

echo "CONTENT_SECURITY_POLICY_*_URLS: Allowed URLs for CSP directives (default empty)."
read -rp "  Default-src []: " CONTENT_SECURITY_POLICY_DEFAULT_URLS
read -rp "  Img-src []: " CONTENT_SECURITY_POLICY_IMG_URLS
read -rp "  Frame-src []: " CONTENT_SECURITY_POLICY_FRAME_URLS
read -rp "  Script-src []: " CONTENT_SECURITY_POLICY_SCRIPT_URLS
read -rp "  Worker-src []: " CONTENT_SECURITY_POLICY_WORKER_URLS

echo

echo "RATE_LIMIT_PER_MINUTE: API rate limit (default: 200)."
read -rp "  RATE_LIMIT_PER_MINUTE [200]: " RATE_LIMIT_PER_MINUTE
test -z "$RATE_LIMIT_PER_MINUTE" && RATE_LIMIT_PER_MINUTE=200

echo

echo "MASTER_PASSWORD: Secure master password (min 8 chars, default: Kennwort123)."
read -rp "  MASTER_PASSWORD [Kennwort123]: " MASTER_PASSWORD
test -z "$MASTER_PASSWORD" && MASTER_PASSWORD=Kennwort123

echo

echo "REGISTER_USERS_AS_INACTIVE: New users inactive by default (true/false, default: false)."
read -rp "  REGISTER_USERS_AS_INACTIVE [false]: " REGISTER_USERS_AS_INACTIVE
test -z "$REGISTER_USERS_AS_INACTIVE" && REGISTER_USERS_AS_INACTIVE=false

# -- SMTP settings --

echo

echo "SMTP_HOST: Hostname for SMTP server (default: host.docker.internal)."
read -rp "  SMTP_HOST [host.docker.internal]: " SMTP_HOST
test -z "$SMTP_HOST" && SMTP_HOST=host.docker.internal

echo

echo "SMTP_USER: SMTP username (default empty)."
read -rp "  SMTP_USER []: " SMTP_USER

echo

echo "SMTP_PASSWORD: SMTP password (min 8 chars)."
read -rp "  SMTP_PASSWORD []: " SMTP_PASSWORD

echo

echo "SMTP_PORT: SMTP server port (default: 1025)."
read -rp "  SMTP_PORT [1025]: " SMTP_PORT
test -z "$SMTP_PORT" && SMTP_PORT=1025

echo

echo "SMTP_SSL: Use SSL (true/false, default: false)."
read -rp "  SMTP_SSL [false]: " SMTP_SSL
test -z "$SMTP_SSL" && SMTP_SSL=false

echo

echo "SMTP_TLS: Use TLS (true/false, default: false)."
read -rp "  SMTP_TLS [false]: " SMTP_TLS
test -z "$SMTP_TLS" && SMTP_TLS=false

echo

echo "EMAIL_SENDER: From address (default: TruSpace <truspace@truspace.com>)."
read -rp "  EMAIL_SENDER [TruSpace <truspace@truspace.com>]: " EMAIL_SENDER
test -z "$EMAIL_SENDER" && EMAIL_SENDER="TruSpace <truspace@truspace.com>"

# -- OpenWeb UI settings --

echo

echo "ADMIN_USER_EMAIL: Admin email (default: admin@example.com)."
read -rp "  ADMIN_USER_EMAIL [admin@example.com]: " ADMIN_USER_EMAIL
test -z "$ADMIN_USER_EMAIL" && ADMIN_USER_EMAIL=admin@example.com

echo

echo "ADMIN_USER_PASSWORD: Admin password (min 8 chars, default: admin)."
read -rp "  ADMIN_USER_PASSWORD [admin]: " ADMIN_USER_PASSWORD
test -z "$ADMIN_USER_PASSWORD" && ADMIN_USER_PASSWORD=admin

echo

echo "WEBUI_SECRET_KEY: WebUI secret key (min 12 chars, default: t0p-s3cr3t)."
read -rp "  WEBUI_SECRET_KEY [t0p-s3cr3t]: " WEBUI_SECRET_KEY
test -z "$WEBUI_SECRET_KEY" && WEBUI_SECRET_KEY=t0p-s3cr3t

echo

echo "OPEN_WEBUI_PORT: WebUI port (default: 3333)."
read -rp "  OPEN_WEBUI_PORT [3333]: " OPEN_WEBUI_PORT
test -z "$OPEN_WEBUI_PORT" && OPEN_WEBUI_PORT=3333

echo

echo "OI_CORS_ALLOW_ORIGIN: Allowed origins for WebUI CORS (semicolon-separated)."
read -rp "  OI_CORS_ALLOW_ORIGIN [http://localhost:3000;http://localhost:3333;http://localhost:8000;http://backend:8000;http://127.0.0.1:3333]: " OI_CORS_ALLOW_ORIGIN
test -z "$OI_CORS_ALLOW_ORIGIN" && OI_CORS_ALLOW_ORIGIN="http://localhost:3000;http://localhost:3333;http://localhost:8000;http://backend:8000;http://127.0.0.1:3333"

# -- Frontend settings --

echo

echo "FRONTEND_PORT: Frontend server port (default: 3000)."
read -rp "  FRONTEND_PORT [3000]: " FRONTEND_PORT
test -z "$FRONTEND_PORT" && FRONTEND_PORT=3000

echo

echo "NEXT_PUBLIC_API_URL: Backend API URL for frontend (default: http://localhost:8000/api)."
read -rp "  NEXT_PUBLIC_API_URL [http://localhost:8000/api]: " NEXT_PUBLIC_API_URL
test -z "$NEXT_PUBLIC_API_URL" && NEXT_PUBLIC_API_URL=http://localhost:8000/api

# -- IPFS Cluster general --

echo

echo "CLUSTER_SECRET: 64-char hex IPFS Cluster secret (generate new)."
read -rp "  CLUSTER_SECRET [generate new]: " CLUSTER_SECRET
test -z "$CLUSTER_SECRET" && CLUSTER_SECRET=$(generate_cluster_secret)

echo

echo "CLUSTER_MONITORPINGINTERVAL: Ping interval (default: 2s)."
read -rp "  CLUSTER_MONITORPINGINTERVAL [2s]: " CLUSTER_MONITORPINGINTERVAL
test -z "$CLUSTER_MONITORPINGINTERVAL" && CLUSTER_MONITORPINGINTERVAL=2s

echo

echo "CLUSTER_RESTAPI_HTTPLISTENMULTIADDRESS: REST API multiaddress (default: /ip4/0.0.0.0/tcp/9094)."
read -rp "  CLUSTER_RESTAPI_HTTPLISTENMULTIADDRESS [/ip4/0.0.0.0/tcp/9094]: " CLUSTER_RESTAPI_HTTPLISTENMULTIADDRESS
test -z "$CLUSTER_RESTAPI_HTTPLISTENMULTIADDRESS" && CLUSTER_RESTAPI_HTTPLISTENMULTIADDRESS=/ip4/0.0.0.0/tcp/9094

echo

echo "CLUSTER_PINSVCAPI_HTTPLISTENMULTIADDRESS: Pinning Service API multiaddress (default: /ip4/0.0.0.0/tcp/9097)."
read -rp "  CLUSTER_PINSVCAPI_HTTPLISTENMULTIADDRESS [/ip4/0.0.0.0/tcp/9097]: " CLUSTER_PINSVCAPI_HTTPLISTENMULTIADDRESS
test -z "$CLUSTER_PINSVCAPI_HTTPLISTENMULTIADDRESS" && CLUSTER_PINSVCAPI_HTTPLISTENMULTIADDRESS=/ip4/0.0.0.0/tcp/9097

echo

echo "OPEN_API_PORT: REST API port (default: 9094)."
read -rp "  OPEN_API_PORT [9094]: " OPEN_API_PORT
test -z "$OPEN_API_PORT" && OPEN_API_PORT=9094

echo

echo "PINNING_SERVICE_PORT: Pinning Service port (default: 9097)."
read -rp "  PINNING_SERVICE_PORT [9097]: " PINNING_SERVICE_PORT
test -z "$PINNING_SERVICE_PORT" && PINNING_SERVICE_PORT=9097

echo

echo "CLUSTER_SWARM_PORT: Swarm communication port (default: 9096)."
read -rp "  CLUSTER_SWARM_PORT [9096]: " CLUSTER_SWARM_PORT
test -z "$CLUSTER_SWARM_PORT" && CLUSTER_SWARM_PORT=9096

# -- Cluster peer entries --

# ... (rest unchanged) ...

# Write .env file

echo
cat > .env <<EOF
# Generated by env_wizard.sh
VERSION=$VERSION
START_PRIVATE_NETWORK=$START_PRIVATE_NETWORK
SWARM_KEY_SECRET=$SWARM_KEY_SECRET
LIBP2P_TCP_MUX=$LIBP2P_TCP_MUX

# Backend settings
NODE_ENV=$NODE_ENV
API_PORT=$API_PORT
IPFS_CLUSTER_HOST=$IPFS_CLUSTER_HOST
IPFS_PINSVC_HOST=$IPFS_PINSVC_HOST
IPFS_GATEWAY_HOST=$IPFS_GATEWAY_HOST
OLLAMA_MODEL=$OLLAMA_MODEL
LOG_LEVEL=$LOG_LEVEL
OPENWEBUI_HOST=$OPENWEBUI_HOST
AUTO_DOWNLOAD=$AUTO_DOWNLOAD
DISABLE_ALL_AI_FUNCTIONALITY=$DISABLE_ALL_AI_FUNCTIONALITY
DATABASE_PATH=$DATABASE_PATH
JWT_SECRET=$JWT_SECRET
JWT_MAX_AGE=$JWT_MAX_AGE
CORS_ORIGIN=$CORS_ORIGIN
CONTENT_SECURITY_POLICY_DEFAULT_URLS=$CONTENT_SECURITY_POLICY_DEFAULT_URLS
CONTENT_SECURITY_POLICY_IMG_URLS=$CONTENT_SECURITY_POLICY_IMG_URLS
CONTENT_SECURITY_POLICY_FRAME_URLS=$CONTENT_SECURITY_POLICY_FRAME_URLS
CONTENT_SECURITY_POLICY_SCRIPT_URLS=$CONTENT_SECURITY_POLICY_SCRIPT_URLS
CONTENT_SECURITY_POLICY_WORKER_URLS=$CONTENT_SECURITY_POLICY_WORKER_URLS
RATE_LIMIT_PER_MINUTE=$RATE_LIMIT_PER_MINUTE
MASTER_PASSWORD=$MASTER_PASSWORD
REGISTER_USERS_AS_INACTIVE=$REGISTER_USERS_AS_INACTIVE

# SMTP settings
SMTP_HOST=$SMTP_HOST
SMTP_USER=$SMTP_USER
SMTP_PASSWORD=$SMTP_PASSWORD
SMTP_PORT=$SMTP_PORT
SMTP_SSL=$SMTP_SSL
SMTP_TLS=$SMTP_TLS
EMAIL_SENDER=$EMAIL_SENDER

# OpenWeb UI settings
ADMIN_USER_EMAIL=$ADMIN_USER_EMAIL
ADMIN_USER_PASSWORD=$ADMIN_USER_PASSWORD
WEBUI_SECRET_KEY=$WEBUI_SECRET_KEY
OPEN_WEBUI_PORT=$OPEN_WEBUI_PORT
OI_CORS_ALLOW_ORIGIN=$OI_CORS_ALLOW_ORIGIN

# Frontend settings
FRONTEND_PORT=$FRONTEND_PORT
NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# IPFS Cluster settings
CLUSTER_SECRET=$CLUSTER_SECRET
CLUSTER_MONITORPINGINTERVAL=$CLUSTER_MONITORPINGINTERVAL
CLUSTER_RESTAPI_HTTPLISTENMULTIADDRESS=$CLUSTER_RESTAPI_HTTPLISTENMULTIADDRESS
CLUSTER_PINSVCAPI_HTTPLISTENMULTIADDRESS=$CLUSTER_PINSVCAPI_HTTPLISTENMULTIADDRESS
OPEN_API_PORT=$OPEN_API_PORT
PINNING_SERVICE_PORT=$PINNING_SERVICE_PORT
CLUSTER_SWARM_PORT=$CLUSTER_SWARM_PORT
EOF

echo ".env file generated successfully!"