# Dhammadha.ro

## Installation

```
bundle install
npm install
cd semantic
gulp build
```

## Run
```sh
./scripts/dev.sh
```

This serves the site on `0.0.0.0:4000`, so it works both on this Mac at `http://127.0.0.1:4000/` and from other devices on your local network at the printed `http://<your-lan-ip>:4000/` URL.

## Update
```
bundle update
npm update
```

## Uposatha calendar

The site includes a native Romanian Uposatha calendar page at `/calendar-uposatha/`.

Calendar data is generated locally from the sibling `../splendidmoons` repository:

```sh
./scripts/generate_uposatha_calendar.sh
```

This writes:

- `_data/uposatha.json`
- `assets/calendars/uposatha-ro.ics`

## Dhammapada audio

Local recordings use `assets/audio/dhammapada/<chapter>/<verse>.mp3`, with
zero-padded chapter and verse numbers (for example,
`assets/audio/dhammapada/01/001.mp3`). A recording has these metadata fields:

```yaml
audio: /assets/audio/dhammapada/01/001.mp3
audio_length: 323012
audio_duration: "00:00:19"
audio_guid: dhammapada-01-001
```

`audio` may instead be an absolute URL such as
`https://audio.example.org/dhammapada/01/001.mp3`. The audio include uses
`relative_url` for local paths and leaves absolute URLs unchanged. For a
podcast enclosure, capture `{% include audio-absolute-url.html audio=page.audio %}`;
the include uses `absolute_url` for local paths (including `site.url` and
`site.baseurl`) and leaves an external URL unchanged.

The current Dhammapada edition stores one document per chapter, so its
per-verse metadata is in `_data/dhammapada_audio.yml`. Standalone verse pages
can put the same fields directly in front matter. To inspect new local MP3s
without involving the Jekyll build, run:

```sh
./scripts/audio_metadata.sh assets/audio/dhammapada/01/001.mp3
```

The helper requires `ffprobe` from FFmpeg and reports exact bytes plus a
rounded `HH:MM:SS` duration.

## Dhammapada podcast feed

The static podcast feed is published at `/podcast.xml`. It uses the recording
records in `_data/dhammapada_audio.yml`; every entry requires `audio`,
`audio_length`, and `audio_guid`, while `audio_duration` and `date` are
optional. Add an explicit `date` when publishing each recording: once all
published entries have dates, the feed sorts them newest first. Until dates
are supplied, the current recordings remain in canonical chapter/verse order
and omit `<pubDate>` rather than using an invented timestamp.

Set `podcast.image` in `_config.yml` to a site-relative podcast artwork path
when artwork is available. The feed converts it to an absolute URL.

Podcast-level attribution (original title, Ajahn Munindo as author, and the
Romanian translators/adapters) is configured under `podcast` in `_config.yml`
and is emitted in the channel and each episode description.

The feed declares the Apple Podcasts `Religion & Spirituality` / `Buddhism`
category, is a serial podcast, and uses each verse's canonical global number
as `itunes:episode`. The public `site.email` is emitted as the podcast owner's
email for ownership verification by services such as Spotify.

## License

[![Creative Commons License](https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png)](http://creativecommons.org/licenses/by-nc-sa/4.0/)


## Acknowledgements & inspiration

* Technology
  * [Jekyll](https://jekyllrb.com)
  * [GitHub Pages](https://pages.github.com/)
  * [Jekyll book theme](https://github.com/henrythemes/jekyll-book-theme)
  * [Semantic UI](https://semantic-ui.com/)
  * [Toptal patterns](https://www.toptal.com/designers/subtlepatterns/)


* Food for thought
  * [A Dhammapada for Contemplation by Ajahn Munindo](https://github.com/profound-labs/dhammapada-munindo)
  * [AccessToInsight.org](https://www.accesstoinsight.org/)
