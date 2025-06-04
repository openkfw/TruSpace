#!/bin/bash

RESPONSE=$(curl -X GET http://localhost:9094/pins | grep '"workspaceId":"value1"')
# RESPONSE=$(curl -X GET http://localhost:9095/pin/ls)

#saved file under a hash
echo "Pins: $RESPONSE"
