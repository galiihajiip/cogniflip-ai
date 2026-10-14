import type { WorkerLike } from "@/app/_lib/python-runner";

/**
 * Languages the Mini IDE can actually run, all inside the learner's browser
 * (D-012, D-015). Everything else is AI review only.
 */
export type WorkerRuntime = {
  kind: "worker";
  label: string;
  command: string;
  /** Shown while the runtime loads for the first time. */
  loading: string | null;
  note: string;
  create: () => WorkerLike;
};
export type PreviewRuntime = { kind: "preview"; label: string; note: string };

const worker = (url: string, type: "module" | "classic") => () =>
  new Worker(url, { type, name: "cogniflip-runner" }) as unknown as WorkerLike;

export const RUNTIMES: Record<string, WorkerRuntime | PreviewRuntime> = {
  python: {
    kind: "worker",
    label: "Python",
    command: "python main.py",
    loading:
      "Menyiapkan Python di browsermu (sekitar 12 MB, hanya pertama kali)…",
    note: "Python sungguhan (Pyodide) di browsermu, bukan di server, tanpa akses internet.",
    create: worker("/runner/python-worker.mjs", "module"),
  },
  javascript: {
    kind: "worker",
    label: "JavaScript",
    command: "node main.js",
    loading: null,
    note: "JavaScript berjalan di worker browser yang tidak bisa mengakses internet. document (DOM) tidak tersedia di sini; untuk halaman web pakai bahasa HTML.",
    create: worker("/runner-js/js-worker.mjs", "module"),
  },
  sql: {
    kind: "worker",
    label: "SQL",
    command: "sqlite3 :memory:",
    loading: "Menyiapkan SQLite di browsermu (sekitar 0,7 MB)…",
    note: "SQLite sungguhan di browsermu. Setiap kali dijalankan, database dimulai kosong, jadi tulis CREATE TABLE dan INSERT dulu.",
    create: worker("/runner/sql-worker.js", "classic"),
  },
  html: {
    kind: "preview",
    label: "HTML",
    note: "Halaman ditampilkan di bingkai terkunci: tanpa akses ke akunmu dan tanpa memuat apa pun dari internet.",
  },
  css: {
    kind: "preview",
    label: "CSS",
    note: "Gayamu diterapkan ke halaman contoh (paragraf, .penting, .kartu, .menu, .galeri) di bingkai terkunci.",
  },
};

/** CSP for the preview frame: inline styles/scripts only, nothing remote. */
export const PREVIEW_CSP =
  "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; font-src data:";

const CSS_DEMO = `<h1>Pratinjau CSS</h1>
<p>Ini paragraf biasa.</p>
<p class="penting">Ini paragraf dengan class penting.</p>
<div class="kartu">Ini .kartu</div>
<nav class="menu"><span>Beranda</span><span>Belajar</span><span>Misi</span></nav>
<div class="galeri"><div>1</div><div>2</div><div>3</div><div>4</div><div>5</div><div>6</div></div>`;

/**
 * Document for the sandboxed preview iframe. The CSP meta comes first so it
 * applies before any learner markup; learner meta tags cannot loosen it.
 */
export function buildPreview(language: "html" | "css", code: string): string {
  const head = `<meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${PREVIEW_CSP}"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:system-ui,sans-serif;margin:16px;color:#131b2e}.galeri>div,.menu>span{background:#eaedff;padding:8px;border-radius:8px}</style>`;
  const body =
    language === "css"
      ? `${CSS_DEMO}<style>${code.replace(/<\/style/gi, "<\\/style")}</style>`
      : code;
  return `<!DOCTYPE html><html><head>${head}</head><body>${body}</body></html>`;
}

export const STARTER: Record<string, string> = {
  python:
    '# Misi: FlipBot melompat 4 kali\nlompatan = 0\nfor i in range(4):\n    print("Lompat ke-", i + 1)\n    lompatan = lompatan + 1\nprint("Total lompatan:", lompatan)\n',
  javascript:
    '// Misi: FlipBot melompat 4 kali\nlet lompatan = 0;\nfor (let i = 1; i <= 4; i++) {\n  console.log("Lompat ke-", i);\n  lompatan++;\n}\nconsole.log("Total lompatan:", lompatan);\n',
  html: '<h1>Halo, aku FlipBot!</h1>\n<p>Ini halaman web pertamaku.</p>\n<button id="tombol">Klik aku</button>\n<p id="pesan">Belum diklik</p>\n<script>\n  document.getElementById("tombol").addEventListener("click", () => {\n    document.getElementById("pesan").textContent = "Halo! Kamu mengeklik.";\n  });\n</script>\n',
  css: "p {\n  color: navy;\n}\n.penting {\n  color: white;\n  background-color: orange;\n}\n.menu {\n  display: flex;\n  gap: 12px;\n}\n.galeri {\n  display: grid;\n  grid-template-columns: 1fr 2fr 1fr;\n  gap: 8px;\n}\n",
  sql: "CREATE TABLE murid (nama TEXT, skor INTEGER);\nINSERT INTO murid VALUES ('Ani', 90), ('Budi', 70), ('Citra', 80);\nSELECT nama, skor FROM murid WHERE skor >= 80 ORDER BY skor DESC;\n",
  java: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Halo dari Java!");\n  }\n}\n',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Halo dari C++!" << endl;\n  return 0;\n}\n',
};
