"use client";

import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { updateUserProfile } from "@/lib/services/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/common/user-avatar";
import Link from "next/link";
import { toast } from "sonner";

export default function ProfileSettingsPage() {
  const { user, profile } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.displayName || user?.displayName || "");
  const [jobTitle, setJobTitle] = useState(profile?.jobTitle || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        jobTitle: jobTitle.trim(),
      });
      toast.success("Profile updated successfully.");
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Profile Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage your personal information, display name, and credentials.
        </p>
      </div>

      <div className="flex gap-2 border-b border-border pb-3">
        <Button variant="ghost" size="sm" className="text-xs" asChild>
          <Link href="/app/settings/workspace">General</Link>
        </Button>
        <Button variant="secondary" size="sm" className="text-xs" asChild>
          <Link href="/app/settings/profile">Profile</Link>
        </Button>
        <Button variant="ghost" size="sm" className="text-xs" asChild>
          <Link href="/app/settings/billing">Plan & Billing</Link>
        </Button>
      </div>

      <form onSubmit={handleSave} className="p-5 rounded-xl border border-border bg-surface shadow-soft space-y-4">
        <div className="flex items-center gap-4 pb-2">
          <UserAvatar
            name={displayName || user?.displayName}
            photoURL={profile?.photoURL || user?.photoURL}
            size="lg"
          />
          <div>
            <h3 className="text-sm font-bold">{displayName || "Your Name"}</h3>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dispName" className="text-xs">
            Display Name
          </Label>
          <Input
            id="dispName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="text-xs max-w-md"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="jobTitle" className="text-xs">
            Job Title / Role
          </Label>
          <Input
            id="jobTitle"
            placeholder="e.g. Senior Frontend Engineer"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="text-xs max-w-md"
          />
        </div>

        <div className="pt-2">
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </form>
    </div>
  );
}
