"use client";

import { useMemo, useState } from "react";
import { useWorkspace } from "@/providers/workspace-provider";
import { useAuth } from "@/providers/auth-provider";
import { TaskDetailDrawer } from "@/components/tasks/task-detail-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle2, Clock, Calendar, CheckSquare } from "lucide-react";
import { ProjectIcon } from "@/components/common/project-icon";
import type { Task } from "@/types";
import { TASK_STATUS_MAP, TASK_PRIORITY_MAP } from "@/lib/constants";

export default function MyTasksPage() {
  const { user } = useAuth();
  const { tasks, projectsById } = useWorkspace();

  const [activeFilter, setActiveFilter] = useState<"all" | "today" | "upcoming" | "completed">("all");
  const [search, setSearch] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const myTasks = useMemo(() => {
    return tasks.filter((t) => t.assigneeId === user?.uid);
  }, [tasks, user]);

  const filteredTasks = useMemo(() => {
    const now = Date.now();
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    const endOfToday = new Date().setHours(23, 59, 59, 999);

    return myTasks.filter((t) => {
      // Search
      const matchesSearch =
        !search.trim() ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      const due = t.dueDate ? t.dueDate.toMillis() : null;

      if (activeFilter === "today") {
        return t.status !== "done" && due && due >= startOfToday && due <= endOfToday;
      }
      if (activeFilter === "upcoming") {
        return t.status !== "done" && (!due || due > endOfToday);
      }
      if (activeFilter === "completed") {
        return t.status === "done";
      }

      return true;
    });
  }, [myTasks, activeFilter, search]);

  const handleOpenTask = (task: Task) => {
    setSelectedTask(task);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          My Tasks
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Everything assigned to you across all projects in this workspace.
        </p>
      </div>

      {/* Filter Tabs and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 border border-border p-0.5 rounded-lg bg-surface">
          {[
            { id: "all", label: `All (${myTasks.length})` },
            { id: "today", label: "Due Today" },
            { id: "upcoming", label: "Upcoming" },
            { id: "completed", label: "Completed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`text-xs px-3 py-1 rounded-md transition-colors ${
                activeFilter === tab.id
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search my tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-xs h-8"
          />
        </div>
      </div>

      {/* Tasks Table */}
      <div className="border border-border rounded-xl bg-surface overflow-hidden shadow-soft">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
            <tr>
              <th className="p-3">Task</th>
              <th className="p-3">Project</th>
              <th className="p-3">Status</th>
              <th className="p-3">Priority</th>
              <th className="p-3">Due Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredTasks.map((t) => {
              const project = projectsById[t.projectId];
              const statusMeta = TASK_STATUS_MAP[t.status];
              const priorityMeta = TASK_PRIORITY_MAP[t.priority];

              return (
                <tr
                  key={t.id}
                  onClick={() => handleOpenTask(t)}
                  className="hover:bg-muted/20 transition-colors cursor-pointer"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">
                        {project?.key}-{t.number}
                      </span>
                      <span>{t.title}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <ProjectIcon name={project?.icon} size="sm" className="text-primary" />
                      <span>{project?.name || "Project"}</span>
                    </span>
                  </td>
                  <td className="p-3">
                    <Badge
                      variant="outline"
                      className="text-[10px] capitalize"
                      style={{ borderColor: statusMeta?.color, color: statusMeta?.color }}
                    >
                      {statusMeta?.label}
                    </Badge>
                  </td>
                  <td className="p-3 text-muted-foreground capitalize">
                    {priorityMeta?.label}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {t.dueDate
                      ? new Date(t.dueDate.toMillis()).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredTasks.length === 0 && (
          <div className="py-14 text-center text-xs text-muted-foreground space-y-2">
            <CheckSquare className="size-8 mx-auto text-muted-foreground/50" />
            <p>No tasks found in this view.</p>
          </div>
        )}
      </div>

      <TaskDetailDrawer
        task={selectedTask}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
