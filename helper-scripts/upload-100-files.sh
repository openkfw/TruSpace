#!/bin/bash

# loop 100 times
for i in {1..100}
do
  # upload file
  echo "Uploading file $i"
  sh upload-file-cluster-random.sh
done

echo "Done uploading 1000 files"
