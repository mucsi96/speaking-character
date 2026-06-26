#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
POD_NAME="speaking-character-test"
HEALTH_URL="http://localhost:8080/health"
MAX_WAIT=120

if [ "${SKIP_BUILD:-}" = "1" ]; then
  echo "Skipping image build (SKIP_BUILD=1)..."
else
  echo "Building container image..."
  podman build -t localhost/speaking-character:test "$PROJECT_DIR"
fi

echo "Cleaning up existing pod..."
podman kube down "$PROJECT_DIR/test/test-pod.yaml" 2>/dev/null || true

echo "Starting pod..."
podman kube play "$PROJECT_DIR/test/test-pod.yaml"

echo "Waiting for the server to become healthy..."
ELAPSED=0
while true; do
  if [ "$ELAPSED" -ge "$MAX_WAIT" ]; then
    echo "Timeout waiting for $POD_NAME to become healthy"
    podman logs "$POD_NAME-speaking-character" 2>&1 | tail -30 || true
    exit 1
  fi
  if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
    echo "Server is healthy!"
    break
  fi
  sleep 2
  ELAPSED=$((ELAPSED + 2))
done

echo "Service is ready at $HEALTH_URL"
