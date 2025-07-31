# Connecting to other IPFS nodes

To connect TruSpace to other IPFS nodes, you need to ensure that the IPFS cluster is properly configured and that the necessary ports are open for communication. This allows TruSpace to sync data with other nodes in the network.

To connect another node, it needs to be added to the cluster:

1. Ensure that the IPFS cluster is running and accessible.
2. Enter the configuration file for the cluster node:
   ```bash
   nano ~/truspace/volumes/cluster0/service.json
   ```
3. In the `/volumes/cluster0/service.json` file **of your target node**, locate the `secret` field and copy this into your `.env` file as the variable `CLUSTER_SECRET`:
   ```json
   {
     "secret": "141a2511dae98...e3c47f69d1e12203246f92"
   }
   ```
4. In the `/volumes/cluster0/identity.json` file **of your target node**, copy the value into the field `id`
5. In the `/volumes/cluster0/service.json` file **of your installation**, locate the `peer_addresses` field and add the address of the peer node you want to connect to (if you haven't connected to others, it will be empty). Enter the target node IP address and the node `id` that you retrieved from the target node's `/volumes/cluster0/service.json` file. The format should be:
   ```json
   {
     "peer_addresses": ["/ip4/192.168.1.100/tcp/9096/p2p/target_ID"]
   }
   ```

---

6. Save the changes and exit the editor.
7. Restart the cluster container to apply the changes:
   ```bash
   docker-compose restart cluster0
   ```
8. Log in to the cluster container using:
   ```bash
   docker exec -it cluster0 sh
   ```
9. Execute the following command to check if the peer has been added successfully:

```bash
 ipfs-cluster-ctl peers ls
```

The output should show the cluster0 peer and indicate that it sees _1_ other peer, confirming that the connection was successful.
