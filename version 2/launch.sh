#!/usr/bin/env bash
# Starts the Express API (port 5000) and the Vite client (port 3000) together.
# Ctrl+C stops both.
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Install dependencies on first run
for dir in server client; do
    if [ ! -d "$ROOT/$dir/node_modules" ]; then
        echo "Installing $dir dependencies..."
        (cd "$ROOT/$dir" && npm install)
    fi
done

cleanup() {
    echo
    echo "Shutting down..."
    kill $SERVER_PID $CLIENT_PID 2>/dev/null
    wait 2>/dev/null
}
trap cleanup EXIT
trap 'exit 130' INT TERM

(cd "$ROOT/server" && npm start) &
SERVER_PID=$!

(cd "$ROOT/client" && npm run dev) &
CLIENT_PID=$!

echo "API:    http://localhost:5000"
echo "Client: http://localhost:3000"
echo "Press Ctrl+C to stop."

# Exit (and stop the other process) as soon as either one dies
wait -n
