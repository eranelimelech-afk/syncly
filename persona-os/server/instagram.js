/**
 * Instagram read route. The browser never sees the access token.
 *
 * `src/lib/sources/instagram.js` has no token parameter at all — it calls this
 * route, and this file is the only place the credential exists. Same shape as
 * server.js at the repo root, which keeps its API key server-side.
 *
 *   GET /api/instagram/media?since=&until=
 *     -> [{ media, insights }]  raw Graph payloads, mapped client-side
 *
 * Environment:
 *   IG_USER_ID       the Instagram business/creator account id
 *   IG_ACCESS_TOKEN  a long-lived token with instagram_business_manage_insights
 *   IG_API_VERSION   optional, defaults below
 *
 * See docs/INSTAGRAM.md and docs/META_APP_REVIEW.md.
 */

const API_VERSION = process.env.IG_API_VERSION || "v23.0";
const GRAPH = `https://graph.facebook.com/${API_VERSION}`;

/**
 * Media-level metrics this app reads. Meta renames these between versions, so
 * a failure here should say which metric was rejected rather than returning
 * a silently empty object — an insights call that 400s on one bad name drops
 * every metric in the request.
 */
const MEDIA_METRICS = ["reach", "shares", "saved", "follows", "profile_visits"];
const REEL_EXTRA = ["ig_reels_avg_watch_time"];

const need = (name) => {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set — the Instagram route cannot run without it`);
  return v;
};

async function graph(path, params, { fetchImpl = fetch } = {}) {
  const url = new URL(`${GRAPH}${path}`);
  for (const [k, v] of Object.entries(params)) if (v != null) url.searchParams.set(k, v);
  url.searchParams.set("access_token", need("IG_ACCESS_TOKEN"));
  const res = await fetchImpl(url);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = body?.error ?? {};
    // Never let the token reach a log line or a response body.
    throw Object.assign(new Error(`graph ${path} failed: ${e.message ?? res.status}`), {
      status: res.status, code: e.code, subcode: e.error_subcode,
    });
  }
  return body;
}

/** One page of media in the window, newest first. */
export async function listMedia({ since, until, limit = 50, fetchImpl } = {}) {
  const igUser = need("IG_USER_ID");
  const page = await graph(`/${igUser}/media`, {
    fields: "id,timestamp,caption,media_type,media_product_type,permalink",
    since, until, limit,
  }, { fetchImpl });
  return page.data ?? [];
}

/** Insights for one media. Reels carry an extra metric that others reject. */
export async function mediaInsights(media, { fetchImpl } = {}) {
  const metrics = media.media_product_type === "REELS"
    ? [...MEDIA_METRICS, ...REEL_EXTRA]
    : MEDIA_METRICS;
  try {
    return await graph(`/${media.id}/insights`, { metric: metrics.join(",") }, { fetchImpl });
  } catch (err) {
    // A metric Meta has retired fails the whole call. Returning empty data here
    // keeps the other media usable and lets merge.js report the gap, rather
    // than failing the entire window on one renamed field.
    return { data: [], error: err.message };
  }
}

/** The route's payload: media plus insights, unmapped. */
export async function fetchWindow({ since, until, fetchImpl } = {}) {
  const media = await listMedia({ since, until, fetchImpl });
  const rows = [];
  // Serial on purpose: the account limit is 200 calls/hour and a burst of
  // parallel insight calls is the fastest way to spend it. See docs/INSTAGRAM.md.
  for (const m of media) {
    rows.push({ media: m, insights: await mediaInsights(m, { fetchImpl }) });
  }
  return rows;
}

/** Publishing limit left in the rolling 24h window, straight from Meta. */
export async function publishingLimit({ fetchImpl } = {}) {
  const igUser = need("IG_USER_ID");
  const r = await graph(`/${igUser}/content_publishing_limit`, { fields: "config,quota_usage" }, { fetchImpl });
  return r.data?.[0] ?? null;
}

/**
 * Mounts the route on a plain Node http server, matching server.js at the root.
 * Returns true when it handled the request.
 */
export async function handle(req, res) {
  if (!req.url?.startsWith("/api/instagram/")) return false;
  const url = new URL(req.url, "http://localhost");
  const send = (code, body) => {
    res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(body));
  };
  try {
    if (url.pathname === "/api/instagram/media") {
      return send(200, await fetchWindow({
        since: url.searchParams.get("since"), until: url.searchParams.get("until"),
      })), true;
    }
    if (url.pathname === "/api/instagram/limit") return send(200, await publishingLimit()), true;
    return send(404, { error: "unknown instagram route" }), true;
  } catch (err) {
    // err.message is built above and never contains the token.
    return send(err.status ?? 500, { error: err.message, code: err.code }), true;
  }
}
