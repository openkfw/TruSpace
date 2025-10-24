#!/usr/bin/env bash
set -euo pipefail

# ========= Config =========
CONTAINER_IPFS="${CONTAINER_IPFS:-ipfs0}"
CONTAINER_CLUSTER="${CONTAINER_CLUSTER:-cluster0}"
OUTDIR="${OUTDIR:-health-$(date +%Y%m%d-%H%M%S)}"
DOT_SVG="${DOT_SVG:-cluster.svg}"
DOT_PNG="${DOT_PNG:-cluster.png}"

# If your 'docker' CLI is actually 'podman', set DOCKER=podman
DOCKER="${DOCKER:-docker}"

# ========= Helpers =========
log() { printf "\033[1;34m[health]\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m[warn]\033[0m %s\n" "$*" >&2; }
err() { printf "\033[1;31m[err]\033[0m %s\n" "$*" >&2; }

run_in() {
  # $1 container, $2+ command...
  local c="$1"; shift
  $DOCKER exec "$c" "$@" 2>&1
}

save_cmd() {
  # $1 label, $2 container, $3.. cmd
  local label="$1"; shift
  local c="$1"; shift
  local file="$OUTDIR/$label.txt"
  log "Running [$label] in $c"
  if ! run_in "$c" "$@" | tee "$file" >/dev/null ; then
    warn "Command [$label] failed. See $file"
  fi
}

save_json() {
  # same as save_cmd but .json
  local label="$1"; shift
  local c="$1"; shift
  local file="$OUTDIR/$label.json"
  log "Running [$label] in $c"
  if ! run_in "$c" "$@" | tee "$file" >/dev/null ; then
    warn "Command [$label] failed. See $file"
  fi
}

try_first_available() {
  # try commands until one succeeds; write to file
  # usage: try_first_available <label> <container> -- <cmd1...> ::: <cmd2...> ::: <cmd3...>
  local label="$1"; shift
  local c="$1"; shift
  local file="$OUTDIR/$label.txt"
  log "Trying [$label] variants in $c"
  IFS=$'\n' read -r -d '' -a variants || true
  variants=()
  local cur=""
  while IFS= read -r line; do
    if [[ "$line" == ":::" ]]; then
      variants+=("$cur")
      cur=""
    else
      cur+="${cur:+ }$line"
    fi
  done <<< "$*"
  variants+=("$cur")

  local ok=0
  : > "$file"
  for v in "${variants[@]}"; do
    if [[ -z "$v" ]]; then continue; fi
    log "  -> $v"
    if run_in "$c" bash -lc "$v" | tee "$file" >/dev/null ; then
      ok=1; break
    fi
  done
  if [[ $ok -eq 0 ]]; then
    warn "All [$label] variants failed. See $file"
  fi
}

render_dot_if_possible() {
  local dot="$1"
  if command -v dot >/dev/null 2>&1; then
    log "Rendering DOT -> SVG/PNG (host Graphviz)"
    dot -Tsvg "$dot" -o "$OUTDIR/$DOT_SVG" || warn "dot->svg failed"
    dot -Tpng "$dot" -o "$OUTDIR/$DOT_PNG" || warn "dot->png failed"
  else
    warn "Graphviz 'dot' not found on host; leaving DOT only."
  fi
}

# ========= Start =========
mkdir -p "$OUTDIR"
log "Output directory: $OUTDIR"

# ========= IPFS (Kubo) health =========
# Versions & identity
save_json "ipfs_id"           "$CONTAINER_IPFS" ipfs id
save_cmd  "ipfs_version"      "$CONTAINER_IPFS" ipfs version --all

# Bandwidth / Bitswap / DHT / Repo
save_cmd  "ipfs_stats_bw"     "$CONTAINER_IPFS" ipfs stats bw
#try_first_available "ipfs_bitswap_stat" "$CONTAINER_IPFS" -- \
#  "ipfs stats bitswap" ::: \
#  "ipfs bitswap stat"
save_cmd  "ipfs_stats_dht"    "$CONTAINER_IPFS" ipfs stats dht || true
save_cmd  "ipfs_stats_repo"   "$CONTAINER_IPFS" ipfs stats repo

# Swarm state
save_cmd  "ipfs_swarm_peers"  "$CONTAINER_IPFS" ipfs swarm peers
save_cmd  "ipfs_swarm_addrs"  "$CONTAINER_IPFS" ipfs swarm addrs
save_cmd  "ipfs_swarm_addrs_local" "$CONTAINER_IPFS" ipfs swarm addrs local
save_cmd  "ipfs_bootstrap_list" "$CONTAINER_IPFS" ipfs bootstrap list

# Diagnostics
save_cmd  "ipfs_diag_sys"     "$CONTAINER_IPFS" ipfs diag sys || true
save_cmd  "ipfs_diag_cmds"    "$CONTAINER_IPFS" ipfs diag cmds || true
# Profiles can be heavy; uncomment if needed:
# save_cmd  "ipfs_diag_profile" "$CONTAINER_IPFS" "ipfs diag profile --cpu=30s --heap"

# ========= IPFS Cluster health =========
# Versions & peerset
save_cmd  "cluster_version"   "$CONTAINER_CLUSTER" ipfs-cluster-ctl --version
save_cmd  "cluster_peers_ls"  "$CONTAINER_CLUSTER" ipfs-cluster-ctl peers ls

# Cluster metrics & alerts
save_cmd  "cluster_health_metrics"         "$CONTAINER_CLUSTER" ipfs-cluster-ctl health metrics
save_cmd  "cluster_health_metrics_ping"    "$CONTAINER_CLUSTER" ipfs-cluster-ctl health metrics ping
save_cmd  "cluster_health_metrics_freespace" "$CONTAINER_CLUSTER" ipfs-cluster-ctl health metrics freespace
save_cmd  "cluster_health_alerts"          "$CONTAINER_CLUSTER" ipfs-cluster-ctl health alerts || true

# Pin/status overview
save_cmd  "cluster_status"    "$CONTAINER_CLUSTER" ipfs-cluster-ctl status
save_cmd  "cluster_pins_ls"   "$CONTAINER_CLUSTER" ipfs-cluster-ctl pin ls

# Graph (DOT) + render on host if possible
log "Exporting cluster connectivity graph (DOT)"
DOT_FILE="$OUTDIR/cluster.dot"
if run_in "$CONTAINER_CLUSTER" ipfs-cluster-ctl health graph > "$DOT_FILE" ; then
  render_dot_if_possible "$DOT_FILE"
else
  warn "cluster health graph export failed."
fi

# ========= Summary =========
log "Done."
echo
echo "Artifacts saved in: $OUTDIR"
if [[ -f "$OUTDIR/$DOT_SVG" ]]; then
  echo "Cluster graph: $OUTDIR/$DOT_SVG (and $OUTDIR/$DOT_PNG)"
else
  echo "Cluster graph DOT: $DOT_FILE"
fi