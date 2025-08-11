# Debugging tips

To debug TruSpace, you can follow these steps:

- **Make sure everything is running**: Check if all the required services are running. You can use the command `docker ps` to see the status of your containers. If any container is not running, you can start it using `docker start <container_name>`.
- **Check logs**: Use the command `docker logs <container_name>` to view the logs of a specific container. This can help you identify any errors or issues that may be occurring.
- **Inspect configuration files**: Ensure that your configuration files (like `.env` and `service.json`) are correctly set up. Look for any typos or incorrect values that might be causing issues.
- **Network connectivity**: If you are having trouble connecting to other nodes, check your network settings. Ensure that the necessary ports are open and that your firewall is not blocking any connections

## Typical troubleshooting cases

### Documents

- **How many documents are in the system?**

  To get the total number of documents and recently added documents, run the following command

  ```bash
  curl http://<your_truspace_domain>/documents/statistics
  ```

- **Which documents are pinned locally?**

  Use the following command to list all documents that are pinned locally on the IPFS node:

  ```bash
  docker exec ipfs0 ipfs pin ls --type=recursive | wc -l
  ```

  You can also use this command on other IPFS nodes in the cluster by replacing `ipfs0` with the name of the desired node.

- **Which documents are pinned in the cluster?**

  Use the following command to list all documents that are pinned in the cluster:

  ```bash
  docker exec cluster0 ipfs-cluster-ctl status | grep Pinned
  ```

  This will show you the status of all pinned documents in the cluster.

- **Are there any pinning errors in the cluster?**

  To check for pinning errors, you can use the following command to list all pinned documents and their status:

  ```bash
  docker exec cluster0 ipfs-cluster-ctl status | grep PIN_ERROR
  ```

  Look for any documents that are not pinned or have an error status.

- **Why are the automatic perspectives not generated?**

  There could be different issues such as with the AI model or the frontend configuration.

  You can check the logs of the `webui`, `frontend` or `truspace-backend` containers for any errors:

  ```bash
  docker logs webui
  docker logs frontend
  docker logs truspace-backend
  ```

- **Why is my document not rendered?**

  Check the `frontend` container logs for any errors related to the document rendering.

  ```bash
  docker logs frontend
  ```

- **How can I delete a document?**

  To delete a document, you can use the following command:

  ```bash
  curl -X DELETE http://<your_truspace_domain>/documents/:docId
  ```

  Make sure to replace `:docId` with the actual ID of the document you want to delete.

### OpenWebUI

- **Why can I not access the chatbot?**

  Check using the status of OpenWebUI and Ollama with the `health` route of the api if the service is running. If it is not, check the logs for any errors. Also ensure that the ports are correctly configured.

  ```bash
  curl http://<your_truspace_domain>/health
  ```

  You can also check the logs of the `webui` container for any errors:

  ```bash
  docker logs webui
  ```

### Server

- **Why is my server not running?**

  Check using the status of all services with the `health` route of the api if they are running. Ensure that the services can be accessed via the configured ports. If they are not running, check the logs for any errors.

  ```bash
  curl http://<your_truspace_domain>/health
  ```

  You can also check the logs of the `truspace-backend` container for any errors:

  ```bash
  docker logs truspace-backend
  ```

- **Am I connected to other IPFS peers?**

  Check using the status of the IPFS Cluster, Pinning Service and Gateway with the `health` route of the api if the service is running. If it is not, check the logs for any errors. Also ensure that the ports are correctly configured. Also ensure that your IPFS configuration is correct (e.g. swarm key, cluster secret, etc.).

  ```bash
  curl http://<your_truspace_domain>/health
  ```

  You can also check the logs of the `ipfs0` and `cluster0` containers for any errors:

  ```bash
  docker logs ipfs0
  docker logs cluster0
  ```

### Users

- **How many users are registered?**

  To get the total number of users and recently added users, run the following command

  ```bash
  curl http://<your_truspace_domain>/users/statistics
  ```

- **Which users have access to a certain workspace?**

  Use the following command to list all users that have access to a certain workspace:

  ```bash
  curl http://<your_truspace_domain>/permissions/users-in-workspace/:workspaceId
  ```

  To remove permissions, use the following command:

  ```bash
  curl -X DELETE http://<your_truspace_domain>/permissions/users-in-workspace/remove/:permissionId
  ```

- **Which users have actually contributed to a certain workspace?**

  Use the following command to list all users that have contributed to a certain workspace:

  ```bash
  curl http://<your_truspace_domain>/workspaces/contributors/:wId
  ```

- **Why can my users not login/register?**

  In this case, you have to check the logs of the `truspace-backend` container. If there are any errors, they will be logged there. Also ensure that the database is running and accessible.

  ```bash
  docker logs truspace-backend
  ```

### Workspaces

- **How can I delete a workspace?**

  To delete a workspace, you can use the following command:

  ```bash
  curl -X DELETE http://<your_truspace_domain>/workspaces/:wCID/:wUID
  ```

  Make sure to replace `:wCID` with the actual ID of the workspace you want to delete. Also, replace `:wUID` with the user ID of the user who is deleting the workspace.
