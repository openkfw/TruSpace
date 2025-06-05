#!/bin/bash

RANDOM_STRING=$(openssl rand -base64 24)
RANDOM_STRING_SHORT=$(openssl rand -base64 3)


echo "Uploading random string: $RANDOM_STRING"
# Post the random string to the server
RESPONSE=$(curl -X POST -F "file=$RANDOM_STRING.txt"  "http://127.0.0.1:9094/add?name=$RANDOM_STRING.txt&meta-workspaceId=value1&meta-fileId=abcd1234&meta-rand=$RANDOM_STRING_SHORT")

# the ipfs cluster returns the hash of the file with a cid key
HASH=$(echo "$RESPONSE" | grep -o '"cid":"[^"]*"' | sed 's/"cid":"\([^"]*\)"/\1/')

# curl -X POST http://localhost:9094/pins/$HASH/metadata -H "Content-Type: application/json" -d '{"workspaceId": "value1","fileId": "abcd1234"}'

#saved file under a hash
echo "The Hash is: $HASH"

# delete file
rm "$RANDOM_STRING.txt"