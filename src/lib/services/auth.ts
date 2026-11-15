"use client";

import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updatePassword,
  updateProfile,
  applyActionCode,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { firebaseEnv } from "@/lib/firebase/config";
import { ensureUserProfile } from "./users";

function actionSettings() {
  return { url: `${firebaseEnv.appUrl}/login`, handleCodeInApp: false };
}

export async function signUpWithEmail(name: string, email: string, password: string) {
  const auth = getFirebaseAuth();
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  await ensureUserProfile(cred.user, name);
  try {
    await sendEmailVerification(cred.user, actionSettings());
  } catch (error) {
    console.warn("[Sprintly] verification email failed", error);
  }
  return cred.user;
}

export async function signInWithEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  await ensureUserProfile(cred.user);
  return cred.user;
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const cred = await signInWithPopup(getFirebaseAuth(), provider);
  await ensureUserProfile(cred.user);
  return cred.user;
}

/** Anonymous auth powers the isolated demo: each visitor gets a private sandbox. */
export async function signInForDemo() {
  const cred = await signInAnonymously(getFirebaseAuth());
  await ensureUserProfile(cred.user, "Demo Visitor");
  return cred.user;
}

export async function resendVerificationEmail() {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("You are not signed in.");
  await sendEmailVerification(user, actionSettings());
}

export async function requestPasswordReset(email: string) {
  await sendPasswordResetEmail(getFirebaseAuth(), email, actionSettings());
}

export async function verifyResetCode(code: string) {
  return verifyPasswordResetCode(getFirebaseAuth(), code);
}

export async function completePasswordReset(code: string, newPassword: string) {
  await confirmPasswordReset(getFirebaseAuth(), code, newPassword);
}

export async function applyEmailVerificationCode(code: string) {
  await applyActionCode(getFirebaseAuth(), code);
  await getFirebaseAuth().currentUser?.reload();
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const user = getFirebaseAuth().currentUser;
  if (!user || !user.email) throw new Error("You are not signed in with a password account.");
  const cred = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, cred);
  await updatePassword(user, newPassword);
}

export async function reauthenticate(currentPassword: string) {
  const user = getFirebaseAuth().currentUser;
  if (!user || !user.email) return;
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
}

export async function signOut() {
  await fbSignOut(getFirebaseAuth());
}
