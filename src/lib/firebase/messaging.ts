"use client";

import { deleteToken, getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getDb, getFirebaseApp } from "./client";
import { firebaseConfig, firebaseEnv } from "./config";

/**
 * Firebase Cloud Messaging (web push).
 *
 * Permission is NEVER requested on page load. The UI calls
 * `enablePushNotifications()` only after the user explicitly opts in from the
 * notification center or notification settings.
 */
export async function isPushSupported(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) return false;
  if (!firebaseEnv.vapidKey) return false;
  try {
    return await isSupported();
  } catch {
    return false;
  }
}

export function pushPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

async function registerServiceWorker() {
  const params = new URLSearchParams({
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
  });
  return navigator.serviceWorker.register(`/firebase-messaging-sw.js?${params.toString()}`);
}

export async function enablePushNotifications(uid: string): Promise<"granted" | "denied" | "unsupported"> {
  if (!(await isPushSupported())) return "unsupported";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";
  const registration = await registerServiceWorker();
  const messaging = getMessaging(getFirebaseApp());
  const token = await getToken(messaging, { vapidKey: firebaseEnv.vapidKey, serviceWorkerRegistration: registration });
  if (token) {
    await setDoc(doc(getDb(), "users", uid, "fcmTokens", token), {
      token,
      userAgent: navigator.userAgent.slice(0, 200),
      createdAt: serverTimestamp(),
    });
  }
  return "granted";
}

export async function disablePushNotifications(uid: string) {
  if (!(await isPushSupported())) return;
  try {
    const registration = await registerServiceWorker();
    const messaging = getMessaging(getFirebaseApp());
    const token = await getToken(messaging, { vapidKey: firebaseEnv.vapidKey, serviceWorkerRegistration: registration });
    if (token) {
      await deleteDoc(doc(getDb(), "users", uid, "fcmTokens", token));
      await deleteToken(messaging);
    }
  } catch (error) {
    console.warn("[Sprintly] Failed to disable push", error);
  }
}

/** Foreground messages are already surfaced by the Firestore listener, so we just ignore them here. */
export async function listenForegroundMessages(cb: (title: string, body: string) => void) {
  if (!(await isPushSupported()) || pushPermission() !== "granted") return () => {};
  const messaging = getMessaging(getFirebaseApp());
  return onMessage(messaging, (payload) => {
    cb(payload.notification?.title ?? "Sprintly", payload.notification?.body ?? "");
  });
}
