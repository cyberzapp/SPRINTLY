"use client";

import { useWorkspace } from "@/providers/workspace-provider";
import { useAuth } from "@/providers/auth-provider";
import { useCollection } from "@/hooks/use-firestore";
import { paths } from "@/lib/firebase/firestore";
import { updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Check, Inbox as InboxIcon } from "lucide-react";
import Link from "next/link";
import type { AppNotification } from "@/types";
import { toast } from "sonner";

export default function InboxNotificationsPage() {
  const { user } = useAuth();
  const { workspaceId } = useWorkspace();

  const notifsState = useCollection<AppNotification>(
    workspaceId ? paths.notifications(workspaceId) : null,
    `notifications:${workspaceId || "none"}`
  );

  const notifications = notifsState.data
    .filter((n) => n.recipientId === user?.uid)
    .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkRead = async (notifId: string) => {
    if (!workspaceId) return;
    try {
      await updateDoc(paths.notification(workspaceId, notifId), {
        read: true,
        readAt: serverTimestamp(),
      });
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllRead = async () => {
    if (!workspaceId) return;
    try {
      const promises = notifications
        .filter((n) => !n.read)
        .map((n) =>
          updateDoc(paths.notification(workspaceId, n.id), {
            read: true,
            readAt: serverTimestamp(),
          })
        );
      await Promise.all(promises);
      toast.success("All notifications marked as read.");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Inbox</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs px-2 py-0">
                {unreadCount} unread
              </Badge>
            )}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time updates on assignments, mentions, and project alerts.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            className="text-xs gap-1.5"
          >
            <Check className="size-3.5" />
            <span>Mark all read</span>
          </Button>
        )}
      </div>

      <div className="border border-border rounded-xl bg-surface divide-y divide-border overflow-hidden shadow-soft">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`p-4 flex items-start justify-between gap-4 transition-colors ${
              !n.read ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/30"
            }`}
          >
            <div className="flex items-start gap-3 flex-1">
              <div
                className={`size-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  !n.read
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Bell className="size-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-foreground">{n.title}</h4>
                  <span className="text-[10px] text-muted-foreground">
                    {n.createdAt
                      ? new Date(n.createdAt.toMillis()).toLocaleString()
                      : "Just now"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{n.body}</p>
                {n.link && (
                  <Link
                    href={n.link}
                    onClick={() => {
                      if (!n.read) handleMarkRead(n.id);
                    }}
                    className="inline-block text-xs font-semibold text-primary hover:underline pt-1"
                  >
                    View details →
                  </Link>
                )}
              </div>
            </div>

            {!n.read && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleMarkRead(n.id)}
                className="size-7 text-muted-foreground hover:text-foreground shrink-0"
                title="Mark as read"
              >
                <Check className="size-3.5" />
              </Button>
            )}
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="py-16 text-center text-xs text-muted-foreground space-y-2">
            <InboxIcon className="size-8 mx-auto text-muted-foreground/50" />
            <p>Your inbox is clear! No notifications at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
