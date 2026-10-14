import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/app/_components/icon";
import { DebugMission } from "@/app/_components/missions/debug-mission";
import { PredictMission } from "@/app/_components/missions/predict-mission";
import { PageFrame } from "@/app/_components/states";
import { getServerEnv } from "@/server/config/env";
import { listMissions, toMissionView } from "@/server/missions/service";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ missionId: string }> };

function find(id: string) {
  const all = listMissions(getServerEnv()).map(toMissionView);
  const index = all.findIndex((m) => m.id === id);
  if (index < 0) return null;
  const next = all[index + 1];
  return {
    mission: all[index]!,
    next: next ? { id: next.id, title: next.title } : null,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = find((await params).missionId);
  return { title: found ? found.mission.title : "Misi tidak ditemukan" };
}

/** ST-09/09a (predict) and ST-10b-style debugging, adapted to fixture-based checking. */
export default async function MissionPage({ params }: Props) {
  const found = find((await params).missionId);
  if (!found) notFound();
  const { mission, next } = found;
  return (
    <PageFrame>
      <Link
        href="/misi"
        className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-surface-container px-4 text-label-ui text-primary hover:bg-surface-container-high"
      >
        <Icon name="arrow_back" size={18} />
        Kembali ke Arena Misi
      </Link>
      {mission.kind === "predict" ? (
        <PredictMission mission={mission} next={next} />
      ) : (
        <DebugMission mission={mission} next={next} />
      )}
    </PageFrame>
  );
}
