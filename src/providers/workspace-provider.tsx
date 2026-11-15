"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { query, where } from "firebase/firestore";
import { useAuth } from "./auth-provider";
import { useCollection, useDocument } from "@/hooks/use-firestore";
import { paths } from "@/lib/firebase/firestore";
import { setLastWorkspace } from "@/lib/services/users";
import type { Member, Project, Role, Task, Workspace } from "@/types";

interface WorkspaceContextValue {
  memberships: Member[];
  membershipsLoading: boolean;
  workspaceId: string | null;
  workspace: Workspace | null;
  role: Role | null;
  members: Member[];
  membersById: Record<string, Member>;
  projects: Project[];
  projectsById: Record<string, Project>;
  tasks: Task[];
  tasksLoading: boolean;
  loading: boolean;
  error: Error | null;
  offline: boolean;
  switchWorkspace: (id: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

/**
 * Owns the shared, real-time listeners for the active workspace. Pages derive
 * their views from these streams instead of opening duplicate listeners:
 *   - memberships (collection group, current user)
 *   - workspace document
 *   - members, projects
 *   - all tasks in the workspace (collection group filtered by workspaceId)
 */
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const uid = user?.uid ?? null;

  const membershipsState = useCollection<Member>(
    uid ? query(paths.allMemberships(), where("userId", "==", uid)) : null,
    `memberships:${uid}`,
  );
  const memberships = useMemo(
    () => [...membershipsState.data].sort((a, b) => (a.workspaceName ?? "").localeCompare(b.workspaceName ?? "")),
    [membershipsState.data],
  );

  const workspaceId = useMemo(() => {
    if (!memberships.length) return null;
    const preferred = profile?.lastWorkspaceId;
    if (preferred && memberships.some((m) => m.workspaceId === preferred)) return preferred;
    return memberships[0].workspaceId;
  }, [memberships, profile?.lastWorkspaceId]);

  // Persist the fallback selection so other devices resume in the same place.
  useEffect(() => {
    if (uid && workspaceId && profile && profile.lastWorkspaceId !== workspaceId) {
      setLastWorkspace(uid, workspaceId).catch(() => {});
    }
  }, [uid, workspaceId, profile]);

  const ws = workspaceId;
  const workspaceState = useDocument<Workspace>(ws ? paths.workspace(ws) : null, `ws:${ws}`);
  const membersState = useCollection<Member>(ws ? paths.members(ws) : null, `members:${ws}`);
  const projectsState = useCollection<Project>(ws ? paths.projects(ws) : null, `projects:${ws}`);
  const tasksState = useCollection<Task>(
    ws ? query(paths.allTasks(), where("workspaceId", "==", ws)) : null,
    `tasks:${ws}`,
  );

  const switchWorkspace = useCallback(
    async (id: string) => {
      if (!uid) return;
      await setLastWorkspace(uid, id);
    },
    [uid],
  );

  const value = useMemo<WorkspaceContextValue>(() => {
    const members = [...membersState.data].sort((a, b) => a.displayName.localeCompare(b.displayName));
    const projects = [...projectsState.data].sort(
      (a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0),
    );
    const membersById = Object.fromEntries(members.map((m) => [m.id, m]));
    const projectsById = Object.fromEntries(projects.map((p) => [p.id, p]));
    const role = memberships.find((m) => m.workspaceId === ws)?.role ?? null;
    return {
      memberships,
      membershipsLoading: membershipsState.loading,
      workspaceId: ws,
      workspace: workspaceState.data,
      role,
      members,
      membersById,
      projects,
      projectsById,
      // Only keep tasks for projects that still exist (deleted project subtrees may lag briefly).
      tasks: tasksState.data.filter((t) => !!projectsById[t.projectId]),
      tasksLoading: tasksState.loading,
      loading:
        membershipsState.loading ||
        (!!ws && (workspaceState.loading || membersState.loading || projectsState.loading)),
      error: membershipsState.error || workspaceState.error || projectsState.error || tasksState.error || null,
      offline: tasksState.fromCache && projectsState.fromCache,
      switchWorkspace,
    };
  }, [memberships, membershipsState, ws, workspaceState, membersState, projectsState, tasksState, switchWorkspace]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return ctx;
}
