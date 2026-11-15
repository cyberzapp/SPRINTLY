"use client";

import { getAnalytics, isSupported, logEvent, setUserId, type Analytics } from "firebase/analytics";
import { getFirebaseApp } from "./client";
import { firebaseConfig, firebaseEnv } from "./config";

/**
 * Privacy-conscious product analytics:
 * - Disabled unless NEXT_PUBLIC_ENABLE_ANALYTICS=true and a measurementId exists.
 * - Always skipped when running against the Firebase Emulator Suite.
 * - Event parameters never include task titles, comment bodies or emails —
 *   only coarse product events (e.g. "task_created").
 * - Users can opt out in Settings → Profile (stored locally as a consent flag).
 */
let analytics: Analytics | null = null;
let loading: Promise<Analytics | null> | null = null;

export const ANALYTICS_OPT_OUT_KEY = "sprintly:analytics-opt-out";

function optedOut() {
  try {
    return window.localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

async function load(): Promise<Analytics | null> {
  if (typeof window === "undefined") return null;
  if (!firebaseEnv.analyticsEnabled || firebaseEnv.useEmulators || !firebaseConfig.measurementId) return null;
  if (optedOut()) return null;
  if (analytics) return analytics;
  if (!loading) {
    loading = isSupported()
      .then((ok) => (ok ? (analytics = getAnalytics(getFirebaseApp())) : null))
      .catch(() => null);
  }
  return loading;
}

export type ProductEvent =
  | "sign_up"
  | "login"
  | "onboarding_completed"
  | "workspace_created"
  | "project_created"
  | "task_created"
  | "task_completed"
  | "comment_added"
  | "member_invited"
  | "report_exported"
  | "demo_started";

export async function track(event: ProductEvent, params?: Record<string, string | number | boolean>) {
  const a = await load();
  if (a) logEvent(a, event as string, params);
}

export async function identify(uid: string | null) {
  const a = await load();
  if (a && uid) setUserId(a, uid);
}
