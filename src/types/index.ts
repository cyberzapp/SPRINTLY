import type { Timestamp } from "firebase/firestore";

/* -------------------------------------------------------------------------- */
/*                                Primitives                                  */
/* -------------------------------------------------------------------------- */

export type Role = "owner" | "admin" | "member" | "viewer";
export type PlanId = "free" | "pro" | "business";
export type PlanStatus = "active" | "trialing" | "past_due" | "canceled";

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "archived";
export type TaskStatus = "backlog" | "todo" | "in_progress" | "in_review" | "done";
export type TaskPriority = "urgent" | "high" | "medium" | "low" | "none";

export type TeamType =
  | "software"
  | "marketing"
  | "startup"
  | "freelance"
  | "operations"
  | "other";

export type InvitationStatus = "pending" | "accepted" | "revoked" | "expired";

export type NotificationType =
  | "task_assigned"
  | "task_mentioned"
  | "task_due_soon"
  | "task_overdue"
  | "comment_received"
  | "project_invitation"
  | "workspace_invitation"
  | "project_update";

export type ActivityType =
  | "project_created"
  | "project_updated"
  | "project_archived"
  | "task_created"
  | "task_completed"
  | "task_status_changed"
  | "task_reassigned"
  | "task_priority_changed"
  | "task_due_date_changed"
  | "task_deleted"
  | "comment_added"
  | "file_uploaded"
  | "member_invited"
  | "member_joined"
  | "member_role_changed"
  | "member_removed";

/** Fields shared by every first-class Firestore document. */
export interface BaseDoc {
  id: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  createdBy: string;
  updatedBy: string;
}

/* -------------------------------------------------------------------------- */
/*                                   Users                                    */
/* -------------------------------------------------------------------------- */

export interface OnboardingState {
  step: number;
  completed: boolean;
  teamType: TeamType | null;
  workspaceId: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  jobTitle: string;
  timeZone: string;
  lastWorkspaceId: string | null;
  onboarding: OnboardingState;
  isDemo?: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface NotificationPreferences {
  inApp: Record<NotificationType, boolean>;
  push: boolean;
  email: boolean;
}

/* -------------------------------------------------------------------------- */
/*                                Workspaces                                  */
/* -------------------------------------------------------------------------- */

export interface WorkspaceUsage {
  members: number;
  activeProjects: number;
  storageBytes: number;
}

export interface WorkspacePreferences {
  weekStartsOn: 0 | 1;
  defaultProjectView: "board" | "list";
}

export interface Workspace extends BaseDoc {
  name: string;
  description: string;
  logoURL: string | null;
  ownerId: string;
  teamType: TeamType | null;
  /** Protected — only writable by trusted backend code. */
  plan: PlanId;
  /** Protected — only writable by trusted backend code. */
  planStatus: PlanStatus;
  /** Protected — maintained by Cloud Functions. */
  usage: WorkspaceUsage;
  preferences: WorkspacePreferences;
  isDemo: boolean;
}

export interface Member {
  id: string; // == userId
  userId: string;
  workspaceId: string;
  role: Role;
  displayName: string;
  email: string;
  photoURL: string | null;
  jobTitle: string;
  status: "active" | "deactivated";
  joinedAt: Timestamp | null;
  invitedBy: string | null;
  /** Denormalized (kept in sync by Cloud Functions) for the workspace switcher. */
  workspaceName: string;
  workspaceLogoURL: string | null;
}

export interface Invitation {
  id: string;
  workspaceId: string;
  workspaceName: string;
  email: string;
  role: Exclude<Role, "owner">;
  status: InvitationStatus;
  invitedBy: string;
  invitedByName: string;
  expiresAt: Timestamp;
  createdAt: Timestamp | null;
  acceptedAt: Timestamp | null;
  acceptedBy: string | null;
  emailDelivery: "sent" | "not_configured" | "failed";
  sendCount: number;
}

/* -------------------------------------------------------------------------- */
/*                                  Projects                                  */
/* -------------------------------------------------------------------------- */

export interface Project extends BaseDoc {
  workspaceId: string;
  name: string;
  key: string;
  description: string;
  icon: string;
  color: string;
  ownerId: string;
  memberIds: string[];
  status: ProjectStatus;
  startDate: Timestamp | null;
  dueDate: Timestamp | null;
  /** Monotonic counter used to assign human-readable task numbers. */
  taskSeq: number;
  /** Protected — maintained by Cloud Functions. */
  taskCount: number;
  /** Protected — maintained by Cloud Functions. */
  completedTaskCount: number;
}

export interface Milestone extends BaseDoc {
  workspaceId: string;
  projectId: string;
  title: string;
  date: Timestamp;
  completed: boolean;
}

/* -------------------------------------------------------------------------- */
/*                                   Tasks                                    */
/* -------------------------------------------------------------------------- */

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task extends BaseDoc {
  workspaceId: string;
  projectId: string;
  number: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  collaboratorIds: string[];
  labels: string[];
  startDate: Timestamp | null;
  dueDate: Timestamp | null;
  estimate: number | null;
  subtasks: Subtask[];
  blockedBy: string[];
  order: number;
  completedAt: Timestamp | null;
  searchKeywords: string[];
  /** Protected — maintained by Cloud Functions. */
  commentCount: number;
  /** Protected — maintained by Cloud Functions. */
  attachmentCount: number;
}

export interface CommentAttachment {
  fileId: string;
  name: string;
  size: number;
  contentType: string;
  storagePath: string;
}

export interface Comment {
  id: string;
  workspaceId: string;
  projectId: string;
  taskId: string;
  parentId: string | null;
  body: string;
  mentionIds: string[];
  attachments: CommentAttachment[];
  authorId: string;
  edited: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface ProjectFile {
  id: string;
  workspaceId: string;
  projectId: string;
  taskId: string | null;
  commentId: string | null;
  name: string;
  storagePath: string;
  contentType: string;
  size: number;
  uploadedBy: string;
  uploaderName: string;
  createdAt: Timestamp | null;
}

export interface Activity {
  id: string;
  workspaceId: string;
  projectId: string | null;
  actorId: string;
  actorName: string;
  type: ActivityType;
  targetType: "project" | "task" | "comment" | "member" | "file" | "invitation";
  targetId: string;
  targetName: string;
  data: Record<string, string | number | boolean | null>;
  createdAt: Timestamp | null;
}

export interface AppNotification {
  id: string;
  workspaceId: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  actorId: string | null;
  actorName: string | null;
  read: boolean;
  createdAt: Timestamp | null;
}
