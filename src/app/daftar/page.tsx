import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/app/_components/auth-form";
import { PageFrame } from "@/app/_components/states";

export const metadata: Metadata = {
  title: "Buat Akun",
  robots: { index: false },
};

export default function Page() {
  return (
    <PageFrame>
      <Suspense>
        <AuthForm mode="daftar" />
      </Suspense>
    </PageFrame>
  );
}
