/**
 * PERSISTENCE — ROADMAP step 2, and the prerequisite for step 1.
 *
 * docs/INSTAGRAM.md works out why this has to come first: the join between a
 * post and its ig_media_id is created at publish time and cannot be
 * reconstructed later. Nothing durable, nothing to join.
 *
 * The interface is deliberately small and synchronous-looking so a SQLite or
 * file-backed driver can replace the browser one without touching callers.
 */

const VERSION = 1;
const KEY = "personaos.v1";

/** In-memory driver. Always available; used by tests and as the fallback. */
export function memoryDriver(seed = {}) {
  let data = { ...seed };
  return {
    name: "memory",
    read: () => data,
    write: (next) => { data = next; },
    clear: () => { data = {}; },
  };
}

/**
 * localStorage driver. Wrapped because the accessor itself throws in private
 * windows and in embedded contexts — a storage failure must degrade to "not
 * saved", never take the app down.
 */
export function localDriver(key = KEY) {
  let usable = true;
  try {
    const probe = "__probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
  } catch {
    usable = false;
  }
  if (!usable) return { ...memoryDriver(), name: "memory (localStorage unavailable)" };
  return {
    name: "localStorage",
    read() {
      try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        // A payload from a future version is not readable; starting clean beats
        // half-applying a schema we do not understand.
        if (parsed.__v !== VERSION) return {};
        const { __v, ...rest } = parsed;
        return rest;
      } catch { return {}; }
    },
    write(next) {
      try { window.localStorage.setItem(key, JSON.stringify({ __v: VERSION, ...next })); }
      catch { /* quota or blocked — the session simply is not persisted */ }
    },
    clear() { try { window.localStorage.removeItem(key); } catch { /* nothing to do */ } },
  };
}

/**
 * The store. Holds exactly what the app would otherwise lose on refresh:
 * gate decisions, the QA checkboxes behind them, bible amendment rulings, and
 * the local post records that carry the tags and the media id.
 */
export function createPersistence(driver = memoryDriver()) {
  let state = {
    qa: {},          // { [queueId]: { checks, decision } }
    amendments: {},  // { [experimentId]: "accepted" | "rejected" }
    records: {},     // { [id]: local post record — tags, qa score, igMediaId }
    ...driver.read(),
  };
  const listeners = new Set();
  const flush = () => { driver.write(state); listeners.forEach((f) => f(state)); };

  return {
    driverName: driver.name,
    get: () => state,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    setQa(qa) { state = { ...state, qa }; flush(); },
    setAmendment(id, verdict) {
      state = { ...state, amendments: { ...state.amendments, [id]: verdict } };
      flush();
    },
    putRecord(record) {
      state = { ...state, records: { ...state.records, [record.id]: { ...state.records[record.id], ...record } } };
      flush();
      return state.records[record.id];
    },
    /**
     * Stamps the media id publishing returned. Refuses to overwrite an existing
     * link: a record pointing at the wrong media silently mis-attributes every
     * metric it ever carries.
     */
    linkMedia(id, igMediaId, publishedAt) {
      const r = state.records[id];
      if (!r) throw new Error(`cannot link media to unknown record "${id}"`);
      if (r.igMediaId && r.igMediaId !== igMediaId) {
        throw new Error(`record "${id}" is already linked to media ${r.igMediaId}`);
      }
      return this.putRecord({ ...r, igMediaId, publishedAt });
    },
    records: () => Object.values(state.records),
    reset() { driver.clear(); state = { qa: {}, amendments: {}, records: {} }; flush(); },
  };
}

/** The app's store: persistent in a browser, in-memory anywhere else. */
export const store = createPersistence(
  typeof window !== "undefined" && window.localStorage ? localDriver() : memoryDriver()
);
