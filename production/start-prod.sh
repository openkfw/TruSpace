#!/bin/bash
# This script starts the production environment for TruSpace
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

start_application() {
    add_cluster_peers
    # start new instance of docker network
    if [ "$DISABLE_ALL_AI_FUNCTIONALITY" = "true" ]; then
        echo "AI functionality is disabled. Starting without 'ollama' and 'webui' service..."
        $dockerCmd compose -f docker-compose.yml --env-file $SCRIPT_DIR/.env up -d
    else
        # Check if OI has a newer image
        $dockerCmd pull ghcr.io/open-webui/open-webui:ollama    
        $dockerCmd compose -f docker-compose.yml -f docker-compose-ai.yml --env-file $SCRIPT_DIR/.env up -d
    fi
}

stop_application() {
    $dockerCmd compose -f docker-compose.yml -f docker-compose-ai.yml down --remove-orphans
}

add_cluster_peers() {
    if [ -z "$CLUSTER_PEERS" ]; then
        echo "No cluster peers configured"
        return
    fi

    PEERSTORE_DIR="$SCRIPT_DIR/volumes/cluster0"
    PEERSTORE_FILE="$PEERSTORE_DIR/peerstore"

    echo "Creating directory: $PEERSTORE_DIR"
    mkdir -p "$PEERSTORE_DIR"

    # Clear existing peerstore file
    echo "Creating peerstore file: $PEERSTORE_FILE"
    > "$PEERSTORE_FILE"

    echo "Writing peers to peerstore..."
    count=0

    # Convert comma-separated string to newline-separated and process
    echo "$CLUSTER_PEERS" | tr ',' '\n' | while IFS= read -r peer; do
        # Trim whitespace
        peer=$(echo "$peer" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

        if [ -n "$peer" ]; then
            count=$((count + 1))
            echo "$peer" >> "$PEERSTORE_FILE"
            echo "[$count] $peer"
        fi
    done

    echo ""
    echo "Peerstore file created successfully!"
    echo "Location: $PEERSTORE_FILE"
    echo "Contents:"
    echo "--------"
    cat "$PEERSTORE_FILE"
    echo "--------"
    echo "Total peers: $(wc -l < "$PEERSTORE_FILE")"
    echo ""
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

if [ "$START_PRIVATE_NETWORK" = "true" ] && ! [ "${#SWARM_KEY_SECRET}" -eq 64 ]; then
    echo "❌ Error: SWARM_KEY_SECRET must be a 64-character hexadecimal string."
    echo "Please set a valid SWARM_KEY_SECRET in the .env file."
    exit 1
fi

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
stop_application

start_application

# Check if root user is owner of the /volumes directory. If so, change ownership to the node user
OWNER_UID=$(get_owner_uid ./volumes)
if [ "$OWNER_UID" = "0" ]; then
    echo "Changing ownership of ./volumes to app user..."
    sudo chown -R 1000:1000 ./volumes
fi

# Check if swarm.key exists
if [ ! -f ./volumes/ipfs0/swarm.key ] & [ "$START_PRIVATE_NETWORK" = "true" ]; then
    echo "Creating swarm.key file..."
    echo "/key/swarm/psk/1.0.0/
/base16/
$SWARM_KEY_SECRET" > ./volumes/ipfs0/swarm.key

    echo "
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣤⣤⣤⣄⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⢀⣴⣾⣿⣿⣿⣿⣿⣿⣿⣿⣷⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⣰⣿⣿⣿⠟⠉⠀⠀⠀⠈⠙⠿⣿⣿⣷⡄⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢰⣿⣿⡿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠙⣿⣿⣿⡀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⣸⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⣿⣿⡇⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⡇⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢿⣿⣿⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⣿⣿⡇⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⢠⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⣤⡀⠀⠀⠀⠀
⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⡿⠋⠉⠉⠛⣿⣿⣿⣿⣿⣿⣿⣿⣷⠀⠀⠀⠀
⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⣸⣿⣿⣿⣿⣿⣿⣿⣿⠀⠀⠀⠀
⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⡶⠀⠀⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⠀⠀⠀⠀
⠀⠀⠀⠀⢻⣿⣿⣿⣿⣿⣿⣿⣿⠃⠀⠀⠸⣿⣿⣿⣿⣿⣿⣿⣿⠏⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠙⢿⣿⣿⣿⣿⣿⡏⠀⠀⠀⠀⢻⣿⣿⣿⣿⣿⡿⠃⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠈⠛⢿⣿⣿⣶⣶⣶⣶⣶⣾⣿⣿⠿⠛⠁⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠙⠛⠛⠉⠉⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
    "
    echo "swarm.key created successfully."
    echo "Restarting application in private network..."
    echo ""

    stop_application
    start_application
fi

# Condition for public networks
if [ "$START_PRIVATE_NETWORK" = "false" ]; then
 echo "
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣄⣠⣀⡀⣀⣠⣤⣤⣤⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣄⢠⣠⣼⣿⣿⣿⣟⣿⣿⣿⣿⣿⣿⣿⣿⡿⠋⠀⠀⠀⢠⣤⣦⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠰⢦⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣟⣾⣿⣽⣿⣿⣅⠈⠉⠻⣿⣿⣿⣿⣿⡿⠇⠀⠀⠀⠀⠀⠉⠀⠀⠀⠀⠀⢀⡶⠒⢉⡀⢠⣤⣶⣶⣿⣷⣆⣀⡀⠀⢲⣖⠒⠀⠀⠀⠀⠀⠀⠀
⢀⣤⣾⣶⣦⣤⣤⣶⣿⣿⣿⣿⣿⣿⣽⡿⠻⣷⣀⠀⢻⣿⣿⣿⡿⠟⠀⠀⠀⠀⠀⠀⣤⣶⣶⣤⣀⣀⣬⣷⣦⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣦⣤⣦⣼⣀⠀
⠈⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠛⠓⣿⣿⠟⠁⠘⣿⡟⠁⠀⠘⠛⠁⠀⠀⢠⣾⣿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠏⠙⠁
⠀⠸⠟⠋⠀⠈⠙⣿⣿⣿⣿⣿⣿⣷⣦⡄⣿⣿⣿⣆⠀⠀⠀⠀⠀⠀⠀⠀⣼⣆⢘⣿⣯⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡉⠉⢱⡿⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠘⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⡿⠦⠀⠀⠀⠀⠀⠀⠀⠙⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⡗⠀⠈⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⢻⣿⣿⣿⣿⣿⣿⣿⣿⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⣿⣉⣿⡿⢿⢷⣾⣾⣿⣞⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠋⣠⠟⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣿⣿⣿⠿⠿⣿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣾⣿⣿⣷⣦⣶⣦⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⠈⠛⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠻⣿⣤⡖⠛⠶⠤⡀⠀⠀⠀⠀⠀⠀⠀⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠁⠙⣿⣿⠿⢻⣿⣿⡿⠋⢩⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⠧⣤⣦⣤⣄⡀⠀⠀⠀⠀⠀⠘⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠘⣧⠀⠈⣹⡻⠇⢀⣿⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⣿⣿⣿⣤⣀⡀⠀⠀⠀⠀⠀⠀⠈⢽⣿⣿⣿⣿⣿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠹⣷⣴⣿⣷⢲⣦⣤⡀⢀⡀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢿⣿⣿⣿⣿⣿⣿⠟⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣷⢀⡄⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠂⠛⣆⣤⡜⣟⠋⠙⠂⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⣿⣿⣿⣿⠟⠀⠀⠀⠀⠀⠀⠀⠀⠘⣿⣿⣿⣿⠉⣿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣤⣾⣿⣿⣿⣿⣆⠀⠰⠄⠀⠉⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⣿⣿⡿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⣿⡿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⣿⠿⠿⣿⣿⣿⠇⠀⠀⢀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⡿⠛⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢻⡇⠀⠀⢀⣼⠗⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⠃⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠁⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠒⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
"
echo "Starting TruSpace in public network mode..."
echo "If you want to start a private network, please set START_PRIVATE_NETWORK=true in the .env file."

    if [ -f ./volumes/ipfs0/swarm.key ]; then
        echo "Removing swarm.key file..."
        rm ./volumes/ipfs0/swarm.key
        echo "swarm.key file removed successfully."
        echo "Restarting application in public network mode..."
        stop_application
        start_application
    fi
else
    echo "Starting TruSpace in private network mode..."
    echo "Removing bootstrap nodes for private network..."

    # Wait for IPFS API to be ready
    echo "Waiting for IPFS API to be available..."
    until curl -s http://localhost:5001/api/v0/id > /dev/null 2>&1; do
    echo "Waiting for IPFS API..."
    sleep 2
    done

    # Remove all bootstrap nodes
    echo "Removing bootstrap nodes..."
    curl -X POST "http://localhost:5001/api/v0/bootstrap/rm/all"
fi

echo "🎉 Done! TruSpace production instance started!"
echo "App is available at ${CORS_ORIGIN:-http://localhost:3000}"
