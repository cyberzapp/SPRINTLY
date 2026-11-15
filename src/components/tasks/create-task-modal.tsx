"use client";

import { useState } from "react";
import { useWorkspace } from "@/providers/workspace-provider";
import { useAuth } from "@/providers/auth-provider";
import { createTask } from "@/lib/services/tasks";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import type { TaskPriority, TaskStatus } from "@/types";
import { toast } from "sonner";

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string;
  defaultStatus?: TaskStatus;
}

export function CreateTaskModal({
  open,
  onOpenChange,
  defaultProjectId,
  defaultStatus = "todo",
}: CreateTaskModalProps) {
  const { user } = useAuth();
  const { workspaceId, projects, members } = useWorkspace();

  const [projectId, setProjectId] = useState<string>(defaultProjectId || projects[0]?.id || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [assigneeId, setAssigneeId] = useState<string>("unassigned");
  const [dueDateStr, setDueDateStr] = useState("");
  const [labelsStr, setLabelsStr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !workspaceId) return;

    const targetProj = projectId || defaultProjectId || projects[0]?.id;
    if (!targetProj) {
      toast.error("Please create or select a project first.");
      return;
    }

    if (!title.trim()) {
      toast.error("Task title is required.");
      return;
    }

    setSubmitting(true);
    try {
      const labels = labelsStr
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      const dueDate = dueDateStr ? new Date(dueDateStr) : null;

      await createTask(user.uid, {
        workspaceId,
        projectId: targetProj,
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        assigneeId: assigneeId === "unassigned" ? null : assigneeId,
        dueDate,
        labels,
      });

      toast.success("Task created successfully!");
      setTitle("");
      setDescription("");
      setLabelsStr("");
      setDueDateStr("");
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to create task.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Create New Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Project selector */}
          <div className="space-y-1.5">
            <Label className="text-xs">Project</Label>
            <Select
              value={projectId || defaultProjectId || projects[0]?.id || ""}
              onValueChange={setProjectId}
            >
              <SelectTrigger className="w-full text-xs">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.icon} {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Task Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs">
              Task Title
            </Label>
            <Input
              id="title"
              placeholder="e.g. Design authentication modal and flows"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xs"
              autoFocus
            />
          </div>

          {/* Task Description */}
          <div className="space-y-1.5">
            <Label htmlFor="desc" className="text-xs">
              Description (Optional)
            </Label>
            <Textarea
              id="desc"
              placeholder="Provide details, acceptance criteria, or context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="text-xs resize-none"
            />
          </div>

          {/* Grid of properties: Status, Priority, Assignee */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger className="w-full text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger className="w-full text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 col-span-2 sm:col-span-1">
              <Label className="text-[11px] text-muted-foreground">Assignee</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger className="w-full text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned" className="text-xs text-muted-foreground">
                    Unassigned
                  </SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.userId} value={m.userId} className="text-xs">
                      {m.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due date & Labels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="dueDate" className="text-[11px] text-muted-foreground">
                Due Date
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDateStr}
                onChange={(e) => setDueDateStr(e.target.value)}
                className="text-xs h-8"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="labels" className="text-[11px] text-muted-foreground">
                Labels (comma-separated)
              </Label>
              <Input
                id="labels"
                placeholder="frontend, ui, urgent"
                value={labelsStr}
                onChange={(e) => setLabelsStr(e.target.value)}
                className="text-xs h-8"
              />
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
              {submitting ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
