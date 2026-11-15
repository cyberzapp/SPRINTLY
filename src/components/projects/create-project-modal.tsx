"use client";

import { useState } from "react";
import { useWorkspace } from "@/providers/workspace-provider";
import { useAuth } from "@/providers/auth-provider";
import { createProject } from "@/lib/services/projects";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PROJECT_COLORS, PROJECT_ICONS } from "@/lib/constants";
import { ProjectIcon } from "@/components/common/project-icon";
import { toast } from "sonner";

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectModal({ open, onOpenChange }: CreateProjectModalProps) {
  const { user } = useAuth();
  const { workspaceId, workspace } = useWorkspace();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState(PROJECT_ICONS[0]);
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !workspaceId) return;

    if (!name.trim()) {
      toast.error("Project name is required.");
      return;
    }

    setSubmitting(true);
    try {
      await createProject(user.uid, {
        workspaceId,
        name: name.trim(),
        description: description.trim(),
        icon,
        color,
        ownerId: user.uid,
        status: "active",
      });

      toast.success("Project created!");
      setName("");
      setDescription("");
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to create project.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Create New Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Project Name */}
          <div className="space-y-1.5">
            <Label htmlFor="projName" className="text-xs">
              Project Name
            </Label>
            <Input
              id="projName"
              placeholder="e.g. Website Redesign 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xs"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="projDesc" className="text-xs">
              Description (Optional)
            </Label>
            <Textarea
              id="projDesc"
              placeholder="Brief summary of goals and scope..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="text-xs resize-none"
            />
          </div>

          {/* Icon Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs">Project Icon</Label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_ICONS.map((i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setIcon(i)}
                  className={`size-8 rounded-lg flex items-center justify-center border transition-all ${
                    icon === i
                      ? "border-primary bg-primary/10 shadow-xs text-primary"
                      : "border-border hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <ProjectIcon name={i} size="sm" />
                </button>
              ))}
            </div>
          </div>

          {/* Color Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs">Accent Color</Label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`size-6 rounded-full border-2 transition-all ${
                    color === c ? "border-foreground scale-110 shadow-xs" : "border-transparent"
                  }`}
                />
              ))}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
