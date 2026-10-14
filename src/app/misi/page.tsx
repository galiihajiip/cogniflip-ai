import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/app/_components/icon";
import { Chip, EmptyBlock, PageFrame } from "@/app/_components/states";
import { topicLabel } from "@/app/_lib/view";
import { getServerEnv } from "@/server/config/env";
import { listMissions, toMissionView } from "@/server/missions/service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Misi Debug",
  description: "Tebak hasil kode dan bantu FlipBot menemukan bug.",
};

/** Mission hub. No dedicated Stitch screen: built from the dashboard card pattern. */
export default function MissionsPage() {
  const missions = listMissions(getServerEnv()).map(toMissionView);
  const predict = missions.filter((m) => m.kind === "predict");
  const debug = missions.filter((m) => m.kind === "debug");

  return (
    <PageFrame>
      <section className="grid grid-cols-1 items-center gap-6 rounded-3xl bg-surface-container-low p-6 sm:p-10 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <Chip tone="secondary" icon="bug_report">
            Arena Misi
          </Chip>
          <h1 className="text-display-hero-mobile text-on-surface sm:text-display-hero">
            Tebak Dulu, <span className="text-primary">Baru Buktikan!</span>
          </h1>
          <p className="max-w-2xl text-body-lg text-on-surface-variant">
            Baca kode pendek, tebak hasilnya, lalu bantu FlipBot menemukan bug.
            Salah itu bagian dari belajar, tidak ada pengurangan XP.
          </p>
        </div>
        <div className="card space-y-2 p-5 text-body-sm text-on-surface lg:col-span-4">
          <p className="flex items-start gap-2">
            <Icon name="verified_user" size={18} className="text-primary" />
            Jawaban yang benar sudah dicek dengan Python sungguhan saat soal
            dibuat.
          </p>
          <p className="flex items-start gap-2">
            <Icon name="info" size={18} className="text-primary" />
            Di misi, tebakanmu dicocokkan dengan kunci jawaban. Mau mencoba
            sendiri? Jalankan kodenya di Mini IDE.
          </p>
        </div>
      </section>

      {missions.length === 0 ? (
        <EmptyBlock icon="quiz" title="Belum ada misi yang dibuka">
          Misi sedang diperiksa oleh tim sebelum boleh dipakai. Coba lagi nanti.
        </EmptyBlock>
      ) : null}

      {predict.length > 0 ? (
        <MissionGroup
          kicker="Tahap Prediksi"
          title="Tebak Hasil Kode"
          icon="quiz"
          tone="bg-secondary-fixed text-secondary"
          items={predict.map((m) => ({
            id: m.id,
            title: m.title,
            topic: m.topic,
            preview: m.code,
            meta: "Tebak output",
          }))}
          cta="Mulai Menebak"
        />
      ) : null}
      {debug.length > 0 ? (
        <MissionGroup
          kicker="Detektif Bug"
          title="Robot Debug"
          icon="bug_report"
          tone="bg-tertiary-fixed text-tertiary"
          items={debug.map((m) => ({
            id: m.id,
            title: m.title,
            topic: m.topic,
            preview: m.code,
            meta: `Tingkat ${m.difficulty}`,
          }))}
          cta="Cari Bug-nya"
        />
      ) : null}
    </PageFrame>
  );
}

function MissionGroup({
  kicker,
  title,
  icon,
  tone,
  items,
  cta,
}: {
  kicker: string;
  title: string;
  icon: string;
  tone: string;
  cta: string;
  items: Array<{
    id: string;
    title: string;
    topic: string;
    preview: string;
    meta: string;
  }>;
}) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}
        >
          <Icon name={icon} size={24} />
        </span>
        <div>
          <p className="text-label-ui uppercase text-primary">{kicker}</p>
          <h2 className="text-headline-md text-on-surface">{title}</h2>
        </div>
      </div>
      <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((m) => (
          <li key={m.id} className="card flex flex-col gap-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Chip tone="secondary">{topicLabel(m.topic)}</Chip>
              <span className="font-mono text-label-code-sm text-on-surface-variant">
                {m.meta}
              </span>
            </div>
            <h3 className="text-headline-sm text-on-surface">{m.title}</h3>
            <pre className="overflow-x-auto rounded-xl bg-inverse-surface p-3 font-mono text-label-code-sm leading-6 text-inverse-on-surface">
              {m.preview}
            </pre>
            <Link
              href={`/misi/${m.id}`}
              className="btn-primary mt-auto !min-h-12 text-body-md"
            >
              {cta}
              <Icon name="arrow_forward" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
