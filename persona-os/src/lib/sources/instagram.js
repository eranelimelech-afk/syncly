/**
 * Instagram adapter. See docs/INSTAGRAM.md.
 *
 * Two halves, deliberately separated:
 *
 *   mapMedia()  — pure. Raw Graph API payload in, metric fields out. Testable
 *                 with no network and no credentials, which is where the real
 *                 risk lives: Meta renames metrics between versions.
 *   fetchMedia() — talks to OUR backend, never to graph.facebook.com.
 *
 * The access token must never reach the browser. This module therefore has no
 * token parameter at all; the backend holds it and exposes a read-only route.
 * Same shape as the DESK server in this repo, which keeps its key server-side.
 */

/** Metric names this adapter reads, kept in one place because Meta moves them. */
export const METRICS = {
  reach: "reach",
  shares: "shares",
  saves: "saved",            // the API field is "saved", our field is "saves"
  follows: "follows",         // media-level since Feb 2024 — this is the north star
  visits: "profile_visits",   // media-level since Feb 2024
  watch: "ig_reels_avg_watch_time",
};

/** Graph media_product_type / media_type -> our format vocabulary. */
function formatOf(media) {
  if (media.media_product_type === "REELS") return "reel";
  if (media.media_type === "CAROUSEL_ALBUM") return "carousel";
  return "still";
}

/** Insights come back as [{name, values:[{value}]}] — flatten to {name: value}. */
export function flattenInsights(insights) {
  const out = {};
  for (const row of insights?.data ?? []) {
    const v = row.values?.[0]?.value;
    out[row.name] = typeof v === "number" ? v : 0;
  }
  return out;
}

/**
 * One Graph media plus its insights -> the metric half of a post.
 * The editorial half (the seven dimensions, the QA score) is not here and
 * cannot be: Instagram does not know it. merge.js joins the two.
 */
export function mapMedia(media, insights) {
  const m = flattenInsights(insights);
  const d = new Date(media.timestamp);
  const isReel = formatOf(media) === "reel";
  return {
    igMediaId: media.id,
    day: `${d.getDate()}.${d.getMonth() + 1}`,
    timestamp: media.timestamp,
    format: formatOf(media),
    line: media.caption ?? "",
    reach: m[METRICS.reach] ?? 0,
    shares: m[METRICS.shares] ?? 0,
    saves: m[METRICS.saves] ?? 0,
    follows: m[METRICS.follows] ?? 0,
    visits: m[METRICS.visits] ?? 0,
    // Only reels report watch time. Zero would read as "nobody watched"; null
    // reads as "not applicable", and the performance table already renders that.
    watch: isReel ? Math.round(m[METRICS.watch] ?? 0) : null,
  };
}

/**
 * Reads a window of media from our backend. `base` is our own route, and the
 * response is expected to be [{media, insights}] straight from the Graph API,
 * so mapMedia stays the single place that knows Meta's field names.
 */
export async function fetchMedia({ base = "/api/instagram", since, until, fetchImpl = fetch } = {}) {
  const q = new URLSearchParams();
  if (since) q.set("since", since);
  if (until) q.set("until", until);
  const res = await fetchImpl(`${base}/media?${q}`);
  if (!res.ok) throw new Error(`instagram backend returned ${res.status}`);
  const rows = await res.json();
  return rows.map((r) => mapMedia(r.media, r.insights));
}
