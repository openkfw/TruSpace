# Connecting to other IPFS nodes

To connect TruSpace to other IPFS nodes, you need to ensure that the IPFS cluster is properly configured and that the necessary ports are open for communication. This allows TruSpace to sync data with other nodes in the network. The connection requires

- The **IP address(es)** of the target node to connect to
- The **swarm key** to allow the IPFS nodes to connecto to each other without sharing the connection with anyone else
- The **IPFS id** identifies the IPFS node in the network
- The **cluster secret** to allow the IPFS cluster to share the pinning information which files should be shared between the nodes
- The **cluster id** identifies the cluster in the network

We have created a script `connectPeer.sh` that automates the process of connecting to another node (find the script [here](../../../connectPeer.sh)):

```bash
./connectPeer.sh <peer_ip> <ipfs_peer_id> <cluster_peer_id> <ipfs_container_id> <cluster_container_id> [swarm_key_path] [cluster_secret_path]
```

This script adapts the configuration in a few places to setup the IPFS and IPFS Cluster connection. The input arguments are as follows:
| Argument | Description |
|-----------------------|--------------------------------------------------------------|
| peer_ip | IP address of the peer you want to connect to. |
| ipfs_peer_id | The libp2p Peer ID of the target IPFS node. |
| cluster_peer_id | The libp2p Peer ID of the target IPFS-Cluster node. |
| ipfs_container_id | Docker container ID or name for the local IPFS node. |
| cluster_container_id | Docker container ID or name for the IPFS cluster. |
| swarm_key_path | (Optional) Path to a swarm.key file for private IPFS networking. |
| cluster_secret_path | (Optional) Path to a file containing the cluster secret.

<br>
<details>
<summary>To get the peer ip and peer ids, you can use this script</summary>
On the target node, use the following script to obtain relevant identifier values that you need to connect your source node to the target node:

```bash
#!/usr/bin/env bash
set -euo pipefail

# --- Config paths ---
IPFS_CONFIG="./volumes/ipfs0/config"
CLUSTER_IDENTITY="./volumes/cluster0/identity.json"

# --- Fetch values ---
MY_IP="$(curl -fsS https://api.ipify.org)"
IPFS_ID="$(jq -r '.Identity.PeerID' "$IPFS_CONFIG")"
CLUSTER_ID="$(jq -r '.id' "$CLUSTER_IDENTITY")"

# --- Output ---
printf '\n'
printf '🖧  My IP Address:\n'
printf '    %s\n\n' "$MY_IP"

printf '🛰  My IPFS ID:\n'
printf '    %s\n\n' "$IPFS_ID"

printf '📡  My Cluster ID:\n'
printf '    %s\n\n' "$CLUSTER_ID"
```

</details>

### IPFS network connection

- Add IPFS address of target node as bootstrap address. This enables the IPFS node to find and connect to the target node. It is added automatically by the script in the `/volumes/ipfs0/config` file in the `Bootstrap` section. The address looks like this:
  ```
  /ip4/<peer_ip>/tcp/4001/p2p/<ipfs_peer_id>
  ```
- If you have a custom swarm key for your private IPFS network, add the swarm key to the `/volumes/ipfs0/swarm.key` file. This is optional; if no swarm key is provided, the default public IPFS network will be used. You can optionally provide the path of your swarm key file in the script command so it can be copied automatically. The swarm key should look something like this:
  ```
  /key/swarm/psk/1.0.0/
  /base16/
  7c2c973709f5a961b.....8926a65b15477cf5
  ```
- In our script, we also adapt some settings in order for the private networking to work properly.

### IPFS cluster connection

- Add the cluster address of the target node in the `/volumes/cluster0/service.json` file in the `peer_addresses` section (automized in our script). This enables the IPFS Cluster to find and connect to the target node. The address looks like this:
  ```
  /ip4/<peer_ip>/tcp/9096/p2p/<cluster_peer_id>
  ```
- If you have a custom cluster secret for your private IPFS Cluster network, add the secret to the `/volumes/cluster0/service.json` file in the `secret` field. This is optional; if no secret is provided, the default public IPFS Cluster network will be used. You can optionally provide the path of your cluster secret file in the script command so it can be copied automatically.

In our script, all configurations and ideally the keys are adapted automatically. Also, both the IPFS and IPFS cluster containers are restarted automatically to apply the changes. If you were to make the changes manually, make sure to restart both containers after making the changes.

### Verification

To verify that the connection was successful, here are some scripts:

#### Find added peer

For the IPFS node:

```bash
docker exec ipfs0 ipfs swarm peers
```

For the IPFS cluster:

```bash
 ipfs-cluster-ctl peers ls
```

You should see the newly added peer in both lists.

#### Check pinned items

Validate that all files have status `PINNED` and no errors are seen:

```bash
docker exec cluster0 ipfs-cluster-ctl status | grep PIN_ERROR
```

#### Practical check

Finally, if you update a file to a public workspace on any of the nodes, it should be visible "on the other side".
