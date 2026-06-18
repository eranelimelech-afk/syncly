"use strict";

/**
 * DESK — Prompt Terminal · backend
 *
 * Serves the static frontend and exposes a single API route, POST /api/run,
 * that holds the Anthropic API key server-side and forwards the assembled
 * prompt to the model. The key is never shipped to the browser.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk");

const PORT = process.env.PORT || 3000;
const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
const MAX_TOKENS = Number(process.env.ANTHROPIC_MAX_TOKENS || 2048);
const PUBLIC_DIR = path.join(__dirname, "public");

// The client resolves ANTHROPIC_API_KEY from the environment automatically.
const client = new Anthropic();

const SYSTEM_PROMPT =
  "You are a financial markets analysis assistant for an educational/research tool. " +
  "Respond in Hebrew. Be concise and practical, and structure the answer with short " +
  "headings and bullet points where helpful. This is educational analysis only — not " +
  "financial advice. Do not invent precise real-time prices; flag when data may be stale.";

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

async function handleRun(req, res) {
  let parsed;
  try {
    const raw = await readBody(req);
    parsed = raw ? JSON.parse(raw) : {};
  } catch (e) {
    return sendJSON(res, 400, { error: "Invalid JSON body." });
  }

  const prompt = typeof parsed.prompt === "string" ? parsed.prompt.trim() : "";
  if (!prompt) {
    return sendJSON(res, 400, { error: "Missing 'prompt'." });
  }
  if (prompt.length > 8000) {
    return sendJSON(res, 400, { error: "Prompt too long." });
  }

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });
    const text = (response.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return sendJSON(res, 200, { text });
  } catch (err) {
    const status = err && typeof err.status === "number" ? err.status : 502;
    // Log the full error server-side; return a generic message to the client.
    console.error("[/api/run] model call failed:", err && err.message ? err.message : err);
    const message =
      status === 401
        ? "Server is missing or has an invalid API key."
        : status === 429
        ? "Rate limited — please try again shortly."
        : "Upstream model request failed.";
    return sendJSON(res, status >= 400 && status < 600 ? status : 502, { error: message });
  }
}

function serveStatic(req, res) {
  // Map "/" to index.html; strip query string; prevent path traversal.
  let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";
  const resolved = path.normalize(path.join(PUBLIC_DIR, urlPath));
  if (!resolved.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  fs.readFile(resolved, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Not found");
    }
    const ext = path.extname(resolved).toLowerCase();
    res.writeHead(200, {
      "Content-Type": STATIC_TYPES[ext] || "application/octet-stream",
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.url && req.url.split("?")[0] === "/api/run") {
    if (req.method !== "POST") {
      res.writeHead(405, { Allow: "POST" });
      return res.end();
    }
    return handleRun(req, res);
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
    console.warn(
      "⚠  ANTHROPIC_API_KEY is not set — /api/run will fail until it is configured."
    );
  }
});
