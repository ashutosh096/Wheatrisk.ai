#!/bin/bash
# ──────────────────────────────────────────────────────────────
# WheatRisk.ai Dashboard — Quick-start script
# Usage: bash start.sh
# ──────────────────────────────────────────────────────────────

set -e

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║          WheatRisk.ai Dashboard  —  Quick Start       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Check Node
if ! command -v node &> /dev/null; then
  echo "❌  Node.js not found. Install Node.js ≥ 20 from https://nodejs.org"
  exit 1
fi

NODE_VER=$(node -e "process.stdout.write(process.version)" 2>/dev/null)
echo "✅  Node.js $NODE_VER"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
  echo "📦  pnpm not found — installing globally..."
  npm install -g pnpm@latest
fi

PNPM_VER=$(pnpm --version 2>/dev/null)
echo "✅  pnpm $PNPM_VER"

# Install deps (skip if node_modules already present)
if [ ! -d "node_modules" ]; then
  echo ""
  echo "📦  Installing dependencies (this takes ~30s on first run)..."
  pnpm install --ignore-scripts
  echo "✅  Dependencies installed"
fi

echo ""
echo "🚀  Starting API server on http://localhost:5000/api ..."
PORT=5000 BASE_PATH=/api pnpm --filter @workspace/api-server run dev &
API_PID=$!

sleep 2

echo "🌐  Starting frontend on http://localhost:3000 ..."
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/wheatrisk run dev &
FRONTEND_PID=$!

echo ""
echo "════════════════════════════════════════════════════════"
echo "  Dashboard: http://localhost:3000"
echo "  API:       http://localhost:5000/api/healthz"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Press Ctrl+C to stop both servers."

# Trap SIGINT to kill both background processes
trap "echo ''; echo '⏹  Stopping...'; kill $API_PID $FRONTEND_PID 2>/dev/null; exit 0" INT
wait
