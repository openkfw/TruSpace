#!/usr/bin/env bash
set -euo pipefail

# -------------------------------------------------------
# fetch_connection.sh
# -------------------------------------------------------
# Collects:
#  - Public IP
#  - IPFS PeerID
#  - IPFS swarm.key
#  - Cluster ID & secret
#
# Creates a .connection file and, if an email is provided,
# opens two prefilled email drafts:
#   1) connection info (user must attach file manually)
#   2) password only
#
# If no email is provided, just saves .connection locally
# without password. The user can then inspect the file.
# -------------------------------------------------------

# --- Fixed paths ---
IPFS_CONFIG="./volumes/ipfs0/config"
SWARM_KEY="./volumes/ipfs0/swarm.key"
CLUSTER_IDENTITY="./volumes/cluster0/identity.json"
CLUSTER_CONFIG="./volumes/cluster0/service.json"
OUTFILE=".connection"              # NOTE: this will be encrypted when email is provided
PASSFILE=".connection.password"
TMP_PLAIN="$(mktemp /tmp/connection_plain.XXXXXX)"

# --- Optional email input ---
EMAIL="${1:-}"

# --- Helpers ---
die() { echo "Error: $*" >&2; exit 1; }
check_cmd() { command -v "$1" >/dev/null 2>&1 || die "$1 required but not found"; }

echo "Collecting connection details..."

# Check basic deps
check_cmd jq
check_cmd curl

# --- Fetch values ---
MY_IP="$(curl -fsS https://api.ipify.org || echo '127.0.0.1')"
IPFS_ID="$(jq -r '.Identity.PeerID' "$IPFS_CONFIG" 2>/dev/null || echo '')"
IPFS_SWARM_KEY_="$( [[ -f "$SWARM_KEY" ]] && cat "$SWARM_KEY" || echo '')"
CLUSTER_ID="$(jq -r '.id // empty' "$CLUSTER_IDENTITY" 2>/dev/null || echo '')"
CLUSTER_SECRET="$(jq -r '.cluster.secret' "$CLUSTER_CONFIG" 2>/dev/null || echo '')"

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

# If no email: keep plaintext file at OUTFILE and exit
if [[ -z "$EMAIL" ]]; then
  mv -f "$TMP_PLAIN" "$OUTFILE"
  chmod 600 "$OUTFILE"
  echo
  echo "✅ .connection created (plaintext) at: $(realpath "$OUTFILE")"
  echo "No password generated because no email was provided."
  exit 0
fi

# --- If email provided: encrypt the plaintext file with a generated password ---
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
echo

# --- Prepare email drafts (mailto:) ---
EXPLANATION_BODY="Dear TruSpace colleague,

Attached is an encrypted file named '.connection' containing the connection variables (IP, IPFS IDs, swarm.key, cluster id/secret) to my IPFS and cluster nodes.
This file is encrypted for transport. You will receive the password in a separate email.

HOW TO CONNECT
We have written an extended guide how to connect your nodes using the '.connection' and '.connection.password'. You can read it here:
https://github.com/openkfw/TruSpace/blob/242-disable-autoconf/doc/Admin%20Guide/Setup%20TruSpace/Connecting%20to%20other%20nodes.md

In short:
- Store the '.connection' and '.connection.password' files in your root TruSpace directory.
- Execute the 'connectPeer-automatic.sh' script with the paths of both files as input arguments.
Et voilà, your nodes should connect automatically and appear in your application!

!!!---IMPORTANT IMPORTANT IMPORTANT---!!!
Please attach the file '.connection' to this message before sending. Afterwards you can delete this reminder.
!!!---IMPORTANT IMPORTANT IMPORTANT---!!!
"

PASSWORD_BODY="Dear TruSpace colleague,

This message contains the password for the encrypted '.connection' file.
This password is solely for decrypting the '.connection' file. Keep it private.

!!!---IMPORTANT IMPORTANT IMPORTANT---!!!
Please attach the file '.connection.password' to this message before sending. Afterwards you can delete this reminder.
!!!---IMPORTANT IMPORTANT IMPORTANT---!!!
"

# Build URL-encoded mailto link helper
urlencode() {
  # encode stdin to percent-encoded string
  # Uses jq -sRr @uri which is robust and already available
  jq -s -R -r @uri
}

open_mail() {
  local subject="$1"
  local body="$2"
  local mailto="mailto:${EMAIL}?subject=$(printf '%s' "$subject" | urlencode)&body=$(printf '%s' "$body" | urlencode)"

  echo
  echo "⚠️  Reminder: attach '$(realpath "$OUTFILE")' manually to the first email if your client does not auto-attach."
  echo "Opening draft: $subject"

  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$mailto" >/dev/null 2>&1 &
  elif command -v open >/dev/null 2>&1; then
    open "$mailto" >/dev/null 2>&1 &
  else
    echo "No known opener found. Paste this into your browser/mail client:"
    echo "$mailto"
  fi
}

# Open two drafts
open_mail "Connect to my TruSpace nodes: .connection" "$EXPLANATION_BODY"
sleep 2
open_mail "Connect to my TruSpace nodes: .connection.password" "$PASSWORD_BODY"

echo
echo "✅ Two email drafts opened (or mailto links displayed)."
echo "Files:"
echo "  - Encrypted connection file: $(realpath "$OUTFILE")"
echo "  - Password file:             $(realpath "$PASSFILE")"
echo
echo "Security note: the password's only purpose is to decrypt the .connection file. Remove files when done:"
echo "  rm -f $(realpath "$OUTFILE") $(realpath "$PASSFILE")"
