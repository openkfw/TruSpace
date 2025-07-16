#!/usr/bin/env bash
#
# connectPeer.sh
#
# Usage:
#   connectPeer.sh <peer_ip> <ipfs_peer_id> <cluster_peer_id>
#
# Options:
#   -h, --help    Show this help message and exit
#
# This script will:
#   1. Replace the "Bootstrap" array in ./volumes/ipfs0/config with a single
#      multiaddr entry for the given IPFS peer.
#   2. Replace the "peer_addresses" array in ./volumes/cluster0/service.json
#      with a single multiaddr entry for the given Cluster peer.

set -euo pipefail

print_help() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS] <peer_ip> <ipfs_peer_id> <cluster_peer_id>

Arguments:
  peer_ip           IP address of the peer you want to connect to.
  ipfs_peer_id      The libp2p Peer ID of the target IPFS node.
  cluster_peer_id   The libp2p Peer ID of the target IPFS-Cluster node.

Options:
  -h, --help        Show this help message and exit.

This will modify:
  • ./volumes/ipfs0/config
      ‣ Sets "Bootstrap" to ["/ip4/peer_ip/tcp/4001/p2p/ipfs_peer_id"]
  • ./volumes/cluster0/service.json
      ‣ Sets "peer_addresses" to ["/ip4/peer_ip/tcp/9096/p2p/cluster_peer_id"]
EOF
}

# Show help if requested
if [[ "${1:-}" =~ ^(-h|--help)$ ]]; then
  print_help
  exit 0
fi

# Check for exactly three arguments
if [[ $# -ne 3 ]]; then
  echo "Error: Wrong number of arguments." >&2
  print_help >&2
  exit 1
fi

PEER_IP="$1"
IPFS_ID="$2"
CLUSTER_ID="$3"

IPFS_CONFIG="./volumes/ipfs0/config"
CLUSTER_CONFIG="./volumes/cluster0/service.json"

# Validate files exist
if [[ ! -f "$IPFS_CONFIG" ]]; then
  echo "Error: IPFS config not found at $IPFS_CONFIG" >&2
  exit 1
fi
if [[ ! -f "$CLUSTER_CONFIG" ]]; then
  echo "Error: Cluster service.json not found at $CLUSTER_CONFIG" >&2
  exit 1
fi

# Build the multiaddrs
IPFS_ADDR="/ip4/${PEER_IP}/tcp/4001/p2p/${IPFS_ID}"
CLUSTER_ADDR="/ip4/${PEER_IP}/tcp/9096/p2p/${CLUSTER_ID}"

# Update IPFS Bootstrap array
tmp_ipfs="$(mktemp)"
jq --arg addr "$IPFS_ADDR" '.Bootstrap = [$addr]' "$IPFS_CONFIG" > "$tmp_ipfs"
mv "$tmp_ipfs" "$IPFS_CONFIG"

# Update Cluster peer_addresses
tmp_cl="$(mktemp)"
jq --arg addr "$CLUSTER_ADDR" '.cluster.peer_addresses = [$addr]' "$CLUSTER_CONFIG" > "$tmp_cl"
mv "$tmp_cl" "$CLUSTER_CONFIG"

echo "✅ Updated IPFS Bootstrap to: $IPFS_ADDR"
echo "✅ Updated Cluster peer_addresses to: $CLUSTER_ADDR"
