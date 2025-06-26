# 🌐 Environment Variables

This document provides a detailed overview of the environment variables used to configure and run this project. These variables support modularity, customization, and a smoother deployment process across development, staging, and production environments.

---

## 🌐 Frontend Configuration

| Variable              | Description                                                                            | Default Value                                          | Required |
| --------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------ | -------- |
| `NEXT_PUBLIC_API_URL` | Public-facing URL for the frontend to reach the backend API. Should include /api path. | [http://localhost:8000/api](http://localhost:8000/api) | true     |

---

## ⚙️ Backend Configuration

| Variable                               | Description                                                                                                        | Default Value         | Required |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------- | -------- |
| `API_PORT`                             | Port on which the backend API server listens.                                                                      | 8000                  | true     |
| `DATABASE_PATH`                        | Path to the SQLite database file which stores user credentials and other sensitive data that is not decentralized. | /app/data/truspace.db | true     |
| `LOG_LEVEL`                            | Logging verbosity (`DEBUG`, `INFO`, `WARNING`, `ERROR`). Use `DEBUG` during development for detailed logs.         | DEBUG                 | true     |
| `CONTENT_SECURITY_POLICY_DEFAULT_URLS` | Comma-separated list of default-src URLs for the Content Security Policy.                                          |                       | false    |
| `CONTENT_SECURITY_POLICY_IMG_URLS`     | Comma-separated list of img-src URLs for the Content Security Policy.                                              |                       | false    |
| `CONTENT_SECURITY_POLICY_FRAME_URLS`   | Comma-separated list of frame-src URLs for the Content Security Policy.                                            |                       | false    |
| `CONTENT_SECURITY_POLICY_SCRIPT_URLS`  | Comma-separated list of script-src URLs for the Content Security Policy.                                           |                       | false    |
| `CONTENT_SECURITY_POLICY_WORKER_URLS`  | Comma-separated list of worker-src URLs for the Content Security Policy.                                           |                       | false    |
| `RATE_LIMIT_PER_MINUTE`                | Maximum number of requests allowed per minute per IP address.                                                      | 200                   | false    |
| `REGISTER_USERS_AS_INACTIVE`           | If set to "true", users are registered as inactive and must be activated using confirmation email                  | false                 | false    |
| `SMTP_HOST`                            | SMTP server address                                                                                                |                       | false    |
| `SMTP_USER`                            | SMTP server user                                                                                                   |                       | false    |
| `SMTP_PASSWORD`                        | SMTP server password                                                                                               |                       | false    |
| `SMTP_PORT`                            | SMTP server port                                                                                                   |                       | false    |
| `SMTP_SSL`                             | SMTP server secure access                                                                                          |                       | false    |
| `EMAIL_SENDER`                         | email address that appears as a sender in notification emails                                                      |                       | false    |
| `NODE_ENV`                             | Specifies the environment (`development`, `production`) in which the application is running.                       | production            | true     |

---

## 🔗 IPFS & Cluster Configuration

### General

| Variable                                   | Description                                                                       | Default Value                                                    | Required |
| ------------------------------------------ | --------------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------- |
| `START_PRIVATE_NETWORK`                    | Option to allow or disable connection to public IPFS nodes                        | true                                                             | true     |
| `SWARM_KEY_SECRET`                         | If `START_PRIVATE_NETWORK` is "true" then swarm key secret is required.           |                                                                  | false    |
| `IPFS_CLUSTER_HOST`                        | Address of the IPFS Cluster REST API.                                             | [http://cluster0:9094](http://cluster0:9094)                     | true     |
| `IPFS_PINSVC_HOST`                         | Address of the IPFS pinning service API.                                          | [http://cluster0:9097](http://cluster0:9097)                     | true     |
| `IPFS_GATEWAY_HOST`                        | Address of the IPFS gateway (used to fetch content).                              | [http://ipfs0:8080](http://ipfs0:8080)                           | true     |
| `CLUSTER_SECRET`                           | Shared secret for cluster peer authentication. Must be the same across all peers. | c141a2511dae98dde9a8606a0c259d362c7449b12ce3c47f69d1e12203246f92 | true     |
| `CLUSTER_MONITORPINGINTERVAL`              | Interval between cluster health checks (e.g., "2s").                              | "2s"                                                             | false    |
| `CLUSTER_RESTAPI_HTTPLISTENMULTIADDRESS`   | Multiaddress for the cluster REST API to bind to.                                 | /ip4/0.0.0.0/tcp/9094                                            | true     |
| `CLUSTER_PINSVCAPI_HTTPLISTENMULTIADDRESS` | Multiaddress for the pinning service API.                                         | /ip4/0.0.0.0/tcp/9097                                            | true     |
| `CLUSTER_SWARM_PORT`                       | Port for peer-to-peer swarm communication.                                        | 9096                                                             | true     |
| `OPEN_API_PORT`                            | Port used by the IPFS Cluster REST API.                                           | 9094                                                             | true     |
| `PINNING_SERVICE_PORT`                     | Port used by the pinning service API.                                             | 9097                                                             | true     |
| `CLUSTER_PEERS`                            | Comma separated multiaddresses of cluster peers                                   |                                                                  | false    |

### Cluster 0

| Variable                              | Description                                                | Default Value        | Required |
| ------------------------------------- | ---------------------------------------------------------- | -------------------- | -------- |
| `CLUSTER_PEERNAME_0`                  | Human-readable name for the first cluster peer.            | cluster0             | true     |
| `CLUSTER_IPFSHTTP_NODEMULTIADDRESS_0` | Multiaddress of the first peer's IPFS daemon.              | /dns4/ipfs0/tcp/5001 | true     |
| `CLUSTER_CRDT_TRUSTEDPEERS_0`         | CRDT trusted peers for cluster consensus. "\*" allows all. | "\*"                 | true     |

### Cluster 1

| Variable                              | Description                                    | Default Value        | Required |
| ------------------------------------- | ---------------------------------------------- | -------------------- | -------- |
| `CLUSTER_PEERNAME_1`                  | Name for the second cluster peer.              | cluster1             | true     |
| `CLUSTER_IPFSHTTP_NODEMULTIADDRESS_1` | Multiaddress of the second peer's IPFS daemon. | /dns4/ipfs1/tcp/5001 | true     |
| `CLUSTER_CRDT_TRUSTEDPEERS_1`         | CRDT trusted peers for this peer.              | "\*"                 | true     |
| `OPEN_API_PORT_1`                     | REST API port for cluster 1.                   | 9194                 | true     |
| `PINNING_SERVICE_PORT_1`              | Pinning service port for cluster 1.            | 9197                 | true     |

---

## 📆 IPFS Kubo Node

| Variable            | Description                                             | Default Value | Required |
| ------------------- | ------------------------------------------------------- | ------------- | -------- |
| `SWARM_PORT`        | Swarm port for IPFS peer-to-peer networking.            | 4001          | true     |
| `IPFS_API_PORT`     | IPFS API port (used for pinning and data manipulation). | 5001          | true     |
| `IPFS_GATEWAY_PORT` | IPFS Gateway port (used for fetching files from IPFS).  | 8080          | true     |

---

## 🤨 AI Integration (Ollama)

| Variable                       | Description                                                          | Default Value | Required |
| ------------------------------ | -------------------------------------------------------------------- | ------------- | -------- |
| `OLLAMA_MODEL`                 | Name of the default model to use (e.g., llama3.2:latest).            | gemma3:1b     | true     |
| `AUTO_DOWNLOAD`                | Whether to auto-download model weights on startup.                   | true          | false    |
| `DISABLE_ALL_AI_FUNCTIONALITY` | Set to true to disable AI features. Useful for limited environments. | false         | false    |

---

## 🧑‍💼 OpenWebUI Configuration

| Variable               | Description                                                        | Default Value                             | Required                     |
| ---------------------- | ------------------------------------------------------------------ | ----------------------------------------- | ---------------------------- |
| `OPENWEBUI_HOST`       | URL of the OpenWebUI instance.                                     | [http://webui:8080](http://webui:8080)    | true                         |
| `OPEN_WEBUI_PORT`      | Port where OpenWebUI listens.                                      | 3333                                      | true                         |
| `ADMIN_USER_EMAIL`     | Default admin user email for the OpenWebUI.                        | [admin@admin.com](mailto:admin@admin.com) | true                         |
| `ADMIN_USER_PASSWORD`  | Default admin password. Change this in production!                 | admin                                     | true                         |
| `WEBUI_SECRET_KEY`     | Secret key for session security. Use a strong value in production. | "t0p-s3cr3t"                              | true                         |
| `OI_CORS_ALLOW_ORIGIN` | Allowed origin for CORS policy                                     | "\*"                                      | no, but strongly recommended |

---

## 🔒 Security Notes

- **Never commit sensitive values** like passwords, secret keys, or API tokens to version control.
- For public repositories, include a `.env.example` file without actual secrets.
- Ensure secret values are securely managed in deployment pipelines or container orchestration environments.
