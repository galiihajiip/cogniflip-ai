"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { apiFetch } from "@/app/_lib/api";
import { meResponseSchema } from "@/shared/api/auth";
import { ownProfileResponseSchema } from "@/shared/api/profile";
import { rewardsResponseSchema } from "@/shared/api/rewards";

type Account = {
  /** `loading` until /api/auth/me answers; `unavailable` if it failed. */
  status: "loading" | "signed_out" | "signed_in" | "unavailable";
  handle: string | null;
  avatarKey: string | null;
  totalXp: number | null;
  refresh: () => Promise<void>;
};

const AccountContext = createContext<Account>({
  status: "loading",
  handle: null,
  avatarKey: null,
  totalXp: null,
  refresh: async () => {},
});

export function useAccount() {
  return useContext(AccountContext);
}

/**
 * Who is signed in, their XP and display preferences, for the header and
 * pages. Display only: every permission is still checked by the server.
 */
export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Omit<Account, "refresh">>({
    status: "loading",
    handle: null,
    avatarKey: null,
    totalXp: null,
  });

  const refresh = useCallback(async () => {
    const me = await apiFetch("/api/auth/me", meResponseSchema);
    if (!me.ok) {
      setState({
        status: "unavailable",
        handle: null,
        avatarKey: null,
        totalXp: null,
      });
      return;
    }
    const user = me.data.user;
    if (!user) {
      setState({
        status: "signed_out",
        handle: null,
        avatarKey: null,
        totalXp: null,
      });
      applyPreferences(undefined);
      return;
    }
    const [rewards, profile] = await Promise.all([
      apiFetch("/api/rewards", rewardsResponseSchema),
      apiFetch("/api/profile", ownProfileResponseSchema),
    ]);
    setState({
      status: "signed_in",
      handle: user.handle,
      avatarKey: profile.ok ? profile.data.profile.avatarKey : null,
      totalXp: rewards.ok ? rewards.data.totalXp : null,
    });
    applyPreferences(profile.ok ? profile.data.profile.preferences : undefined);
  }, []);

  useEffect(() => {
    // Initial load of the account state from the server.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  return (
    <AccountContext.Provider value={{ ...state, refresh }}>
      {children}
    </AccountContext.Provider>
  );
}

/** Applies display preferences to <html> (see globals.css). */
export function applyPreferences(
  prefs: { reducedMotion?: boolean; textSize?: "normal" | "besar" } | undefined,
) {
  const root = document.documentElement;
  root.dataset.reducedMotion = prefs?.reducedMotion ? "true" : "false";
  root.dataset.textSize = prefs?.textSize ?? "normal";
}
