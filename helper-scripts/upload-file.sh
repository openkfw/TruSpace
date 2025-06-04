#!/bin/bash

RESPONSE=$(curl -X POST -F "file=@input3.png"  "http://127.0.0.1:5001/api/v0/add?pin=true")

# the ipfs cluster returns the hash of the file with a cid key
HASH=$(echo "$RESPONSE" | grep -o '"Hash":"[^"]*"' | sed 's/"Hash":"\([^"]*\)"/\1/')

# curl -X POST http://localhost:9094/pins/$HASH/metadata -H "Content-Type: application/json" -d '{"workspaceId": "value1","fileId": "abcd1234"}'

#saved file under a hash
echo "The Hash is: $HASH"
echo "The Response is: $RESPONSE"