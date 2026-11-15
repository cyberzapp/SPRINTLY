"use client";

import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { paths } from "@/lib/firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { buildSearchKeywords } from "@/lib/utils";
import type { Task, TaskPriority, TaskStatus, Subtask } from "@/types";

export interface CreateTaskInput {
  workspaceId: string;
  projectId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  collaboratorIds?: string[];
  labels?: string[];
  startDate?: Date | null;
  dueDate?: Date | null;
  estimate?: number | null;
  subtasks?: Subtask[];
  blockedBy?: string[];
  order?: number;
}

/**
 * Creates a task atomically incrementing the project's task sequence
 */
export async function createTask(uid: string, input: CreateTaskInput): Promise<string> {
  const db = getDb();
  const projectRef = paths.project(input.workspaceId, input.projectId);
  const taskRef = doc(paths.tasks(input.workspaceId, input.projectId));

  await runTransaction(db, async (tx) => {
    const projSnap = await tx.get(projectRef);
    if (!projSnap.exists()) {
      throw new Error("Project does not exist.");
    }
    const currentSeq = (projSnap.data().taskSeq || 0) + 1;
    tx.update(projectRef, { taskSeq: currentSeq });

    const searchKeywords = buildSearchKeywords(
      input.title,
      input.description,
      ...(input.labels || [])
    );

    const newTask: Record<string, unknown> = {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      number: currentSeq,
      title: input.title.trim(),
      description: input.description?.trim() || "",
      status: input.status || "todo",
      priority: input.priority || "medium",
      assigneeId: input.assigneeId || null,
      collaboratorIds: input.collaboratorIds || [],
      labels: input.labels || [],
      startDate: input.startDate ? Timestamp.fromDate(input.startDate) : null,
      dueDate: input.dueDate ? Timestamp.fromDate(input.dueDate) : null,
      estimate: input.estimate ?? null,
      subtasks: input.subtasks || [],
      blockedBy: input.blockedBy || [],
      order: input.order ?? 1000,
      completedAt: input.status === "done" ? serverTimestamp() : null,
      searchKeywords,
      commentCount: 0,
      attachmentCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: uid,
      updatedBy: uid,
    };

    tx.set(taskRef, newTask);
  });

  return taskRef.id;
}

export async function updateTask(
  workspaceId: string,
  projectId: string,
  taskId: string,
  uid: string,
  data: Partial<Omit<Task, "id" | "workspaceId" | "projectId" | "number" | "createdAt" | "createdBy">>
) {
  const ref = paths.task(workspaceId, projectId, taskId);
  const updates: Record<string, unknown> = {
    ...data,
    updatedBy: uid,
    updatedAt: serverTimestamp(),
  };

  if ("title" in data || "description" in data || "labels" in data) {
    updates.searchKeywords = buildSearchKeywords(
      data.title,
      data.description,
      ...(data.labels || [])
    );
  }

  if (data.status) {
    if (data.status === "done") {
      updates.completedAt = serverTimestamp();
    } else {
      updates.completedAt = null;
    }
  }

  await updateDoc(ref, updates);
}

export async function deleteTask(workspaceId: string, projectId: string, taskId: string) {
  const ref = paths.task(workspaceId, projectId, taskId);
  await deleteDoc(ref);
}
