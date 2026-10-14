import type { Metadata } from "next";
import { LeaderboardView } from "@/app/_components/leaderboard-view";
import { PageFrame } from "@/app/_components/states";

export const metadata: Metadata = { title: "Papan Peringkat" };

export default function LeaderboardPage() {
  return (
    <PageFrame>
      <LeaderboardView />
    </PageFrame>
  );
}
