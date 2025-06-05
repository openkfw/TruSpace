#!/bin/sh

# Creates a runtime config file in the writable directory
cat <<EOF > /app/public/runtime/config.js
// This file is auto-generated at container startup
window.RUNTIME_CONFIG = {
  API_URL: "${NEXT_PUBLIC_API_URL:-http://localhost:8000/api}"
};
EOF

echo "Runtime configuration generated with API_URL: ${NEXT_PUBLIC_API_URL:-http://localhost:8000/api}"

exec node server.js