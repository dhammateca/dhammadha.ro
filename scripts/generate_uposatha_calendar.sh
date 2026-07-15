#!/bin/sh

set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
SPLENDIDMOONS_DIR=${SPLENDIDMOONS_DIR:-"$ROOT_DIR/../splendidmoons"}
FROM_YEAR=${FROM_YEAR:-2025}
TO_YEAR=${TO_YEAR:-2035}

if [ ! -d "$SPLENDIDMOONS_DIR" ]; then
  echo "Missing splendidmoons repository at: $SPLENDIDMOONS_DIR" >&2
  exit 1
fi

mkdir -p "$ROOT_DIR/_data" "$ROOT_DIR/assets/calendars"

cd "$SPLENDIDMOONS_DIR"

poetry run splendidmoons year-events-json \
  "$FROM_YEAR" "$TO_YEAR" \
  "$ROOT_DIR/_data/uposatha.json" \
  --locale ro

poetry run splendidmoons year-events-ical \
  "$FROM_YEAR" "$TO_YEAR" \
  "$ROOT_DIR/assets/calendars/uposatha-ro.ics" \
  --locale ro

echo "Generated Romanian Uposatha calendar data for $FROM_YEAR-$TO_YEAR."
