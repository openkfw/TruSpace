#!/bin/sh
set -e

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

echo "Starting IPFS daemon..."
exec ipfs daemon --migrate=true --enable-gc