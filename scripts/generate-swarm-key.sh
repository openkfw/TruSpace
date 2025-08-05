#!/bin/bash

# This script generates a swarm key for a private IPFS network

set -e

KEY_FILE="swarm.key"

# Create header and version
echo "/key/swarm/psk/1.0.0/" > "$KEY_FILE"
echo "/base16/" >> "$KEY_FILE"

# Generate 32-byte (256-bit) random key and encode it as hex
head -c 32 /dev/urandom | xxd -p -c 32 >> "$KEY_FILE"

echo "Swarm key generated and saved to $KEY_FILE"
