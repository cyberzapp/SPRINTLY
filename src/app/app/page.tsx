"use client";

import { useWorkspace } from "@/providers/workspace-provider";
import { useAuth } from "@/providers/auth-provider";
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ProjectIcon } from "@/components/common/project-icon";
import { UserAvatar } from "@/components/common/user-avatar";

export default function DashboardOverviewPage() {
  const { user, profile } = useAuth();
  const { workspace, projects, tasks, members } = useWorkspace();

  // Metrics computation from real Firestore data
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;

  const now = Date.now();
  const overdueTasks = tasks.filter(
    (t) => t.status !== "done" && t.dueDate && t.dueDate.toMillis() < now
  ).length;

  const myTasks = tasks.filter((t) => t.assigneeId === user?.uid);
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Chart data: Tasks by Status
  const statusData = [
    { name: "Backlog", count: tasks.filter((t) => t.status === "backlog").length, color: "#94A3B8" },
    { name: "Todo", count: tasks.filter((t) => t.status === "todo").length, color: "#64748B" },
    { name: "In Progress", count: inProgressTasks, color: "#635BFF" },
    { name: "In Review", count: tasks.filter((t) => t.status === "in_review").length, color: "#F59E0B" },
    { name: "Done", count: completedTasks, color: "#16A34A" },
  ];

  // Chart data: Tasks by Priority
  const priorityData = [
    { name: "Urgent", count: tasks.filter((t) => t.priority === "urgent").length, color: "#EF4444" },
    { name: "High", count: tasks.filter((t) => t.priority === "high").length, color: "#F97316" },
    { name: "Medium", count: tasks.filter((t) => t.priority === "medium").length, color: "#F59E0B" },
    { name: "Low", count: tasks.filter((t) => t.priority === "low").length, color: "#3B82F6" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Good day, {profile?.displayName || user?.displayName || "Leader"}</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Here is your workspace progress and team activity for{" "}
            <span className="font-semibold text-foreground">{workspace?.name}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link href="/app/reports">View Full Reports</Link>
          </Button>
          <Button asChild size="sm" className="text-xs shadow-soft font-semibold">
            <Link href="/app/projects">Explore Projects</Link>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-surface border border-border rounded-xl p-3.5 shadow-soft">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-2">
            <span>Total Projects</span>
            <FolderKanban className="size-4 text-primary" />
          </div>
          <div className="text-2xl font-bold">{totalProjects}</div>
          <span className="text-[10px] text-muted-foreground">{activeProjects} currently active</span>
        </div>

        <div className="bg-surface border border-border rounded-xl p-3.5 shadow-soft">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-2">
            <span>Total Tasks</span>
            <CheckCircle2 className="size-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">{totalTasks}</div>
          <span className="text-[10px] text-muted-foreground">{inProgressTasks} in progress</span>
        </div>

        <div className="bg-surface border border-border rounded-xl p-3.5 shadow-soft">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-2">
            <span>Completed</span>
            <TrendingUp className="size-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {completedTasks}
          </div>
          <span className="text-[10px] text-muted-foreground">{completionRate}% total rate</span>
        </div>

        <div className="bg-surface border border-border rounded-xl p-3.5 shadow-soft">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-2">
            <span>Overdue Tasks</span>
            <AlertCircle className="size-4 text-destructive" />
          </div>
          <div className="text-2xl font-bold text-destructive">{overdueTasks}</div>
          <span className="text-[10px] text-muted-foreground">Requires attention</span>
        </div>

        <div className="bg-surface border border-border rounded-xl p-3.5 shadow-soft">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-2">
            <span>Assigned to Me</span>
            <Clock className="size-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold">{myTasks.length}</div>
          <span className="text-[10px] text-muted-foreground">
            {myTasks.filter((t) => t.status === "done").length} finished
          </span>
        </div>

        <div className="bg-surface border border-border rounded-xl p-3.5 shadow-soft">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-2">
            <span>Team Members</span>
            <Users className="size-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold">{members.length}</div>
          <span className="text-[10px] text-muted-foreground">Active collaborators</span>
        </div>
      </div>

      {/* Main Grid: Projects Progress & Productivity Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Projects */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-tight">Active Projects</h2>
            <Link
              href="/app/projects"
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowUpRight className="size-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {projects.slice(0, 5).map((p) => {
              const projTasks = tasks.filter((t) => t.projectId === p.id);
              const done = projTasks.filter((t) => t.status === "done").length;
              const rate = projTasks.length > 0 ? Math.round((done / projTasks.length) * 100) : 0;

              return (
                <div
                  key={p.id}
                  className="p-3.5 rounded-lg border border-border bg-background hover:bg-muted/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-background border border-border flex items-center justify-center text-primary shadow-xs">
                      <ProjectIcon name={p.icon} size="sm" />
                    </div>
                    <div>
                      <Link
                        href={`/app/projects/${p.id}`}
                        className="text-xs font-semibold hover:text-primary transition-colors flex items-center gap-1.5"
                      >
                        <span>{p.name}</span>
                        <Badge variant="outline" className="text-[9px] py-0 px-1 uppercase">
                          {p.key}
                        </Badge>
                      </Link>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-sm">
                        {p.description || "No project description provided."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 min-w-[180px]">
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                        <span>{done}/{projTasks.length} tasks</span>
                        <span>{rate}%</span>
                      </div>
                      <Progress value={rate} className="h-1.5" />
                    </div>
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {p.status}
                    </Badge>
                  </div>
                </div>
              );
            })}

            {projects.length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-xs">
                No projects created yet. Click "New Project" in the sidebar to begin!
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Tasks by Status Chart */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-soft space-y-4">
          <h2 className="text-sm font-bold tracking-tight">Task Status Distribution</h2>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-surface)",
                    borderColor: "var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "11px",
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="border-t border-border pt-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Priority Breakdown</span>
            </div>
            <div className="flex gap-2 text-[10px]">
              {priorityData.map((pr) => (
                <div key={pr.name} className="flex items-center gap-1">
                  <span className="size-2 rounded-full" style={{ backgroundColor: pr.color }} />
                  <span>{pr.name}: {pr.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: My Tasks & Team Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Tasks */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-tight">Assigned to Me</h2>
            <Link href="/app/my-tasks" className="text-xs text-primary font-medium hover:underline">
              View all ({myTasks.length})
            </Link>
          </div>

          <div className="space-y-2">
            {myTasks.slice(0, 5).map((t) => (
              <div
                key={t.id}
                className="p-2.5 rounded-lg border border-border bg-background hover:bg-muted/20 transition-all flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={`size-2 rounded-full shrink-0 ${
                      t.priority === "urgent"
                        ? "bg-red-500"
                        : t.priority === "high"
                        ? "bg-orange-500"
                        : "bg-blue-500"
                    }`}
                  />
                  <span className="font-medium truncate">{t.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {t.status.replace("_", " ")}
                  </Badge>
                  {t.dueDate && (
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(t.dueDate.toMillis()).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {myTasks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-xs">
                You have no tasks assigned right now. You're all caught up!
              </div>
            )}
          </div>
        </div>

        {/* Team Overview */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-tight">Team Overview</h2>
            <Link href="/app/team" className="text-xs text-primary font-medium hover:underline">
              Manage Team ({members.length})
            </Link>
          </div>

          <div className="space-y-3">
            {members.slice(0, 5).map((m) => {
              const memberTasks = tasks.filter((t) => t.assigneeId === m.userId);
              const done = memberTasks.filter((t) => t.status === "done").length;

              return (
                <div
                  key={m.userId}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar name={m.displayName} photoURL={m.photoURL} size="sm" />
                    <div>
                      <p className="text-xs font-semibold">{m.displayName}</p>
                      <p className="text-[10px] text-muted-foreground">{m.jobTitle || m.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold">{done}/{memberTasks.length}</span>
                    <p className="text-[10px] text-muted-foreground">tasks completed</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
