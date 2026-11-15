"use client";

import { useEffect, useState } from "react";
import { useWorkspace } from "@/providers/workspace-provider";
import { useAuth } from "@/providers/auth-provider";
import { updateTask, deleteTask } from "@/lib/services/tasks";
import { addComment, deleteComment } from "@/lib/services/comments";
import { useCollection } from "@/hooks/use-firestore";
import { paths } from "@/lib/firebase/firestore";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/common/user-avatar";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import type { Task, TaskPriority, TaskStatus, Comment, Subtask } from "@/types";
import {
  Calendar,
  Trash2,
  Send,
  CheckCircle2,
  Clock,
  Paperclip,
  Tag,
  AlertTriangle,
  Upload,
  Download,
  File as FileIcon,
  Sparkles,
  Loader2,
} from "lucide-react";
import { ProjectIcon } from "@/components/common/project-icon";
import { uploadProjectFile, deleteProjectFile, getFileDownloadUrl } from "@/lib/services/files";
import { formatBytes } from "@/lib/utils";
import type { ProjectFile } from "@/types";
import { toast } from "sonner";
import { generateSubtasksWithAI, enhanceDescriptionWithAI } from "@/lib/gemini/ai-service";
import { AiKeyModal } from "@/components/common/ai-key-modal";

interface TaskDetailDrawerProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailDrawer({ task, open, onOpenChange }: TaskDetailDrawerProps) {
  const { user } = useAuth();
  const { workspaceId, members, projectsById } = useWorkspace();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [assigneeId, setAssigneeId] = useState<string>("unassigned");
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState<"subtasks" | "description" | null>(null);
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [pendingAiAction, setPendingAiAction] = useState<"subtasks" | "description" | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
      setPriority(task.priority);
      setAssigneeId(task.assigneeId || "unassigned");
      setSubtasks(task.subtasks || []);
    }
  }, [task]);

  // Load comments in real-time
  const commentsState = useCollection<Comment>(
    task && workspaceId ? paths.comments(workspaceId, task.projectId) : null,
    `comments:${task?.id || "none"}`
  );
  const taskComments = commentsState.data
    .filter((c) => c.taskId === task?.id)
    .sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0));

  // Load attachments in real-time
  const filesState = useCollection<ProjectFile>(
    task && workspaceId ? paths.files(workspaceId, task.projectId) : null,
    `task_files:${task?.id || "none"}`
  );
  const taskFiles = filesState.data.filter((f) => f.taskId === task?.id);

  if (!task || !workspaceId) return null;

  const project = projectsById[task.projectId];

  const handleUpdateField = async (fields: Partial<Task>) => {
    if (!user) return;
    try {
      await updateTask(workspaceId, task.projectId, task.id, user.uid, fields);
      toast.success("Updated");
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleTriggerAiSubtasks = async () => {
    if (!title.trim()) {
      toast.error("Please enter a task title first");
      return;
    }
    setAiLoading("subtasks");
    try {
      const generated = await generateSubtasksWithAI({ title, description });
      if (!generated || generated.length === 0) {
        toast.info("No subtasks suggested");
        return;
      }
      const newItems: Subtask[] = generated.map((t, idx) => ({
        id: `sub_${Date.now()}_${idx}`,
        title: t,
        done: false,
      }));
      const updated = [...subtasks, ...newItems];
      setSubtasks(updated);
      if (user) {
        await updateTask(workspaceId, task.projectId, task.id, user.uid, { subtasks: updated });
      }
      toast.success(`Generated ${generated.length} actionable subtasks with Vertex AI!`);
    } catch (err: any) {
      if (err.message?.includes("API key")) {
        setPendingAiAction("subtasks");
        setKeyModalOpen(true);
      } else {
        toast.error(err.message || "Failed to generate subtasks");
      }
    } finally {
      setAiLoading(null);
    }
  };

  const handleTriggerAiDescription = async () => {
    if (!title.trim()) {
      toast.error("Please enter a task title first");
      return;
    }
    setAiLoading("description");
    try {
      const enhanced = await enhanceDescriptionWithAI({ title, description });
      if (enhanced) {
        setDescription(enhanced);
        if (user) {
          await updateTask(workspaceId, task.projectId, task.id, user.uid, { description: enhanced });
        }
        toast.success("Description enhanced with Vertex AI!");
      }
    } catch (err: any) {
      if (err.message?.includes("API key")) {
        setPendingAiAction("description");
        setKeyModalOpen(true);
      } else {
        toast.error(err.message || "Failed to enhance description");
      }
    } finally {
      setAiLoading(null);
    }
  };

  const handleResumeAi = () => {
    if (pendingAiAction === "subtasks") {
      setPendingAiAction(null);
      handleTriggerAiSubtasks();
    } else if (pendingAiAction === "description") {
      setPendingAiAction(null);
      handleTriggerAiDescription();
    }
  };

  const handleToggleSubtask = async (id: string, currentDone: boolean) => {
    const updated = subtasks.map((s) => (s.id === id ? { ...s, done: !currentDone } : s));
    setSubtasks(updated);
    if (user) {
      await updateTask(workspaceId, task.projectId, task.id, user.uid, { subtasks: updated });
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !user) return;
    const newSub: Subtask = {
      id: `sub_${Date.now()}`,
      title: newSubtaskTitle.trim(),
      done: false,
    };
    const updated = [...subtasks, newSub];
    setSubtasks(updated);
    setNewSubtaskTitle("");
    await updateTask(workspaceId, task.projectId, task.id, user.uid, { subtasks: updated });
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim() || !user) return;
    try {
      await addComment(user.uid, workspaceId, task.projectId, task.id, commentBody.trim());
      setCommentBody("");
      toast.success("Comment posted");
    } catch {
      toast.error("Failed to post comment");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !workspaceId || !user) return;
    setUploading(true);
    try {
      await uploadProjectFile({
        workspaceId,
        projectId: task.projectId,
        taskId: task.id,
        file,
        uploaderId: user.uid,
        uploaderName: user.displayName || user.email || "Team Member",
      });
      toast.success("File uploaded to task");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDownloadAttachment = async (file: ProjectFile) => {
    try {
      const url = await getFileDownloadUrl(file.storagePath);
      window.open(url, "_blank");
    } catch {
      toast.error("Failed to open file");
    }
  };

  const handleDeleteAttachment = async (file: ProjectFile) => {
    if (!confirm(`Delete ${file.name}?`)) return;
    try {
      await deleteProjectFile(workspaceId, task.projectId, file.id, file.storagePath, task.id);
      toast.success("File deleted");
    } catch {
      toast.error("Failed to delete file");
    }
  };

  const handleDeleteTask = async () => {
    if (!confirm("Are you sure you want to delete this task? This cannot be undone.")) return;
    try {
      await deleteTask(workspaceId, task.projectId, task.id);
      toast.success("Task deleted");
      onOpenChange(false);
    } catch {
      toast.error("Failed to delete task");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col bg-surface overflow-hidden">
        {/* Drawer Header */}
        <SheetHeader className="p-4 border-b border-border flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <ProjectIcon name={project?.icon} size="sm" className="text-primary" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {project?.key}-{task.number}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDeleteTask}
            className="text-muted-foreground hover:text-destructive size-7"
            title="Delete Task"
          >
            <Trash2 className="size-4" />
          </Button>
        </SheetHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
          {/* Title */}
          <div className="space-y-1">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                if (title !== task.title) handleUpdateField({ title });
              }}
              className="text-base font-bold border-transparent hover:border-border focus:border-primary px-2 -mx-2 h-9"
            />
          </div>

          {/* Key Properties Grid */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-background border border-border">
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground font-medium uppercase">
                Status
              </label>
              <Select
                value={status}
                onValueChange={(val) => {
                  const s = val as TaskStatus;
                  setStatus(s);
                  handleUpdateField({ status: s });
                }}
              >
                <SelectTrigger className="h-7 text-xs">
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
              <label className="text-[10px] text-muted-foreground font-medium uppercase">
                Priority
              </label>
              <Select
                value={priority}
                onValueChange={(val) => {
                  const p = val as TaskPriority;
                  setPriority(p);
                  handleUpdateField({ priority: p });
                }}
              >
                <SelectTrigger className="h-7 text-xs">
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

            <div className="space-y-1 col-span-2">
              <label className="text-[10px] text-muted-foreground font-medium uppercase">
                Assignee
              </label>
              <Select
                value={assigneeId}
                onValueChange={(val) => {
                  setAssigneeId(val);
                  handleUpdateField({ assigneeId: val === "unassigned" ? null : val });
                }}
              >
                <SelectTrigger className="h-7 text-xs">
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

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">Description</label>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={handleTriggerAiDescription}
                disabled={aiLoading === "description"}
                className="h-6 gap-1 text-[11px] text-primary hover:text-primary hover:bg-primary/10"
              >
                {aiLoading === "description" ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Sparkles className="size-3 text-primary" />
                )}
                <span>AI Enhance</span>
              </Button>
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => {
                if (description !== (task.description || "")) {
                  handleUpdateField({ description });
                }
              }}
              placeholder="Add more details, links, or notes..."
              rows={4}
              className="text-xs resize-none"
            />
          </div>

          {/* Subtasks checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                Subtasks ({subtasks.filter((s) => s.done).length}/{subtasks.length})
              </label>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={handleTriggerAiSubtasks}
                disabled={aiLoading === "subtasks"}
                className="h-6 gap-1 text-[11px] text-primary hover:text-primary hover:bg-primary/10"
              >
                {aiLoading === "subtasks" ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Sparkles className="size-3 text-primary" />
                )}
                <span>AI Breakdown</span>
              </Button>
            </div>

            <div className="space-y-1.5">
              {subtasks.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/40 text-xs"
                >
                  <Checkbox
                    checked={s.done}
                    onCheckedChange={() => handleToggleSubtask(s.id, s.done)}
                  />
                  <span className={`flex-1 ${s.done ? "line-through text-muted-foreground" : ""}`}>
                    {s.title}
                  </span>
                </div>
              ))}

              <form onSubmit={handleAddSubtask} className="flex gap-2 pt-1">
                <Input
                  placeholder="Add a new subtask..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  className="text-xs h-7"
                />
                <Button type="submit" size="xs" variant="secondary">
                  Add
                </Button>
              </form>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="space-y-2 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Paperclip className="size-3.5" />
                <span>Attachments ({taskFiles.length})</span>
              </label>
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  disabled={uploading}
                  className="gap-1 pointer-events-none"
                >
                  <Upload className="size-3" />
                  <span>{uploading ? "Uploading..." : "Attach File"}</span>
                </Button>
              </label>
            </div>

            <div className="space-y-1.5">
              {taskFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-background border border-border text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileIcon className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate max-w-[200px] font-medium">{file.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      ({formatBytes(file.size)})
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownloadAttachment(file)}
                      className="size-6 text-muted-foreground hover:text-foreground"
                    >
                      <Download className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteAttachment(file)}
                      className="size-6 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-3 pt-4 border-t border-border">
            <label className="text-xs font-semibold text-foreground">
              Comments & Activity ({taskComments.length})
            </label>

            {/* List of comments */}
            <div className="space-y-3">
              {taskComments.map((c) => (
                <div key={c.id} className="p-3 rounded-lg border border-border bg-background space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-primary">Teammate</span>
                    <span className="text-[10px] text-muted-foreground">
                      {c.createdAt ? new Date(c.createdAt.toMillis()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now"}
                    </span>
                  </div>
                  <p className="text-muted-foreground whitespace-pre-wrap">{c.body}</p>
                </div>
              ))}

              {taskComments.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No comments yet. Leave a note or @mention a teammate below.
                </p>
              )}
            </div>

            {/* Add comment input */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <Input
                placeholder="Write a comment..."
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                className="text-xs h-8"
              />
              <Button type="submit" size="sm" className="h-8 gap-1.5 text-xs">
                <Send className="size-3.5" />
                <span>Send</span>
              </Button>
            </form>
          </div>
        </div>
      </SheetContent>

      <AiKeyModal
        open={keyModalOpen}
        onOpenChange={setKeyModalOpen}
        onSuccess={handleResumeAi}
      />
    </Sheet>
  );
}
