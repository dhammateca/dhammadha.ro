# Dhammadha.ro

## Installation

```
bundle install
npm install
cd semantic
gulp build
```

## Run
```
jekyll serve
```

## Local hostname

Serve this site locally at `http://mini.test/` with:

```sh
./scripts/dev-mini-test.sh
```

This uses plain HTTP for the local hostname, so Caddy does not try to issue a TLS certificate for `mini.test`.

If `caddy` is not installed yet, run Jekyll only at `http://127.0.0.1:4000/` with:

```sh
./scripts/dev-jekyll-local.sh
```

Add this hosts entry once:

```sh
127.0.0.1 mini.test
```

If you want to run the pieces separately:

```sh
bundle exec jekyll serve --config _config.yml,_config.local.yml --host 127.0.0.1 --port 4000
caddy run --config Caddyfile
```

## Update
```
bundle update
npm update
```

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
