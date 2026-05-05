# postpallite

A self-hosted web app for printing Deutsche Post Internetmarke (ePaket/ePost) stamps directly from your browser via [PrintNode](https://www.printnode.com/).

Paste an address, pick a letter format, and the stamp is purchased via the Deutsche Post API and sent to your printer automatically.

## Stack

- Node.js + Express backend
- SQLite for order history
- Docker for deployment

## Setup

Copy `.env.example` to `.env` and fill in your credentials:

```
DP_USER=your@email.de
DP_PASS=yourpassword
PRINTNODE_API_KEY=yourkey
PRINTNODE_DEFAULT_PRINTER=12345
```

Then run:

```bash
docker compose up -d
```

The app will be available at `http://localhost:3000`.
