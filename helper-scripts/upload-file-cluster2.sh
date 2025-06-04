#!/bin/bash

RESPONSE=$(curl -X POST -F "file=@input2.jpg"  "http://127.0.0.1:9194/add?name=input2.jpg&meta-workspaceId=value1&meta-fileId=fghi1234")

# the ipfs cluster returns the hash of the file with a cid key
HASH=$(echo "$RESPONSE" | grep -o '"cid":"[^"]*"' | sed 's/"cid":"\([^"]*\)"/\1/')

# curl -X POST http://localhost:9094/pins/$HASH/metadata -H "Content-Type: application/json" -d '{"workspaceId": "value1","fileId": "abcd1234"}'

#saved file under a hash
echo "The Hash is: $HASH"
