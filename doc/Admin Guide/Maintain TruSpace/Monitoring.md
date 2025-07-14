# Monitoring

TruSpace has a built-in health check endpoint in the api, routed at `/health`. This endpoint can be used to monitor the different service components of TruSpace. Currently, it checks the following components:

- **Backend**: The main API service of TruSpace.
- **Database**: The database service used by TruSpace.
- **IPFS Cluster**: The IPFS cluster service used for distributed file storage.
- **IPFS Pinning Service**: The service responsible for pinning files in IPFS
- **IPFS Gateway**: The gateway service for accessing IPFS content.
- **Open WebUI**: The web interface for TruSpace.
- **Ollama**: The Ollama service for AI model management.

This endpoint is also used to display the status via the green signals in the top right corner of the TruSpace web interface. You can access the health check endpoint by navigating to `http://<your_truspace_domain>/health` in your web browser or by using a tool like `curl`:

```bash
curl http://<your_truspace_domain>/health
```
