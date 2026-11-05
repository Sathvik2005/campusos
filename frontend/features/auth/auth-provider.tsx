"use client";

import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiError, NetworkError, apiFetch, setTokenProvider, setUnauthorizedHandler } from "@/lib/api/client";
import { getSupabase } from "@/lib/supabase/client";
import type { Me } from "@/types/api";

export type AuthState =
  | { status: "loading" }
  | { status: "unconfigured" }
  | { status: "anonymous"; message?: string }
  | { status: "forbidden"; message: string }
  | { status: "error"; message: string }
  | { status: "authenticated"; user: Me };

interface AuthContextValue {
  state: AuthState;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  retry: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const PROFILE_KEY = "campusos.profile.v1";

/**
 * The last confirmed profile (id, role, display name only: no token, no PII beyond the name) so the app can reopen
 * when the API is unreachable. It is presentation only: the API still authorises every request, and a cached
 * profile is used only if it belongs to the user of the current Supabase session.
 */
export function readCachedProfile(sessionUserId: string | null | undefined): Me | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw || !sessionUserId) return null;
    const me = JSON.parse(raw) as Me;
    return me && me.id === sessionUserId ? me : null;
  } catch {
    return null;
  }
}
function cacheProfile(me: Me | null) {
  try {
    if (me) localStorage.setItem(PROFILE_KEY, JSON.stringify(me));
    else localStorage.removeItem(PROFILE_KEY);
  } catch {
    /* storage unavailable: offline reopen simply is not available */
  }
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** Test seam: lets component tests supply a fixed auth value without Supabase. */
export const AuthTestProvider = AuthContext.Provider;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => getSupabase(), []);
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>(supabase ? { status: "loading" } : { status: "unconfigured" });
  const [attempt, setAttempt] = useState(0);

  const loadProfile = useCallback(async () => {
    try {
      const user = await apiFetch<Me>("/api/v1/auth/me");
      cacheProfile(user);
      setState({ status: "authenticated", user });
    } catch (e) {
      if (e instanceof ApiError && (e.status === 403 || e.status === 401)) cacheProfile(null);
      if (e instanceof ApiError && e.status === 403) {
        setState({ status: "forbidden", message: "Your account is signed in but has no CampusOS access yet. Ask an Office Admin." });
      } else if (e instanceof ApiError && e.status === 401) {
        await supabase?.auth.signOut();
        setState({ status: "anonymous", message: "Your session expired. Please sign in again." });
      } else if (e instanceof NetworkError) {
        const session = (await supabase?.auth.getSession())?.data.session;
        const cached = readCachedProfile(session?.user.id);
        if (cached) setState({ status: "authenticated", user: cached }); // reopen offline; saved work stays reachable
        else setState({ status: "error", message: "Can't reach the server right now. Your sign-in is kept; try again." });
      } else {
        setState({ status: "error", message: "Something went wrong while loading your profile." });
      }
    }
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;
    setTokenProvider(async () => (await supabase.auth.getSession()).data.session?.access_token ?? null);
    setUnauthorizedHandler(() => {
      void supabase.auth.signOut();
      queryClient.clear();
      setState({ status: "anonymous", message: "Your session expired. Please sign in again." });
    });
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) void loadProfile();
      else setState({ status: "anonymous" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") setState({ status: "anonymous" });
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
      setUnauthorizedHandler(null);
    };
  }, [supabase, loadProfile, queryClient, attempt]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return "Sign-in is not configured for this environment.";
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return error.status === 400 ? "That email or password is not correct." : "Could not sign in. Please try again.";
      }
      setState({ status: "loading" });
      await loadProfile();
      return null;
    },
    [supabase, loadProfile],
  );

  const signOut = useCallback(async () => {
    cacheProfile(null);
    await supabase?.auth.signOut();
    queryClient.clear();
    setState({ status: "anonymous" });
  }, [supabase, queryClient]);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  const value = useMemo(() => ({ state, signIn, signOut, retry }), [state, signIn, signOut, retry]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
