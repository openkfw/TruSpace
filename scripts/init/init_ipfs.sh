#!/bin/sh
set -ex

add_ipfs_nodes_peers() {
    if [ -z "$IPFS_NODE_PEERS" ]; then
        echo "No cluster peers configured"
        return
    fi
    
    count=0
    # Save the original IFS - special shell variable that specifies default word separator
    old_IFS="$IFS" 
    # Set ',' as default word separator
    IFS=','
    
    # Process each peer
    for peer in $IPFS_NODE_PEERS; do
        # Trim whitespace
        peer=$(echo "$peer" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        if [ -n "$peer" ]; then
            count=$((count + 1))
            ipfs bootstrap add "$peer"
        fi
    done
    
    # Restore IFS
    IFS="$old_IFS"
    
    echo ""
    echo "Current peers:"
    ipfs bootstrap list
}

ipfs bootstrap rm all
add_ipfs_nodes_peers