#!/bin/bash

RESPONSE=$(curl -X GET http://localhost:9094/pins | grep '"type":"workspace"')

# get only CIDs from the response
CIDS=$(echo "$RESPONSE" | grep -o '"cid":"[^"]*"' | sed 's/"cid":"\([^"]*\)"/\1/')

# unpin all CIDs
for CID in $CIDS
do
  echo "Unpinning $CID"
  RESPONSE=$(curl -X DELETE http://localhost:9094/pins/$CID)

  echo "Unpinning response: $RESPONSE"
done

