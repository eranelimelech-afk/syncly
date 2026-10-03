/**
 * Parses a heartbeat report (agents/runtime/heartbeat.mjs output) for display.
 * Pure — the Vite glob that finds the files lives in the component.
 */
export function parseReport(text) {
  const fm = text.match(/^---\n([\s\S]*?)\n---/);
  const meta = {};
  if (fm) for (const l of fm[1].split("\n")) {
    const m = l.match(/^([\w-]+):\s*(.*)$/);
    if (m) meta[m[1]] = m[2].trim();
  }
  const bullets = (heading) => {
    const m = text.match(new RegExp(`## ${heading}\\n\\n([\\s\\S]*?)(?:\\n## |$)`));
    return m ? m[1].split("\n").filter((l) => l.startsWith("- ")).map((l) => l.slice(2)) : [];
  };
  return {
    persona: meta.persona ?? null,
    generatedAt: meta.generated_at ?? null,
    status: meta.status === "ALERT" ? "ALERT" : "SILENT",
    source: meta.source ?? null,
    alerts: bullets("התראות"),
    info: bullets("מצב"),
    skipped: bullets("דולג"),
  };
}

/** The latest report per agent id, from a { path: text } map. File names are ISO dates. */
export function latestReports(files) {
  const out = {};
  for (const path of Object.keys(files).sort()) {
    const m = path.match(/personas\/([^/]+)\/reports\/([^/]+)\.md$/);
    if (m) out[m[1]] = { date: m[2], ...parseReport(files[path]) };
  }
  return out;
}
