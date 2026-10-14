"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useRef, useState } from "react";
import { useAccount } from "@/app/_components/account";
import { FlipBotAvatar } from "@/app/_components/flipbot";
import { Icon } from "@/app/_components/icon";
import { apiFetch, failureMessage } from "@/app/_lib/api";
import { DEMO_ACCOUNT } from "@/shared/api/demo";
import {
  handleSchema,
  meResponseSchema,
  passwordSchema,
} from "@/shared/api/auth";

function handleProblem(handle: string): string | null {
  const r = handleSchema.safeParse(handle);
  if (r.success) return null;
  const msg = r.error.issues[0]?.message;
  if (msg === "reserved")
    return "Nama ini tidak boleh dipakai. Pilih nama lain.";
  if (msg === "looks_like_contact_details")
    return "Jangan pakai nomor telepon atau angka panjang di nama penggunamu.";
  return "3–20 karakter, diawali huruf, hanya huruf kecil, angka, dan garis bawah (_).";
}

function passwordProblem(password: string, handle: string): string | null {
  const r = passwordSchema.safeParse(password);
  if (!r.success)
    return r.error.issues[0]?.message === "too_common"
      ? "Kata sandi ini terlalu mudah ditebak. Coba yang lain."
      : "Kata sandi minimal 8 karakter.";
  if (handle && password.toLowerCase().includes(handle.trim().toLowerCase()))
    return "Kata sandi tidak boleh berisi nama penggunamu.";
  return null;
}

/** Handle + password sign-in and registration (D-010). No email, no real name. */
export function AuthForm({ mode }: { mode: "masuk" | "daftar" }) {
  const router = useRouter();
  const params = useSearchParams();
  const account = useAccount();
  const id = useId();
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const register = mode === "daftar";
  const submitRef = useRef<HTMLButtonElement>(null);
  const [filled, setFilled] = useState(false);

  function fillDemo() {
    setHandle(DEMO_ACCOUNT.handle);
    setPassword(DEMO_ACCOUNT.password);
    setError(null);
    setTouched(false);
    setFilled(true);
    submitRef.current?.focus();
  }

  const hErr = register
    ? handleProblem(handle)
    : handle.trim()
      ? null
      : "Isi nama penggunamu.";
  const pErr = register
    ? passwordProblem(password, handle)
    : password
      ? null
      : "Isi kata sandimu.";
  const cErr =
    register && confirm !== password ? "Kata sandinya belum sama." : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (hErr || pErr || cErr || busy) return;
    setBusy(true);
    setError(null);
    const r = await apiFetch(
      register ? "/api/auth/register" : "/api/auth/login",
      meResponseSchema,
      {
        method: "POST",
        body: { handle: handle.trim().toLowerCase(), password },
      },
    );
    setBusy(false);
    if (!r.ok) {
      setError(
        register && r.code === "CONFLICT"
          ? "Nama pengguna ini sudah dipakai. Coba nama lain."
          : register && r.code === "VALIDATION_ERROR"
            ? "Nama pengguna atau kata sandi belum memenuhi aturan."
            : failureMessage(r),
      );
      return;
    }
    await account.refresh();
    const next = params.get("lanjut");
    router.push(
      next && next.startsWith("/") && !next.startsWith("//")
        ? next
        : "/belajar",
    );
    router.refresh();
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl grid-cols-1 items-center gap-8 lg:grid-cols-2">
      <section className="hidden space-y-5 rounded-3xl bg-surface-container-low p-8 lg:block">
        <FlipBotAvatar size="lg" tone="secondary" />
        <h2 className="text-headline-lg text-on-surface">
          {register ? "Simpan perjalanan belajarmu" : "Selamat datang kembali!"}
        </h2>
        <ul className="space-y-3 text-body-md text-on-surface">
          <li className="flex gap-2">
            <Icon name="shield" className="text-primary" />
            Tidak perlu email, nama asli, atau sekolah.
          </li>
          <li className="flex gap-2">
            <Icon name="bolt" className="text-primary" />
            XP dan lencana tersimpan di akunmu.
          </li>
          <li className="flex gap-2">
            <Icon name="family_restroom" className="text-primary" />
            Minta izin orang tua atau guru sebelum membuat akun.
          </li>
        </ul>
      </section>
      <form onSubmit={submit} noValidate className="card space-y-5 p-6 sm:p-8">
        <div>
          <h1 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg">
            {register ? "Buat Akun" : "Masuk"}
          </h1>
          <p className="text-body-md text-on-surface-variant">
            {register
              ? "Pilih nama samaran yang lucu, bukan nama aslimu."
              : "Masuk dengan nama pengguna dan kata sandimu."}
          </p>
        </div>
        {!register ? (
          <div className="space-y-3 rounded-2xl border-[1.5px] border-bubble-border bg-tertiary-fixed/30 p-4">
            <div className="flex items-center gap-2">
              <Icon name="rocket_launch" className="text-primary" />
              <h2 className="text-body-md font-bold text-on-surface">
                Akun Demo
              </h2>
            </div>
            <p className="text-body-sm text-on-surface-variant">
              Mau langsung mencoba semua fitur? Pakai akun demo ini. Akun ini
              dipakai bersama, jadi jangan tulis data pribadi.
            </p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-body-sm">
              <dt className="text-on-surface-variant">Nama pengguna</dt>
              <dd className="font-mono font-semibold text-on-surface">
                {DEMO_ACCOUNT.handle}
              </dd>
              <dt className="text-on-surface-variant">Kata sandi</dt>
              <dd className="font-mono font-semibold text-on-surface">
                {DEMO_ACCOUNT.password}
              </dd>
            </dl>
            <button
              type="button"
              onClick={fillDemo}
              className="btn-secondary w-full bg-surface-container-lowest"
            >
              <Icon name="edit_note" />
              Isi Otomatis Akun Demo
            </button>
            <p
              role="status"
              aria-live="polite"
              className="text-body-sm text-primary"
            >
              {filled ? "Terisi! Tekan “Masuk” untuk melanjutkan." : ""}
            </p>
          </div>
        ) : null}
        <Field
          id={`${id}-h`}
          label="Nama pengguna"
          hint={register ? "Contoh: penjelajah_kode7" : undefined}
          error={touched ? hErr : null}
        >
          <input
            id={`${id}-h`}
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={40}
            aria-invalid={touched && hErr ? true : undefined}
            aria-describedby={`${id}-h-msg`}
            className="field text-body-md"
          />
        </Field>
        <Field
          id={`${id}-p`}
          label="Kata sandi"
          hint={
            register ? "Minimal 8 karakter. Jangan beri tahu teman." : undefined
          }
          error={touched ? pErr : null}
        >
          <div className="relative">
            <input
              id={`${id}-p`}
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={register ? "new-password" : "current-password"}
              maxLength={128}
              aria-invalid={touched && pErr ? true : undefined}
              aria-describedby={`${id}-p-msg`}
              className="field pr-14 text-body-md"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container"
              aria-label={
                show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
              }
              aria-pressed={show}
            >
              <Icon name="visibility" />
            </button>
          </div>
        </Field>
        {register ? (
          <Field
            id={`${id}-c`}
            label="Ulangi kata sandi"
            error={touched ? cErr : null}
          >
            <input
              id={`${id}-c`}
              type={show ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              maxLength={128}
              aria-invalid={touched && cErr ? true : undefined}
              aria-describedby={`${id}-c-msg`}
              className="field text-body-md"
            />
          </Field>
        ) : null}
        {error ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl bg-error-container p-3 text-body-sm text-on-error-container"
          >
            <Icon name="error" size={18} />
            {error}
          </p>
        ) : null}
        {register ? (
          <p className="text-body-sm text-on-surface-variant">
            Belum ada cara memulihkan kata sandi yang lupa. Simpan kata sandimu
            baik-baik, ya.
          </p>
        ) : null}
        <button
          ref={submitRef}
          type="submit"
          className="btn-primary w-full"
          disabled={busy}
        >
          <Icon
            name={busy ? "hourglass_top" : register ? "rocket_launch" : "login"}
          />
          {busy ? "Sebentar…" : register ? "Buat Akun" : "Masuk"}
        </button>
        <p className="text-center text-body-sm text-on-surface-variant">
          {register ? "Sudah punya akun? " : "Belum punya akun? "}
          <Link
            href={register ? "/masuk" : "/daftar"}
            className="font-semibold text-primary underline"
          >
            {register ? "Masuk" : "Buat akun"}
          </Link>
          {" • "}
          <Link
            href="/belajar"
            className="font-semibold text-primary underline"
          >
            Belajar tanpa akun
          </Link>
        </p>
      </form>
    </div>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-body-md font-semibold text-on-surface"
      >
        {label}
      </label>
      {children}
      <p
        id={`${id}-msg`}
        className={`text-body-sm ${error ? "text-error" : "text-on-surface-variant"}`}
      >
        {error ?? hint ?? ""}
      </p>
    </div>
  );
}
