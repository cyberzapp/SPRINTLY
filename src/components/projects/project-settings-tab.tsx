"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/providers/workspace-provider";
import { useAuth } from "@/providers/auth-provider";
import { updateProject, deleteProject } from "@/lib/services/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROJECT_STATUSES, PROJECT_COLORS, PROJECT_ICONS } from "@/lib/constants";
import { ProjectIcon } from "@/components/common/project-icon";
import type { Project, ProjectStatus } from "@/types";
import { Trash2, Archive, Check } from "lucide-react";
import { toast } from "sonner";

interface ProjectSettingsTabProps {
  project: Project;
}

export function ProjectSettingsTab({ project }: ProjectSettingsTabProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { workspaceId, role } = useWorkspace();

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [icon, setIcon] = useState(project.icon || "folder");
  const [color, setColor] = useState(project.color || "#635BFF");
  const [saving, setSaving] = useState(false);

  const canEdit = role === "owner" || role === "admin" || project.ownerId === user?.uid;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !user || !canEdit) return;

    setSaving(true);
    try {
      await updateProject(workspaceId, project.id, user.uid, {
        name: name.trim(),
        description: description.trim(),
        status,
        icon,
        color,
      });
      toast.success("Project updated successfully.");
    } catch {
      toast.error("Failed to update project.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to permanently delete "${project.name}" and all its tasks?`))
      return;
    if (!workspaceId) return;

    try {
      await deleteProject(workspaceId, project.id);
      toast.success("Project deleted.");
      router.push("/app/projects");
    } catch {
      toast.error("Failed to delete project.");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <form onSubmit={handleSave} className="p-5 rounded-xl border border-border bg-surface shadow-soft space-y-4">
        <h3 className="text-sm font-bold tracking-tight">Project Settings</h3>

        <div className="space-y-1.5">
          <Label htmlFor="projName" className="text-xs">
            Project Name
          </Label>
          <Input
            id="projName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canEdit}
            className="text-xs"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="projDesc" className="text-xs">
            Description
          </Label>
          <Textarea
            id="projDesc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!canEdit}
            rows={3}
            className="text-xs resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select
              value={status}
              onValueChange={(val) => setStatus(val as ProjectStatus)}
              disabled={!canEdit}
            >
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STATUSES.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs capitalize">
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Accent Color</Label>
            <div className="flex flex-wrap gap-2 pt-1">
              {PROJECT_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  disabled={!canEdit}
                  style={{ backgroundColor: c }}
                  className={`size-6 rounded-full border-2 transition-all ${
                    color === c ? "border-foreground scale-110 shadow-xs" : "border-transparent"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Icon</Label>
          <div className="flex flex-wrap gap-2 pt-1">
            {PROJECT_ICONS.map((i) => (
              <button
                type="button"
                key={i}
                onClick={() => setIcon(i)}
                disabled={!canEdit}
                className={`size-8 rounded-lg flex items-center justify-center border transition-all ${
                  icon === i
                    ? "border-primary bg-primary/10 text-primary shadow-xs"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <ProjectIcon name={i} size="sm" />
              </button>
            ))}
          </div>
        </div>

        {canEdit && (
          <div className="pt-2">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Saving..." : "Save Project Settings"}
            </Button>
          </div>
        )}
      </form>

      {/* Danger Zone */}
      {canEdit && (
        <div className="p-5 rounded-xl border border-destructive/20 bg-destructive/5 space-y-3">
          <h4 className="text-xs font-bold text-destructive">Danger Zone</h4>
          <p className="text-xs text-muted-foreground">
            Deleting this project will permanently remove all tasks, comments, and project attachments.
          </p>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="text-xs gap-1.5"
          >
            <Trash2 className="size-3.5" />
            <span>Delete Project</span>
          </Button>
        </div>
      )}
    </div>
  );
}
