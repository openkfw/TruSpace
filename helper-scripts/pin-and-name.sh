#!/bin/bash

CID=$1
NAME=$2
if [ -z "$CID" ]; then
  echo "Usage: sh $0 <CID>"
  exit 1
fi
if [ -z "$CID" ]; then
  NAME="default"
fi

# curl -X POST http://localhost:9094/pins/$HASH/metadata -H "Content-Type: application/json" -d '{"key1": "value1"}'
# RESPONSE=$(curl -X POST http://localhost:9094/pins/$CID)
RESPONSE=$(curl -X POST http://localhost:5001/api/v0/pin/add?arg=$CID&name=$NAME)

#saved file under a hash
echo "Pinning response: $RESPONSE"
