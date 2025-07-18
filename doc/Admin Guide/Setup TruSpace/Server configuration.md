# Server configuration

To run TruSpace and make it accessible to users and nodes, you need to configure the server. This includes ensuring the necessary ports are open, setting up firewall rules etc.

## Ports

TruSpace requires the following ports to be open for communication. Ensure the correct direction (inbound/outbound) and protocol (TCP/UDP) are configured in your firewall:

| Port(s) | Protocol  | Direction        | Purpose                                 |
| ------- | --------- | ---------------- | --------------------------------------- |
| 443     | TCP       | Inbound          | HTTPS traffic                           |
| 4001    | TCP & UDP | Inbound/Outbound | IPFS swarm (peer-to-peer communication) |
| 9096    | TCP & UDP | Inbound/Outbound | IPFS cluster management                 |

In the beginning, you also need to open port 80 for the initial setup of the HTTPS certificate. After that, you can redirect HTTP traffic to HTTPS and close port 80 if desired (currently, port 80 then redirects to 404 page).

| Port(s) | Protocol | Direction | Purpose      |
| ------- | -------- | --------- | ------------ |
| 80      | TCP      | Inbound   | HTTP traffic |

Some ports which are needed for external access are mapped to the subdomains using `nginx`:
| Port(s) | Protocol | Purpose |
| ------- | -------- | ----------------------------------- |
| 3000 | TCP | TruSpace UI (main web interface) |
| 3333 | TCP | Open Web UI service (AI processing) |
| 8000 | TCP | API service (backend) |

The other ports are used for internal communication between the TruSpace components and may not need to be exposed externally. However, they should be accessible within your network. They include:

| Port(s) | Protocol | Purpose                         |
| ------- | -------- | ------------------------------- |
| 5001    | TCP      | IPFS API                        |
| 6831    | UDP      | Jaeger agent endpoint (tracing) |
| 8080    | TCP      | IPFS HTTP Gateway               |
| 8888    | TCP      | Prometheus endpoint (metrics)   |
| 9094    | TCP      | IPFS cluster management         |
| 9095    | TCP      | IPFS cluster management         |
| 9097    | TCP      | IPFS cluster management         |

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
