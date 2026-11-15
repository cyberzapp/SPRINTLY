"use client";

import { useMemo } from "react";
import { TASK_STATUS_MAP, TASK_PRIORITY_MAP } from "@/lib/constants";
import type { Task } from "@/types";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/common/user-avatar";
import { useWorkspace } from "@/providers/workspace-provider";
import { Calendar, ChevronRight } from "lucide-react";

interface ProjectTimelineTabProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
}

export function ProjectTimelineTab({ tasks, onSelectTask }: ProjectTimelineTabProps) {
  const { membersById } = useWorkspace();

  const datedTasks = useMemo(() => {
    return tasks
      .filter((t) => t.startDate || t.dueDate)
      .sort((a, b) => {
        const startA = a.startDate?.toMillis?.() ?? a.dueDate?.toMillis?.() ?? 0;
        const startB = b.startDate?.toMillis?.() ?? b.dueDate?.toMillis?.() ?? 0;
        return startA - startB;
      });
  }, [tasks]);

  return (
    <div className="space-y-4">
      <div className="p-5 rounded-xl border border-border bg-surface shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold tracking-tight">Timeline & Milestones (Gantt)</h3>
          <span className="text-xs text-muted-foreground">{datedTasks.length} scheduled items</span>
        </div>

        <div className="space-y-3">
          {datedTasks.map((t) => {
            const assignee = t.assigneeId ? membersById[t.assigneeId] : null;
            const statusMeta = TASK_STATUS_MAP[t.status];
            const start = t.startDate ? new Date(t.startDate.toMillis()).toLocaleDateString() : null;
            const due = t.dueDate ? new Date(t.dueDate.toMillis()).toLocaleDateString() : null;

            return (
              <div
                key={t.id}
                onClick={() => onSelectTask(t)}
                className="p-3 rounded-lg border border-border bg-background hover:border-primary/50 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: statusMeta?.color }}
                  />
                  <div>
                    <span className="font-semibold text-foreground hover:text-primary">
                      {t.title}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                      <Calendar className="size-3" />
                      <span>
                        {start ? `${start} — ${due || "No deadline"}` : `Due: ${due}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Badge
                    variant="outline"
                    className="text-[10px] capitalize"
                    style={{ borderColor: statusMeta?.color, color: statusMeta?.color }}
                  >
                    {statusMeta?.label}
                  </Badge>
                  {assignee && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <UserAvatar name={assignee.displayName} photoURL={assignee.photoURL} size="xs" />
                      <span className="text-[11px]">{assignee.displayName}</span>
                    </div>
                  )}
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              </div>
            );
          })}

          {datedTasks.length === 0 && (
            <div className="py-12 text-center text-xs text-muted-foreground space-y-1">
              <Calendar className="size-8 mx-auto text-muted-foreground/40 mb-2" />
              <p>No tasks with start or due dates scheduled yet.</p>
              <p className="text-[11px]">Set due dates on tasks to visualize the project roadmap.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
