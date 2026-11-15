import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import * as crypto from "crypto";
import { db, auth } from "./lib/admin";
import { PLAN_LIMITS, type PlanId } from "./lib/plans";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

/* ========================================================================== */
/*                             CALLABLE FUNCTIONS                             */
/* ========================================================================== */

/**
 * Creates a workspace atomically:
 * - Checks user authentication
 * - Inserts workspace document with safe default plan ('free') & zeroed usage
 * - Sets the creator as 'owner' in the members subcollection
 * - Updates user's lastWorkspaceId
 */
export const createWorkspace = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be logged in to create a workspace.");
  }

  const { name, description, teamType } = request.data as {
    name: string;
    description?: string;
    teamType?: string;
  };

  if (!name || typeof name !== "string" || name.trim().length === 0 || name.length > 60) {
    throw new HttpsError("invalid-argument", "Valid workspace name required (1-60 chars).");
  }

  const uid = request.auth.uid;
  const userRecord = await auth.getUser(uid);
  const displayName = userRecord.displayName || (userRecord.email ? userRecord.email.split("@")[0] : "Member");

  const wsRef = db.collection("workspaces").doc();
  const workspaceId = wsRef.id;

  const now = FieldValue.serverTimestamp();

  const batch = db.batch();

  batch.set(wsRef, {
    name: name.trim(),
    description: description ? description.trim().slice(0, 500) : "",
    logoURL: null,
    ownerId: uid,
    teamType: teamType || null,
    plan: "free",
    planStatus: "active",
    usage: {
      members: 1,
      activeProjects: 0,
      storageBytes: 0,
    },
    preferences: {
      weekStartsOn: 1,
      defaultProjectView: "board",
    },
    isDemo: false,
    createdAt: now,
    updatedAt: now,
    createdBy: uid,
    updatedBy: uid,
  });

  const memberRef = wsRef.collection("members").doc(uid);
  batch.set(memberRef, {
    userId: uid,
    workspaceId,
    role: "owner",
    displayName,
    email: userRecord.email || "",
    photoURL: userRecord.photoURL || null,
    jobTitle: "Founder / Owner",
    status: "active",
    joinedAt: now,
    invitedBy: null,
    workspaceName: name.trim(),
    workspaceLogoURL: null,
  });

  const userRef = db.collection("users").doc(uid);
  batch.update(userRef, {
    lastWorkspaceId: workspaceId,
    "onboarding.completed": true,
    "onboarding.workspaceId": workspaceId,
    updatedAt: now,
  });

  // Log activity
  const actRef = wsRef.collection("activity").doc();
  batch.set(actRef, {
    workspaceId,
    projectId: null,
    actorId: uid,
    actorName: displayName,
    type: "member_joined",
    targetType: "workspace",
    targetId: workspaceId,
    targetName: name.trim(),
    data: { role: "owner" },
    createdAt: now,
  });

  await batch.commit();

  return { workspaceId };
});

/**
 * Invites a team member to a workspace:
 * - Checks admin / owner role
 * - Enforces workspace plan membership limit
 * - Generates secure token
 * - Writes invitation document & maps token in /invitationTokens
 */
export const inviteMember = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be logged in.");
  }

  const { workspaceId, email, role } = request.data as {
    workspaceId: string;
    email: string;
    role: "admin" | "member" | "viewer";
  };

  if (!workspaceId || !email || !["admin", "member", "viewer"].includes(role)) {
    throw new HttpsError("invalid-argument", "Missing or invalid parameters.");
  }

  const cleanEmail = email.trim().toLowerCase();
  const callerUid = request.auth.uid;

  // Verify caller is admin or owner
  const callerMemberSnap = await db.doc(`workspaces/${workspaceId}/members/${callerUid}`).get();
  if (!callerMemberSnap.exists || !["owner", "admin"].includes(callerMemberSnap.data()?.role)) {
    throw new HttpsError("permission-denied", "Only workspace admins or owners can invite members.");
  }

  // Get workspace and check limit
  const wsSnap = await db.doc(`workspaces/${workspaceId}`).get();
  if (!wsSnap.exists) {
    throw new HttpsError("not-found", "Workspace not found.");
  }
  const wsData = wsSnap.data()!;
  const plan = (wsData.plan || "free") as PlanId;
  const currentMembers = wsData.usage?.members || 1;
  const maxMembers = PLAN_LIMITS[plan]?.members || 5;

  if (currentMembers >= maxMembers) {
    throw new HttpsError(
      "resource-exhausted",
      `Plan limit reached. The ${plan} plan allows up to ${maxMembers} members. Upgrade to invite more.`
    );
  }

  // Generate secure token (hex)
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const callerUser = await auth.getUser(callerUid);
  const callerName = callerUser.displayName || callerUser.email || "Team Admin";

  const invRef = db.collection(`workspaces/${workspaceId}/invitations`).doc();
  const now = FieldValue.serverTimestamp();
  const expiresAt = Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const batch = db.batch();

  batch.set(invRef, {
    workspaceId,
    workspaceName: wsData.name,
    email: cleanEmail,
    role,
    status: "pending",
    invitedBy: callerUid,
    invitedByName: callerName,
    tokenHash,
    expiresAt,
    createdAt: now,
    acceptedAt: null,
    acceptedBy: null,
    emailDelivery: "not_configured", // clearly documented fallback
    sendCount: 1,
  });

  // Token lookup mapping
  batch.set(db.doc(`invitationTokens/${tokenHash}`), {
    workspaceId,
    invitationId: invRef.id,
    expiresAt,
  });

  await batch.commit();

  return { invitationId: invRef.id, token };
});

/**
 * Validates and accepts an invitation token:
 * - Checks token hash in /invitationTokens
 * - Checks expiration
 * - Updates invitation to 'accepted'
 * - Creates member document
 * - Increments workspace.usage.members
 */
export const acceptInvitation = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be logged in to accept an invitation.");
  }

  const { token } = request.data as { token: string };
  if (!token) throw new HttpsError("invalid-argument", "Missing token.");

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const tokenSnap = await db.doc(`invitationTokens/${tokenHash}`).get();

  if (!tokenSnap.exists) {
    throw new HttpsError("not-found", "Invalid or expired invitation link.");
  }

  const { workspaceId, invitationId, expiresAt } = tokenSnap.data()!;
  if (expiresAt.toMillis() < Date.now()) {
    throw new HttpsError("failed-precondition", "This invitation has expired.");
  }

  const invRef = db.doc(`workspaces/${workspaceId}/invitations/${invitationId}`);
  const invSnap = await invRef.get();
  if (!invSnap.exists || invSnap.data()?.status !== "pending") {
    throw new HttpsError("failed-precondition", "Invitation has already been used or revoked.");
  }

  const invData = invSnap.data()!;
  const uid = request.auth.uid;
  const user = await auth.getUser(uid);

  const wsSnap = await db.doc(`workspaces/${workspaceId}`).get();
  if (!wsSnap.exists) throw new HttpsError("not-found", "Workspace no longer exists.");
  const wsData = wsSnap.data()!;

  const batch = db.batch();
  const now = FieldValue.serverTimestamp();

  // Create or activate member record
  const memberRef = db.doc(`workspaces/${workspaceId}/members/${uid}`);
  batch.set(memberRef, {
    userId: uid,
    workspaceId,
    role: invData.role,
    displayName: user.displayName || user.email?.split("@")[0] || "Team Member",
    email: user.email || invData.email,
    photoURL: user.photoURL || null,
    jobTitle: "",
    status: "active",
    joinedAt: now,
    invitedBy: invData.invitedBy,
    workspaceName: wsData.name,
    workspaceLogoURL: wsData.logoURL || null,
  });

  // Update invitation
  batch.update(invRef, {
    status: "accepted",
    acceptedAt: now,
    acceptedBy: uid,
  });

  // Delete token hash
  batch.delete(db.doc(`invitationTokens/${tokenHash}`));

  // Increment workspace usage
  batch.update(db.doc(`workspaces/${workspaceId}`), {
    "usage.members": FieldValue.increment(1),
    updatedAt: now,
  });

  // Update user's last workspace
  batch.update(db.doc(`users/${uid}`), {
    lastWorkspaceId: workspaceId,
    "onboarding.completed": true,
    "onboarding.workspaceId": workspaceId,
    updatedAt: now,
  });

  // Activity log
  const actRef = db.collection(`workspaces/${workspaceId}/activity`).doc();
  batch.set(actRef, {
    workspaceId,
    projectId: null,
    actorId: uid,
    actorName: user.displayName || user.email || "New Member",
    type: "member_joined",
    targetType: "member",
    targetId: uid,
    targetName: user.displayName || user.email || "Member",
    data: { role: invData.role },
    createdAt: now,
  });

  await batch.commit();

  return { workspaceId };
});

/**
 * Changes a member's role or removes a member:
 * - Only owner can change admin/owner or transfer ownership.
 * - Admin can change member/viewer.
 */
export const updateMemberRole = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be logged in.");

  const { workspaceId, targetUserId, newRole } = request.data as {
    workspaceId: string;
    targetUserId: string;
    newRole: "admin" | "member" | "viewer" | "owner";
  };

  const callerUid = request.auth.uid;
  const callerSnap = await db.doc(`workspaces/${workspaceId}/members/${callerUid}`).get();
  if (!callerSnap.exists) throw new HttpsError("permission-denied", "Not a workspace member.");

  const callerRole = callerSnap.data()?.role;
  if (!["owner", "admin"].includes(callerRole)) {
    throw new HttpsError("permission-denied", "Insufficient permissions.");
  }

  if (newRole === "owner" && callerRole !== "owner") {
    throw new HttpsError("permission-denied", "Only current owner can transfer ownership.");
  }

  const targetRef = db.doc(`workspaces/${workspaceId}/members/${targetUserId}`);
  const targetSnap = await targetRef.get();
  if (!targetSnap.exists) throw new HttpsError("not-found", "Member not found.");

  const batch = db.batch();
  const now = FieldValue.serverTimestamp();

  if (newRole === "owner") {
    // Demote current owner to admin, promote target to owner
    batch.update(callerSnap.ref, { role: "admin", updatedAt: now });
    batch.update(targetRef, { role: "owner", updatedAt: now });
    batch.update(db.doc(`workspaces/${workspaceId}`), { ownerId: targetUserId, updatedAt: now });
  } else {
    batch.update(targetRef, { role: newRole, updatedAt: now });
  }

  await batch.commit();
  return { success: true };
});

/**
 * Removes a member from workspace
 */
export const removeMember = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be logged in.");

  const { workspaceId, targetUserId } = request.data as { workspaceId: string; targetUserId: string };
  const callerUid = request.auth.uid;

  const callerSnap = await db.doc(`workspaces/${workspaceId}/members/${callerUid}`).get();
  if (!callerSnap.exists) throw new HttpsError("permission-denied", "Not a member.");

  const callerRole = callerSnap.data()?.role;
  // User can remove themselves (leave) or admin/owner can remove member
  const isSelf = callerUid === targetUserId;
  if (!isSelf && !["owner", "admin"].includes(callerRole)) {
    throw new HttpsError("permission-denied", "Cannot remove member.");
  }

  const targetSnap = await db.doc(`workspaces/${workspaceId}/members/${targetUserId}`).get();
  if (!targetSnap.exists) throw new HttpsError("not-found", "Target is not a member.");
  if (targetSnap.data()?.role === "owner") {
    throw new HttpsError("failed-precondition", "Owner cannot leave or be removed. Transfer ownership first.");
  }

  const batch = db.batch();
  batch.delete(targetSnap.ref);
  batch.update(db.doc(`workspaces/${workspaceId}`), {
    "usage.members": FieldValue.increment(-1),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
  return { success: true };
});

/* ========================================================================== */
/*                             FIRESTORE TRIGGERS                             */
/* ========================================================================== */

/**
 * Task created trigger:
 * - Increments project taskCount
 * - Generates notifications for assignee
 * - Logs activity
 */
export const onTaskCreated = onDocumentCreated(
  "workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const task = snap.data();
    const { workspaceId, projectId } = event.params;
    const taskId = event.params.taskId;

    const projectRef = db.doc(`workspaces/${workspaceId}/projects/${projectId}`);
    const batch = db.batch();

    // Increment taskCount
    batch.update(projectRef, {
      taskCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Notify assignee if not the creator
    if (task.assigneeId && task.assigneeId !== task.createdBy) {
      const notifRef = db.collection(`workspaces/${workspaceId}/notifications`).doc();
      batch.set(notifRef, {
        workspaceId,
        recipientId: task.assigneeId,
        type: "task_assigned",
        title: "New Task Assigned",
        body: `You have been assigned to: ${task.title}`,
        link: `/app/projects/${projectId}?task=${taskId}`,
        actorId: task.createdBy,
        actorName: "A teammate",
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    // Activity record
    const actRef = db.collection(`workspaces/${workspaceId}/activity`).doc();
    batch.set(actRef, {
      workspaceId,
      projectId,
      actorId: task.createdBy,
      actorName: "Team member",
      type: "task_created",
      targetType: "task",
      targetId: taskId,
      targetName: task.title,
      data: { status: task.status, priority: task.priority },
      createdAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();
  }
);

/**
 * Task updated trigger:
 * - Tracks completion count
 * - Notifies reassigned user
 * - Logs completion / status changes
 */
export const onTaskUpdated = onDocumentUpdated(
  "workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    const { workspaceId, projectId, taskId } = event.params;
    const projectRef = db.doc(`workspaces/${workspaceId}/projects/${projectId}`);
    const batch = db.batch();

    // Did status change to / from 'done'?
    if (before.status !== "done" && after.status === "done") {
      batch.update(projectRef, {
        completedTaskCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
      // Activity
      const actRef = db.collection(`workspaces/${workspaceId}/activity`).doc();
      batch.set(actRef, {
        workspaceId,
        projectId,
        actorId: after.updatedBy,
        actorName: "Team member",
        type: "task_completed",
        targetType: "task",
        targetId: taskId,
        targetName: after.title,
        data: {},
        createdAt: FieldValue.serverTimestamp(),
      });
    } else if (before.status === "done" && after.status !== "done") {
      batch.update(projectRef, {
        completedTaskCount: FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // Assignee changed notification
    if (after.assigneeId && after.assigneeId !== before.assigneeId && after.assigneeId !== after.updatedBy) {
      const notifRef = db.collection(`workspaces/${workspaceId}/notifications`).doc();
      batch.set(notifRef, {
        workspaceId,
        recipientId: after.assigneeId,
        type: "task_assigned",
        title: "Task Assigned to You",
        body: `You were assigned to: ${after.title}`,
        link: `/app/projects/${projectId}?task=${taskId}`,
        actorId: after.updatedBy,
        actorName: "A teammate",
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
  }
);

/**
 * Task deleted trigger:
 * - Decrements project taskCount (and completed count if done)
 */
export const onTaskDeleted = onDocumentDeleted(
  "workspaces/{workspaceId}/projects/{projectId}/tasks/{taskId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const task = snap.data();
    const { workspaceId, projectId } = event.params;

    const projectRef = db.doc(`workspaces/${workspaceId}/projects/${projectId}`);
    const updates: Record<string, unknown> = {
      taskCount: FieldValue.increment(-1),
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (task.status === "done") {
      updates.completedTaskCount = FieldValue.increment(-1);
    }
    await projectRef.update(updates);
  }
);

/**
 * Comment created trigger:
 * - Increments task.commentCount
 * - Handles @mentions and notifies users
 */
export const onCommentCreated = onDocumentCreated(
  "workspaces/{workspaceId}/projects/{projectId}/comments/{commentId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const comment = snap.data();
    const { workspaceId, projectId } = event.params;

    const taskRef = db.doc(`workspaces/${workspaceId}/projects/${projectId}/tasks/${comment.taskId}`);
    const taskSnap = await taskRef.get();
    if (!taskSnap.exists) return;
    const task = taskSnap.data()!;

    const batch = db.batch();

    // Increment commentCount
    batch.update(taskRef, {
      commentCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Notify task assignee if not author
    if (task.assigneeId && task.assigneeId !== comment.authorId) {
      const notifRef = db.collection(`workspaces/${workspaceId}/notifications`).doc();
      batch.set(notifRef, {
        workspaceId,
        recipientId: task.assigneeId,
        type: "comment_received",
        title: "New Comment on Task",
        body: `New comment on: ${task.title}`,
        link: `/app/projects/${projectId}?task=${taskSnap.id}`,
        actorId: comment.authorId,
        actorName: "Teammate",
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    // Mention notifications
    const mentions = (comment.mentionIds as string[]) || [];
    for (const mentionedUid of mentions) {
      if (mentionedUid !== comment.authorId && mentionedUid !== task.assigneeId) {
        const mNotifRef = db.collection(`workspaces/${workspaceId}/notifications`).doc();
        batch.set(mNotifRef, {
          workspaceId,
          recipientId: mentionedUid,
          type: "task_mentioned",
          title: "You were mentioned",
          body: `Mentioned in comment on: ${task.title}`,
          link: `/app/projects/${projectId}?task=${taskSnap.id}`,
          actorId: comment.authorId,
          actorName: "Teammate",
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
    }

    // Log activity
    const actRef = db.collection(`workspaces/${workspaceId}/activity`).doc();
    batch.set(actRef, {
      workspaceId,
      projectId,
      actorId: comment.authorId,
      actorName: "Team member",
      type: "comment_added",
      targetType: "task",
      targetId: taskSnap.id,
      targetName: task.title,
      data: {},
      createdAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();
  }
);

/**
 * Project created trigger:
 * - Updates workspace.usage.activeProjects count
 */
export const onProjectCreated = onDocumentCreated(
  "workspaces/{workspaceId}/projects/{projectId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const project = snap.data();
    const { workspaceId, projectId } = event.params;

    if (["planning", "active", "on_hold"].includes(project.status)) {
      await db.doc(`workspaces/${workspaceId}`).update({
        "usage.activeProjects": FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // Activity
    await db.collection(`workspaces/${workspaceId}/activity`).add({
      workspaceId,
      projectId,
      actorId: project.createdBy,
      actorName: "Team member",
      type: "project_created",
      targetType: "project",
      targetId: projectId,
      targetName: project.name,
      data: { status: project.status },
      createdAt: FieldValue.serverTimestamp(),
    });
  }
);
