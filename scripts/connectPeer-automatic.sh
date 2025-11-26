#!/usr/bin/env bash
set -euo pipefail

# -------------------------------------------------------
# connectPeer-automatic.sh
# -------------------------------------------------------
# Usage:
#   ./connectPeer-automatic.sh <path/to/.connection> [path/to/.connection.password]
#
# 1. If a password file is inputted, decypts the encrypted .connection file using the password file.
# 2. Sources the variables into the current shell environment.
# 3. Prints them for confirmation.
#
# Dependencies: openssl
# -------------------------------------------------------

print_help() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS] <path/to/.connection> [path/to/.connection.password]

Arguments:
    <path/to/.connection>               Path to the .connection file (encrypted or plaintext).
    [path/to/.connection.password]      Optional: path to the password file for decrypting the .connection file.

Example:
  ./$(basename "$0") -e

This script will:
  1. If a password file is inputted, decypts the encrypted .connection file using the password file.
  2. Sources the variables into the current shell environment.
  3. Prints them for confirmation.
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
echo "Reading connection data and configuring IPFS and Cluster..."
echo

# Show help
if [[ "${1:-}" =~ ^(-h|--help)$ ]]; then
  print_help
  exit 0
fi

# Check arguments (1 required, 2 optional)
if [[ $# -lt 1 || $# -gt 2 ]]; then
  echo "❌ Error: Wrong number of arguments." >&2
  print_help >&2
  exit 1
fi

CONNECTION_FILE="$1"
PASSWORD_FILE="${2:-}"

[[ -f "$CONNECTION_FILE" ]] || { echo "Error: $CONNECTION_FILE not found"; exit 1; }

# --- Check dependencies ---
command -v openssl >/dev/null 2>&1 || { echo "Error: openssl not found"; exit 1; }

if [[ -n "$PASSWORD_FILE" ]]; then
  [[ -f "$PASSWORD_FILE" ]] || { echo "Error: Password file $PASSWORD_FILE not found"; exit 1; }

    echo "🔐 Decrypting $CONNECTION_FILE using password from $PASSWORD_FILE ..."

    # --- Read password ---
    PASSWORD="$(<"$PASSWORD_FILE")"

    # --- Decrypt to temporary file ---
    TMP_DECRYPTED="$(mktemp /tmp/connection_decrypted.XXXXXX)"
    trap 'rm -f "$TMP_DECRYPTED"' EXIT

    # Attempt decryption with PBKDF2 + iterations (used by make_connection.sh)
    if openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 -in "$CONNECTION_FILE" -out "$TMP_DECRYPTED" -pass pass:"$PASSWORD" 2>/dev/null; then
    :
    else
    echo "⚠️  PBKDF2 decryption failed — trying fallback (older format)..."
    openssl enc -d -aes-256-cbc -in "$CONNECTION_FILE" -out "$TMP_DECRYPTED" -pass pass:"$PASSWORD"
    fi

    # --- Load variables ---
    set -a
    # shellcheck disable=SC1090
    source "$TMP_DECRYPTED"
    set +a

    # Remove temporary decrypted file
    rm -f "$TMP_DECRYPTED"

else
    echo "ℹ️ No password file provided — assuming $CONNECTION_FILE is plaintext."
    # --- Load variables directly ---
    set -a
    # shellcheck disable=SC1090
    source "$CONNECTION_FILE"
    set +a
fi

# --- Create temporary files for sensitive values ---
SWARM_DIR="$(mktemp -d /tmp/ipfs_swarm_key.XXXXXX)"
CLUSTER_SECRET_DIR="$(mktemp -d /tmp/ipfs_cluster_secret.XXXXXX)"

SWARM_KEY_PATH="${SWARM_DIR}/swarm.key"
CLUSTER_SECRET_PATH="${CLUSTER_SECRET_DIR}/cluster_secret.txt"

# Write values to files
printf '%s\n' "${IPFS_SWARM_KEY_}" > "$SWARM_KEY_PATH"
printf '%s\n' "${IPFS_CLUSTER_SECRET}" > "$CLUSTER_SECRET_PATH"

chmod 600 "$SWARM_KEY_PATH" "$CLUSTER_SECRET_PATH"

# Export directories for later use
export SWARM_KEY_DIR="$SWARM_DIR"
export CLUSTER_SECRET_DIR="$CLUSTER_SECRET_DIR"

# --- Summary ---
echo "✅ Decryption successful. Environment variables loaded."
echo
echo "🔑 Temporary files created:"
echo "  SWARM_KEY_DIR        = $SWARM_KEY_DIR"
echo "  CLUSTER_SECRET_DIR   = $CLUSTER_SECRET_DIR"
echo
echo "Variables in memory:"
echo "  IP=${IP:-}"
echo "  IPFS_ID=${IPFS_ID:-}"
echo "  IPFS_CLUSTER_ID=${IPFS_CLUSTER_ID:-}"
echo
echo "Sensitive contents written to temp files (not printed)."
echo

# Configure the connection variables in the right places
# Using connectPeer-manually.sh to insert the values
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "${SCRIPT_DIR}/connectPeer-manually.sh" \
  "${IP:-}" \
  "${IPFS_ID:-}" \
  "${IPFS_CLUSTER_ID:-}" \
  "ipfs0" \
  "cluster0" \
  "${SWARM_KEY_PATH:-}" \
  "${CLUSTER_SECRET_PATH:-}"

# --- Cleanup temporary sensitive files ---
echo
echo "🧹 Cleaning up temporary sensitive files..."
rm -rf "$SWARM_KEY_DIR" "$CLUSTER_SECRET_DIR"
echo "✅ Cleanup complete."
