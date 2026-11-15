"use client";

import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { getDb } from "@/lib/firebase/client";
import { paths } from "@/lib/firebase/firestore";
import type { NotificationPreferences, OnboardingState, UserProfile } from "@/types";

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  inApp: {
    task_assigned: true,
    task_mentioned: true,
    task_due_soon: true,
    task_overdue: true,
    comment_received: true,
    project_invitation: true,
    workspace_invitation: true,
    project_update: true,
  },
  push: false,
  email: false,
};

/** Create the Firestore profile for a newly authenticated user (idempotent). */
export async function ensureUserProfile(user: User, displayName?: string): Promise<void> {
  const ref = paths.user(user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  const profile: Omit<UserProfile, "id" | "createdAt" | "updatedAt"> & Record<string, unknown> = {
    email: (user.email ?? "").toLowerCase(),
    displayName: displayName || user.displayName || (user.email ? user.email.split("@")[0] : "Guest"),
    photoURL: user.photoURL ?? null,
    jobTitle: "",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    lastWorkspaceId: null,
    onboarding: { step: 1, completed: false, teamType: null, workspaceId: null },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, profile);
  await setDoc(paths.userPreference(user.uid, "notifications"), {
    ...DEFAULT_NOTIFICATION_PREFS,
    updatedAt: serverTimestamp(),
  });
}

export type ProfileUpdate = Partial<Pick<UserProfile, "displayName" | "photoURL" | "jobTitle" | "timeZone">>;

export async function updateUserProfile(uid: string, data: ProfileUpdate) {
  await updateDoc(paths.user(uid), { ...data, updatedAt: serverTimestamp() });
}

export async function updateOnboarding(uid: string, data: Partial<OnboardingState>) {
  const updates: Record<string, unknown> = { updatedAt: serverTimestamp() };
  for (const [k, v] of Object.entries(data)) updates[`onboarding.${k}`] = v;
  await updateDoc(paths.user(uid), updates);
}

export async function setLastWorkspace(uid: string, workspaceId: string) {
  await updateDoc(paths.user(uid), { lastWorkspaceId: workspaceId, updatedAt: serverTimestamp() });
}

export async function saveNotificationPreferences(uid: string, prefs: NotificationPreferences) {
  await setDoc(doc(getDb(), "users", uid, "preferences", "notifications"), {
    ...prefs,
    updatedAt: serverTimestamp(),
  });
}
