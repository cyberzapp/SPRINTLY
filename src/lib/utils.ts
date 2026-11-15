export { cn } from "cn";

import type { Timestamp } from "firebase/firestore";

type DateLike = Timestamp | Date | null | undefined;

/** Convert Firestore Timestamp | Date | null into a Date (or null). */
export function toDate(value: DateLike): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof (value as Timestamp).toDate === "function") return (value as Timestamp).toDate();
  return null;
}

export function toMillis(value: DateLike): number {
  return toDate(value)?.getTime() ?? 0;
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return ((parts[0][0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** Derive a short uppercase project key ("Website Redesign" -> "WR"). */
export function deriveProjectKey(name: string): string {
  const words = name
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "PRJ";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 4)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/**
 * Build lowercase prefix tokens used by the Firestore-compatible search
 * strategy (`array-contains`). Bounded to keep documents small.
 */
export function buildSearchKeywords(...texts: (string | null | undefined)[]): string[] {
  const tokens = new Set<string>();
  for (const text of texts) {
    if (!text) continue;
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/[\s-]+/)
      .filter((w) => w.length > 0)
      .slice(0, 20);
    for (const word of words) {
      for (let i = 1; i <= Math.min(word.length, 15); i++) tokens.add(word.slice(0, i));
    }
  }
  return Array.from(tokens).slice(0, 200);
}

export function randomId(len = 12): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const values = new Uint32Array(len);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => chars[v % chars.length]).join("");
}

/** Midpoint ordering for drag & drop (fractional indexing using doubles). */
export function orderBetween(before: number | null, after: number | null): number {
  if (before == null && after == null) return 1000;
  if (before == null) return (after as number) - 1000;
  if (after == null) return before + 1000;
  return (before + after) / 2;
}

export function downloadTextFile(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const s = cell == null ? "" : String(cell);
          return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\r\n");
}

/** Human-friendly message from Firebase errors. */
export function getErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? "";
  const map: Record<string, string> = {
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/wrong-password": "Incorrect email or password.",
    "auth/user-not-found": "No account exists with that email.",
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/weak-password": "Please choose a stronger password (at least 8 characters).",
    "auth/invalid-email": "That email address looks invalid.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/popup-closed-by-user": "The sign-in popup was closed before completing.",
    "auth/network-request-failed": "Network error. Check your connection and try again.",
    "auth/requires-recent-login": "For security, please sign in again and retry.",
    "auth/expired-action-code": "This link has expired. Please request a new one.",
    "auth/invalid-action-code": "This link is invalid or has already been used.",
    "auth/operation-not-allowed": "This sign-in method is not enabled for this Firebase project.",
    "permission-denied": "You don't have permission to perform this action.",
    "functions/permission-denied": "You don't have permission to perform this action.",
    unavailable: "Service temporarily unavailable — you may be offline.",
    "storage/unauthorized": "You don't have permission to access this file.",
    "storage/quota-exceeded": "Storage quota exceeded.",
    "storage/canceled": "Upload canceled.",
  };
  if (map[code]) return map[code];
  const message = (error as { message?: string })?.message;
  if (message) return message.replace(/^Firebase:\s*/, "").replace(/\s*\(.*\)\.?$/, "");
  return "Something went wrong. Please try again.";
}
