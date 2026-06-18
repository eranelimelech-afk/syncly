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
server.js           ← Node http server: serves static files + POST /api/run
```

`POST /api/run` accepts `{ "prompt": "..." }`, calls the Claude Messages API with
the key from `ANTHROPIC_API_KEY`, and returns `{ "text": "..." }`. The key is
never exposed to the client.

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
| `PORT` | `3000` | HTTP port. |

## Code landmarks (frontend)

- `const FORMATS` — the 10 templates and their fields.
- `const SECTORS / STOCKS / STRATS` — the option banks (chips).
- `const TOP_SECTORS` — the ranked growth panel data (hardcoded, June 2026).
- `function render()` — builds each screen.
- `function plainPrompt()` — assembles the final prompt string.
- `async function runPrompt()` — POSTs to `/api/run` and renders the response.
- `function mdLite()` — minimal markdown→HTML for the response panel.

## Compliance

DESK is an educational / research tool, **not financial advice**. The in-app
response disclaimer and the persistent footer disclaimer should be kept in any
deployment.
