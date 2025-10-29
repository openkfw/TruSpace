#!/bin/sh
set -e

# Read input arguments
SWARM_PORT=$1
IPFS_API_PORT=$2
IPFS_GATEWAY_PORT=$3

if [ ! -f /data/ipfs/config ]; then
    echo "Initializing IPFS repository..."
    ipfs init
fi

# Generate a random swarm.key if it doesn't exist
SWARM_KEY_PATH="/data/ipfs/swarm.key"
if [ ! -f "$SWARM_KEY_PATH" ]; then
    echo "Generating random swarm.key..."
    if command -v ipfs-swarm-key-gen >/dev/null 2>&1; then
        ipfs-swarm-key-gen > "$SWARM_KEY_PATH"
    else
        echo "/key/swarm/psk/1.0.0/" > "$SWARM_KEY_PATH"
        echo "/base16/" >> "$SWARM_KEY_PATH"
        head -c 32 /dev/urandom | hexdump -v -e '/1 "%02x"' >> "$SWARM_KEY_PATH"
        echo "" >> "$SWARM_KEY_PATH"
    fi
    chmod 600 "$SWARM_KEY_PATH"
fi

echo "Applying IPFS config patches..."

# Disable AutoConf completely
ipfs config --json AutoConf.Enabled false

# Fix private network settings
ipfs config Routing.Type dht
ipfs config --json AutoTLS.Enabled false
ipfs config --json Swarm.Transports.Network '{"Websocket": false}'

# Replace 'auto' entries to remove warnings
ipfs config --json DNS.Resolvers '{}'
ipfs config --json Routing.DelegatedRouters '[]'
ipfs config --json Ipns.DelegatedPublishers '[]'

# Remove all bootstrap addresses
echo "Clearing bootstrap addresses..."
ipfs bootstrap rm --all

# Bind the API and Gateway to the ports specified in the environment variables
echo "Binding API to 0.0.0.0:${IPFS_API_PORT}"
ipfs config Addresses.API "/ip4/0.0.0.0/tcp/${IPFS_API_PORT}"

echo "Binding Gateway to 0.0.0.0:${IPFS_GATEWAY_PORT}"
ipfs config Addresses.Gateway "/ip4/0.0.0.0/tcp/${IPFS_GATEWAY_PORT}"

echo "Starting IPFS daemon..."
exec ipfs daemon --migrate=true --enable-gc