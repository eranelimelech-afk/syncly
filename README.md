# DESK — Prompt Terminal

A trader's prompt builder. 10 prompt templates, each on its own screen, where
bracketed placeholders like `[sector or stock]` become real selectable controls.
The assembled prompt can be copied or run live against an LLM, with the answer
shown inline. UI is Hebrew, RTL, dark "trading desk" theme.

This is the deployable version of the single-file artifact: the browser no longer
calls `api.anthropic.com` directly. Instead it calls a small backend route
(`POST /api/run`) that holds the API key server-side and forwards the prompt to
the model.

## Architecture

```
public/index.html   ← the whole frontend (pure HTML/CSS/vanilla JS, no build step)
public/formats.json ← the 10 templates + option banks (editable without touching code)
server.js           ← Node http server: static files + /api/run + /api/sectors
```

### Routes

- `POST /api/run` — accepts `{ "prompt": "..." }`, calls the Claude Messages API
  with the key from `ANTHROPIC_API_KEY`, and **streams** the answer back as
  Server-Sent Events (`{type:"delta",text} | {type:"error",error} | {type:"done"}`).
  The key is never exposed to the client; the upstream request is aborted if the
  browser disconnects.
- `GET /api/sectors` — returns the top-5 sector ETFs ranked by trailing ~3-month
  return (live, keyless feed via Yahoo Finance, cached server-side for 1 hour).
  Falls back to a static ranking when the feed is unreachable, so the UI always
  has data.

## Features

- **Streaming responses** — the model answer renders token-by-token inline.
- **Live sector panel** — the "top-5 growth sectors" panel is driven by `/api/sectors`
  (live ETF performance) with a static fallback.
- **Run history** — every run is saved to `localStorage` (last 30); the History view
  lets you restore the exact format + selections or delete entries.
- **Editable templates** — `public/formats.json` holds all 10 templates, option
  banks (`@SECTORS` / `@STOCKS` / `@STRATS` tokens expand to the chip lists), and
  the sector fallback. Non-developers can edit it without touching the app code.

## Run locally

```bash
npm install
cp .env.example .env        # then edit .env and set ANTHROPIC_API_KEY
# load the env and start (any method works):
export $(grep -v '^#' .env | xargs) && npm start
# → http://localhost:3000
```

Without an API key the app still loads and **COPY** works; **RUN (▶ הרץ)** will
return an error until `ANTHROPIC_API_KEY` is configured.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | — | **Required** for RUN. Held server-side only. |
| `ANTHROPIC_MODEL` | `claude-opus-4-8` | Model used for the run route. |
| `ANTHROPIC_MAX_TOKENS` | `2048` | Max output tokens per response. |
| `PORT` | `3000` | HTTP port (hosting platforms set this for you). |

## Deploy

The app has no build step and binds to `PORT` — it runs anywhere that can run a
Node process. **Set `ANTHROPIC_API_KEY` as a secret on the platform; never commit it.**

### Docker

```bash
docker build -t desk .
docker run -p 3000:3000 -e ANTHROPIC_API_KEY="sk-ant-..." desk
# → http://localhost:3000
```

### Render (blueprint included)

This repo ships a `render.yaml`. In Render: **New → Blueprint → pick this repo**,
then set `ANTHROPIC_API_KEY` in the service's **Environment** tab. Render provides
`PORT` automatically. (Manual setup without the blueprint: Build `npm ci --omit=dev`,
Start `npm start`.)

### Railway

**New Project → Deploy from GitHub repo.** Railway detects Node and runs `npm start`.
Add `ANTHROPIC_API_KEY` under **Variables**. `PORT` is injected automatically.

### Fly.io

```bash
fly launch --no-deploy          # detects the Dockerfile, generates fly.toml
fly secrets set ANTHROPIC_API_KEY="sk-ant-..."
fly deploy
```

> Note: the live sector feed (`/api/sectors`) makes an outbound request to Yahoo
> Finance. If the host blocks outbound traffic it falls back to static data — the
> app keeps working either way.

## Code landmarks

- `public/formats.json` — the 10 templates, option banks, and sector fallback.
- `boot()` (index.html) — loads `formats.json`, builds the UI, then fetches live sectors.
- `function render()` — builds each format screen.
- `function plainPrompt()` — assembles the final prompt string.
- `async function runPrompt()` — POSTs to `/api/run` and renders the streamed response.
- `loadHist()/saveHist()/renderHistory()` — the localStorage run history.
- `buildSectors()` (server.js) — fetches/ranks sector ETFs for `/api/sectors`.

## Compliance

DESK is an educational / research tool, **not financial advice**. The in-app
response disclaimer and the persistent footer disclaimer should be kept in any
deployment.
