/**
 * Public Firebase web configuration. These values identify the Firebase
 * project and are safe to ship to the browser — access is controlled by
 * Firebase Security Rules and App Check, NOT by keeping these secret.
 *
 * Never put service-account credentials or other secrets in NEXT_PUBLIC_*.
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || undefined,
};

export const firebaseEnv = {
  useEmulators: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true",
  emulatorHost: process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST || "127.0.0.1",
  functionsRegion: process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION || "us-central1",
  appCheckSiteKey: process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY || "",
  appCheckDebugToken: process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN || "",
  vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "",
  analyticsEnabled: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
};

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}
