// Deployment smoke test: `npm run smoke -- https://your-deployment.example`
// Read-only checks plus two safe negative probes (cross-origin write, code run).
// Prints PASS/FAIL per check and exits 1 if any check fails. Sends no secrets
// and creates no accounts.
const base = (process.argv[2] ?? "").replace(/\/$/, "");
if (!/^https?:\/\/[^/]+$/.test(base)) {
  console.error("usage: npm run smoke -- https://host (no trailing path)");
  process.exit(2);
}

type Check = { name: string; run: () => Promise<string> };
const results: Array<{ name: string; pass: boolean; detail: string }> = [];

function expect(condition: unknown, detail: string): string {
  if (!condition) throw new Error(detail);
  return detail;
}

async function get(path: string, init?: RequestInit) {
  return fetch(`${base}${path}`, { redirect: "manual", ...init });
}

const checks: Check[] = [
  {
    name: "home page loads (200, lang=id)",
    run: async () => {
      const r = await get("/");
      const html = await r.text();
      return expect(
        r.status === 200 && html.includes('lang="id"'),
        `status ${r.status}`,
      );
    },
  },
  {
    name: "security headers present, no X-Powered-By",
    run: async () => {
      const h = (await get("/")).headers;
      const ok =
        h.get("x-content-type-options") === "nosniff" &&
        h.get("x-frame-options") === "DENY" &&
        (h.get("permissions-policy") ?? "").includes("microphone=()") &&
        !h.get("x-powered-by");
      return expect(ok, ok ? "ok" : "missing or unexpected headers");
    },
  },
  {
    // Guards against a stale build cache serving CSS without the Stitch tokens.
    name: "stylesheet contains the design tokens",
    run: async () => {
      const html = await (await get("/")).text();
      const hrefs = [...html.matchAll(/href="([^"]+\.css)"/g)].map(
        (m) => m[1]!,
      );
      let found = false;
      for (const href of hrefs) {
        const css = await (await get(href)).text();
        if (
          css.includes("--color-primary-container") &&
          css.includes(".btn-primary")
        )
          found = true;
      }
      return expect(found, `${hrefs.length} stylesheet(s) checked`);
    },
  },
  {
    name: "robots.txt disallows /api/",
    run: async () =>
      expect(
        (await (await get("/robots.txt")).text()).includes("Disallow: /api/"),
        "ok",
      ),
  },
  {
    name: "sitemap.xml lists only public pages",
    run: async () => {
      const xml = await (await get("/sitemap.xml")).text();
      return expect(xml.includes("<urlset") && !xml.includes("/api/"), "ok");
    },
  },
  {
    name: "status endpoint reports integrations without secrets",
    run: async () => {
      const r = await get("/api/status");
      const text = await r.text();
      const body = JSON.parse(text);
      const ok =
        r.status === 200 &&
        body.integrations?.ai &&
        !/AIza|postgres(ql)?:\/\/|LLM_API_KEY/.test(text);
      const ai = JSON.stringify(body.integrations?.ai);
      const db = JSON.stringify(body.integrations?.database);
      return expect(ok, `ai=${ai} database=${db}`);
    },
  },
  {
    name: "AI is not the development mock in production",
    run: async () => {
      const body = await (await get("/api/status")).json();
      return expect(
        body.integrations?.ai?.mode !== "mock",
        JSON.stringify(body.integrations?.ai),
      );
    },
  },
  {
    name: "lesson list responds (200)",
    run: async () => {
      const r = await get("/api/lessons");
      const body = await r.json();
      return expect(
        r.status === 200 && Array.isArray(body.lessons),
        `${body.lessons?.length ?? "?"} lessons`,
      );
    },
  },
  {
    name: "API responses are not cacheable",
    run: async () =>
      expect(
        (await get("/api/lessons")).headers.get("cache-control") === "no-store",
        "no-store",
      ),
  },
  {
    name: "cross-origin write is refused (403)",
    run: async () => {
      const r = await get("/api/sessions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://evil.example",
        },
        body: JSON.stringify({ lessonId: "urutan-instruksi" }),
      });
      return expect(r.status === 403, `status ${r.status}`);
    },
  },
  {
    name: "code execution is refused, never run (422)",
    run: async () => {
      const r = await get("/api/code/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ language: "python", code: "print(1)" }),
      });
      return expect(r.status === 422, `status ${r.status}`);
    },
  },
  {
    name: "private history needs an identity (401) or a database (503)",
    run: async () => {
      const r = await get("/api/history");
      return expect(r.status === 401 || r.status === 503, `status ${r.status}`);
    },
  },
];

const startedAt = new Date().toISOString();
for (const check of checks) {
  try {
    results.push({ name: check.name, pass: true, detail: await check.run() });
  } catch (error) {
    results.push({
      name: check.name,
      pass: false,
      detail: (error as Error).message,
    });
  }
}
console.log(`Smoke test ${base} at ${startedAt}`);
for (const r of results)
  console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name} — ${r.detail}`);
const failed = results.filter((r) => !r.pass).length;
console.log(`${results.length - failed}/${results.length} passed`);
process.exit(failed === 0 ? 0 : 1);
