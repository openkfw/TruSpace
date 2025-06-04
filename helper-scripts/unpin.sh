#!/bin/bash

CID=$1
if [ -z "$CID" ]; then
  echo "Usage: sh $0 <CID>"
  exit 1
fi

# RESPONSE=$(curl -X DELETE http://localhost:9094/pins/$CID)
RESPONSE=$(curl -X POST http://localhost:5001/api/v0/pin/rm?arg=$CID)

#saved file under a hash
echo "Unpinning response: $RESPONSE"
