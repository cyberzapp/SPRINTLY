"use client";

import { useWorkspace } from "@/providers/workspace-provider";
import { useCollection } from "@/hooks/use-firestore";
import { paths } from "@/lib/firebase/firestore";
import {
  CheckCircle2,
  FolderPlus,
  MessageSquare,
  UserCheck,
  FileUp,
  Tag,
  AlertCircle,
  Activity as ActivityIcon,
} from "lucide-react";
import type { Activity } from "@/types";

interface ProjectActivityTabProps {
  projectId: string;
}

export function ProjectActivityTab({ projectId }: ProjectActivityTabProps) {
  const { workspaceId } = useWorkspace();

  const activityState = useCollection<Activity>(
    workspaceId ? paths.projectActivity(workspaceId, projectId) : null,
    `activity:${workspaceId}:${projectId}`
  );

  const activities = [...activityState.data].sort(
    (a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
  );

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "task_created":
        return <FolderPlus className="size-3.5 text-blue-500" />;
      case "task_completed":
        return <CheckCircle2 className="size-3.5 text-emerald-500" />;
      case "comment_added":
        return <MessageSquare className="size-3.5 text-purple-500" />;
      case "file_uploaded":
        return <FileUp className="size-3.5 text-amber-500" />;
      case "member_joined":
        return <UserCheck className="size-3.5 text-indigo-500" />;
      default:
        return <ActivityIcon className="size-3.5 text-muted-foreground" />;
    }
  };

  const getActivityDescription = (act: Activity) => {
    switch (act.type) {
      case "task_created":
        return `created task "${act.targetName}"`;
      case "task_completed":
        return `completed task "${act.targetName}"`;
      case "task_status_changed":
        return `updated status on "${act.targetName}" to ${act.data?.status || "new status"}`;
      case "comment_added":
        return `commented on "${act.targetName}"`;
      case "file_uploaded":
        return `uploaded file "${act.targetName}"`;
      case "project_created":
        return `initialized project "${act.targetName}"`;
      default:
        return `performed action on "${act.targetName}"`;
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="p-5 rounded-xl border border-border bg-surface shadow-soft space-y-4">
        <h3 className="text-sm font-bold tracking-tight">Project Activity Stream</h3>

        <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-px before:bg-border">
          {activities.map((act) => (
            <div key={act.id} className="flex items-start gap-3 pl-1 text-xs relative">
              <div className="size-7 rounded-full bg-background border border-border flex items-center justify-center shrink-0 z-10 shadow-2xs">
                {getActivityIcon(act.type)}
              </div>
              <div className="flex-1 pt-1 space-y-0.5">
                <p className="text-foreground">
                  <span className="font-semibold text-primary">{act.actorName}</span>{" "}
                  <span className="text-muted-foreground">{getActivityDescription(act)}</span>
                </p>
                <span className="text-[10px] text-muted-foreground block">
                  {act.createdAt
                    ? new Date(act.createdAt.toMillis()).toLocaleString()
                    : "Recent"}
                </span>
              </div>
            </div>
          ))}

          {activities.length === 0 && (
            <div className="py-10 text-center text-xs text-muted-foreground">
              No recorded activity yet in this project.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
