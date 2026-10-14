import type { Metadata } from "next";
import { JourneyView } from "@/app/_components/journey-view";
import { PageFrame } from "@/app/_components/states";

export const metadata: Metadata = {
  title: "Perjalananku",
  robots: { index: false },
};

export default function JourneyPage() {
  return (
    <PageFrame>
      <JourneyView />
    </PageFrame>
  );
}
