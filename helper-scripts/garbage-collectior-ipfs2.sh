#!/bin/bash

# garbage collection
echo "Collecting garbage"
# curl -X POST http://127.0.0.1:9094/ipfs/gc 
curl -X POST http:///127.0.0.1:5101/api/v0/repo/gc
