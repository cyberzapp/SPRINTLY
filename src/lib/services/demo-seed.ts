"use client";

import {
  writeBatch,
  doc,
  collection,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { paths } from "@/lib/firebase/firestore";
import { buildSearchKeywords } from "@/lib/utils";
import type { TaskPriority, TaskStatus } from "@/types";

/**
 * Creates an isolated, fully populated "Acme Studio" demo workspace
 * for the authenticated visitor.
 */
export async function seedDemoWorkspace(userId: string, userEmail: string): Promise<string> {
  const db = getDb();
  const wsRef = doc(collection(db, "workspaces"));
  const workspaceId = wsRef.id;

  const now = Timestamp.now();
  const sevenDaysFromNow = Timestamp.fromMillis(Date.now() + 7 * 86400000);
  const fourteenDaysFromNow = Timestamp.fromMillis(Date.now() + 14 * 86400000);
  const thirtyDaysFromNow = Timestamp.fromMillis(Date.now() + 30 * 86400000);
  const twoDaysAgo = Timestamp.fromMillis(Date.now() - 2 * 86400000);

  // 1. Workspace
  const batch1 = writeBatch(db);
  batch1.set(wsRef, {
    name: "Acme Studio",
    description: "Digital product design, brand identity, and scalable SaaS engineering.",
    logoURL: null,
    ownerId: userId,
    teamType: "software",
    plan: "pro",
    planStatus: "active",
    usage: {
      members: 6,
      activeProjects: 4,
      storageBytes: 15420000,
    },
    preferences: {
      weekStartsOn: 1,
      defaultProjectView: "board",
    },
    isDemo: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: userId,
    updatedBy: userId,
  });

  // 2. Members
  const demoMembers = [
    {
      userId,
      role: "owner",
      displayName: "You (Demo Lead)",
      email: userEmail,
      jobTitle: "Product Lead",
    },
    {
      userId: `demo_sarah_${workspaceId}`,
      role: "admin",
      displayName: "Sarah Chen",
      email: "sarah.chen@acme.example",
      jobTitle: "Design Director",
    },
    {
      userId: `demo_marcus_${workspaceId}`,
      role: "member",
      displayName: "Marcus Vance",
      email: "marcus.v@acme.example",
      jobTitle: "Senior Frontend Engineer",
    },
    {
      userId: `demo_elena_${workspaceId}`,
      role: "member",
      displayName: "Elena Rostova",
      email: "elena.r@acme.example",
      jobTitle: "Backend Architect",
    },
    {
      userId: `demo_alex_${workspaceId}`,
      role: "member",
      displayName: "Alex Rivera",
      email: "alex.r@acme.example",
      jobTitle: "Product Manager",
    },
    {
      userId: `demo_david_${workspaceId}`,
      role: "viewer",
      displayName: "David Kim",
      email: "david.kim@acme.example",
      jobTitle: "Marketing Strategist",
    },
  ];

  for (const m of demoMembers) {
    const mRef = paths.member(workspaceId, m.userId);
    batch1.set(mRef, {
      userId: m.userId,
      workspaceId,
      role: m.role,
      displayName: m.displayName,
      email: m.email,
      photoURL: null,
      jobTitle: m.jobTitle,
      status: "active",
      joinedAt: twoDaysAgo,
      invitedBy: userId,
      workspaceName: "Acme Studio",
      workspaceLogoURL: null,
    });
  }

  // 3. Projects
  const projectsData = [
    {
      id: `proj_cloud_${workspaceId}`,
      name: "Cloud Platform 2.0",
      key: "CP",
      description: "Next generation cloud management dashboard and API gateway.",
      icon: "zap",
      color: "#635BFF",
      ownerId: userId,
      memberIds: [userId, `demo_marcus_${workspaceId}`, `demo_elena_${workspaceId}`],
      status: "active",
      taskSeq: 8,
      taskCount: 8,
      completedTaskCount: 2,
    },
    {
      id: `proj_brand_${workspaceId}`,
      name: "Brand Design System",
      key: "BDS",
      description: "Unified design tokens, icons, and multi-brand style guides in Figma & code.",
      icon: "palette",
      color: "#EC4899",
      ownerId: `demo_sarah_${workspaceId}`,
      memberIds: [userId, `demo_sarah_${workspaceId}`, `demo_marcus_${workspaceId}`],
      status: "active",
      taskSeq: 7,
      taskCount: 7,
      completedTaskCount: 3,
    },
    {
      id: `proj_mobile_${workspaceId}`,
      name: "Mobile App (iOS & Android)",
      key: "MOB",
      description: "React Native client with offline sync, notifications, and biometric auth.",
      icon: "smartphone",
      color: "#0EA5E9",
      ownerId: `demo_alex_${workspaceId}`,
      memberIds: [userId, `demo_marcus_${workspaceId}`, `demo_alex_${workspaceId}`],
      status: "planning",
      taskSeq: 6,
      taskCount: 6,
      completedTaskCount: 0,
    },
    {
      id: `proj_growth_${workspaceId}`,
      name: "Q4 Growth & Launch",
      key: "Q4",
      description: "Conversion funnels, landing page optimization, and product analytics setup.",
      icon: "trending",
      color: "#10B981",
      ownerId: userId,
      memberIds: [userId, `demo_david_${workspaceId}`, `demo_alex_${workspaceId}`],
      status: "active",
      taskSeq: 6,
      taskCount: 6,
      completedTaskCount: 4,
    },
  ];

  for (const p of projectsData) {
    const pRef = paths.project(workspaceId, p.id);
    batch1.set(pRef, {
      workspaceId,
      name: p.name,
      key: p.key,
      description: p.description,
      icon: p.icon,
      color: p.color,
      ownerId: p.ownerId,
      memberIds: p.memberIds,
      status: p.status,
      taskSeq: p.taskSeq,
      taskCount: p.taskCount,
      completedTaskCount: p.completedTaskCount,
      startDate: twoDaysAgo,
      dueDate: thirtyDaysFromNow,
      createdAt: twoDaysAgo,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
    });
  }

  // User profile workspace update
  batch1.update(paths.user(userId), {
    lastWorkspaceId: workspaceId,
    "onboarding.completed": true,
    "onboarding.workspaceId": workspaceId,
    updatedAt: serverTimestamp(),
  });

  await batch1.commit();

  // 4. Batch 2: Tasks across projects
  const batch2 = writeBatch(db);

  const sampleTasks: {
    projectId: string;
    num: number;
    title: string;
    desc: string;
    status: TaskStatus;
    priority: TaskPriority;
    assigneeId: string | null;
    labels: string[];
    dueDate: Timestamp | null;
    order: number;
  }[] = [
    // Cloud Platform 2.0 Tasks
    {
      projectId: `proj_cloud_${workspaceId}`,
      num: 1,
      title: "Design high-throughput rate limiter for GraphQL API",
      desc: "Implement sliding window counter using Redis with sub-millisecond response latency.",
      status: "in_progress",
      priority: "urgent",
      assigneeId: `demo_elena_${workspaceId}`,
      labels: ["backend", "performance"],
      dueDate: sevenDaysFromNow,
      order: 1000,
    },
    {
      projectId: `proj_cloud_${workspaceId}`,
      num: 2,
      title: "Set up OpenTelemetry distributed tracing pipeline",
      desc: "Export trace spans to Jaeger with sampling rules for heavy production queries.",
      status: "todo",
      priority: "high",
      assigneeId: `demo_elena_${workspaceId}`,
      labels: ["devops", "observability"],
      dueDate: fourteenDaysFromNow,
      order: 2000,
    },
    {
      projectId: `proj_cloud_${workspaceId}`,
      num: 3,
      title: "Implement virtualized table for cluster node metrics",
      desc: "Render 10,000+ metrics records seamlessly with 60fps scrolling and column sorting.",
      status: "in_progress",
      priority: "high",
      assigneeId: `demo_marcus_${workspaceId}`,
      labels: ["frontend", "ui"],
      dueDate: sevenDaysFromNow,
      order: 3000,
    },
    {
      projectId: `proj_cloud_${workspaceId}`,
      num: 4,
      title: "Configure multi-region failover health probes",
      desc: "Automated DNS failover testing between us-east and eu-west regions.",
      status: "done",
      priority: "medium",
      assigneeId: userId,
      labels: ["infrastructure"],
      dueDate: twoDaysAgo,
      order: 4000,
    },
    {
      projectId: `proj_cloud_${workspaceId}`,
      num: 5,
      title: "Audit security headers and CSP policies",
      desc: "Verify strict CSP, CORS headers, and HSTS across all microservice entry points.",
      status: "done",
      priority: "medium",
      assigneeId: userId,
      labels: ["security"],
      dueDate: twoDaysAgo,
      order: 5000,
    },
    {
      projectId: `proj_cloud_${workspaceId}`,
      num: 6,
      title: "Add webhook retry worker with exponential backoff",
      desc: "Dead letter queue processing and automated signature validation.",
      status: "backlog",
      priority: "low",
      assigneeId: null,
      labels: ["backend"],
      dueDate: null,
      order: 6000,
    },
    {
      projectId: `proj_cloud_${workspaceId}`,
      num: 7,
      title: "Interactive latency breakdown chart",
      desc: "Recharts area chart visualizing TTFB, DNS lookup, and server response times.",
      status: "in_review",
      priority: "medium",
      assigneeId: `demo_marcus_${workspaceId}`,
      labels: ["frontend", "analytics"],
      dueDate: sevenDaysFromNow,
      order: 7000,
    },
    {
      projectId: `proj_cloud_${workspaceId}`,
      num: 8,
      title: "Draft public developer API documentation",
      desc: "Interactive OpenAPI 3.1 specification and code snippets in curl, TS, and Python.",
      status: "todo",
      priority: "medium",
      assigneeId: userId,
      labels: ["docs"],
      dueDate: fourteenDaysFromNow,
      order: 8000,
    },

    // Brand Design System Tasks
    {
      projectId: `proj_brand_${workspaceId}`,
      num: 1,
      title: "Export semantic color tokens into Tailwind config",
      desc: "Support light/dark modes and high-contrast accessibility standards.",
      status: "done",
      priority: "high",
      assigneeId: `demo_sarah_${workspaceId}`,
      labels: ["design", "tokens"],
      dueDate: twoDaysAgo,
      order: 1000,
    },
    {
      projectId: `proj_brand_${workspaceId}`,
      num: 2,
      title: "Create accessible form components with shadcn/ui",
      desc: "Custom inputs, selects, segmented controls with WCAG 2.1 AAA keyboard focus.",
      status: "in_progress",
      priority: "high",
      assigneeId: `demo_marcus_${workspaceId}`,
      labels: ["frontend", "a11y"],
      dueDate: sevenDaysFromNow,
      order: 2000,
    },
    {
      projectId: `proj_brand_${workspaceId}`,
      num: 3,
      title: "Design illustration pack for empty states and error pages",
      desc: "12 vector illustrations tailored to onboarding, 404s, and empty project boards.",
      status: "in_review",
      priority: "medium",
      assigneeId: `demo_sarah_${workspaceId}`,
      labels: ["design", "illustration"],
      dueDate: sevenDaysFromNow,
      order: 3000,
    },
    {
      projectId: `proj_brand_${workspaceId}`,
      num: 4,
      title: "Conduct typography audit across all dashboard views",
      desc: "Check scale harmony, tabular numerals on metric counters, and text contrast.",
      status: "done",
      priority: "low",
      assigneeId: userId,
      labels: ["design"],
      dueDate: twoDaysAgo,
      order: 4000,
    },
    {
      projectId: `proj_brand_${workspaceId}`,
      num: 5,
      title: "Dark mode palette refinement",
      desc: "Calibrate charcoal backgrounds (#0F1222) to avoid pure black clipping.",
      status: "done",
      priority: "medium",
      assigneeId: `demo_sarah_${workspaceId}`,
      labels: ["design"],
      dueDate: twoDaysAgo,
      order: 5000,
    },

    // Mobile App Tasks
    {
      projectId: `proj_mobile_${workspaceId}`,
      num: 1,
      title: "Configure offline SQLite cache for mobile board view",
      desc: "Optimistic task status updates with background synchronization queue.",
      status: "todo",
      priority: "urgent",
      assigneeId: `demo_marcus_${workspaceId}`,
      labels: ["mobile", "offline"],
      dueDate: fourteenDaysFromNow,
      order: 1000,
    },
    {
      projectId: `proj_mobile_${workspaceId}`,
      num: 2,
      title: "Biometric login flow (FaceID / Fingerprint)",
      desc: "Secure keychain storage for refresh tokens and rapid unlock screen.",
      status: "todo",
      priority: "high",
      assigneeId: `demo_alex_${workspaceId}`,
      labels: ["mobile", "auth"],
      dueDate: fourteenDaysFromNow,
      order: 2000,
    },
    {
      projectId: `proj_mobile_${workspaceId}`,
      num: 3,
      title: "Push notifications integration for task mentions",
      desc: "Handle deep linking directly into the targeted task comment thread.",
      status: "backlog",
      priority: "medium",
      assigneeId: null,
      labels: ["mobile", "push"],
      dueDate: null,
      order: 3000,
    },

    // Growth Tasks
    {
      projectId: `proj_growth_${workspaceId}`,
      num: 1,
      title: "A/B test pricing table tier highlights",
      desc: "Test monthly vs annual switcher and Pro tier callout banner.",
      status: "done",
      priority: "high",
      assigneeId: userId,
      labels: ["growth", "pricing"],
      dueDate: twoDaysAgo,
      order: 1000,
    },
    {
      projectId: `proj_growth_${workspaceId}`,
      num: 2,
      title: "SEO meta tags & dynamic OpenGraph card generator",
      desc: "Generate social preview images with project stats and team count.",
      status: "done",
      priority: "medium",
      assigneeId: userId,
      labels: ["seo", "marketing"],
      dueDate: twoDaysAgo,
      order: 2000,
    },
    {
      projectId: `proj_growth_${workspaceId}`,
      num: 3,
      title: "Customer testimonial carousel video clips",
      desc: "Edit 30s clips highlighting sprint velocity improvements.",
      status: "done",
      priority: "medium",
      assigneeId: `demo_david_${workspaceId}`,
      labels: ["marketing"],
      dueDate: twoDaysAgo,
      order: 3000,
    },
    {
      projectId: `proj_growth_${workspaceId}`,
      num: 4,
      title: "Integrate privacy-conscious product analytics",
      desc: "Track funnel conversions without logging PII or customer payloads.",
      status: "done",
      priority: "urgent",
      assigneeId: userId,
      labels: ["analytics"],
      dueDate: twoDaysAgo,
      order: 4000,
    },
    {
      projectId: `proj_growth_${workspaceId}`,
      num: 5,
      title: "Launch Product Hunt scheduled release campaign",
      desc: "Prepare assets, first maker comment, and VIP notification list.",
      status: "in_progress",
      priority: "urgent",
      assigneeId: `demo_david_${workspaceId}`,
      labels: ["launch"],
      dueDate: sevenDaysFromNow,
      order: 5000,
    },
  ];

  for (const t of sampleTasks) {
    const tRef = doc(paths.tasks(workspaceId, t.projectId));
    const kws = buildSearchKeywords(t.title, t.desc, ...t.labels);
    batch2.set(tRef, {
      workspaceId,
      projectId: t.projectId,
      number: t.num,
      title: t.title,
      description: t.desc,
      status: t.status,
      priority: t.priority,
      assigneeId: t.assigneeId,
      collaboratorIds: [],
      labels: t.labels,
      startDate: twoDaysAgo,
      dueDate: t.dueDate,
      estimate: 3,
      subtasks: [
        { id: "sub_1", title: "Review requirements & API docs", done: true },
        { id: "sub_2", title: "Implement core logic & unit tests", done: t.status === "done" },
        { id: "sub_3", title: "QA sign-off & deploy", done: t.status === "done" },
      ],
      blockedBy: [],
      order: t.order,
      completedAt: t.status === "done" ? twoDaysAgo : null,
      searchKeywords: kws,
      commentCount: 2,
      attachmentCount: 0,
      createdAt: twoDaysAgo,
      updatedAt: now,
      createdBy: userId,
      updatedBy: userId,
    });
  }

  // Sample Notifications for visitor
  const notifRef1 = doc(paths.notifications(workspaceId));
  batch2.set(notifRef1, {
    workspaceId,
    recipientId: userId,
    type: "task_assigned",
    title: "Welcome to your Acme Studio demo!",
    body: "Explore your interactive Kanban boards, Gantt timeline, and analytics.",
    link: `/app/projects/proj_cloud_${workspaceId}`,
    actorId: `demo_sarah_${workspaceId}`,
    actorName: "Sarah Chen",
    read: false,
    createdAt: now,
  });

  const notifRef2 = doc(paths.notifications(workspaceId));
  batch2.set(notifRef2, {
    workspaceId,
    recipientId: userId,
    type: "task_mentioned",
    title: "Sarah mentioned you",
    body: "Can you review the typography audit findings?",
    link: `/app/projects/proj_brand_${workspaceId}`,
    actorId: `demo_sarah_${workspaceId}`,
    actorName: "Sarah Chen",
    read: false,
    createdAt: now,
  });

  await batch2.commit();

  return workspaceId;
}
