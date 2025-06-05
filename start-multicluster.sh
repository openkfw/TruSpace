#!/bin/bash

SCRIPT_DIR=$(dirname -- $0)

# generate env file if it does not exist
[[ -e .env ]] || cp .env.example .env
[[ -e .env-multicluster ]] || cp .env-multicluster.example .env-multicluster

source $SCRIPT_DIR/.env
source $SCRIPT_DIR/.env-multicluster
echo "INFO: Starting multicluster environment"
echo "INFO: Current script directory: $SCRIPT_DIR"



echo "INFO: Starting dev environment"

export LUID=$(id -u)
export LGID=$(id -g)

# remove previous docker instances
docker compose down --remove-orphans



# start new instance of docker network
if [ "$DISABLE_ALL_AI_FUNCTIONALITY" = "true" ]; then
    echo "AI functionality is disabled. Starting without 'ollama' and 'webui' service..."
    docker compose -f docker-compose-multicluster.yml --env-file $SCRIPT_DIR/.env --env-file $SCRIPT_DIR/.env-multicluster up -d
else
    docker compose -f docker-compose-multicluster.yml -f docker-compose-ai.yml --env-file $SCRIPT_DIR/.env --env-file $SCRIPT_DIR/.env-multicluster up -d --build
fi

