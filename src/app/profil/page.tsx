import type { Metadata } from "next";
import { ProfileView } from "@/app/_components/profile-view";
import { PageFrame } from "@/app/_components/states";

export const metadata: Metadata = {
  title: "Profil & Privasi",
  robots: { index: false },
};

export default function ProfilePage() {
  return (
    <PageFrame>
      <ProfileView />
    </PageFrame>
  );
}
