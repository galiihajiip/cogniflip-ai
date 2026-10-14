"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";
import { z } from "zod";
import { applyPreferences, useAccount } from "@/app/_components/account";
import { Icon } from "@/app/_components/icon";
import { SignInNeeded } from "@/app/_components/sign-in-needed";
import { ErrorBlock, LoadingBlock } from "@/app/_components/states";
import { apiFetch, failureMessage, type ApiFailure } from "@/app/_lib/api";
import { AVATAR_ICON, AVATAR_LABEL } from "@/app/_lib/view";
import { isDemoHandle } from "@/shared/api/demo";
import { AVATAR_KEYS, ownProfileResponseSchema } from "@/shared/api/profile";

type Profile = z.infer<typeof ownProfileResponseSchema>["profile"];
const deletedSchema = z.object({ deleted: z.literal(true) });

/** Own profile: avatar, leaderboard opt-in, display preferences, export, delete. */
export function ProfileView() {
  const account = useAccount();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [failure, setFailure] = useState<ApiFailure | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const load = useCallback(async () => {
    setFailure(null);
    const r = await apiFetch("/api/profile", ownProfileResponseSchema);
    if (r.ok) setProfile(r.data.profile);
    else setFailure(r);
  }, []);

  useEffect(() => {
    // Load the profile once the account is known.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (account.status === "signed_in") void load();
  }, [account.status, load]);

  async function update(patch: Record<string, unknown>, message: string) {
    setSaving(true);
    setSaved(null);
    const r = await apiFetch("/api/profile", ownProfileResponseSchema, {
      method: "PATCH",
      body: patch,
    });
    setSaving(false);
    if (r.ok) {
      setProfile(r.data.profile);
      applyPreferences(r.data.profile.preferences);
      setSaved(message);
      void account.refresh();
    } else setFailure(r);
  }

  if (account.status === "loading")
    return <LoadingBlock label="Memuat akunmu…" />;
  if (account.status !== "signed_in")
    return <SignInNeeded what="mengatur profil dan privasimu" next="/profil" />;
  if (failure && !profile)
    return (
      <ErrorBlock
        message={failureMessage(failure)}
        onRetry={() => void load()}
      />
    );
  if (!profile) return <LoadingBlock label="Memuat profilmu…" />;

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 rounded-3xl bg-surface-container-low p-6 sm:flex-row sm:items-center sm:p-8">
        <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-on-primary">
          <Icon name={AVATAR_ICON[profile.avatarKey] ?? "person"} size={44} />
        </span>
        <div>
          <p className="text-label-ui uppercase text-primary">
            Profil &amp; Privasi
          </p>
          <h1 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg">
            @{profile.handle}
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Orang lain hanya bisa melihat nama samaran dan avatarmu.
          </p>
        </div>
      </section>

      <p
        role="status"
        aria-live="polite"
        className="min-h-6 text-body-sm text-primary"
      >
        {saving ? "Menyimpan…" : saved ? `✓ ${saved}` : ""}
      </p>
      {failure ? <ErrorBlock message={failureMessage(failure)} /> : null}

      <section className="card space-y-4 p-6">
        <h2 className="text-headline-sm text-on-surface">Pilih Avatar</h2>
        <div
          role="radiogroup"
          aria-label="Avatar"
          className="grid grid-cols-3 gap-3 sm:grid-cols-6"
        >
          {AVATAR_KEYS.map((key) => {
            const active = profile.avatarKey === key;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={saving}
                onClick={() =>
                  void update({ avatarKey: key }, "Avatar disimpan")
                }
                className={`flex flex-col items-center gap-2 rounded-2xl border-[1.5px] p-3 text-label-ui ${
                  active
                    ? "border-primary-container bg-primary-fixed text-primary"
                    : "border-transparent bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <Icon
                  name={AVATAR_ICON[key] ?? "person"}
                  size={32}
                  filled={active}
                />
                {AVATAR_LABEL[key]}
                {active ? <span className="sr-only">(dipilih)</span> : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="card space-y-5 p-6">
        <h2 className="text-headline-sm text-on-surface">
          Privasi &amp; Tampilan
        </h2>
        <Toggle
          label="Tampilkan aku di papan peringkat"
          description="Hanya nama samaran, avatar, dan XP yang terlihat. Bisa dimatikan kapan saja."
          checked={profile.leaderboardOptIn}
          disabled={saving}
          onChange={(v) =>
            void update(
              { leaderboardOptIn: v },
              v
                ? "Kamu tampil di papan peringkat"
                : "Kamu disembunyikan dari papan peringkat",
            )
          }
        />
        <Toggle
          label="Kurangi animasi"
          description="Gerakan di layar dibuat seminimal mungkin."
          checked={profile.preferences.reducedMotion ?? false}
          disabled={saving}
          onChange={(v) =>
            void update(
              { preferences: { ...profile.preferences, reducedMotion: v } },
              "Pengaturan animasi disimpan",
            )
          }
        />
        <Toggle
          label="Teks lebih besar"
          description="Semua tulisan dibuat sedikit lebih besar."
          checked={profile.preferences.textSize === "besar"}
          disabled={saving}
          onChange={(v) =>
            void update(
              {
                preferences: {
                  ...profile.preferences,
                  textSize: v ? "besar" : "normal",
                },
              },
              "Ukuran teks disimpan",
            )
          }
        />
      </section>

      <section className="card space-y-3 p-6">
        <h2 className="text-headline-sm text-on-surface">Data Milikmu</h2>
        <p className="text-body-md text-on-surface-variant">
          Unduh semua data yang tersimpan tentangmu dalam satu file.
        </p>
        <a
          href="/api/account/export"
          download="data-cogniflip.json"
          className="btn-secondary w-fit"
        >
          <Icon name="download" /> Unduh Dataku
        </a>
      </section>

      {isDemoHandle(profile.handle) ? (
        <section className="card space-y-2 p-6">
          <h2 className="text-headline-sm text-on-surface">Akun Demo</h2>
          <p className="text-body-md text-on-surface-variant">
            Ini akun demo yang dipakai bersama, jadi tidak bisa dihapus. Riwayat
            dan XP-nya juga terlihat oleh pemakai demo lainnya. Buat akunmu
            sendiri kalau ingin menyimpan perjalanan belajarmu.
          </p>
        </section>
      ) : (
        <DeleteAccount
          onDeleted={async () => {
            await account.refresh();
            router.push("/");
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p id={id} className="text-body-md font-semibold text-on-surface">
          {label}
        </p>
        <p className="text-body-sm text-on-surface-variant">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={id}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-primary-container" : "bg-outline-variant"
        }`}
      >
        <span
          className={`inline-block h-6 w-6 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-7" : "translate-x-1"
          }`}
        />
        <span className="sr-only">{checked ? "Aktif" : "Mati"}</span>
      </button>
    </div>
  );
}

function DeleteAccount({ onDeleted }: { onDeleted: () => Promise<void> }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove(e: React.FormEvent) {
    e.preventDefault();
    if (confirm !== "HAPUS" || !password || busy) return;
    setBusy(true);
    setError(null);
    const r = await apiFetch("/api/account", deletedSchema, {
      method: "DELETE",
      body: { password, confirm: "HAPUS" },
    });
    setBusy(false);
    if (r.ok) await onDeleted();
    else
      setError(
        r.code === "INVALID_CREDENTIALS"
          ? "Kata sandi salah."
          : failureMessage(r),
      );
  }

  return (
    <section className="card space-y-3 border-error-container p-6">
      <h2 className="text-headline-sm text-on-surface">Hapus Akun</h2>
      <p className="text-body-md text-on-surface-variant">
        Akun, riwayat belajar, XP, dan lencanamu akan dihapus dan tidak bisa
        dikembalikan. Ajak orang tua atau gurumu sebelum melakukannya.
      </p>
      {!open ? (
        <button
          type="button"
          className="btn-secondary w-fit text-error"
          onClick={() => setOpen(true)}
        >
          <Icon name="delete" /> Aku ingin menghapus akunku
        </button>
      ) : (
        <form onSubmit={remove} className="space-y-3" noValidate>
          <label
            htmlFor={`${id}-p`}
            className="block text-body-md font-semibold text-on-surface"
          >
            Kata sandimu
          </label>
          <input
            id={`${id}-p`}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field max-w-sm"
          />
          <label
            htmlFor={`${id}-c`}
            className="block text-body-md font-semibold text-on-surface"
          >
            Ketik <span className="font-mono">HAPUS</span> untuk memastikan
          </label>
          <input
            id={`${id}-c`}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="field max-w-sm font-mono"
            autoCapitalize="characters"
          />
          {error ? (
            <p role="alert" className="text-body-sm text-error">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={busy || confirm !== "HAPUS" || !password}
              className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-error px-5 font-bold text-on-error disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon name="delete" />{" "}
              {busy ? "Menghapus…" : "Hapus Akun Selamanya"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setOpen(false)}
            >
              Batal
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
