"use client";

import {
  collection,
  collectionGroup,
  doc,
  type DocumentData,
  type QueryDocumentSnapshot,
  type DocumentSnapshot,
} from "firebase/firestore";
import { getDb } from "./client";

/** Centralized Firestore paths — keep in sync with firestore.rules. */
export const paths = {
  user: (uid: string) => doc(getDb(), "users", uid),
  userPreference: (uid: string, id: string) => doc(getDb(), "users", uid, "preferences", id),
  workspace: (ws: string) => doc(getDb(), "workspaces", ws),
  members: (ws: string) => collection(getDb(), "workspaces", ws, "members"),
  member: (ws: string, uid: string) => doc(getDb(), "workspaces", ws, "members", uid),
  invitations: (ws: string) => collection(getDb(), "workspaces", ws, "invitations"),
  projects: (ws: string) => collection(getDb(), "workspaces", ws, "projects"),
  project: (ws: string, p: string) => doc(getDb(), "workspaces", ws, "projects", p),
  tasks: (ws: string, p: string) => collection(getDb(), "workspaces", ws, "projects", p, "tasks"),
  task: (ws: string, p: string, t: string) => doc(getDb(), "workspaces", ws, "projects", p, "tasks", t),
  comments: (ws: string, p: string) => collection(getDb(), "workspaces", ws, "projects", p, "comments"),
  comment: (ws: string, p: string, c: string) => doc(getDb(), "workspaces", ws, "projects", p, "comments", c),
  files: (ws: string, p: string) => collection(getDb(), "workspaces", ws, "projects", p, "files"),
  file: (ws: string, p: string, f: string) => doc(getDb(), "workspaces", ws, "projects", p, "files", f),
  milestones: (ws: string, p: string) => collection(getDb(), "workspaces", ws, "projects", p, "milestones"),
  milestone: (ws: string, p: string, m: string) =>
    doc(getDb(), "workspaces", ws, "projects", p, "milestones", m),
  projectActivity: (ws: string, p: string) => collection(getDb(), "workspaces", ws, "projects", p, "activity"),
  notifications: (ws: string) => collection(getDb(), "workspaces", ws, "notifications"),
  notification: (ws: string, n: string) => doc(getDb(), "workspaces", ws, "notifications", n),
  settings: (ws: string, id: string) => doc(getDb(), "workspaces", ws, "settings", id),
  allTasks: () => collectionGroup(getDb(), "tasks"),
  allActivity: () => collectionGroup(getDb(), "activity"),
  allMemberships: () => collectionGroup(getDb(), "members"),
};

export function withId<T>(snap: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>): T {
  return { ...(snap.data() as object), id: snap.id } as T;
}
