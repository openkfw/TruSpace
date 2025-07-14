#!/bin/sh

echo "Replacing _NEXT_PUBLIC_API_URL_ placeholder with runtime value: $NEXT_PUBLIC_API_URL"

if [ -z "$NEXT_PUBLIC_API_URL" ]; then
  echo "NEXT_PUBLIC_API_URL is not set"
  exit 1
fi

PLACEHOLDER="_NEXT_PUBLIC_API_URL_"

REPLACEMENT_COUNT=$(find /app/.next -type f -exec grep -o "$PLACEHOLDER" {} \; 2>/dev/null | wc -l)

find /app/.next -type f -exec sed -i "s#${PLACEHOLDER}#${NEXT_PUBLIC_API_URL}#g" {} \;

if [ "$REPLACEMENT_COUNT" -eq 0 ]; then
  echo "No placeholders found to replace in /app/.next. This probably means that _NEXT_PUBLIC_API_URL_ has already been replaced with another value. You might need to use a fresh container."
fi

exec "$@"