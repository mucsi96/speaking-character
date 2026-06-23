#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "=== Installing root + workspace dependencies ==="
npm install

echo ""
echo "=== Dependencies installed for client and server ==="
