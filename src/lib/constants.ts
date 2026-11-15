import type { ProjectStatus, Role, TaskPriority, TaskStatus, TeamType } from "@/types";

export const APP_NAME = "Sprintly";

export const TASK_STATUSES: { id: TaskStatus; label: string; color: string }[] = [
  { id: "backlog", label: "Backlog", color: "#94A3B8" },
  { id: "todo", label: "Todo", color: "#64748B" },
  { id: "in_progress", label: "In Progress", color: "#635BFF" },
  { id: "in_review", label: "In Review", color: "#F59E0B" },
  { id: "done", label: "Done", color: "#16A34A" },
];

export const TASK_STATUS_MAP = Object.fromEntries(TASK_STATUSES.map((s) => [s.id, s])) as Record<
  TaskStatus,
  (typeof TASK_STATUSES)[number]
>;

export const TASK_PRIORITIES: { id: TaskPriority; label: string; color: string; rank: number }[] = [
  { id: "urgent", label: "Urgent", color: "#EF4444", rank: 4 },
  { id: "high", label: "High", color: "#F97316", rank: 3 },
  { id: "medium", label: "Medium", color: "#F59E0B", rank: 2 },
  { id: "low", label: "Low", color: "#3B82F6", rank: 1 },
  { id: "none", label: "No priority", color: "#94A3B8", rank: 0 },
];

export const TASK_PRIORITY_MAP = Object.fromEntries(TASK_PRIORITIES.map((p) => [p.id, p])) as Record<
  TaskPriority,
  (typeof TASK_PRIORITIES)[number]
>;

export const PROJECT_STATUSES: { id: ProjectStatus; label: string; color: string }[] = [
  { id: "planning", label: "Planning", color: "#8B5CF6" },
  { id: "active", label: "Active", color: "#635BFF" },
  { id: "on_hold", label: "On Hold", color: "#F59E0B" },
  { id: "completed", label: "Completed", color: "#16A34A" },
  { id: "archived", label: "Archived", color: "#94A3B8" },
];

export const PROJECT_STATUS_MAP = Object.fromEntries(PROJECT_STATUSES.map((s) => [s.id, s])) as Record<
  ProjectStatus,
  (typeof PROJECT_STATUSES)[number]
>;

export const PROJECT_COLORS = [
  "#635BFF",
  "#0EA5E9",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#8B5CF6",
  "#14B8A6",
  "#64748B",
];

export const PROJECT_ICONS = [
  "rocket",
  "palette",
  "smartphone",
  "compass",
  "trending",
  "wrench",
  "science",
  "megaphone",
  "lightbulb",
  "folder",
  "globe",
  "zap",
];

export const ROLES: { id: Role; label: string; description: string }[] = [
  { id: "owner", label: "Owner", description: "Full control, billing and ownership transfer." },
  { id: "admin", label: "Admin", description: "Manage projects, members, invitations and settings." },
  { id: "member", label: "Member", description: "Create and manage tasks, comment and upload files." },
  { id: "viewer", label: "Viewer", description: "Read-only access to projects, tasks and reports." },
];

export const ROLE_MAP = Object.fromEntries(ROLES.map((r) => [r.id, r])) as Record<Role, (typeof ROLES)[number]>;

export const TEAM_TYPES: { id: TeamType; label: string; description: string }[] = [
  { id: "software", label: "Software development", description: "Sprints, bugs and releases" },
  { id: "marketing", label: "Marketing agency", description: "Campaigns, clients and content" },
  { id: "startup", label: "Startup", description: "Move fast across every function" },
  { id: "freelance", label: "Freelance", description: "Clients, deliverables and deadlines" },
  { id: "operations", label: "Business operations", description: "Processes, requests and planning" },
  { id: "other", label: "Other", description: "Something else entirely" },
];

/** Upload constraints — mirrored in storage.rules. */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_UPLOAD_TYPES = [
  "image/",
  "application/pdf",
  "text/",
  "application/zip",
  "application/json",
  "application/msword",
  "application/vnd.openxmlformats-officedocument",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "video/mp4",
  "audio/mpeg",
];

export const MAX_SUBTASKS = 50;
export const MAX_LABELS = 10;
