"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useWorkspace } from "@/providers/workspace-provider";
import { KanbanBoard } from "@/components/projects/kanban-board";
import { TaskDetailDrawer } from "@/components/tasks/task-detail-drawer";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UserAvatar } from "@/components/common/user-avatar";
import {
  Plus,
  Search,
  Kanban,
  List as ListIcon,
  CalendarDays,
  Files,
  Settings,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { ProjectIcon } from "@/components/common/project-icon";
import { ProjectFilesTab } from "@/components/projects/project-files-tab";
import { ProjectActivityTab } from "@/components/projects/project-activity-tab";
import { ProjectTimelineTab } from "@/components/projects/project-timeline-tab";
import { ProjectSettingsTab } from "@/components/projects/project-settings-tab";
import type { Task, TaskStatus } from "@/types";
import { TASK_STATUS_MAP, TASK_PRIORITY_MAP } from "@/lib/constants";

export default function ProjectWorkspacePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const { projectsById, tasks, membersById, workspaceId } = useWorkspace();
  const project = projectsById[projectId];

  const [activeTab, setActiveTab] = useState<string>("board");
  const [search, setSearch] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<TaskStatus>("todo");

  // Query parameter task preview (?task=taskId)
  const taskQueryId = searchParams.get("task");

  const projectTasks = useMemo(() => {
    return tasks.filter((t) => t.projectId === projectId);
  }, [tasks, projectId]);

  const filteredTasks = useMemo(() => {
    if (!search.trim()) return projectTasks;
    const term = search.toLowerCase();
    return projectTasks.filter(
      (t) =>
        t.title.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term) ||
        t.labels.some((l) => l.toLowerCase().includes(term))
    );
  }, [projectTasks, search]);

  // Open drawer if taskQueryId exists in URL
  useMemo(() => {
    if (taskQueryId) {
      const found = projectTasks.find((t) => t.id === taskQueryId);
      if (found) {
        setSelectedTask(found);
        setDrawerOpen(true);
      }
    }
  }, [taskQueryId, projectTasks]);

  if (!project) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-center space-y-3">
        <p className="text-sm text-muted-foreground">Project not found or loading...</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/app/projects")}>
          Back to Projects
        </Button>
      </div>
    );
  }

  const completedCount = projectTasks.filter((t) => t.status === "done").length;
  const progressPct =
    projectTasks.length > 0 ? Math.round((completedCount / projectTasks.length) * 100) : 0;

  const handleOpenTask = (task: Task) => {
    setSelectedTask(task);
    setDrawerOpen(true);
  };

  const handleCreateWithStatus = (status: TaskStatus) => {
    setCreateStatus(status);
    setCreateTaskOpen(true);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* Project Banner Header */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="size-12 rounded-xl bg-background border border-border flex items-center justify-center text-primary shadow-xs">
              <ProjectIcon name={project.icon} size="lg" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  {project.name}
                </h1>
                <Badge variant="secondary" className="text-[10px] uppercase">
                  {project.key}
                </Badge>
                <Badge variant="outline" className="text-[10px] capitalize">
                  {project.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                {project.description || "No project overview description."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs font-semibold">{progressPct}% complete</span>
              <p className="text-[10px] text-muted-foreground">
                {completedCount} of {projectTasks.length} tasks done
              </p>
              <Progress value={progressPct} className="h-1.5 w-32 mt-1" />
            </div>
            <Button
              size="sm"
              onClick={() => {
                setCreateStatus("todo");
                setCreateTaskOpen(true);
              }}
              className="gap-1.5 text-xs shadow-soft font-semibold"
            >
              <Plus className="size-3.5" />
              <span>Add Task</span>
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="bg-muted/50 p-0.5 h-8">
              <TabsTrigger value="board" className="text-xs gap-1.5 px-3 h-7">
                <Kanban className="size-3.5" />
                <span>Board</span>
              </TabsTrigger>
              <TabsTrigger value="list" className="text-xs gap-1.5 px-3 h-7">
                <ListIcon className="size-3.5" />
                <span>List</span>
              </TabsTrigger>
              <TabsTrigger value="timeline" className="text-xs gap-1.5 px-3 h-7">
                <CalendarDays className="size-3.5" />
                <span>Timeline</span>
              </TabsTrigger>
              <TabsTrigger value="files" className="text-xs gap-1.5 px-3 h-7">
                <Files className="size-3.5" />
                <span>Files</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-xs gap-1.5 px-3 h-7">
                <Activity className="size-3.5" />
                <span>Activity</span>
              </TabsTrigger>
              <TabsTrigger value="overview" className="text-xs gap-1.5 px-3 h-7">
                <CheckCircle2 className="size-3.5" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs gap-1.5 px-3 h-7">
                <Settings className="size-3.5" />
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full sm:w-60">
            <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs h-8"
            />
          </div>
        </div>
      </div>

      {/* Tab 1: Kanban Board */}
      {activeTab === "board" && (
        <KanbanBoard
          tasks={filteredTasks}
          projectId={projectId}
          onSelectTask={handleOpenTask}
          onOpenCreateTaskWithStatus={handleCreateWithStatus}
        />
      )}

      {/* Tab 2: List View */}
      {activeTab === "list" && (
        <div className="border border-border rounded-xl bg-surface overflow-hidden shadow-soft">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
              <tr>
                <th className="p-3">Task</th>
                <th className="p-3">Status</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Assignee</th>
                <th className="p-3">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTasks.map((t) => {
                const assignee = t.assigneeId ? membersById[t.assigneeId] : null;
                const statusMeta = TASK_STATUS_MAP[t.status];
                const priorityMeta = TASK_PRIORITY_MAP[t.priority];

                return (
                  <tr
                    key={t.id}
                    onClick={() => handleOpenTask(t)}
                    className="hover:bg-muted/20 transition-colors cursor-pointer"
                  >
                    <td className="p-3">
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {project.key}-{t.number}
                        </span>
                        <span>{t.title}</span>
                      </div>
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
                    <td className="p-3">
                      <span className="text-[11px] capitalize text-muted-foreground">
                        {priorityMeta?.label}
                      </span>
                    </td>
                    <td className="p-3">
                      {assignee ? (
                        <div className="flex items-center gap-1.5">
                          <UserAvatar
                            name={assignee.displayName}
                            photoURL={assignee.photoURL}
                            size="xs"
                          />
                          <span>{assignee.displayName}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground text-[11px]">
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
            <div className="py-12 text-center text-xs text-muted-foreground">
              No tasks match your filter.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Timeline */}
      {activeTab === "timeline" && (
        <ProjectTimelineTab
          tasks={filteredTasks}
          onSelectTask={handleOpenTask}
        />
      )}

      {/* Tab 4: Files */}
      {activeTab === "files" && (
        <ProjectFilesTab projectId={projectId} />
      )}

      {/* Tab 5: Activity */}
      {activeTab === "activity" && (
        <ProjectActivityTab projectId={projectId} />
      )}

      {/* Tab 6: Settings */}
      {activeTab === "settings" && (
        <ProjectSettingsTab project={project} />
      )}

      {/* Tab 7: Overview & Milestones */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="p-5 rounded-xl border border-border bg-surface shadow-soft space-y-3">
              <h3 className="text-sm font-bold">About {project.name}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {project.description || "No extensive description has been added for this project."}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-5 rounded-xl border border-border bg-surface shadow-soft space-y-3">
              <h3 className="text-sm font-bold">Project Members</h3>
              <div className="space-y-2">
                {project.memberIds.map((uid) => {
                  const m = membersById[uid];
                  if (!m) return null;
                  return (
                    <div key={uid} className="flex items-center gap-2.5 text-xs">
                      <UserAvatar name={m.displayName} photoURL={m.photoURL} size="xs" />
                      <span className="font-medium">{m.displayName}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        defaultProjectId={projectId}
        defaultStatus={createStatus}
      />
    </div>
  );
}
