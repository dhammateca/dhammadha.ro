#!/usr/bin/env bash

# Print front-matter-ready MP3 metadata. This is a local authoring helper and
# is never run by Jekyll or GitHub Pages.
set -euo pipefail

if ! command -v ffprobe >/dev/null 2>&1; then
  echo "ffprobe is required (install FFmpeg to use this helper)." >&2
  exit 1
fi

if [ "$#" -eq 0 ]; then
  echo "Usage: $0 assets/audio/dhammapada/01/001.mp3 [...]" >&2
  exit 1
fi

for audio_path in "$@"; do
  if [ ! -f "$audio_path" ]; then
    echo "Not a file: $audio_path" >&2
    exit 1
  fi

  audio_length=$(stat -f '%z' "$audio_path")
  duration_seconds=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$audio_path")
  audio_duration=$(awk -v seconds="$duration_seconds" 'BEGIN {
    seconds = int(seconds + 0.5)
    printf "%02d:%02d:%02d", seconds / 3600, (seconds % 3600) / 60, seconds % 60
  }')

  printf '%s\n' "$audio_path"
  printf 'audio_length: %s\n' "$audio_length"
  printf 'audio_duration: "%s"\n' "$audio_duration"
done
