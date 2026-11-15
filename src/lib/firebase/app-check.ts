"use client";

import type { FirebaseApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { firebaseEnv } from "./config";

let initialized = false;

/**
 * Firebase App Check — attests that requests come from the genuine Sprintly
 * web app. Enabled when NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY is provided
 * (reCAPTCHA Enterprise). In local development you can register a debug token
 * via NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN.
 *
 * After verifying metrics in the Firebase console, turn on enforcement for
 * Firestore, Storage and Cloud Functions.
 */
export function initAppCheck(app: FirebaseApp) {
  if (initialized || typeof window === "undefined") return;
  if (firebaseEnv.useEmulators || !firebaseEnv.appCheckSiteKey) return;
  initialized = true;
  if (firebaseEnv.appCheckDebugToken) {
    (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN =
      firebaseEnv.appCheckDebugToken === "true" ? true : firebaseEnv.appCheckDebugToken;
  }
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(firebaseEnv.appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    console.warn("[Sprintly] App Check failed to initialize", error);
  }
}
