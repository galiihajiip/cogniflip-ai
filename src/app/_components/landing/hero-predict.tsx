"use client";

import { useState } from "react";
import { FlipBotAvatar } from "@/app/_components/flipbot";
import { Icon } from "@/app/_components/icon";

const CODE = [
  { n: "01", text: "energi_lompat = 3" },
  { n: "02", text: "" },
  { n: "03", text: "for langkah in range(energi_lompat):", highlight: true },
  { n: "04", text: "    flipbot.lompat()" },
];

/**
 * Landing demo. A fixed, reviewed example: the answer is known in advance,
 * nothing is executed or scored, and it awards no XP.
 */
export function HeroPredict() {
  const [choice, setChoice] = useState<number | null>(null);
  const correct = choice === 3;
  return (
    <div className="card relative flex flex-col gap-5 p-6">
      <div className="flex items-start gap-4">
        <FlipBotAvatar tone="secondary" status="online" />
        <div className="flex-1 rounded-2xl border-[1.5px] border-bubble-border bg-surface-container-low p-4">
          <p className="pb-1 text-label-ui uppercase text-primary">
            FlipBot sedang penasaran
          </p>
          <p className="text-body-md text-on-surface">
            “Kak, aku menemukan kode ini. Katanya aku harus melompat beberapa
            kali. Tapi, berapa kali, ya? Bisa bantu aku menebaknya?”
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-inverse-surface p-5 font-mono text-label-code-sm text-inverse-on-surface shadow-inner">
        <div className="flex items-center justify-between pb-1 text-outline-variant">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-danger" />
            <span className="h-3 w-3 rounded-full bg-secondary-container" />
            <span className="h-3 w-3 rounded-full bg-tertiary-fixed-dim" />
            <span className="ml-2 text-surface-container-highest">
              contoh_lompat.py
            </span>
          </span>
          <span className="text-surface-container-high">Python</span>
        </div>
        <pre className="overflow-x-auto leading-relaxed">
          {CODE.map((line) => (
            <div
              key={line.n}
              className={`flex gap-3 rounded-lg px-2 py-0.5 ${line.highlight ? "bg-white/5" : ""}`}
            >
              <span className="select-none text-outline">{line.n}</span>
              <span className="whitespace-pre">{line.text || " "}</span>
            </div>
          ))}
        </pre>
        <fieldset className="mt-1 flex flex-col gap-2 rounded-xl bg-white/5 p-3">
          <legend className="mb-2 font-sans text-label-ui text-secondary-fixed-dim">
            Menurutmu, berapa kali FlipBot akan melompat?
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={choice === n}
                onClick={() => setChoice(n)}
                className="min-h-11 rounded-xl bg-inverse-surface/80 text-center text-label-code-lg shadow-sm ring-1 ring-white/10 transition-colors hover:bg-primary-container aria-pressed:bg-primary-container"
              >
                {n} kali
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div aria-live="polite">
        {choice !== null ? (
          <p
            className={`flex items-start gap-2 rounded-2xl p-4 text-body-md ${
              correct
                ? "bg-tertiary-fixed/60 text-on-tertiary-fixed"
                : "bg-secondary-fixed/60 text-on-secondary-fixed"
            }`}
          >
            <Icon
              name={correct ? "check_circle" : "lightbulb"}
              className={correct ? "text-tertiary" : "text-secondary"}
            />
            {correct ? (
              <span>
                “Yap, tiga kali! <code className="font-mono">range(3)</code>{" "}
                membuat perintah di dalam loop berjalan tiga kali. Ternyata kamu
                bisa membantu aku memahami kode!”
              </span>
            ) : (
              <span>
                “Hmm, sepertinya belum. Coba lihat lagi angka di{" "}
                <code className="font-mono">energi_lompat</code>, lalu tebak
                sekali lagi!”
              </span>
            )}
          </p>
        ) : null}
      </div>

      <p className="flex items-center gap-2 text-body-sm text-on-surface-variant">
        <Icon name="lightbulb" className="text-secondary" />
        Contoh interaktif. Coba tebak dulu sebelum melihat jawabannya.
      </p>
    </div>
  );
}
