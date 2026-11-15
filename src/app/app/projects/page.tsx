"use client";

import { useState } from "react";
import Link from "next/link";
import { useWorkspace } from "@/providers/workspace-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FolderKanban,
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  Filter,
} from "lucide-react";
import { CreateProjectModal } from "@/components/projects/create-project-modal";
import { ProjectIcon } from "@/components/common/project-icon";
import { PROJECT_STATUS_MAP } from "@/lib/constants";
import type { ProjectStatus } from "@/types";

export default function ProjectsDirectoryPage() {
  const { projects, tasks } = useWorkspace();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.key.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Projects
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your company's projects, roadmaps, and delivery milestones.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-1.5 text-xs shadow-soft font-semibold">
          <Plus className="size-4" />
          <span>New Project</span>
        </Button>
      </div>

      {/* Filter and View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs h-8"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter buttons */}
          <div className="flex items-center gap-1 border border-border p-0.5 rounded-lg bg-surface">
            {["all", "active", "planning", "completed"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`text-xs px-2.5 py-1 rounded-md capitalize transition-colors ${
                  statusFilter === st
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Grid vs List toggle */}
          <div className="flex items-center border border-border p-0.5 rounded-lg bg-surface">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1 rounded-md ${
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1 rounded-md ${
                viewMode === "list"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ListIcon className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects Display */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((p) => {
            const projTasks = tasks.filter((t) => t.projectId === p.id);
            const done = projTasks.filter((t) => t.status === "done").length;
            const rate = projTasks.length > 0 ? Math.round((done / projTasks.length) * 100) : 0;

            return (
              <Link
                key={p.id}
                href={`/app/projects/${p.id}`}
                className="group block p-5 rounded-xl border border-border bg-surface hover:border-primary/50 hover:shadow-card transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="size-10 rounded-xl bg-background border border-border flex items-center justify-center text-primary shadow-xs group-hover:scale-105 transition-transform">
                    <ProjectIcon name={p.icon} size="md" />
                  </div>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {p.status}
                  </Badge>
                </div>

                <div className="space-y-1 mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold group-hover:text-primary transition-colors">
                      {p.name}
                    </h3>
                    <Badge variant="secondary" className="text-[9px] uppercase px-1 py-0">
                      {p.key}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {p.description || "No project description provided."}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Task Progress</span>
                    <span className="font-semibold text-foreground">{rate}% ({done}/{projTasks.length})</span>
                  </div>
                  <Progress value={rate} className="h-1.5" />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="border border-border rounded-xl bg-surface overflow-hidden shadow-soft">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground">
              <tr>
                <th className="p-3 font-semibold">Project</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Progress</th>
                <th className="p-3 font-semibold">Tasks</th>
                <th className="p-3 font-semibold">Key</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProjects.map((p) => {
                const projTasks = tasks.filter((t) => t.projectId === p.id);
                const done = projTasks.filter((t) => t.status === "done").length;
                const rate = projTasks.length > 0 ? Math.round((done / projTasks.length) * 100) : 0;

                return (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      <Link
                        href={`/app/projects/${p.id}`}
                        className="flex items-center gap-2 font-semibold hover:text-primary transition-colors"
                      >
                        <ProjectIcon name={p.icon} size="sm" className="text-primary" />
                        <span>{p.name}</span>
                      </Link>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {p.status}
                      </Badge>
                    </td>
                    <td className="p-3 w-40">
                      <div className="flex items-center gap-2">
                        <Progress value={rate} className="h-1.5 flex-1" />
                        <span className="text-[10px] text-muted-foreground">{rate}%</span>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {done}/{projTasks.length}
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary" className="text-[9px] uppercase">
                        {p.key}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filteredProjects.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-xs space-y-2">
          <p>No projects match your filter criteria.</p>
          <Button variant="outline" size="sm" onClick={() => { setSearch(""); setStatusFilter("all"); }}>
            Clear filters
          </Button>
        </div>
      )}

      <CreateProjectModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
