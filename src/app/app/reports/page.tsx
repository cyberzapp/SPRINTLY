"use client";

import { useMemo, useState } from "react";
import { useWorkspace } from "@/providers/workspace-provider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
  Users,
  Sparkles,
  Loader2,
  X,
} from "lucide-react";
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
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { toCsv, downloadTextFile } from "@/lib/utils";
import { toast } from "sonner";
import { generateSprintSummaryWithAI } from "@/lib/gemini/ai-service";
import { AiKeyModal } from "@/components/common/ai-key-modal";

export default function ReportsAnalyticsPage() {
  const { workspace, projects, tasks, members } = useWorkspace();

  const [dateFilter, setDateFilter] = useState<"all" | "7d" | "30d" | "90d">("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [memberFilter, setMemberFilter] = useState<string>("all");
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [keyModalOpen, setKeyModalOpen] = useState(false);

  const filteredTasks = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    return tasks.filter((t) => {
      // Date filter
      if (dateFilter !== "all" && t.createdAt) {
        const createdMs = t.createdAt.toMillis();
        const daysAgo = dateFilter === "7d" ? 7 : dateFilter === "30d" ? 30 : 90;
        if (now - createdMs > daysAgo * dayMs) return false;
      }
      // Project filter
      if (projectFilter !== "all" && t.projectId !== projectFilter) return false;
      // Member filter
      if (memberFilter !== "all" && t.assigneeId !== memberFilter) return false;

      return true;
    });
  }, [tasks, dateFilter, projectFilter, memberFilter]);

  const totalTasks = filteredTasks.length;
  const completedTasks = filteredTasks.filter((t) => t.status === "done").length;
  const inProgressTasks = filteredTasks.filter((t) => t.status === "in_progress").length;
  const overdueTasks = filteredTasks.filter(
    (t) => t.status !== "done" && t.dueDate && t.dueDate.toMillis() < Date.now()
  ).length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Chart 1: Tasks by Priority
  const priorityChartData = [
    { name: "Urgent", count: filteredTasks.filter((t) => t.priority === "urgent").length, color: "#EF4444" },
    { name: "High", count: filteredTasks.filter((t) => t.priority === "high").length, color: "#F97316" },
    { name: "Medium", count: filteredTasks.filter((t) => t.priority === "medium").length, color: "#F59E0B" },
    { name: "Low", count: filteredTasks.filter((t) => t.priority === "low").length, color: "#3B82F6" },
  ];

  // Chart 2: Project Workload Comparison
  const projectWorkloadData = projects
    .filter((p) => projectFilter === "all" || p.id === projectFilter)
    .map((p) => {
      const pTasks = filteredTasks.filter((t) => t.projectId === p.id);
      const pDone = pTasks.filter((t) => t.status === "done").length;
      return {
        name: p.key,
        total: pTasks.length,
        done: pDone,
      };
    });

  // Chart 3: Team Workload Distribution
  const teamWorkloadData = members
    .filter((m) => memberFilter === "all" || m.userId === memberFilter)
    .map((m) => {
      const mTasks = filteredTasks.filter((t) => t.assigneeId === m.userId);
      const mDone = mTasks.filter((t) => t.status === "done").length;
      return {
        name: m.displayName.split(" ")[0],
        total: mTasks.length,
        done: mDone,
      };
    });

  const handleGenerateAiSummary = async () => {
    if (filteredTasks.length === 0) {
      toast.info("No tasks to analyze in the current filter scope.");
      return;
    }
    setAiLoading(true);
    try {
      const targetProjectName =
        projectFilter === "all"
          ? workspace?.name || "Workspace Sprint"
          : projects.find((p) => p.id === projectFilter)?.name || "Project";

      const sample = filteredTasks.map((t) => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
      }));

      const summary = await generateSprintSummaryWithAI({
        projectName: targetProjectName,
        tasks: sample,
      });

      setAiSummary(summary);
      toast.success("AI Sprint Health generated!");
    } catch (err: any) {
      if (err.message?.includes("API key")) {
        setKeyModalOpen(true);
      } else {
        toast.error(err.message || "Failed to generate AI sprint health");
      }
    } finally {
      setAiLoading(false);
    }
  };

  const handleExportCsv = () => {
    try {
      const rows: (string | number)[][] = [
        ["Task ID", "Title", "Project ID", "Status", "Priority", "Assignee ID", "Due Date", "Created Date"],
      ];

      for (const t of filteredTasks) {
        rows.push([
          t.number,
          t.title,
          t.projectId,
          t.status,
          t.priority,
          t.assigneeId || "Unassigned",
          t.dueDate ? new Date(t.dueDate.toMillis()).toISOString().split("T")[0] : "",
          t.createdAt ? new Date(t.createdAt.toMillis()).toISOString().split("T")[0] : "",
        ]);
      }

      const csv = toCsv(rows);
      downloadTextFile(`${workspace?.name || "workspace"}-analytics-report.csv`, csv);
      toast.success("CSV export downloaded.");
    } catch {
      toast.error("Failed to export report.");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Reports & Analytics
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time performance metrics, team workload, and exportable project data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleGenerateAiSummary}
            disabled={aiLoading}
            size="sm"
            className="gap-1.5 text-xs bg-primary text-primary-foreground shadow hover:bg-primary/90"
          >
            {aiLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            <span>Vertex AI Health</span>
          </Button>

          <Button onClick={handleExportCsv} size="sm" variant="outline" className="gap-2 text-xs">
            <Download className="size-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* AI Sprint Health Card */}
      {aiSummary && (
        <div className="p-5 rounded-xl border border-primary/20 bg-primary/[0.03] space-y-3 relative transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <Sparkles className="size-4" />
              <span>Vertex AI Sprint Health & Velocity Intelligence</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setAiSummary(null)}
              className="size-6 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </Button>
          </div>
          <div className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap font-sans">
            {aiSummary}
          </div>
        </div>
      )}

      {/* Interactive Filters Bar */}
      <div className="p-3.5 rounded-xl border border-border bg-surface flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
          <Filter className="size-3.5" />
          <span>Filter:</span>
        </div>

        {/* Date range filter */}
        <div className="flex items-center gap-1 border border-border p-0.5 rounded-lg bg-background text-xs">
          {[
            { id: "all", label: "All time" },
            { id: "7d", label: "7 days" },
            { id: "30d", label: "30 days" },
            { id: "90d", label: "90 days" },
          ].map((d) => (
            <button
              key={d.id}
              onClick={() => setDateFilter(d.id as any)}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                dateFilter === d.id
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Project Selector */}
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-36 h-7 text-xs">
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All Projects
            </SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id} className="text-xs">
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Member Selector */}
        <Select value={memberFilter} onValueChange={setMemberFilter}>
          <SelectTrigger className="w-36 h-7 text-xs">
            <SelectValue placeholder="All teammates" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All Teammates
            </SelectItem>
            {members.map((m) => (
              <SelectItem key={m.userId} value={m.userId} className="text-xs">
                {m.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(dateFilter !== "all" || projectFilter !== "all" || memberFilter !== "all") && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              setDateFilter("all");
              setProjectFilter("all");
              setMemberFilter("all");
            }}
            className="text-[11px] text-muted-foreground hover:text-foreground"
          >
            Reset Filters
          </Button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-surface shadow-soft">
          <span className="text-xs text-muted-foreground">Filtered Tasks</span>
          <div className="text-2xl font-bold mt-1 text-foreground">{totalTasks}</div>
          <span className="text-[10px] text-muted-foreground">
            {completedTasks} completed ({completionRate}%)
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface shadow-soft">
          <span className="text-xs text-muted-foreground">In Progress</span>
          <div className="text-2xl font-bold mt-1 text-primary">{inProgressTasks}</div>
          <span className="text-[10px] text-muted-foreground">Active deliverables</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface shadow-soft">
          <span className="text-xs text-muted-foreground">Overdue Items</span>
          <div className="text-2xl font-bold mt-1 text-destructive">{overdueTasks}</div>
          <span className="text-[10px] text-muted-foreground">Passed target due date</span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface shadow-soft">
          <span className="text-xs text-muted-foreground">Completion Rate</span>
          <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
            {completionRate}%
          </div>
          <span className="text-[10px] text-muted-foreground">Against filtered scope</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Workload Comparison */}
        <div className="p-5 rounded-xl border border-border bg-surface shadow-soft space-y-4">
          <h3 className="text-sm font-bold">Project Task Progress</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectWorkloadData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-surface)",
                    borderColor: "var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "11px",
                  }}
                />
                <Bar dataKey="total" name="Total Tasks" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="done" name="Completed" fill="#635BFF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Team Workload Distribution */}
        <div className="p-5 rounded-xl border border-border bg-surface shadow-soft space-y-4">
          <h3 className="text-sm font-bold">Team Workload Distribution</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamWorkloadData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-surface)",
                    borderColor: "var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "11px",
                  }}
                />
                <Bar dataKey="total" name="Assigned" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="done" name="Finished" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="p-5 rounded-xl border border-border bg-surface shadow-soft space-y-4">
          <h3 className="text-sm font-bold">Priority Breakdown</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-surface)",
                    borderColor: "var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "11px",
                  }}
                />
                <Bar dataKey="count" name="Tasks" radius={[4, 4, 0, 0]}>
                  {priorityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <AiKeyModal
        open={keyModalOpen}
        onOpenChange={setKeyModalOpen}
        onSuccess={handleGenerateAiSummary}
      />
    </div>
  );
}
