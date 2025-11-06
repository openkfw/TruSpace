#!/usr/bin/env bash
#
# connectPeer-manually.sh
#
# Usage:
#   connectPeer-manually.sh <peer_ip> <ipfs_peer_id> <cluster_peer_id> <ipfs:container_id> <cluster_container_id> [swarm_key_path] [cluster_secret_path]
#
# Description:
#   Connects the local IPFS & Cluster nodes to a remote peer in a private network.

set -euo pipefail

print_help() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS] <peer_ip> <ipfs_peer_id> <cluster_peer_id> <ipfs_container_id> <cluster_container_id> [swarm_key_path] [cluster_secret_path]

Arguments:
  peer_ip               IP address of the peer you want to connect to.
  ipfs_peer_id          The libp2p Peer ID of the target IPFS node.
  cluster_peer_id       The libp2p Peer ID of the target IPFS-Cluster node.
  ipfs_container_id     Docker container ID or name for the local IPFS node.
  cluster_container_id  Docker container ID or name for the IPFS cluster.
  swarm_key_path        (Optional) Path to a swarm.key file for private IPFS networking.
  cluster_secret_path   (Optional) Path to a file containing the cluster secret.

How to find your container ID:
  You can list all running containers and find the IPFS one with:
    docker ps
  Example output:
    CONTAINER ID   IMAGE         COMMAND                  ...
    a1b2c3d4e5f6   ipfs/go-ipfs  "start_ipfs.sh"          ...
  Then use either the "CONTAINER ID" or the "NAME" in this script.

Example:
  ./connectPeer-manually.sh 10.0.0.2 QmPeer123 QmCluster456 ipfs0 cluster0 ./swarm.key ./cluster_secret.txt

This script will:
  1. Optionally copy a swarm.key into ./volumes/ipfs0/.
  2. Optionally update the cluster secret inside ./volumes/cluster0/service.json.
  2. Apply required IPFS configuration patches (private network settings, no AutoConf, etc.).
  3. Set the "Bootstrap" entry in IPFS config to the given peer.
  4. Set the "peer_addresses" entry in cluster service.json to the given peer.
  5. Restart the IPFS container and cluster container to apply the changes.
EOF
}

# Show help
if [[ "${1:-}" =~ ^(-h|--help)$ ]]; then
  print_help
  exit 0
fi

# Check arguments (5 required, 7 optional)
if [[ $# -lt 5 || $# -gt 7 ]]; then
  echo "❌ Error: Wrong number of arguments." >&2
  print_help >&2
  exit 1
fi

PEER_IP="$1"
IPFS_ID="$2"
CLUSTER_ID="$3"
IPFS_CONTAINER_ID="$4"
CLUSTER_CONTAINER_ID="$5"
SWARM_KEY_PATH="${6:-}"
CLUSTER_SECRET_PATH="${7:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IPFS_CONFIG="$SCRIPT_DIR/../volumes/ipfs0/config"
IPFS_SWARM_KEY="$SCRIPT_DIR/../volumes/ipfs0/swarm.key"
CLUSTER_CONFIG="$SCRIPT_DIR/../volumes/cluster0/service.json"

# Validate files exist
if [[ ! -f "$IPFS_CONFIG" ]]; then
  echo "❌ Error: IPFS config not found at $IPFS_CONFIG" >&2
  exit 1
fi
if [[ ! -f "$CLUSTER_CONFIG" ]]; then
  echo "❌ Error: Cluster service.json not found at $CLUSTER_CONFIG" >&2
  exit 1
fi

# --- cluster secret handling ---
if [[ -n "$SWARM_KEY_PATH" ]]; then
  if [[ ! -f "$SWARM_KEY_PATH" ]]; then
    echo "❌ Error: swarm.key not found at $SWARM_KEY_PATH" >&2
    exit 1
  fi
  echo "🔑 Copying swarm.key to $IPFS_SWARM_KEY ..."
  cp "$SWARM_KEY_PATH" "$IPFS_SWARM_KEY"
  chmod 600 "$IPFS_SWARM_KEY"
  echo "🔐 swarm.key copied successfully."
else
  echo "ℹ️ No swarm.key provided — running without private network key. Please add to $SWARM_KEY_PATH if necessary."
fi

# --- cluster secret handling ---
echo ""
if [[ -n "$CLUSTER_SECRET_PATH" ]]; then
  if [[ ! -f "$CLUSTER_SECRET_PATH" ]]; then
    echo "❌ Cluster secret file not found at $CLUSTER_SECRET_PATH" >&2
    exit 1
  fi
  CLUSTER_SECRET=$(<"$CLUSTER_SECRET_PATH")
  if [[ ! "$CLUSTER_SECRET" =~ ^[0-9a-fA-F]+$ ]]; then
    echo "⚠️ Warning: cluster secret seems not to be a valid hex string" >&2
  fi
  echo "🔑 Updating cluster secret in service.json..."
  tmp_cs="$(mktemp)"
  jq --arg secret "$CLUSTER_SECRET" '.cluster.secret = $secret' "$CLUSTER_CONFIG" > "$tmp_cs"
  mv "$tmp_cs" "$CLUSTER_CONFIG"
  echo "🔐 Cluster secret updated."
else
  echo "ℹ️ No cluster secret provided — keeping existing one."
fi

# Build multiaddrs
IPFS_ADDR="/ip4/${PEER_IP}/tcp/4001/p2p/${IPFS_ID}"
CLUSTER_ADDR="/ip4/${PEER_IP}/tcp/9096/p2p/${CLUSTER_ID}"

echo ""
echo "🔧 Applying IPFS configuration patches in container '$IPFS_CONTAINER_ID'..."

run_ipfs_config() {
  docker exec "$IPFS_CONTAINER_ID" ipfs config "$@"
}

# Apply IPFS configuration patches for private networks
run_ipfs_config --json AutoConf.Enabled false
run_ipfs_config Routing.Type dht
run_ipfs_config --json AutoTLS.Enabled false
run_ipfs_config --json Swarm.Transports.Network '{"Websocket": false}'
run_ipfs_config --json DNS.Resolvers '{}'
run_ipfs_config --json Routing.DelegatedRouters '[]'
run_ipfs_config --json Ipns.DelegatedPublishers '[]'

# Update IPFS Bootstrap address directly via ipfs config
echo ""
echo "🔁 Updating IPFS Bootstrap entry to $IPFS_ADDR ..."
run_ipfs_config --json Bootstrap "[\"$IPFS_ADDR\"]"
echo "✅ Updated IPFS Bootstrap to: $IPFS_ADDR"

# Update Cluster peer_addresses via jq
echo ""
echo "🔁 Updating Cluster peer_addresses..."
tmp_cl="$(mktemp)"
jq --arg addr "$CLUSTER_ADDR" '.cluster.peer_addresses = [$addr]' "$CLUSTER_CONFIG" > "$tmp_cl"
mv "$tmp_cl" "$CLUSTER_CONFIG"
echo "✅ Updated Cluster peer_addresses to: $CLUSTER_ADDR"

# Restart IPFS container
echo ""
echo "🔄 Restarting IPFS daemon in container '$IPFS_CONTAINER_ID'..."
docker restart "$IPFS_CONTAINER_ID" >/dev/null
echo "✅ IPFS daemon restarted successfully."

# Restart cluster container
echo ""
echo "🔄 Restarting cluster daemon in container '$CLUSTER_CONTAINER_ID'..."
docker restart "$CLUSTER_CONTAINER_ID" >/dev/null
echo "✅ Cluster daemon restarted successfully."

echo ""
echo "🎉 Peer connection setup complete."
