#!/bin/bash

RESPONSE=$(curl -X POST -F "file=@input.png"  "http://127.0.0.1:9094/add?name=input.png&meta-key1=val1&meta-key2=val2")

# the ipfs cluster returns the hash of the file with a cid key
HASH=$(echo "$RESPONSE" | grep -o '"cid":"[^"]*"' | sed 's/"cid":"\([^"]*\)"/\1/')

# curl -X POST http://localhost:9094/pins/$HASH/metadata -H "Content-Type: application/json" -d '{"key1": "value1"}'

#saved file under a hash
echo "The Hash is: $HASH"

#use the IPFS gateway to retrieve the file
echo "Retrieving the file $HASH"
curl -X GET "http://127.0.0.1:8080/ipfs/$HASH" --output output.png

# now let's try to delete the file again
# not sure if repliation needs some time?

echo "Deleting / unpinning the file $HASH"
#curl -X DELETE "http://127.0.0.1:9094/pins/$HASH" 

# garbage collection
echo "Collecting garbage"
curl -X POST http://127.0.0.1:9094/ipfs/gc 

# so anything left?
echo "Is the file still there?"
#curl -X GET "http://127.0.0.1:8080/ipfs/$HASH" 
curl -X GET "http://127.0.0.1:9094/pins" | grep input.png

