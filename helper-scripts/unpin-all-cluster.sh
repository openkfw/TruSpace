#!/bin/bash

curl -X POST http://127.0.0.1:9094/ipfs/gc 

RESPONSE=$(curl -X GET http://localhost:9094/pins)

# get only CIDs from the response
CIDS=$(echo "$RESPONSE" | grep -o '"cid":"[^"]*"' | sed 's/"cid":"\([^"]*\)"/\1/')

# unpin all CIDs
for CID in $CIDS
do
  echo "Unpinning $CID"
  RESPONSE=$(curl -X DELETE http://localhost:9094/pins/$CID)

  echo "Unpinning response: $RESPONSE"
done

