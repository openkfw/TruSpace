# Server configuration

To run TruSpace and make it accessible to users and nodes, you need to configure the server. This includes ensuring the necessary ports are open, setting up firewall rules etc.

## Ports

TruSpace requires the following ports to be open for communication. Ensure the correct direction (inbound/outbound) and protocol (TCP/UDP) are configured in your firewall:

| Port(s) | Protocol  | Direction        | Purpose                                 |
| ------- | --------- | ---------------- | --------------------------------------- |
| 3000    | TCP       | Inbound/Outbound | TruSpace UI (main web interface)        |
| 3333    | TCP       | Inbound/Outbound | Open Web UI service (AI processing)     |
| 4001    | TCP & UDP | Inbound/Outbound | IPFS swarm (peer-to-peer communication) |
| 5001    | TCP       | Inbound/Outbound | IPFS API                                |
| 6831    | UDP       | Outbound         | Jaeger agent endpoint (tracing)         |
| 8000    | TCP       | Inbound/Outbound | TruSpace backend API                    |
| 8080    | TCP       | Inbound/Outbound | IPFS HTTP Gateway                       |
| 8888    | TCP       | Outbound         | Prometheus endpoint (metrics)           |
| 9094    | TCP       | Inbound/Outbound | IPFS cluster management                 |
| 9095    | TCP       | Inbound/Outbound | IPFS proxy                              |
| 9096    | TCP & UDP | Inbound/Outbound | IPFS cluster management                 |
| 9097    | TCP       | Inbound/Outbound | IPFS cluster management                 |

> **Note:** All listed ports use the TCP protocol. If you have a restrictive firewall, ensure both inbound and outbound rules are set for these ports.

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
