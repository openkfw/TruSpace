#!/usr/bin/env bash
set -euo pipefail

#─── COLORS ───────────────────────────────────────────────────────────────────
RED="\033[0;31m"     YELLOW="\033[0;33m"
GREEN="\033[0;32m"   NC="\033[0m"

info(){ echo -e "${GREEN}✔ $*${NC}"; }
warn(){ echo -e "${YELLOW}➜ $*${NC}"; }
err(){ echo -e "${RED}✖ $*${NC}"; }

#─── PATHS ────────────────────────────────────────────────────────────────────
TEMPLATE="./.env.template"
ENVFILE=".env"

#─── PRE-CHECK ─────────────────────────────────────────────────────────────────
if [[ -f "$ENVFILE" ]]; then
  info "Found existing $ENVFILE; nothing to do."
  exit 0
fi

if [[ ! -f "$TEMPLATE" ]]; then
  err "Template file '$TEMPLATE' not found in $(pwd). Please place your template there."
  exit 1
fi

#─── GENERATE SECRETS ───────────────────────────────────────────────────────────
warn "Generating secure secrets..."
SWARM_KEY_SECRET=$(openssl rand -hex 32)
CLUSTER_SECRET=$(openssl rand -hex 32)
info "  • SWARM_KEY_SECRET: ${SWARM_KEY_SECRET:0:8}…${SWARM_KEY_SECRET: -8}"
info "  • CLUSTER_SECRET : ${CLUSTER_SECRET:0:8}…${CLUSTER_SECRET: -8}"

#─── CREATE IPFS SWARM KEY ──────────────────────────────────────────────────────
IPFS_SWARM_DIR="./volumes/ipfs0"
IPFS_SWARM_KEY_FILE="$IPFS_SWARM_DIR/swarm.key"

warn "Ensuring IPFS swarm key directory exists at $IPFS_SWARM_DIR"
mkdir -p "$IPFS_SWARM_DIR"

warn "Writing IPFS swarm key to $IPFS_SWARM_KEY_FILE"
cat > "$IPFS_SWARM_KEY_FILE" <<EOF
/key/swarm/psk/1.0.0/
/base16/
$SWARM_KEY_SECRET
EOF
info "IPFS swarm key generated."

#─── PROMPTS ───────────────────────────────────────────────────────────────────
echo
echo -e "${YELLOW}Let’s fill in the remaining values:${NC}"
read -rp "1) NODE_ENV (e.g. development/production) [production]: " NODE_ENV
NODE_ENV=${NODE_ENV:-production}

# DOMAIN
while :; do
  read -rp "2) Your Public DOMAIN (e.g. example.com): " DOMAIN
  if [[ ${#DOMAIN} -ge 5 && "$DOMAIN" =~ [A-Za-z0-9.-]+ ]]; then break; fi
  warn "   ▶ Domain must be at least 5 characters (letters, numbers, dots)."
done

# ADMIN OI UI PASSWORD
while :; do
  read -rsp "3) OpenWebUI ADMIN_USER_PASSWORD (min 8 chars): " OI_PASSWORD
  echo
  if [[ ${#OI_PASSWORD} -ge 8 ]]; then break; fi
  warn "   ▶ Password too short; needs ≥8 characters."
done

# NEXT_PUBLIC_API_URL domain
while :; do
  read -rp "4) API_DOMAIN for frontend (e.g. api.example.com): " API_DOMAIN
  if [[ ${#API_DOMAIN} -ge 5 ]]; then break; fi
  warn "   ▶ Must be at least 5 characters."
done

#─── CREATE .env FROM TEMPLATE ─────────────────────────────────────────────────
cp "$TEMPLATE" "$ENVFILE"
info "Copied $TEMPLATE → $ENVFILE"

#─── SUBSTITUTE PLACEHOLDERS ───────────────────────────────────────────────────
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' \
    -e "s|<SWARM_KEY_SECRET>|${SWARM_KEY_SECRET}|g" \
    -e "s|<CLUSTER_SECRET>|${CLUSTER_SECRET}|g" \
    -e "s|<NODE_ENV>|${NODE_ENV}|g" \
    -e "s|<DOMAIN>|${DOMAIN}|g" \
    -e "s|<OI_PASSWORD>|${OI_PASSWORD}|g" \
    -e "s|<API_DOMAIN>|${API_DOMAIN}|g" \
    "$ENVFILE"
else
  sed -i \
    -e "s|<SWARM_KEY_SECRET>|${SWARM_KEY_SECRET}|g" \
    -e "s|<CLUSTER_SECRET>|${CLUSTER_SECRET}|g" \
    -e "s|<NODE_ENV>|${NODE_ENV}|g" \
    -e "s|<DOMAIN>|${DOMAIN}|g" \
    -e "s|<OI_PASSWORD>|${OI_PASSWORD}|g" \
    -e "s|<API_DOMAIN>|${API_DOMAIN}|g" \
    "$ENVFILE"
fi
  -e "s|<SWARM_KEY_SECRET>|${SWARM_KEY_SECRET}|g" \
  -e "s|<CLUSTER_SECRET>|${CLUSTER_SECRET}|g" \
  -e "s|<NODE_ENV>|${NODE_ENV}|g" \
  -e "s|<DOMAIN>|${DOMAIN}|g" \
  -e "s|<OI_PASSWORD>|${OI_PASSWORD}|g" \
  -e "s|<API_DOMAIN>|${API_DOMAIN}|g" \
  "$ENVFILE"

info ".env file has been created and all placeholders replaced!"
echo
echo -e "${GREEN}Next steps:${NC}"
echo " • Review and adjust any CONTENT_SECURITY_POLICY_* entries in $ENVFILE"
echo " • For a more detailed configuration (e.g. email server), have a look at the configuration in $ENVFILE"
echo " • Start TruSpace with ./start.sh"
