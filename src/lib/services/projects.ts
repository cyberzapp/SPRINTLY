"use client";

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { paths } from "@/lib/firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { deriveProjectKey } from "@/lib/utils";
import type { Project, ProjectStatus } from "@/types";

export interface CreateProjectInput {
  workspaceId: string;
  name: string;
  key?: string;
  description?: string;
  icon?: string;
  color?: string;
  ownerId: string;
  memberIds?: string[];
  status?: ProjectStatus;
  startDate?: Date | null;
  dueDate?: Date | null;
}

export async function createProject(uid: string, input: CreateProjectInput): Promise<string> {
  const ws = input.workspaceId;
  const projectRef = doc(paths.projects(ws));
  const key = input.key ? input.key.trim().toUpperCase() : deriveProjectKey(input.name);

  const newProject: Record<string, unknown> = {
    workspaceId: ws,
    name: input.name.trim(),
    key,
    description: input.description?.trim() || "",
    icon: input.icon || "🚀",
    color: input.color || "#635BFF",
    ownerId: input.ownerId,
    memberIds: input.memberIds || [input.ownerId],
    status: input.status || "active",
    startDate: input.startDate ? Timestamp.fromDate(input.startDate) : null,
    dueDate: input.dueDate ? Timestamp.fromDate(input.dueDate) : null,
    taskSeq: 0,
    taskCount: 0,
    completedTaskCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: uid,
    updatedBy: uid,
  };

  await setDoc(projectRef, newProject);
  return projectRef.id;
}

export async function updateProject(
  workspaceId: string,
  projectId: string,
  uid: string,
  data: Partial<Omit<Project, "id" | "workspaceId" | "createdAt" | "createdBy">>
) {
  const ref = paths.project(workspaceId, projectId);
  await updateDoc(ref, {
    ...data,
    updatedBy: uid,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProject(workspaceId: string, projectId: string) {
  const ref = paths.project(workspaceId, projectId);
  await deleteDoc(ref);
}
