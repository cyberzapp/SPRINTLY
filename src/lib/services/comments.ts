"use client";

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { paths } from "@/lib/firebase/firestore";
import type { Comment, CommentAttachment } from "@/types";

export async function addComment(
  uid: string,
  workspaceId: string,
  projectId: string,
  taskId: string,
  body: string,
  mentionIds: string[] = [],
  attachments: CommentAttachment[] = [],
  parentId: string | null = null
): Promise<string> {
  const commentRef = doc(paths.comments(workspaceId, projectId));

  const newComment: Record<string, unknown> = {
    workspaceId,
    projectId,
    taskId,
    parentId,
    body: body.trim(),
    mentionIds,
    attachments,
    authorId: uid,
    edited: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(commentRef, newComment);
  return commentRef.id;
}

export async function updateComment(
  workspaceId: string,
  projectId: string,
  commentId: string,
  body: string,
  mentionIds: string[] = []
) {
  const ref = paths.comment(workspaceId, projectId, commentId);
  await updateDoc(ref, {
    body: body.trim(),
    mentionIds,
    edited: true,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteComment(
  workspaceId: string,
  projectId: string,
  commentId: string
) {
  const ref = paths.comment(workspaceId, projectId, commentId);
  await deleteDoc(ref);
}
