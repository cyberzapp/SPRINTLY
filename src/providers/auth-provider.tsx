"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { onIdTokenChanged, type User } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { paths } from "@/lib/firebase/firestore";
import { useDocument } from "@/hooks/use-firestore";
import { ensureUserProfile } from "@/lib/services/users";
import { identify } from "@/lib/firebase/analytics";
import type { UserProfile } from "@/types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  /** True until Firebase restores the persisted session (and the profile, if signed in). */
  loading: boolean;
  configured: boolean;
  /** Password accounts must verify their email; Google & demo accounts are exempt. */
  needsEmailVerification: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(configured);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!configured) return;
    const auth = getFirebaseAuth();
    // onIdTokenChanged also fires after reload()/emailVerified changes.
    return onIdTokenChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      setTick((t) => t + 1);
      if (u) {
        identify(u.uid);
        ensureUserProfile(u).catch((e) => console.warn("[Sprintly] ensure profile failed", e));
      }
    });
  }, [configured]);

  const profileState = useDocument<UserProfile>(user ? paths.user(user.uid) : null, `user:${user?.uid ?? "none"}`);

  const value = useMemo<AuthContextValue>(() => {
    const isPasswordUser = !!user?.providerData.some((p) => p.providerId === "password");
    return {
      user,
      profile: profileState.data,
      loading: authLoading || (!!user && profileState.loading && !profileState.data),
      configured,
      needsEmailVerification: !!user && !user.isAnonymous && isPasswordUser && !user.emailVerified,
      refreshUser: async () => {
        const current = getFirebaseAuth().currentUser;
        if (current) {
          await current.reload();
          await current.getIdToken(true);
          setUser(getFirebaseAuth().currentUser);
          setTick((t) => t + 1);
        }
      },
    };
  }, [user, profileState.data, profileState.loading, authLoading, configured]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
