#!/bin/bash

# RESPONSE=$(curl -X GET http://localhost:9194/pins)
RESPONSE=$(curl -X POST http://localhost:5101/api/v0/pin/ls)

#saved file under a hash
echo "Pins: $RESPONSE"
