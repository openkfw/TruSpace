#!/bin/bash
# bash start-prod.sh
# use vsc extension shell-format to format this file

Help() {
    # Display Help
    echo
    echo "Help"
    echo "This script setups a TruSpace production instance of your choice."
    echo "The Ollama + Open web UI (if enabled) are configured in separate dockerfile"
    echo "The environmental variables can be set in the .env file."
    echo
    echo
    echo "Syntax: bash start-prod.sh [options]"
    echo "Example: bash start-prod.sh"
    echo "Example: bash start-prod.sh --no-ai"
    echo
    echo "options:"
    echo "  --no-ai                         Starts a TruSpace instance without AI containers and functionality."
    echo "  --down                          Shutdown all docker containers"
    echo "  --help                          Print the help section"
    echo
    echo "Default option: full TruSpace instance with all components"
    echo "Recommended docker compose version: >2"
}

orange=$(tput setaf 214)
red=$(tput setaf 196)
colorReset=$(tput sgr0)

# Find correct docker command
dockerCmd=$(which docker)
if [ -z "$dockerCmd" ]; then
    dockerCmd="$1"
fi

echo "INFO: Building, Starting TruSpace for production"

while [ "$1" != "" ]; do
    case $1 in
    -n | --no-ai)
        NO_AI=true
        shift # past argument
        ;;

    -d | --down)
        $dockerCmd compose -p truspace-production down
        exit 1
        ;;

    -h | --help)
        Help
        exit 1
        ;;

    *) # unknown option
        if [ $1 == $dockerCmd ]; then
            shift
            continue
        fi
        echo "unknown argument: " $1
        echo "Exiting ..."
        exit 1
        shift # past argument
        ;;
    esac
done

# Get the relative path of the script directory
SCRIPT_DIR=$(dirname -- $0)
echo "INFO: Current script directory: $SCRIPT_DIR"

# generate env file if it does not exist
[[ -e $SCRIPT_DIR/.env ]] || cp .env.example $SCRIPT_DIR/.env

source $SCRIPT_DIR/.env

if [ "$NO_AI" = "true" ]; then
    echo "INFO: Starting without AI functionality"
    DISABLE_ALL_AI_FUNCTIONALITY=true
fi

echo "INFO: Starting production environment"

export LUID=$(id -u)
export LGID=$(id -g)

# remove previous docker instances
docker compose -f $SCRIPT_DIR/docker-compose.yml down --remove-orphans

# rebuilds backend
docker compose -f $SCRIPT_DIR/docker-compose.yml build backend
# rebuilds frontend
docker compose -f $SCRIPT_DIR/docker-compose.yml build frontend

# start new instance of docker network
if [ "$DISABLE_ALL_AI_FUNCTIONALITY" = "true" ]; then
    echo "AI functionality is disabled. Starting without 'ollama' and 'webui' service..."
    docker compose -f $SCRIPT_DIR/docker-compose.yml -p truspace-production --env-file $SCRIPT_DIR/.env up -d
else
    docker compose -f $SCRIPT_DIR/docker-compose.yml -p truspace-production -f $SCRIPT_DIR/docker-compose-ai.yml --env-file $SCRIPT_DIR/.env up -d
fi