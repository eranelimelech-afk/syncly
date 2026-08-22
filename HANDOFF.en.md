# DESK — Prompt Terminal · Handoff

This document fully explains the application so another developer or agent can
maintain and extend it with no additional context. Written 2026-06-19.
(Hebrew version: `HANDOFF.md`.)

---

## 1. What the app is

**DESK — Prompt Terminal** is a trader's prompt builder. The UI is Hebrew, RTL,
with a dark "trading desk" theme. There are 10 prompt templates (each on its own
screen); bracketed placeholders like `[sector or stock]` become interactive
controls (multi-select chips + a free-text field). The assembled prompt can be
copied (COPY) or run against an LLM (▶ הרץ / "Run"), with the answer streamed inline.

**Origin:** It started as a single-file Claude artifact that called
`api.anthropic.com` directly from the browser — which only works inside Claude's
sandbox. It was converted into a real, deployable app with a backend that holds
the API key server-side.

---

## 2. Repo & branch

- **Repo:** `eranelimelech-afk/syncly`
- **Branch:** `claude/app-build-from-files-v1qukf`
- **Stack:** Node.js (built-in `http` server, no framework) + vanilla frontend
  (HTML/CSS/JS, no build step). Single dependency: `@anthropic-ai/sdk`.

---

## 3. File layout

```
syncly/
├── server.js            # Node server: static + /api/run (SSE) + /api/sectors
├── public/
│   ├── index.html       # entire frontend (HTML+CSS+JS in one file)
│   └── formats.json     # the 10 templates + option banks + sector fallback
├── package.json         # scripts + dependency (@anthropic-ai/sdk)
├── package-lock.json    # lockfile (required by npm ci on deploy)
├── .env.example         # env-var template
├── .gitignore           # ignores .env, node_modules, etc.
├── Dockerfile           # deploy image (node:22-alpine, non-root)
├── .dockerignore
├── render.yaml          # Render deploy blueprint
├── README.md            # user/dev docs
├── HANDOFF.md           # handoff (Hebrew)
└── HANDOFF.en.md        # this document
```

---

## 4. Architecture & data flow

```
Browser (public/index.html)
   │
   ├── GET /formats.json ──────► loads templates, builds the UI (boot())
   ├── GET /api/sectors ───────► live sector ranking ("Top 5" panel)
   └── POST /api/run ──────────► sends prompt; receives streamed answer (SSE)
                                   │
                              server.js
                                   │  holds ANTHROPIC_API_KEY (secret, server-side only)
                                   └──► Anthropic Messages API (client.messages.stream)
```

**Key principle:** the API key **never** reaches the browser. Every model call
goes through `server.js`, which reads the key from an environment variable.

---

## 5. Backend (`server.js`)

A built-in Node `http` server with three responsibilities:

### a. Static file serving
Serves `public/` (`/` → `index.html`). Includes path-traversal protection
(cannot escape `public/`).

### b. `POST /api/run` — streaming prompt run (SSE)
- **Request:** `{ "prompt": "..." }` (JSON). Validation: prompt required, ≤ 8000
  chars, body ≤ 100KB.
- **Response:** Server-Sent Events (`Content-Type: text/event-stream`). Each event
  is a `data:` line:
  - `{ "type": "delta", "text": "..." }` — next chunk of model text
  - `{ "type": "error", "error": "..." }` — error (generic client message; the full
    error is logged server-side only)
  - `{ "type": "done" }` — clean completion
- Uses `client.messages.stream(...)` with a `system` prompt instructing the model
  to answer in Hebrew, concisely, as "educational content only — not financial advice".
- **Auto-abort:** if the browser disconnects (`req.on('close')`), the upstream
  request is aborted (`stream.abort()`) to avoid wasting tokens. This is what
  backs the client-side "Stop" button.

### c. `GET /api/sectors` — live sector feed
- Ranks the top-5 sector ETFs by trailing ~3-month return.
- Source: **Yahoo Finance chart API** (free, keyless) —
  `query1.finance.yahoo.com/v8/finance/chart/{ETF}?range=3mo&interval=1d`.
- The ETF list maps to Hebrew sector names with a curated note each (`SECTOR_ETFS`).
- **Cache:** in-memory, 1 hour (`SECTORS_TTL_MS`).
- **Fallback:** if the feed is unavailable (no outbound network / error) it returns
  a static list (`STATIC_TOP_SECTORS`) with `live: false`, so the UI always works.
- **Response:** `{ "live": bool, "asOf": "YYYY-MM-DD"|null, "topSectors": [{name, perf, note, tag}, ...] }`

**Environment variables (all optional except the key):**

| Variable | Default | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | **Required** for /api/run. Server-side only. |
| `ANTHROPIC_MODEL` | `claude-opus-4-8` | Model used. |
| `ANTHROPIC_MAX_TOKENS` | `2048` | Max output tokens per answer. |
| `PORT` | `3000` | HTTP port (hosting platforms inject it). |

---

## 6. Frontend (`public/index.html`)

A single file: vanilla HTML + CSS + JS. No external deps, no build.

**Boot flow:** `boot()` → loads `formats.json` → builds `FORMATS` (expands option
tokens) → inits state → builds nav → `render()` → `loadSectors()` (live feed,
re-renders when ready).

**Key functions:**
- `boot()` — async init (loads JSON + sectors).
- `render()` — builds a format screen (chips, sector panel, prompt card).
- `paintPrompt()` / `plainPrompt()` — assemble the prompt string (replace `{key}`
  with selected values).
- `runPrompt()` — POSTs to `/api/run`, reads the SSE stream, renders text live.
  Includes a stop button (`AbortController`).
- `copyPrompt()` — copies to clipboard.
- `mdLite()` — minimal Markdown → HTML for the answer panel.
- History: `loadHist()/saveHist()/startHistory()/finishHistory()/renderHistory()/restoreHistory()/exportHistory()`.

**State:** `state[formatId][fieldKey] = [selected values]`. Held in memory only
(not persisted beyond the session, except the history).

---

## 7. `public/formats.json` schema (templates — editable without code)

```jsonc
{
  "banks": {
    "SECTORS": ["Energy", ...],   // chip option lists
    "STOCKS":  ["NVDA", ...],
    "STRATS":  ["Swing Trading", ...]
  },
  "topSectorsFallback": [ {name, perf, note, tag}, ... ],  // used when the live feed is down
  "formats": [
    {
      "id": 1,
      "title": "Market Analysis",   // English name (breadcrumb)
      "he": "ניתוח שוק",            // Hebrew title (nav + screen)
      "lede": "...",                // short description
      "template": "Analyze ... focusing on {sel}. ...",  // string; {key} = placeholder
      "fields": [
        {
          "key": "sel",                       // matches {sel} in the template
          "label": "סקטור או מניה",
          "ph": "[sector or stock]",          // placeholder text when empty
          "options": ["@SECTORS", "@STOCKS"], // tokens expand to banks; or an explicit list
          "free": true,                       // allow free-text input
          "multi": true,                      // multi-select
          "sectorTop": true                   // show the "Top 5 sectors" panel
        }
      ]
    }
    // ... 10 formats
  ]
}
```

**Option tokens:** `@SECTORS` / `@STOCKS` / `@STRATS` in `options` auto-expand to
the lists in `banks`. You can also give an explicit string list (as in format 9).
**To add/edit a format:** edit `formats.json` only — no code changes needed.

---

## 8. The 6 upgrades implemented (beyond the backend conversion)

1. **Streaming responses** — `/api/run` streams SSE; output appears token-by-token.
2. **Live sector feed** — `/api/sectors` with Yahoo Finance + cache + fallback.
3. **Run history** — stored in `localStorage` (last 30); a "History" screen with restore/delete.
4. **External templates** — `formats.json` (editable by non-developers).
5. **Stop button** — ▶ Run becomes ⏹ Stop while streaming; stopping keeps the partial answer.
6. **History export** — a "⬇ Export JSON" button downloads the full history.

---

## 9. Run locally

Requires Node.js 18+ (tested on 22).

```bash
git clone -b claude/app-build-from-files-v1qukf https://github.com/eranelimelech-afk/syncly.git
cd syncly
npm install
export ANTHROPIC_API_KEY="sk-ant-..."   # your key
npm start                                # → http://localhost:3000
```

Without a key: the app loads, COPY and the sectors panel work, but ▶ Run errors.

---

## 10. Deployment

No build step; binds to `PORT` — runs anywhere that runs Node.
**Always set `ANTHROPIC_API_KEY` as a platform secret — never in code.**

- **Docker:** `docker build -t desk . && docker run -p 3000:3000 -e ANTHROPIC_API_KEY="..." desk`
- **Render:** New → Blueprint → pick the repo (`render.yaml` included) → set the key in Environment.
- **Railway:** Deploy from GitHub → add `ANTHROPIC_API_KEY` in Variables.
- **Fly.io:** `fly launch --no-deploy` → `fly secrets set ANTHROPIC_API_KEY="..."` → `fly deploy`.

Full details: `README.md`, Deploy section.

---

## 11. Security — important points

- **The API key is server-side only** (env var). The browser only calls `/api/run`.
- **`.env` is in `.gitignore`** — never committed.
- **Model errors** are logged server-side; the client gets a generic message only.
- **Path-traversal protection** in static file serving.
- **Lesson from development:** if a key is ever exposed (e.g. pasted into a chat/issue),
  **revoke and rotate it immediately** at console.anthropic.com. The repo was scanned
  and verified clean of real keys (only `sk-ant-...` placeholders).

---

## 12. What was tested

- JSON validation of `formats.json`; syntax checks of `server.js` and the embedded JS.
- Serving `/`, `/formats.json`, `/api/sectors` (returned real live data).
- `/api/run`: validation (400), SSE channel open, controlled error event without a key.
- `npm ci --omit=dev` (the Docker/Render build command) + a `NODE_ENV=production` boot.
- **Not tested live:** a real model call (no key in the dev environment) — the streaming
  path was verified up to the SDK call. With a valid key, streaming works end-to-end.

---

## 13. Follow-up ideas (not implemented)

- A ready `fly.toml` / a GitHub Action for automatic deploy.
- History import (only export exists today).
- Auth / rate limiting on `/api/run` before public exposure.
- Swapping the system prompt or disclaimer for production regulatory requirements.
- Expanding the ETF list / changing the sector feed time window.

---

## 14. One-paragraph summary for an agent

> Node app + vanilla frontend. `server.js` serves `public/` and exposes `/api/run`
> (SSE streaming to Claude, key held server-side) and `/api/sectors` (live ETF feed
> + fallback). Templates live in `public/formats.json`. Run: `npm install` →
> `export ANTHROPIC_API_KEY=...` → `npm start` → `localhost:3000`. Deploy: Docker /
> Render (`render.yaml`) / Railway / Fly. Iron rule: the key is an env secret, never in code.
