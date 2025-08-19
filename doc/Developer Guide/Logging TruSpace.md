# Logging in TruSpace

## Logger configuration

As the logger technology, we use Winston. You can find the documentation for Winston [here](https://github.com/winstonjs/winston). The configuration itself is in [backend/src/config/winston.ts](./../../backend/src/config/winston.ts). The log level can be defined through the following environment variable:

```bash
LOG_LEVEL=DEBUG  # DEBUG is the default value
```

Other values include:

- `LOG_LEVEL=INFO`: Less verbose than DEBUG
- `LOG_LEVEL=WARN`: For warning messages
- `LOG_LEVEL=ERROR`: For error messages
- `LOG_LEVEL=NONE`: Disable logging

## Docker logs

To access the logs of a specific Docker container, you can use the following command:

```bash
docker logs <container_id>
```

Replace `<container_id>` with the actual ID or name of the container you want to inspect. You can find the container ID by running:

```bash
docker ps
```

This will list all running containers along with their IDs and names.
