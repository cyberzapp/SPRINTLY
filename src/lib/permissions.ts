import type { Role } from "@/types";

/**
 * Client-side permission helpers. These ONLY drive UI affordances; every
 * operation is independently authorized by Firestore/Storage Security Rules
 * and Cloud Functions.
 */
const RANK: Record<Role, number> = { viewer: 0, member: 1, admin: 2, owner: 3 };

export function hasRole(role: Role | null | undefined, min: Role): boolean {
  if (!role) return false;
  return RANK[role] >= RANK[min];
}

export const can = {
  write: (role?: Role | null) => hasRole(role, "member"),
  manageMembers: (role?: Role | null) => hasRole(role, "admin"),
  manageWorkspace: (role?: Role | null) => hasRole(role, "admin"),
  manageProjects: (role?: Role | null) => hasRole(role, "admin"),
  viewReports: (role?: Role | null) => hasRole(role, "viewer"),
  ownerOnly: (role?: Role | null) => role === "owner",
  /** Can a user edit tasks inside a given project? Mirrors `canEditProjectContent` in firestore.rules. */
  editProjectContent: (role: Role | null | undefined, uid: string | undefined, memberIds: string[]) =>
    hasRole(role, "admin") || (role === "member" && !!uid && memberIds.includes(uid)),
  /** Roles an actor is allowed to assign to others. */
  assignableRoles: (role?: Role | null): Role[] =>
    role === "owner" ? ["admin", "member", "viewer"] : role === "admin" ? ["member", "viewer"] : [],
};
