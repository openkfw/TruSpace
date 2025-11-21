#!/usr/bin/env bash
set -euo pipefail

# -------------------------------------------------------
# fetch-connection.sh
# -------------------------------------------------------
# Collects:
#  - Public IP
#  - IPFS PeerID
#  - IPFS swarm.key
#  - Cluster ID & secret
#
# Creates a .connection file and, if flag -e or --encrypted is provided,
# creates .connection file, which is encrypted with .connection.password
# -------------------------------------------------------

print_help() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS] [-e|--encrypted]

Arguments:
    -e, --encrypted       If provided, creates an encrypted .connection file along with a .connection.password file.

Example:
  ./$(basename "$0") -e

This script will:
  1. Collect the necessary connection details from local IPFS and Cluster configurations.
  2. Create a plaintext .connection file if no -e/--encrypted flag is provided.
  3. If -e/--encrypted flag is provided, it will:
EOF
}

echo
echo "████████╗██████╗ ██╗   ██╗███████╗██████╗  █████╗  ██████╗███████╗ "
echo "╚══██╔══╝██╔══██╗██║   ██║██╔════╝██╔══██╗██╔══██╗██╔════╝██╔════╝ "
echo "   ██║   ██████╔╝██║   ██║███████╗██████╔╝███████║██║     █████╗   "
echo "   ██║   ██╔══██╗██║   ██║╚════██║██╔═══╝ ██╔══██║██║     ██╔══╝   "
echo "   ██║   ██║  ██║╚██████╔╝███████║██║     ██║  ██║╚██████╗███████╗ "
echo "   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝     ╚═╝  ╚═╝ ╚═════╝╚══════╝ "
echo "                                                                   "

# Show help
if [[ "${1:-}" =~ ^(-h|--help)$ ]]; then
  print_help
  exit 0
fi

# --- Optional flag input ---
ENCRYPTED=false
if [[ "${1:-}" == "-e" || "${1:-}" == "--encrypted" ]]; then
    ENCRYPTED=true
fi

# --- Fixed paths ---
IPFS_CONFIG="./volumes/ipfs0/config"
SWARM_KEY="./volumes/ipfs0/swarm.key"
CLUSTER_IDENTITY="./volumes/cluster0/identity.json"
CLUSTER_CONFIG="./volumes/cluster0/service.json"
OUTFILE=".connection"              # NOTE: this will be encrypted when flag is provided
PASSFILE=".connection.password"
TMP_PLAIN="$(mktemp /tmp/connection_plain.XXXXXX)"


# --- Helpers ---
die() { echo "Error: $*" >&2; exit 1; }
check_cmd() { command -v "$1" >/dev/null 2>&1 || die "$1 required but not found"; }

echo "Collecting connection details..."

# Check basic deps
check_cmd curl

# --- Fetch values ---
compact_json() {
    # Bring json into one large row
    tr -d '\n\r' < "$1" | sed 's/[[:space:]]\+/ /g'
}
json_get() {
    # Extract value for inputted target
    echo "$2" | grep "\"$1\"" | sed -E "s/.*\"$1\"[[:space:]]*:[[:space:]]*\"([^\"]*)\".*/\1/"
}

MY_IP="$(curl -fsS https://api.ipify.org || echo '127.0.0.1')"

IPFS_CONFIG_JSON="$(compact_json "$IPFS_CONFIG")"
CLUSTER_ID_JSON="$(compact_json "$CLUSTER_IDENTITY")"
CLUSTER_CFG_JSON="$(compact_json "$CLUSTER_CONFIG")"

IPFS_ID="$(json_get PeerID "$IPFS_CONFIG_JSON")"
IPFS_SWARM_KEY_="$( [[ -f "$SWARM_KEY" ]] && cat "$SWARM_KEY" || echo '')"
CLUSTER_ID="$(json_get id "$CLUSTER_ID_JSON")"
CLUSTER_SECRET="$(json_get secret "$CLUSTER_CFG_JSON")"

# --- Write plaintext temporary .connection content ---
cat > "$TMP_PLAIN" <<EOF
# .connection - generated $(date -u +"%Y-%m-%dT%H:%M:%SZ")
IP=${MY_IP}
IPFS_ID=${IPFS_ID}
IPFS_SWARM_KEY_='${IPFS_SWARM_KEY_}'
IPFS_CLUSTER_ID=${CLUSTER_ID}
IPFS_CLUSTER_SECRET='${CLUSTER_SECRET}'
EOF
chmod 600 "$TMP_PLAIN"

# If not encrypted: keep plaintext file at OUTFILE and exit
if [[ "$ENCRYPTED" == false ]]; then
  mv -f "$TMP_PLAIN" "$OUTFILE"
  chmod 600 "$OUTFILE"
  echo
  echo "✅ .connection created (plaintext) at: $(realpath "$OUTFILE")"
  echo "No password generated because no email was provided."
  exit 0
fi

# --- If encrypted: encrypt the plaintext file with a generated password ---
check_cmd openssl

# Generate password (only purpose: encryption of .connection)
if command -v openssl >/dev/null 2>&1; then
  # strong random base64 passphrase
  PASSWORD="$(openssl rand -base64 24)"
else
  PASSWORD="$(date +%s%N | sha256sum | cut -c1-32)"
fi

# Encrypt into OUTFILE using AES-256-CBC with PBKDF2 and iterations
# -iter increases KDF iterations for PBKDF2 (available in newer openssl)
# Use a reasonably high iteration count (100k)
ENCRYPT_ITER=100000

# Use a temporary encrypted file first
TMP_ENC="$(mktemp /tmp/connection_enc.XXXXXX)"

# Note: if openssl doesn't support -pbkdf2 or -iter, fallback to older invocation
if openssl enc -aes-256-cbc -pbkdf2 -iter "$ENCRYPT_ITER" -salt -in "$TMP_PLAIN" -out "$TMP_ENC" -pass pass:"$PASSWORD" 2>/dev/null; then
  :
else
  # fallback without pbkdf2/iter (less ideal) — try without these flags
  openssl enc -aes-256-cbc -salt -in "$TMP_PLAIN" -out "$TMP_ENC" -pass pass:"$PASSWORD"
fi

# Move encrypted to OUTFILE, remove plaintext
mv -f "$TMP_ENC" "$OUTFILE"
chmod 600 "$OUTFILE"
shred -u "$TMP_PLAIN" >/dev/null 2>&1 || rm -f "$TMP_PLAIN" >/dev/null 2>&1

# Store password in PASSFILE (for manual sending via second email draft)
printf '%s\n' "$PASSWORD" > "$PASSFILE"
chmod 600 "$PASSFILE"

echo
echo "✅ Encrypted .connection created at: $(realpath "$OUTFILE")"
echo "🔐 Password stored in: $(realpath "$PASSFILE")"
