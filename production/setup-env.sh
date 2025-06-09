#!/bin/bash

EXAMPLE_FILE="../.env.example"
ENV_FILE=".env"

if [ ! -f "$EXAMPLE_FILE" ]; then
  echo "❌ $EXAMPLE_FILE not found!"
  exit 1
fi

# Use indexed arrays for Bash 3 compatibility
CURRENT_ENV_KEYS=()
CURRENT_ENV_VALUES=()

# Load current values from existing .env file, if any
if [[ -f "$ENV_FILE" ]]; then
  while IFS='=' read -r key value; do
    [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue
    CURRENT_ENV_KEYS+=("$key")
    CURRENT_ENV_VALUES+=("$value")
  done < "$ENV_FILE"
fi


echo "🧙 Welcome to the .env setup wizard"
echo "----------------------------------"
echo "This wizard will help you configure your environment variables."
echo

# Buffer for new env content
ENV_CONTENT=""

# Read .env.example line-by-line
while IFS= read -r line || [ -n "$line" ]; do
  # Preserve comments and blank lines
  if [[ "$line" =~ ^#.*$ || -z "$line" ]]; then
    COMMENT="${line#\# }"
    COMMENT="${COMMENT%\"}"
    COMMENT="${COMMENT#\"}"
    ENV_CONTENT+="$line"$'\n'
    continue
  fi

  # Match variable line
  if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=?(.*)$ ]]; then
    VAR_NAME="${BASH_REMATCH[1]}"
    DEFAULT_VALUE="${BASH_REMATCH[2]}"
    DEFAULT_VALUE="${DEFAULT_VALUE%\"}"
    DEFAULT_VALUE="${DEFAULT_VALUE#\"}"

    # Lookup current value for VAR_NAME
    CURRENT_VALUE=""
    for i in "${!CURRENT_ENV_KEYS[@]}"; do
      if [[ "${CURRENT_ENV_KEYS[$i]}" == "$VAR_NAME" ]]; then
        CURRENT_VALUE="${CURRENT_ENV_VALUES[$i]}"
        break
      fi
    done
    PROMPT_VALUE="${CURRENT_VALUE:-$DEFAULT_VALUE}"
    PROMPT_VALUE="${PROMPT_VALUE%\"}"
    PROMPT_VALUE="${PROMPT_VALUE#\"}"

    echo "🔍 Found value: $PROMPT_VALUE"

    echo
    echo "🔧 Setting variable: $VAR_NAME"
    echo "   $COMMENT"
    echo "💡 Press Enter to keep current/default: '$PROMPT_VALUE'"

    # Extract regex from comment if present (format: regex:/.../)
    REGEX_PATTERN=""
    if [[ "$COMMENT" =~ regex:/([^/]*)/ ]]; then
      REGEX_PATTERN="${BASH_REMATCH[1]}"
    fi
    
    # Loop for input and validation
    while true; do
      printf "> $VAR_NAME = " > /dev/tty
      read USER_INPUT < /dev/tty
      FINAL_VALUE="${USER_INPUT:-$PROMPT_VALUE}"

      # Validate if regex is present
      if [[ -n "$REGEX_PATTERN" ]]; then
        if ! [[ "$FINAL_VALUE" =~ $REGEX_PATTERN ]]; then
          echo "❌ Input does not match required regex pattern: /$REGEX_PATTERN/" > /dev/tty
          continue
        fi
      fi

      # Wrap value in quotes if it contains characters other than just numbers and letters
      if [[ ! "$FINAL_VALUE" =~ ^[A-Za-z0-9]+$ ]]; then
        FINAL_VALUE="\"$FINAL_VALUE\""
      fi
      break
    done

    ENV_CONTENT+="$VAR_NAME=$FINAL_VALUE"$'\n'
  else
    ENV_CONTENT+="$line"$'\n'
  fi

  COMMENT=""
done < "$EXAMPLE_FILE"

echo
echo "✅ Writing configuration to $ENV_FILE..."
echo "$ENV_CONTENT" > "$ENV_FILE"
echo "🎉 Done! Your .env file is ready."
