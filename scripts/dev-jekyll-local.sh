#!/bin/sh

set -eu

bundle exec jekyll serve \
  --config _config.yml,_config.local.yml \
  --host 127.0.0.1 \
  --port 4000
