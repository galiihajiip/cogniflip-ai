"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { z } from "zod";
import { FlipBotAvatar } from "@/app/_components/flipbot";
import { Icon } from "@/app/_components/icon";
import { Chip } from "@/app/_components/states";
import { apiFetch, failureMessage } from "@/app/_lib/api";
import {
  PythonRunner,
  RUNNER_LIMITS,
  type RunResult,
} from "@/app/_lib/python-runner";
import { buildPreview, RUNTIMES, STARTER } from "@/app/_lib/runtimes";
import { CODE_LIMITS, codeReviewResponseSchema } from "@/shared/api/code";

type Review = z.infer<typeof codeReviewResponseSchema>;
type Language = {
  id: string;
  label: string;
  supportLevel: string;
  canAnalyzeWithAi: boolean;
  limitations: string[];
};

const SEVERITY = {
  info: { label: "Info", tone: "bg-surface-container text-on-surface-variant" },
  low: { label: "Ringan", tone: "bg-tertiary-fixed text-on-tertiary-fixed" },
  medium: {
    label: "Sedang",
    tone: "bg-secondary-fixed text-on-secondary-fixed",
  },
  high: {
    label: "Penting",
    tone: "bg-error-container text-on-error-container",
  },
  critical: { label: "Sangat penting", tone: "bg-error text-on-error" },
} as const;

const DIMENSION = {
  correctness: "Kebenaran",
  readability: "Mudah dibaca",
  maintainability: "Mudah dirawat",
  performance: "Kecepatan",
  security: "Keamanan",
} as const;

type ConsoleLine = { kind: "system" | "stdout" | "stderr"; text: string };
type RunError = Extract<RunResult, { status: "error" }>["error"];

const MAX_OUTPUT_CHARS = 20_000;

const OTHER = "lainnya";

/**
 * Mini IDE: the editor and console from ST-10. Python, JavaScript and SQL run
 * in isolated browser workers, HTML/CSS in a locked preview frame (D-012,
 * D-015); every language, including any typed under "Lainnya", gets AI review.
 */
export function MiniIde({
  languages,
  initial,
}: {
  languages: Language[];
  initial?: { language: string; code: string; title: string };
}) {
  const usable = languages.filter((l) => l.canAnalyzeWithAi);
  const [lang, setLang] = useState(initial?.language ?? "python");
  const [code, setCode] = useState(initial?.code ?? STARTER[lang] ?? "");
  const [otherName, setOtherName] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [goal, setGoal] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [stdin, setStdin] = useState("");
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<RunError | null>(null);
  const [pyVersion, setPyVersion] = useState<string | null>(null);
  const [console_, setConsole] = useState<ConsoleLine[]>([
    { kind: "system", text: "$ mini-ide siap." },
    {
      kind: "system",
      text: initial
        ? `Contoh dari pelajaran “${initial.title}” sudah dimuat. Tekan “Jalankan”.`
        : "Tekan “Jalankan” untuk menjalankan kodemu di browser, atau “Minta Saran FlipBot”.",
    },
  ]);
  const runners = useRef(new Map<string, PythonRunner>());
  const runtime = RUNTIMES[lang];
  const canRun = runtime !== undefined;
  const say = (text: string) =>
    setConsole((c) => [...c, { kind: "system", text }]);

  useEffect(() => {
    const all = runners.current;
    return () => all.forEach((r) => r.reset());
  }, []);

  async function runCode() {
    if (!runtime || !code.trim() || tooBig || running) return;
    setRunError(null);
    if (runtime.kind === "preview") {
      setPreview(buildPreview(lang as "html" | "css", code));
      setConsole([
        { kind: "system", text: `$ buka pratinjau ${runtime.label}` },
        { kind: "system", text: "Pratinjau diperbarui di panel samping." },
      ]);
      return;
    }
    let runner = runners.current.get(lang);
    if (!runner) {
      runner = new PythonRunner(runtime.create);
      runners.current.set(lang, runner);
    }
    setRunning(true);
    setConsole([{ kind: "system", text: `$ ${runtime.command}` }]);
    if (!runner.version && runtime.loading) say(runtime.loading);
    const result = await runner.run(code, stdin, (stream, text) =>
      setConsole((c) => {
        const last = c[c.length - 1];
        // Append to the current output line so streamed chunks stay readable.
        if (last && last.kind === stream)
          return [...c.slice(0, -1), { kind: stream, text: last.text + text }];
        return [...c, { kind: stream, text }];
      }),
    );
    setRunning(false);
    setPyVersion(runner.version);
    if (result.status === "unavailable") {
      say(
        `${runtime.label} belum bisa dimuat di browser ini. Coba muat ulang halaman atau pakai browser lain.`,
      );
      return;
    }
    const seconds =
      result.durationMs < 1000
        ? `${result.durationMs} ms`
        : `${(result.durationMs / 1000).toFixed(1)} detik`;
    if (result.status === "ok") say(`Program selesai (${seconds}).`);
    if (result.status === "error") {
      setRunError(result.error);
      say(
        result.error.line
          ? `Program berhenti karena error di baris ${result.error.line}.`
          : "Program berhenti karena error.",
      );
    }
    if (result.status === "timeout")
      say(
        `Program dihentikan setelah ${RUNNER_LIMITS.timeoutMs / 1000} detik. Mungkin ada perulangan yang tidak pernah berhenti?`,
      );
    if (result.status === "output_limit")
      say(
        `Output terlalu panjang, dihentikan setelah ${MAX_OUTPUT_CHARS.toLocaleString("id-ID")} karakter.`,
      );
  }
  const gutterRef = useRef<HTMLDivElement>(null);
  const editorId = useId();
  const language = languages.find((l) => l.id === lang);

  const lines = code.split("\n").length;
  const bytes = useMemo(
    () => new TextEncoder().encode(code).byteLength,
    [code],
  );
  const tooBig = bytes > CODE_LIMITS.maxBytes || lines > CODE_LIMITS.maxLines;

  async function requestReview() {
    if (!code.trim() || tooBig || busy) return;
    setBusy(true);
    setError(null);
    say(`$ minta-saran --bahasa ${lang}`);
    say("FlipBot sedang membaca kodemu…");
    const r = await apiFetch("/api/code/review", codeReviewResponseSchema, {
      method: "POST",
      body: {
        language: lang === OTHER ? otherName.trim() || "Lainnya" : lang,
        code,
        ...(goal.trim() ? { goal: goal.trim() } : {}),
      },
    });
    setBusy(false);
    if (!r.ok) {
      setError(failureMessage(r));
      say("Tinjauan gagal. Kodemu tetap aman di editor.");
      return;
    }
    setReview(r.data);
    say(
      `Selesai: ${r.data.findings.length} saran${r.data.mockMode ? " (mode uji)" : ""}. Saran AI tidak menjalankan kodemu.`,
    );
  }

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-8">
          <div className="flex flex-wrap gap-2">
            <span className="chip bg-secondary-container text-on-secondary-fixed">
              LAB KODE • MINI IDE
            </span>
            <Chip icon="play_arrow">
              Jalankan Python, JavaScript, SQL, HTML, CSS
            </Chip>
            <Chip icon="auto_awesome">Saran AI untuk semua bahasa</Chip>
          </div>
          <h1 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg">
            Tulis Kodemu, Jalankan, Minta Saran FlipBot
          </h1>
          <p className="max-w-2xl text-body-md text-on-surface-variant">
            Ketik atau ubah kode, tekan “Jalankan” untuk melihat hasilnya, lalu
            minta FlipBot memberi saran. Saran diberi label “saran AI” karena
            tidak diperiksa oleh compiler.
          </p>
        </div>
        <aside className="card flex items-start gap-4 p-5 lg:col-span-4">
          <FlipBotAvatar status="online" />
          <div>
            <p className="text-headline-sm text-on-surface">
              FlipBot Sahabatmu
            </p>
            <p className="text-body-sm text-on-surface-variant">
              “Jalankan kodemu untuk melihat hasilnya. Kalau bingung, minta
              saranku!”
            </p>
          </div>
        </aside>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <section className="space-y-4 lg:col-span-7">
          <div className="overflow-hidden rounded-3xl bg-inverse-surface shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-danger" />
                <span className="h-3 w-3 rounded-full bg-secondary-container" />
                <span className="h-3 w-3 rounded-full bg-tertiary-fixed-dim" />
                <label htmlFor={`${editorId}-lang`} className="sr-only">
                  Bahasa pemrograman
                </label>
                <select
                  id={`${editorId}-lang`}
                  value={lang}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (
                      code === (STARTER[lang] ?? "") ||
                      code === initial?.code
                    )
                      setCode(STARTER[next] ?? "");
                    setLang(next);
                    setReview(null);
                    setPreview(null);
                    setRunError(null);
                  }}
                  className="ml-2 min-h-9 rounded-lg bg-white/10 px-2 font-mono text-label-code-sm text-inverse-on-surface"
                >
                  {usable.map((l) => (
                    <option key={l.id} value={l.id} className="text-on-surface">
                      {l.label}
                      {RUNTIMES[l.id] ? " ▶" : ""}
                    </option>
                  ))}
                  <option value={OTHER} className="text-on-surface">
                    Lainnya…
                  </option>
                </select>
                {lang === OTHER ? (
                  <>
                    <label htmlFor={`${editorId}-other`} className="sr-only">
                      Nama bahasa
                    </label>
                    <input
                      id={`${editorId}-other`}
                      value={otherName}
                      onChange={(e) => setOtherName(e.target.value)}
                      maxLength={40}
                      placeholder="nama bahasa, mis. Scratch"
                      className="min-h-9 w-40 rounded-lg bg-white/10 px-2 font-mono text-label-code-sm text-inverse-on-surface placeholder:text-outline"
                    />
                  </>
                ) : null}
              </div>
              <button
                type="button"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-white/10 px-3 text-label-ui text-inverse-on-surface hover:bg-white/20"
                onClick={() => {
                  setCode(STARTER[lang] ?? "");
                  setReview(null);
                }}
              >
                <Icon name="refresh" size={16} />
                Kembalikan Kode Awal
              </button>
            </div>
            <div className="flex max-h-[28rem] min-h-72">
              <div
                ref={gutterRef}
                aria-hidden="true"
                className="w-12 shrink-0 select-none overflow-hidden py-4 pr-2 text-right font-mono text-label-code-lg leading-7 text-outline"
              >
                {Array.from({ length: lines }, (_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <label htmlFor={editorId} className="sr-only">
                Editor kode
              </label>
              <textarea
                id={editorId}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onScroll={(e) => {
                  if (gutterRef.current)
                    gutterRef.current.scrollTop = e.currentTarget.scrollTop;
                }}
                onKeyDown={(e) => {
                  // Tab inserts spaces; Escape then Tab leaves the editor (keyboard users).
                  if (
                    e.key === "Tab" &&
                    !e.shiftKey &&
                    !e.currentTarget.dataset.escape
                  ) {
                    e.preventDefault();
                    const el = e.currentTarget;
                    const { selectionStart: s, selectionEnd: end } = el;
                    const nextCode = `${code.slice(0, s)}    ${code.slice(end)}`;
                    setCode(nextCode);
                    requestAnimationFrame(() =>
                      el.setSelectionRange(s + 4, s + 4),
                    );
                  }
                  if (e.key === "Escape") e.currentTarget.dataset.escape = "1";
                  else if (e.key !== "Tab")
                    delete e.currentTarget.dataset.escape;
                }}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                aria-describedby={`${editorId}-help`}
                className="flex-1 resize-none overflow-auto whitespace-pre bg-transparent py-4 pr-4 font-mono text-label-code-lg leading-7 text-inverse-on-surface outline-none focus-visible:outline-none"
              />
            </div>
            <div className="border-t border-white/10 bg-console px-4 py-3">
              <p className="mb-1 flex items-center justify-between font-mono text-label-code-sm text-surface-container-high">
                <span className="flex items-center gap-2">
                  <Icon name="terminal" size={16} /> OUTPUT MINI-IDE
                </span>
                <span>
                  {lines} baris • {bytes} byte
                </span>
              </p>
              <div
                role="log"
                aria-live="polite"
                className="max-h-64 overflow-auto whitespace-pre-wrap break-words font-mono text-label-code-sm leading-6"
              >
                {console_.map((l, i) => (
                  <div
                    key={i}
                    className={
                      l.kind === "system"
                        ? "text-surface-container-high"
                        : l.kind === "stderr"
                          ? "text-danger"
                          : "text-console-text"
                    }
                  >
                    {l.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p
            id={`${editorId}-help`}
            className="text-body-sm text-on-surface-variant"
          >
            Tab menyisipkan 4 spasi. Tekan Esc lalu Tab untuk keluar dari
            editor. Batas: {CODE_LIMITS.maxLines} baris,{" "}
            {CODE_LIMITS.maxBytes / 1024} KB.
          </p>
          {tooBig ? (
            <p
              role="alert"
              className="rounded-xl bg-error-container p-3 text-body-sm text-on-error-container"
            >
              Kodenya terlalu panjang untuk ditinjau. Pendekkan dulu, ya.
            </p>
          ) : null}

          <details className="card p-5">
            <summary className="cursor-pointer text-body-md font-semibold text-on-surface">
              Pengaturan lanjutan (opsional)
            </summary>
            <label
              htmlFor={`${editorId}-goal`}
              className="mt-4 block text-body-sm font-semibold text-on-surface"
            >
              Apa tujuan kodemu?
            </label>
            <input
              id={`${editorId}-goal`}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              maxLength={300}
              className="field mt-2 text-body-md"
              placeholder="Contoh: mencetak angka 1 sampai 5"
            />
            {lang === "python" ? (
              <>
                <label
                  htmlFor={`${editorId}-stdin`}
                  className="mt-4 block text-body-sm font-semibold text-on-surface"
                >
                  Jawaban untuk <code className="font-mono">input()</code> (satu
                  per baris)
                </label>
                <textarea
                  id={`${editorId}-stdin`}
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  maxLength={2000}
                  rows={3}
                  className="field mt-2 font-mono text-label-code-lg"
                  placeholder="FlipBot"
                />
              </>
            ) : null}
          </details>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="btn-primary flex-1"
              onClick={runCode}
              disabled={!canRun || running || tooBig || !code.trim()}
              aria-describedby={`${editorId}-run`}
            >
              <Icon name={running ? "hourglass_top" : "play_arrow"} />
              {running ? "Menjalankan…" : "Jalankan"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={requestReview}
              disabled={busy || tooBig || !code.trim()}
            >
              <Icon name={busy ? "hourglass_top" : "auto_awesome"} />
              {busy ? "FlipBot membaca…" : "Minta Saran FlipBot"}
            </button>
          </div>
          <p
            id={`${editorId}-run`}
            className="flex items-start gap-2 text-body-sm text-on-surface-variant"
          >
            <Icon name="shield" size={18} />
            {runtime
              ? `${runtime.note}${runtime.kind === "worker" ? ` Batas: ${RUNNER_LIMITS.timeoutMs / 1000} detik dan ${MAX_OUTPUT_CHARS.toLocaleString("id-ID")} karakter output.${pyVersion && lang === "python" ? ` (Pyodide ${pyVersion})` : ""}` : ""}`
              : "Bahasa ini belum bisa dijalankan dengan aman di browser (butuh compiler di server). Kamu tetap bisa meminta saran AI, dan contoh kode di pelajaran sudah dicek dengan compiler sungguhan."}
          </p>
        </section>

        <section className="space-y-6 lg:col-span-5" aria-live="polite">
          {error ? (
            <div
              role="alert"
              className="card flex items-start gap-3 border-error-container p-5"
            >
              <Icon name="cloud_off" className="text-error" />
              <p className="text-body-md text-on-surface">{error}</p>
            </div>
          ) : null}
          {runError ? <RunErrorPanel error={runError} /> : null}
          {preview ? (
            <div className="card space-y-3 p-4">
              <h2 className="flex items-center gap-2 px-2 text-headline-sm text-on-surface">
                <Icon name="visibility" className="text-primary" />
                Pratinjau {runtime?.label}
              </h2>
              <iframe
                title={`Pratinjau ${runtime?.label ?? ""}`}
                sandbox="allow-scripts"
                srcDoc={preview}
                referrerPolicy="no-referrer"
                className="h-80 w-full rounded-2xl border-[1.5px] border-outline-variant bg-white"
              />
            </div>
          ) : null}
          {!review && !error ? (
            <div className="card space-y-3 p-6">
              <h2 className="flex items-center gap-2 text-headline-sm text-on-surface">
                <Icon name="checklist" className="text-primary" />
                Saran FlipBot
              </h2>
              <p className="text-body-md text-on-surface-variant">
                Belum ada saran. Tulis kodemu lalu tekan “Minta Saran FlipBot”.
              </p>
            </div>
          ) : null}
          {review ? <ReviewPanel review={review} /> : null}
          {language ? (
            <div className="rounded-3xl bg-surface-container-low p-6">
              <h2 className="text-headline-sm text-on-surface">
                Batas saran AI untuk {language.label}
              </h2>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                Berlaku untuk “Minta Saran FlipBot”.
                {canRun
                  ? ` Tombol “Jalankan” memakai ${runtime?.label} sungguhan di browsermu.`
                  : ""}
              </p>
              <ul className="mt-2 space-y-1.5 text-body-sm text-on-surface">
                {language.limitations.map((l) => (
                  <li key={l} className="flex gap-2">
                    <Icon name="info" size={18} className="text-primary" />
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function ReviewPanel({ review }: { review: Review }) {
  return (
    <>
      <div className="card space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-headline-sm text-on-surface">
            <Icon name="checklist" className="text-primary" />
            Saran FlipBot
          </h2>
          <span className="chip bg-surface-container text-on-surface-variant">
            {review.findings.length} saran
          </span>
        </div>
        {review.mockMode ? (
          <Chip tone="error" icon="warning">
            Mode uji: contoh saran, bukan AI sungguhan
          </Chip>
        ) : null}
        {review.findings.length === 0 ? (
          <p className="text-body-md text-on-surface-variant">
            FlipBot tidak menemukan saran untuk kode ini. Itu bukan jaminan
            kodenya benar.
          </p>
        ) : (
          <ol className="space-y-3">
            {review.findings.map((f) => (
              <li
                key={f.id}
                className="space-y-2 rounded-2xl bg-surface-container-low p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`chip ${SEVERITY[f.severity].tone}`}>
                    {SEVERITY[f.severity].label}
                  </span>
                  {f.range ? (
                    <span className="chip bg-surface-container-lowest font-mono font-normal text-on-surface-variant">
                      Baris {f.range.startLine}
                      {f.range.endLine !== f.range.startLine
                        ? `–${f.range.endLine}`
                        : ""}
                    </span>
                  ) : null}
                  <span className="chip bg-surface-container-lowest text-on-surface-variant">
                    {f.verification === "confirmed_diagnostic"
                      ? `Dari alat: ${f.tool?.name ?? ""}`
                      : "Saran AI"}
                  </span>
                </div>
                <h3 className="text-body-md font-semibold text-on-surface">
                  {f.title}
                </h3>
                <p className="text-body-sm text-on-surface">{f.explanation}</p>
                {f.evidence ? (
                  <pre className="overflow-x-auto rounded-lg bg-inverse-surface p-2 font-mono text-label-code-sm text-inverse-on-surface">
                    {f.evidence}
                  </pre>
                ) : null}
                <p className="text-body-sm text-on-surface-variant">
                  <strong className="text-on-surface">Coba:</strong>{" "}
                  {f.remediation}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
      <div className="card space-y-3 p-6">
        <h2 className="text-headline-sm text-on-surface">
          Perkiraan Kualitas Kode
        </h2>
        <p className="text-body-sm text-on-surface-variant">
          Ini nilai kualitas kode dari saran di atas, terpisah dari nilai
          pemahamanmu.
        </p>
        <ul className="space-y-2">
          {review.quality.dimensions.map((d) => (
            <li key={d.dimension} className="space-y-1">
              <div className="flex justify-between text-body-sm text-on-surface">
                <span>{DIMENSION[d.dimension]}</span>
                <span className="font-mono">{d.score}/100</span>
              </div>
              <div
                className="h-2.5 overflow-hidden rounded-full bg-surface-container-highest"
                aria-hidden="true"
              >
                <div
                  className="h-full rounded-full bg-primary-container"
                  style={{ width: `${d.score}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
        <p className="text-body-sm text-on-surface-variant">
          {review.quality.basis}
        </p>
      </div>
    </>
  );
}

function RunErrorPanel({ error }: { error: RunError }) {
  return (
    <div role="alert" className="card space-y-3 border-error-container p-6">
      <h2 className="flex items-center gap-2 text-headline-sm text-on-surface">
        <Icon name="bug_report" className="text-error" />
        {error.line ? `Ada error di baris ${error.line}` : "Ada error"}
      </h2>
      <p className="text-body-md text-on-surface">
        <span className="font-mono font-semibold">{error.type}</span>
        {error.message ? `: ${error.message}` : ""}
      </p>
      <p className="text-body-sm text-on-surface-variant">
        Ini pesan asli dari Python. Baca baris yang disebut, lalu coba perbaiki.
        Kalau bingung, tekan “Minta Saran FlipBot”.
      </p>
      {error.traceback ? (
        <details>
          <summary className="cursor-pointer text-body-sm font-semibold text-primary">
            Lihat pesan lengkap
          </summary>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-console p-3 font-mono text-label-code-sm text-danger">
            {error.traceback}
          </pre>
        </details>
      ) : null}
    </div>
  );
}
