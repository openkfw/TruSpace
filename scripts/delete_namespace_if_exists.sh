#!/bin/bash

ns=`kubectl get namespace $1 --no-headers --output=go-template={{.metadata.name}} 2>/dev/null`
if [ -z "${ns}" ]; then
    echo "Namespace $1 not found."
else
    echo "Namespace $1 found, starting cleanup first."
    echo "Deleting namespace..."
    kubectl delete ns $1
fi