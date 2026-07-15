#!/bin/sh

set -eu

LAN_IP=$(
  ipconfig getifaddr en0 2>/dev/null \
  || ipconfig getifaddr en1 2>/dev/null \
  || ifconfig en0 2>/dev/null | awk '/inet / { print $2; exit }' \
  || ifconfig en1 2>/dev/null | awk '/inet / { print $2; exit }' \
  || true
)

echo "Local preview: http://127.0.0.1:4000/"

if [ -n "$LAN_IP" ]; then
  echo "LAN preview:   http://$LAN_IP:4000/"
else
  echo "LAN preview:   use this Mac's local network IP on port 4000."
fi

bundle exec jekyll serve \
  --config _config.yml \
  --host 0.0.0.0 \
  --port 4000
