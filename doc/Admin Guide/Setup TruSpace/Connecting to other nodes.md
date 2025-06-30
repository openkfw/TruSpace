# Connecting to other IPFS nodes

To connect TruSpace to other IPFS nodes, you need to ensure that the IPFS cluster is properly configured and that the necessary ports are open for communication. This allows TruSpace to sync data with other nodes in the network.

To connect another node, it needs to be added to the cluster:

1. Ensure that the IPFS cluster is running and accessible.
2. Enter the configuration file for the cluster node:
   ```bash
   nano ~/truspace/volumes/cluster0/service.json
   ```
3. In the `service.json` file, locate the `peer_addresses` field and add the address of the peer node you want to connect to. It should look something like this:
   ```json
   {
     "peer_addresses": ["http://<peer-node-ip>:9096"]
   }
   ```
4. Save the changes and exit the editor.
5. Restart the cluster container to apply the changes:
   ```bash
   docker-compose restart cluster0
   ```
6. Log in to the cluster container using:
   ```bash
   docker exec -it cluster0 sh
   ```
7. Execute the following command to check if the peer has been added successfully:
   ```bash
    ipfs-cluster-ctl peers ls
   ```
   The output should show the cluster0 peer and indicate that it sees _1_ other peer, confirming that the connection was successful.
