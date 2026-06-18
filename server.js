"use strict";

/**
 * DESK — Prompt Terminal · backend
 *
 *   GET  /                → static frontend (public/)
 *   POST /api/run         → streams the model answer back as SSE
 *                           (holds ANTHROPIC_API_KEY server-side)
 *   GET  /api/sectors     → live sector-ETF performance ranking (cached),
 *                           with a static fallback when the feed is unreachable
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk");

const PORT = process.env.PORT || 3000;
const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
const MAX_TOKENS = Number(process.env.ANTHROPIC_MAX_TOKENS || 2048);
const PUBLIC_DIR = path.join(__dirname, "public");

const client = new Anthropic(); // resolves ANTHROPIC_API_KEY from the environment

const SYSTEM_PROMPT =
  "You are a financial markets analysis assistant for an educational/research tool. " +
  "Respond in Hebrew. Be concise and practical, and structure the answer with short " +
  "headings and bullet points where helpful. This is educational analysis only — not " +
  "financial advice. Do not invent precise real-time prices; flag when data may be stale.";

/* ------------------------------------------------------------------ */
/*  Live sector feed                                                  */
/* ------------------------------------------------------------------ */

// Sector / industry ETFs mapped to the option-bank names used by the UI,
// each with a short curated Hebrew note. Ranking + performance are live;
// the note stays editorial.
const SECTOR_ETFS = [
  { etf: "XLE", name: "Energy", note: "סקטור האנרגיה — רגיש למחירי הנפט והגז ולמתחים גיאופוליטיים." },
  { etf: "XLK", name: "Information Technology", note: "טכנולוגיה רחבה — ביקוש AI לתשתיות ושבבים תומך במגמה." },
  { etf: "XLI", name: "Industrials", note: "תעשייה — בנייית מרכזי נתונים, חשמול ותקציבי הגנה." },
  { etf: "XLB", name: "Materials", note: "חומרי גלם — מחירי סחורות וביקוש למתכות לתשתיות." },
  { etf: "IGV", name: "Software", note: "תוכנה — תלוי בצמיחת ההכנסות החוזרות ובסנטימנט הצמיחה." },
  { etf: "CIBR", name: "Cybersecurity", note: "סייבר — ביקוש מבני מתמשך להגנה (CrowdStrike, Palo Alto)." },
  { etf: "SMH", name: "Semiconductors", note: "מוליכים למחצה — מנוע מרכזי של מחזור ה-AI, תנודתי." },
  { etf: "XLF", name: "Financials", note: "פיננסים — רגיש לעקום התשואות ולמרווחי האשראי." },
  { etf: "XLV", name: "Healthcare", note: "בריאות — דפנסיבי, מושפע מרגולציה ומחדשנות תרופתית." },
  { etf: "XLP", name: "Consumer Staples", note: "צריכה בסיסית — דפנסיבי, יציב יחסית בירידות." },
  { etf: "XLY", name: "Consumer Discretionary", note: "צריכה מחזורית — תלוי בכוח הקנייה ובריבית." },
  { etf: "XLRE", name: "Real Estate", note: "נדל\"ן — רגיש מאוד לכיוון הריבית." },
  { etf: "XLC", name: "Communication Services", note: "תקשורת ומדיה — פרסום, סטרימינג ופלטפורמות." },
  { etf: "XLU", name: "Utilities", note: "תשתיות — דפנסיבי, נהנה מביקוש החשמל של מרכזי נתונים." },
];

const STATIC_TOP_SECTORS = [
  { name: "Energy", perf: "+29%", note: "המוביל ב-2026 — עליית מחירי נפט ומתחים גיאופוליטיים מזרימים הון לסקטור.", tag: "Top performer" },
  { name: "Information Technology", perf: "+17%", note: "מס' 2 ב-YTD; ביקוש AI לתשתיות ממשיך לתמוך, למרות תנודתיות.", tag: "AI demand" },
  { name: "Industrials", perf: "+16%", note: "בנייית מרכזי נתונים, חשמול, הגנה — Caterpillar ו-GE Vernova מובילים.", tag: "AI buildout" },
  { name: "Materials", perf: "+12%", note: "התאוששות מחירי סחורות וביקוש למתכות לתשתיות AI.", tag: "Commodities" },
  { name: "Software", perf: "Rebound", note: "זינוק ~44% מהשפל של אפריל; הסייבר מוביל (CrowdStrike, Palo Alto).", tag: "Off the lows" },
];

let sectorsCache = { at: 0, payload: null };
const SECTORS_TTL_MS = 60 * 60 * 1000; // 1 hour

async function fetchEtfReturn(etf) {
  // Yahoo chart API, keyless. Trailing ~3-month total return.
  const url =
    "https://query1.finance.yahoo.com/v8/finance/chart/" +
    encodeURIComponent(etf) +
    "?range=3mo&interval=1d";
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (DESK prompt terminal)" },
    });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const j = await r.json();
    const result = j && j.chart && j.chart.result && j.chart.result[0];
    if (!result) throw new Error("no result");
    const adj =
      (result.indicators &&
        result.indicators.adjclose &&
        result.indicators.adjclose[0] &&
        result.indicators.adjclose[0].adjclose) ||
      (result.indicators &&
        result.indicators.quote &&
        result.indicators.quote[0] &&
        result.indicators.quote[0].close) ||
      [];
    const series = adj.filter((v) => typeof v === "number" && !Number.isNaN(v));
    if (series.length < 2) throw new Error("short series");
    const first = series[0];
    const last = series[series.length - 1];
    if (!first) throw new Error("bad base");
    return ((last - first) / first) * 100;
  } finally {
    clearTimeout(t);
  }
}

async function buildSectors() {
  const settled = await Promise.allSettled(
    SECTOR_ETFS.map((s) => fetchEtfReturn(s.etf))
  );
  const rows = [];
  settled.forEach((res, i) => {
    if (res.status === "fulfilled" && typeof res.value === "number") {
      rows.push({ ...SECTOR_ETFS[i], pct: res.value });
    }
  });
  if (rows.length < 5) throw new Error("insufficient live data");
  rows.sort((a, b) => b.pct - a.pct);
  const top = rows.slice(0, 5).map((r) => ({
    name: r.name,
    perf: (r.pct >= 0 ? "+" : "") + r.pct.toFixed(1) + "%",
    note: r.note,
    tag: "3M",
  }));
  return {
    live: true,
    asOf: new Date().toISOString().slice(0, 10),
    topSectors: top,
  };
}

async function handleSectors(req, res) {
  const now = Date.now();
  if (sectorsCache.payload && now - sectorsCache.at < SECTORS_TTL_MS) {
    return sendJSON(res, 200, sectorsCache.payload);
  }
  try {
    const payload = await buildSectors();
    sectorsCache = { at: now, payload };
    return sendJSON(res, 200, payload);
  } catch (err) {
    console.warn("[/api/sectors] live feed unavailable:", err && err.message ? err.message : err);
    // Serve the static fallback so the UI always has a ranking.
    return sendJSON(res, 200, {
      live: false,
      asOf: null,
      topSectors: STATIC_TOP_SECTORS,
    });
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const STATIC_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json",
};

function sendJSON(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function readBody(req, limitBytes = 100 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > limitBytes) {
        reject(new Error("payload too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

/* ------------------------------------------------------------------ */
/*  Run route (SSE streaming)                                         */
/* ------------------------------------------------------------------ */

async function handleRun(req, res) {
  let parsed;
  try {
    const raw = await readBody(req);
    parsed = raw ? JSON.parse(raw) : {};
  } catch (e) {
    return sendJSON(res, 400, { error: "Invalid JSON body." });
  }

  const prompt = typeof parsed.prompt === "string" ? parsed.prompt.trim() : "";
  if (!prompt) return sendJSON(res, 400, { error: "Missing 'prompt'." });
  if (prompt.length > 8000) return sendJSON(res, 400, { error: "Prompt too long." });

  // Open the SSE channel.
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  let stream;
  try {
    stream = client.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });
  } catch (err) {
    console.error("[/api/run] failed to start stream:", err && err.message ? err.message : err);
    send({ type: "error", error: "Upstream model request failed." });
    return res.end();
  }

  // Abort the upstream request if the client disconnects.
  const onClose = () => {
    try { stream.abort(); } catch (_) {}
  };
  req.on("close", onClose);

  stream.on("text", (delta) => {
    if (delta) send({ type: "delta", text: delta });
  });

  try {
    await stream.finalMessage();
    send({ type: "done" });
  } catch (err) {
    const status = err && typeof err.status === "number" ? err.status : 502;
    console.error("[/api/run] model call failed:", err && err.message ? err.message : err);
    const message =
      status === 401
        ? "Server is missing or has an invalid API key."
        : status === 429
        ? "Rate limited — please try again shortly."
        : "Upstream model request failed.";
    send({ type: "error", error: message });
  } finally {
    req.off("close", onClose);
    res.end();
  }
}

/* ------------------------------------------------------------------ */
/*  Static files                                                      */
/* ------------------------------------------------------------------ */

function serveStatic(req, res) {
  let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";
  const resolved = path.normalize(path.join(PUBLIC_DIR, urlPath));
  if (resolved !== PUBLIC_DIR && !resolved.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  fs.readFile(resolved, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Not found");
    }
    const ext = path.extname(resolved).toLowerCase();
    res.writeHead(200, { "Content-Type": STATIC_TYPES[ext] || "application/octet-stream" });
    res.end(data);
  });
}

/* ------------------------------------------------------------------ */
/*  Server                                                            */
/* ------------------------------------------------------------------ */

const server = http.createServer((req, res) => {
  const route = (req.url || "/").split("?")[0];

  if (route === "/api/run") {
    if (req.method !== "POST") {
      res.writeHead(405, { Allow: "POST" });
      return res.end();
    }
    return handleRun(req, res);
  }

  if (route === "/api/sectors") {
    if (req.method !== "GET") {
      res.writeHead(405, { Allow: "GET" });
      return res.end();
    }
    return handleSectors(req, res);
  }

  if (req.method === "GET" || req.method === "HEAD") {
    return serveStatic(req, res);
  }
  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`DESK running on http://localhost:${PORT}  (model: ${MODEL})`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("⚠  ANTHROPIC_API_KEY is not set — /api/run will fail until it is configured.");
  }
});
