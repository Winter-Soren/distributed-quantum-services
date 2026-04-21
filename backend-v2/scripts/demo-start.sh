#!/usr/bin/env bash
# Local startup script for backend-v2
#
# Ensures key ports are free and optionally clears local runtime files.
# Invoked by `make run` and `make run-clean`.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

ENV_FILE="$PROJECT_ROOT/.env"

read_env_value() {
  local key="$1"
  if [ ! -f "$ENV_FILE" ]; then
    return 0
  fi

  grep -E "^${key}=" "$ENV_FILE" | tail -n 1 | cut -d'=' -f2- | tr -d '\r'
}

extract_tcp_port() {
  local listen_multiaddrs="$1"
  printf '%s' "$listen_multiaddrs" | sed -n 's#.*\/tcp\/\([0-9][0-9]*\).*#\1#p' | head -n 1
}

API_PORT="${QB2_API_PORT:-$(read_env_value QB2_API_PORT)}"
API_PORT="${API_PORT:-8081}"

LISTEN_MULTIADDRS="${QB2_LIBP2P_LISTEN_MULTIADDRS:-$(read_env_value QB2_LIBP2P_LISTEN_MULTIADDRS)}"
LIBP2P_PORT="$(extract_tcp_port "$LISTEN_MULTIADDRS")"
LIBP2P_PORT="${LIBP2P_PORT:-4011}"

PEERSTORE_PATH="${QB2_LIBP2P_PEERSTORE_PATH:-$(read_env_value QB2_LIBP2P_PEERSTORE_PATH)}"
PEERSTORE_PATH="${PEERSTORE_PATH:-./quantum-backend-v2/libp2p/peerstore.sqlite3}"

PEER_LOG_DIR="${QB2_PEER_LOG_DIR:-$(read_env_value QB2_PEER_LOG_DIR)}"
PEER_LOG_DIR="${PEER_LOG_DIR:-./quantum-backend-v2/peer-logs}"

CLEAN_RUN=false
for arg in "$@"; do
  case "$arg" in
    --clean) CLEAN_RUN=true ;;
  esac
done

echo "=== Quantum Backend V2 Startup ==="

echo ""
echo "Checking ports $API_PORT and $LIBP2P_PORT..."
for port in "$API_PORT" "$LIBP2P_PORT"; do
  pid="$(lsof -ti ":$port" 2>/dev/null || true)"
  if [ -n "$pid" ]; then
    echo "  Killing process(es) on port $port (PID: $pid)"
    kill -9 $pid 2>/dev/null || true
  fi
done
sleep 2

for port in "$API_PORT" "$LIBP2P_PORT"; do
  if lsof -ti ":$port" 2>/dev/null; then
    echo "ERROR: Port $port still in use. Stop the process manually and retry."
    exit 1
  fi
done
echo "  All ports free."

if [ "$CLEAN_RUN" = true ]; then
  echo ""
  if [ -f "$PEERSTORE_PATH" ]; then
    echo "Removing peerstore for clean run: $PEERSTORE_PATH"
    rm -f "$PEERSTORE_PATH"
    rm -f "${PEERSTORE_PATH}-shm" "${PEERSTORE_PATH}-wal"
    echo "  Peerstore removed."
  else
    echo "Peerstore not found (already clean): $PEERSTORE_PATH"
  fi

  if [ -d "$PEER_LOG_DIR" ]; then
    echo "Removing peer logs for clean run: $PEER_LOG_DIR"
    rm -rf "$PEER_LOG_DIR"
    echo "  Peer logs removed."
  else
    echo "Peer log directory not found (already clean): $PEER_LOG_DIR"
  fi
fi

echo ""
echo "Starting backend-v2"
echo "  API:    http://127.0.0.1:$API_PORT"
echo "  Health: http://127.0.0.1:$API_PORT/api/v1/health"
echo "  Docs:   http://127.0.0.1:$API_PORT/docs"
echo ""
echo "Press Ctrl+C to stop."
echo ""

if [ -x ".venv/bin/quantum-backend-v2" ]; then
  .venv/bin/quantum-backend-v2 --host 0.0.0.0 --port "$API_PORT"
else
  uv run quantum-backend-v2 --host 0.0.0.0 --port "$API_PORT"
fi
