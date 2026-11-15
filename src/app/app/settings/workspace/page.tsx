"use client";

import { useState } from "react";
import { useWorkspace } from "@/providers/workspace-provider";
import { useAuth } from "@/providers/auth-provider";
import { updateWorkspaceDetails } from "@/lib/services/workspaces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Shield, Building2, User, Bell, CreditCard, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function WorkspaceSettingsPage() {
  const { user } = useAuth();
  const { workspace, workspaceId, role } = useWorkspace();

  const [name, setName] = useState(workspace?.name || "");
  const [description, setDescription] = useState(workspace?.description || "");
  const [saving, setSaving] = useState(false);

  const canEdit = role === "owner" || role === "admin";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !user) return;

    setSaving(true);
    try {
      await updateWorkspaceDetails(workspaceId, user.uid, {
        name: name.trim(),
        description: description.trim(),
      });
      toast.success("Workspace settings updated.");
    } catch {
      toast.error("Failed to update settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Workspace Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage workspace branding, team configurations, and plan details.
        </p>
      </div>

      <div className="flex gap-2 border-b border-border pb-3">
        <Button variant="secondary" size="sm" className="text-xs" asChild>
          <Link href="/app/settings/workspace">General</Link>
        </Button>
        <Button variant="ghost" size="sm" className="text-xs" asChild>
          <Link href="/app/settings/profile">Profile</Link>
        </Button>
        <Button variant="ghost" size="sm" className="text-xs" asChild>
          <Link href="/app/settings/billing">Plan & Billing</Link>
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="p-5 rounded-xl border border-border bg-surface shadow-soft space-y-4">
          <h2 className="text-sm font-bold tracking-tight">General Information</h2>

          <div className="space-y-1.5">
            <Label htmlFor="wsName" className="text-xs">
              Workspace Name
            </Label>
            <Input
              id="wsName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canEdit}
              className="text-xs max-w-md"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wsDesc" className="text-xs">
              Description
            </Label>
            <Textarea
              id="wsDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canEdit}
              rows={3}
              className="text-xs max-w-md resize-none"
            />
          </div>

          {canEdit && (
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </div>

        {/* Plan overview */}
        <div className="p-5 rounded-xl border border-border bg-surface shadow-soft flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold">Current Plan: {workspace?.plan?.toUpperCase()}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Includes {workspace?.usage?.members || 1} members and {workspace?.usage?.activeProjects || 0} active projects.
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="text-xs">
            <Link href="/app/settings/billing">Manage Subscription</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
