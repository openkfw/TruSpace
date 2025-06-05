#!/bin/bash

VALUES="--values helm/truspace-cluster/values/minimal.yaml"
if [[ $ENABLE_E2ETESTS == "true" ]] 
then
    VALUES="${VALUES} --values helm/truspace-cluster/values/e2e-tests.yaml"
fi

echo "${VALUES}"
