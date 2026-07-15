#!/bin/sh

set -eu

if ! command -v caddy >/dev/null 2>&1; then
  echo "Error: caddy is not installed or not on PATH." >&2
  echo "Run Jekyll only with ./scripts/dev-jekyll-local.sh, or install Caddy to use http://mini.test/." >&2
  exit 1
fi

cleanup() {
  if [ -n "${CADDY_PID:-}" ] && kill -0 "$CADDY_PID" 2>/dev/null; then
    kill "$CADDY_PID"
    wait "$CADDY_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

caddy run --config Caddyfile &
CADDY_PID=$!

sleep 1

if ! kill -0 "$CADDY_PID" 2>/dev/null; then
  echo "Error: Caddy exited before Jekyll started." >&2
  echo "Check that /etc/hosts contains '127.0.0.1 mini.test' and that Caddy is allowed to bind to port 80." >&2
  echo "You can still use http://mini.test:4000/ if mini.test resolves locally, or http://127.0.0.1:4000/ directly." >&2
  exit 1
fi

bundle exec jekyll serve \
  --config _config.yml,_config.local.yml \
  --host 127.0.0.1 \
  --port 4000
