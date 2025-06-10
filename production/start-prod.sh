#!/bin/bash
# This script starts the production environment for Truspace
# Usage: ./start-prod.sh

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
    echo "  --down                          Shutdown all docker containers"
    echo "  --help                          Print the help section"
    echo
    echo "Default option: full TruSpace instance with all components"
    echo "Recommended docker compose version: >2"
}

get_owner_uid() {
    if [ ! -d ./volumes ]; then
        mkdir -p ./volumes
    fi
    if stat --version >/dev/null 2>&1; then
        # GNU stat (Linux)
        stat -c '%u' "$1"
    else
        # BSD stat (macOS)
        stat -f '%u' "$1"
    fi
}

# Find correct docker command
dockerCmd=$(which docker)
if [ -z "$dockerCmd" ]; then
    dockerCmd="$1"
fi

while [ "$1" != "" ]; do
    case $1 in
    -d | --down)
        $dockerCmd compose -p truspace-production down
        exit 1
        ;;

    -h | --help)
        Help
        exit 1
        ;;

    *) # unknown option
        echo "unknown argument: " $1
        echo "Exiting ..."
        exit 1
        shift # past argument
        ;;
    esac
done


SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# Check if .env file exists
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    bash "$SCRIPT_DIR/setup-env.sh"
fi
source "$SCRIPT_DIR/.env"

echo "                          "
echo "                    .     "
echo "                   .'.    "
echo "                   |o|    "
echo "                  .'o'.   "
echo "                  |.-.|   "
echo "                  '   '   "
echo "                   ( )    "
echo "                    )     "
echo "                   ( )    "
echo " "
echo "████████╗██████╗ ██╗   ██╗███████╗██████╗  █████╗  ██████╗███████╗ "
echo "╚══██╔══╝██╔══██╗██║   ██║██╔════╝██╔══██╗██╔══██╗██╔════╝██╔════╝ "
echo "   ██║   ██████╔╝██║   ██║███████╗██████╔╝███████║██║     █████╗   "
echo "   ██║   ██╔══██╗██║   ██║╚════██║██╔═══╝ ██╔══██║██║     ██╔══╝   "
echo "   ██║   ██║  ██║╚██████╔╝███████║██║     ██║  ██║╚██████╗███████╗ "
echo "   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝     ╚═╝  ╚═╝ ╚═════╝╚══════╝ "
echo "                                                                   "

export LUID=$(id -u)
export LGID=$(id -g)

# remove previous docker instances
$dockerCmd compose -f docker-compose.yml -f docker-compose-ai.yml down --remove-orphans

# start new instance of docker network
if [ "$DISABLE_ALL_AI_FUNCTIONALITY" = "true" ]; then
    echo "AI functionality is disabled. Starting without 'ollama' and 'webui' service..."
    $dockerCmd compose -f docker-compose.yml --env-file $SCRIPT_DIR/.env up -d
else
    # Check if OI has a newer image
    $dockerCmd pull ghcr.io/open-webui/open-webui:ollama    
    $dockerCmd compose -f docker-compose.yml -f docker-compose-ai.yml --env-file $SCRIPT_DIR/.env up -d
fi

# Check if root user is owner of the /volumes directory. If so, change ownership to the node user
OWNER_UID=$(get_owner_uid ./volumes)
if [ "$OWNER_UID" = "0" ]; then
    echo "Changing ownership of ./volumes to app user..."
    sudo chown -R 1000:1000 ./volumes
fi

echo "🎉 Done! TruSpace production instance started!"
echo "App is available at ${CORS_ORIGIN:-http://localhost:3000}"
