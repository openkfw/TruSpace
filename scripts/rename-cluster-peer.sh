#!/usr/bin/env bash
set -euo pipefail

# -------------------------------------------------------
# rename-cluster-peer.sh
# -------------------------------------------------------
# Adapts CLUSTER_PEERNAME_0 in .env and afterwards restarts the cluster0 container with the new name.
# -------------------------------------------------------

# Get current peer name from .env
CURRENT_PEERNAME=$(grep -E '^CLUSTER_PEERNAME_0=' .env | cut -d '=' -f 2-)

# Prompt user for new peer name
read -p "Current peer name is '$CURRENT_PEERNAME'. Enter new peer name:
" NEW_PEERNAME

# Update .env with new peer name
sed -i.bak "s/^CLUSTER_PEERNAME_0=.*/CLUSTER_PEERNAME_0=$NEW_PEERNAME/" .env
rm .env.bak

# Restart cluster0 container to apply new peer name
export LUID=$(id -u)
export LGID=$(id -g)

docker compose -f docker-compose.yml -f docker-compose.pull.yml \
  up -d --force-recreate --no-deps cluster0
