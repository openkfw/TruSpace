# SMTP CA Certificate

Place your SMTP server's CA certificate here as `ca.crt` to resolve TLS
"unknown issuer" errors when connecting to a mail server that uses a
self-signed or privately-issued certificate.

**Steps:**

1. Export the CA certificate from your mail server (PEM format, `.crt`).
2. Copy it to this directory in `volumes/general/smtp/` as `ca.crt`.
3. Set `USE_STORED_CERTIFICATE=true` in your `.env` file.
4. Restart the backend container.

The file is mounted into the backend container at `/app/smtp/ca.crt` (read-only).