#!/bin/bash

RESPONSE=$(curl -X GET http://localhost:9094/pins | grep '"rand":"oCcG"' )
# RESPONSE=$(curl -X GET http://localhost:9094/pins?cid=QmbWHowpWreBMcJFddQuJvFkAWtPmmrx1SzUU2miyiX7PD37)

#saved file under a hash
echo "Pins: $RESPONSE"
