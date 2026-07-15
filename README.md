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
