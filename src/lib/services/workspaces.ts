"use client";

import { httpsCallable } from "firebase/functions";
import { getFirebaseFunctions, getDb } from "@/lib/firebase/client";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { paths } from "@/lib/firebase/firestore";
import type { Workspace, Role } from "@/types";

/**
 * Creates a workspace by calling the secure Cloud Function
 */
export async function createWorkspaceCall(data: {
  name: string;
  description?: string;
  teamType?: string;
}): Promise<string> {
  const fn = httpsCallable<{ name: string; description?: string; teamType?: string }, { workspaceId: string }>(
    getFirebaseFunctions(),
    "createWorkspace"
  );
  const res = await fn(data);
  return res.data.workspaceId;
}

/**
 * Invites a team member by email
 */
export async function inviteMemberCall(data: {
  workspaceId: string;
  email: string;
  role: "admin" | "member" | "viewer";
}): Promise<{ invitationId: string; token: string }> {
  const fn = httpsCallable<
    { workspaceId: string; email: string; role: string },
    { invitationId: string; token: string }
  >(getFirebaseFunctions(), "inviteMember");
  const res = await fn(data);
  return res.data;
}

/**
 * Accepts an invitation using its secure token
 */
export async function acceptInvitationCall(token: string): Promise<{ workspaceId: string }> {
  const fn = httpsCallable<{ token: string }, { workspaceId: string }>(
    getFirebaseFunctions(),
    "acceptInvitation"
  );
  const res = await fn({ token });
  return res.data;
}

/**
 * Updates a member's role (or transfers ownership)
 */
export async function updateMemberRoleCall(data: {
  workspaceId: string;
  targetUserId: string;
  newRole: Role;
}): Promise<void> {
  const fn = httpsCallable<
    { workspaceId: string; targetUserId: string; newRole: Role },
    { success: boolean }
  >(getFirebaseFunctions(), "updateMemberRole");
  await fn(data);
}

/**
 * Removes a member from workspace or self-leave
 */
export async function removeMemberCall(data: {
  workspaceId: string;
  targetUserId: string;
}): Promise<void> {
  const fn = httpsCallable<
    { workspaceId: string; targetUserId: string },
    { success: boolean }
  >(getFirebaseFunctions(), "removeMember");
  await fn(data);
}

/**
 * Updates basic workspace details (presentation fields allowed by firestore.rules)
 */
export async function updateWorkspaceDetails(
  workspaceId: string,
  uid: string,
  data: Partial<Pick<Workspace, "name" | "description" | "logoURL" | "preferences">>
) {
  const ref = paths.workspace(workspaceId);
  await updateDoc(ref, {
    ...data,
    updatedBy: uid,
    updatedAt: serverTimestamp(),
  });
}
