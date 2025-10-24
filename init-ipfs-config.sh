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

# Bind the API and Gateway to the ports specified in the environment variables
echo "Binding API to 0.0.0.0:${IPFS_API_PORT}"
ipfs config Addresses.API "/ip4/0.0.0.0/tcp/${IPFS_API_PORT}"

echo "Binding Gateway to 0.0.0.0:${IPFS_GATEWAY_PORT}"
ipfs config Addresses.Gateway "/ip4/0.0.0.0/tcp/${IPFS_GATEWAY_PORT}"

echo "Starting IPFS daemon..."
exec ipfs daemon --migrate=true --enable-gc