# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A self-hosted Node.js web app that purchases Deutsche Post Internetmarke (ePaket/ePost) stamps via the DHL API and sends the resulting PDF label directly to a PrintNode-connected printer. No framework — plain Express backend, vanilla JS frontend.

## Running locally

```bash
cp .env.example .env   # fill in credentials
node server.js         # starts on PORT (default 3000)
```

`src/config.js` throws on startup if any required env var is missing.

The SQLite database is created automatically at `data/postpallite.db` on first run. The `data/` directory must exist; Docker creates it via `RUN mkdir -p data`, but for local runs you need to `mkdir data` yourself.

## Deployment

```bash
docker compose up -d
```

`config/` and `data/` are bind-mounted into the container, so you can edit `config/products.yaml` and restart without rebuilding the image.

## Architecture

The main request flow for purchasing a label is in `server.js` POST `/api/labels`:

1. `src/parse-address.js` — parses a free-text address block (3+ lines: name, street, postal+city, optional country line) into a structured object
2. `src/deutschepost.js` — authenticates against the DHL Internetmarke API (token cached in-module, refreshed 5 min before expiry), calls `buyLabel`, downloads the PDF
3. `src/db.js` — saves the label record + raw PDF blob to SQLite; auto-purges entries older than 30 days on startup and hourly
4. `src/printnode.js` — POSTs the PDF (base64) to the PrintNode API

Print failures are **non-fatal**: the label is already purchased and saved to the DB; the response includes `printError` but `success: true`. The label can be reprinted via POST `/api/labels/:id/print`.

## Product catalog

`config/products.yaml` lists the available stamp products. `price_cents` **must exactly match Deutsche Post's current rates** — the API validates this and rejects mismatches. Prices change roughly yearly; run `node scripts/fetch-products.js` (with `.env` loaded) to regenerate the catalog from the live API.

## No tests or linter

There is no test suite and no linting config in this project.
