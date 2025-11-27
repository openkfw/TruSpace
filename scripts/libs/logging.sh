#!/usr/bin/env bash
# colors.sh - Bash color and logging helpers (Linux best practices)
# Use: source this file in your scripts to get consistent logging functions

# Prevent multiple sourcing
[[ -n "${_COLORS_SH_INCLUDED:-}" ]] && return
_COLORS_SH_INCLUDED=1

# -----------------------------
# ANSI color codes
# -----------------------------
RED="\033[0;31m"
YELLOW="\033[0;33m"
GREEN="\033[0;32m"
CYAN="\033[0;36m"
NC="\033[0m"  # No Color / reset

# -----------------------------
# Logging / output functions
# -----------------------------
echo_success() {
  echo -e "${GREEN}✔ $*${NC}"
}

echo_error() {
    echo -e "${RED}✖ $*${NC}"
}

echo_warn() {
    echo -e "${YELLOW}⚠ $*${NC}"
}

echo_section() {
    echo -e "\n${CYAN}=== $* ===${NC}"
}

echo_info() {
    echo -e "$*"
}

prompt() {
    local message="$1"
    local var="$2"
    read -rp "→ $message" "$var"
}