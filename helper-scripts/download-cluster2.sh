#!/bin/bash

CID=$1
if [ -z "$CID" ]; then
  echo "Usage: sh $0 <CID> [output_filename]"
  exit 1
fi
OUTPUT_FILENAME=$2

#if file is not provided, use the default
if [ -z "$OUTPUT_FILENAME" ]; then
  OUTPUT_FILENAME="output.png"
fi

#use the IPFS gateway to retrieve the file
echo "Retrieving the file $CID"
curl -X GET "http://127.0.0.1:8180/ipfs/$CID" --output $OUTPUT_FILENAME


