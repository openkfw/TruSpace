# Server configuration

To run TruSpace and make it accessible to users and nodes, you need to configure the server. This includes ensuring the necessary ports are open, setting up firewall rules etc.

## Ports

TruSpace requires the following ports to be open for communication:

- **3000**: The main port for the TruSpace UI
- **3333**: The port for the Open Web UI service, which provides AI processing capabilities
- **4001/5001/8080**: IPFS swarm port for peer-to-peer communication
- **8000**: Backend API port for the TruSpace server
- **9094/9096/9097**: IPFS cluster ports for managing the IPFS cluster

## Firewall Configuration

To ensure that TruSpace can communicate with other nodes and services, you need to configure your firewall to allow traffic on the above ports. The exact steps depend on your operating system and firewall software, but generally, you will need to:

1. Open the firewall configuration tool.
2. Add rules to allow incoming and outgoing traffic on the specified ports.
3. Save the changes and restart the firewall if necessary.
4. Test the configuration by accessing TruSpace from a web browser or using command-line tools like `curl` to check connectivity.
5. Monitor the firewall logs for any blocked connections related to TruSpace and adjust the rules as needed.
6. Ensure that the firewall rules are persistent across reboots, so you don't have to reconfigure them every time the server restarts.

## Reverse Proxy Configuration

If you want to run TruSpace behind a reverse proxy (e.g., Nginx or Apache), you need to configure the reverse proxy to forward requests to the appropriate ports. This is useful for SSL termination, load balancing, and serving multiple applications on the same server.

More on e.g. Nginx configuration can be found in the [installation guides](./Installation.md).
