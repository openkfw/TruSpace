#!/bin/sh
set -e

if [ ! -f /data/ipfs/config ]; then
    echo "Initializing IPFS..."
    ipfs init
fi

echo "Clearing default bootstrap nodes..."
ipfs bootstrap rm --all

echo "TODO Adding custom bootstrap nodes"

echo "Starting IPFS daemon..."
exec ipfs daemon --migrate=true