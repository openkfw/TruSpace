#!/bin/bash

RESPONSE=$(curl -X GET http://localhost:9094/pins)
#RESPONSE=$(curl -X POST http://localhost:5001/api/v0/pin/ls)

#saved file under a hash
echo "Pins: $RESPONSE"

# count number of lines in the response
echo "Number of lines: $(echo "$RESPONSE" | wc -l)"
