#!/bin/bash
# API Endpoints cURL Examples for Prompt Management with Authentication
# --------------------------------------------------------------------

# Authentication credentials 
EMAIL=""
PASSWORD=""

# Base URL for the API
BASE_URL="http://localhost:8000/api"

CONTENT_TYPE="Content-Type: application/json"

# Cookie jar file to store and use cookies between requests
COOKIE_JAR="cookies.txt"

# Colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Prompt Management API Examples ===${NC}"

# Remove any existing cookie jar
if [ -f "$COOKIE_JAR" ]; then
  rm "$COOKIE_JAR"
fi

# Login to get authentication cookie
echo -e "\n${YELLOW}Logging in to get auth cookie with email: ${EMAIL}...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/users/login" \
  -H "${CONTENT_TYPE}" \
  -d "{
    \"email\": \"${EMAIL}\",
    \"password\": \"${PASSWORD}\"
  }" \
  -c "$COOKIE_JAR")

echo "$LOGIN_RESPONSE" | jq .

# Check if login was successful
if [[ "$LOGIN_RESPONSE" == *"error"* || "$LOGIN_RESPONSE" == *"failure"* ]]; then
  echo -e "\n${RED}Login failed! Exiting.${NC}"
  exit 1
fi

echo -e "\n${GREEN}Login successful! Auth cookie stored in $COOKIE_JAR${NC}"
echo -e "${YELLOW}Cookie details:${NC}"
cat "$COOKIE_JAR"

# 1. Get all prompts
echo -e "\n${GREEN}Getting all prompts...${NC}"
curl -s -X GET "${BASE_URL}/prompts" | jq .

# 2. Create a new prompt
echo -e "\n${GREEN}Creating a new prompt...${NC}"
curl -s -X POST "${BASE_URL}/prompts" \
  -H "${CONTENT_TYPE}" \
  -d '{
    "title": "Caustic commentary",
    "prompt": "Write a very biting and sarcastic summary of a document"
  }' | jq .

# 3. Create another prompt
echo -e "\n${GREEN}Creating another prompt...${NC}"
curl -s -X POST "${BASE_URL}/prompts" \
  -H "${CONTENT_TYPE}" \
  -d '{
    "title": "Trump",
    "prompt": "Summarize a given document in a style of Donald Trump"
  }' | jq .

# 4. Update an existing prompt (PUT endpoint)
echo -e "\n${GREEN}Updating an existing prompt...${NC}"
curl -s -X PUT "${BASE_URL}/prompts/Trump" \
  -H "${CONTENT_TYPE}" \
  -d '{
    "title": "Updated summary",
    "prompt": "Write a joke relating to a summary of a document, and use dark humor, if possible"
  }' | jq .

# 5. Delete a prompt (this endpoint is not implemented in your code yet)
echo -e "\n${GREEN}Deleting a prompt...${NC}"
curl -s -X DELETE "${BASE_URL}/prompts/Trump" | jq .

echo -e "\n${BLUE}=== End of Examples ===${NC}"

# Notes: 
# - '%20' is used to encode spaces in the URL
# - The script assumes you have 'jq' installed for JSON formatting
# - Update BASE_URL if your server runs on a different host/port
# - Some endpoints may return empty arrays ([]) if not fully implemented yet