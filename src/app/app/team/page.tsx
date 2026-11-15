"use client";

import { useState } from "react";
import { useWorkspace } from "@/providers/workspace-provider";
import { useAuth } from "@/providers/auth-provider";
import { inviteMemberCall, updateMemberRoleCall, removeMemberCall } from "@/lib/services/workspaces";
import { UserAvatar } from "@/components/common/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Shield, Trash2, Mail, Check } from "lucide-react";
import type { Role } from "@/types";
import { toast } from "sonner";

export default function TeamManagementPage() {
  const { user } = useAuth();
  const { members, workspaceId, role } = useWorkspace();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member" | "viewer">("member");
  const [generatedInviteLink, setGeneratedInviteLink] = useState("");
  const [inviting, setInviting] = useState(false);

  const canManage = role === "owner" || role === "admin";

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !inviteEmail.trim()) return;

    setInviting(true);
    try {
      const res = await inviteMemberCall({
        workspaceId,
        email: inviteEmail.trim(),
        role: inviteRole,
      });

      const inviteUrl = `${window.location.origin}/invite/${res.token}`;
      setGeneratedInviteLink(inviteUrl);
      toast.success("Invitation generated! Share the link below.");
    } catch (err: any) {
      toast.error(err.message || "Failed to invite member.");
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (targetUserId: string, newRole: Role) => {
    if (!workspaceId) return;
    try {
      await updateMemberRoleCall({ workspaceId, targetUserId, newRole });
      toast.success("Role updated successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to change role.");
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!confirm("Are you sure you want to remove this member from the workspace?")) return;
    if (!workspaceId) return;
    try {
      await removeMemberCall({ workspaceId, targetUserId });
      toast.success("Member removed.");
    } catch (err: any) {
      toast.error(err.message || "Failed to remove member.");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Team Members
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage who has access to this workspace and configure their permissions.
          </p>
        </div>

        {canManage && (
          <Button
            onClick={() => {
              setGeneratedInviteLink("");
              setInviteEmail("");
              setInviteOpen(true);
            }}
            size="sm"
            className="gap-1.5 text-xs shadow-soft font-semibold"
          >
            <UserPlus className="size-4" />
            <span>Invite Member</span>
          </Button>
        )}
      </div>

      <div className="border border-border rounded-xl bg-surface overflow-hidden shadow-soft">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
            <tr>
              <th className="p-3.5">Member</th>
              <th className="p-3.5">Email</th>
              <th className="p-3.5">Role</th>
              <th className="p-3.5">Status</th>
              {canManage && <th className="p-3.5 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.map((m) => {
              const isSelf = m.userId === user?.uid;
              const isOwner = m.role === "owner";

              return (
                <tr key={m.userId} className="hover:bg-muted/20 transition-colors">
                  <td className="p-3.5">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar name={m.displayName} photoURL={m.photoURL} size="sm" />
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          <span>{m.displayName}</span>
                          {isSelf && (
                            <Badge variant="secondary" className="text-[9px] py-0 px-1">
                              You
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">{m.jobTitle || "Member"}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 text-muted-foreground">{m.email}</td>
                  <td className="p-3.5">
                    {canManage && !isSelf && !isOwner ? (
                      <Select
                        value={m.role}
                        onValueChange={(val) => handleRoleChange(m.userId, val as Role)}
                      >
                        <SelectTrigger className="h-7 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                        {m.role}
                      </Badge>
                    )}
                  </td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 text-[11px] font-medium">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </td>
                  {canManage && (
                    <td className="p-3.5 text-right">
                      {!isOwner && !isSelf && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMember(m.userId)}
                          className="size-7 text-muted-foreground hover:text-destructive"
                          title="Remove Member"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Invite to Workspace</DialogTitle>
          </DialogHeader>

          {!generatedInviteLink ? (
            <form onSubmit={handleSendInvite} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="invEmail" className="text-xs">
                  Teammate's Email Address
                </Label>
                <Input
                  id="invEmail"
                  type="email"
                  placeholder="name@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Role & Permissions</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(v) => setInviteRole(v as any)}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member" className="text-xs">
                      Member (Can create & manage tasks)
                    </SelectItem>
                    <SelectItem value="admin" className="text-xs">
                      Admin (Can invite members & manage projects)
                    </SelectItem>
                    <SelectItem value="viewer" className="text-xs">
                      Viewer (Read-only access)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setInviteOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={inviting}>
                  {inviting ? "Generating..." : "Generate Invite Link"}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-xs space-y-1 text-primary">
                <p className="font-semibold">Invitation Ready!</p>
                <p className="text-[11px] text-muted-foreground">
                  Since external email delivery is optional, share this direct invitation URL with your teammate:
                </p>
              </div>

              <div className="flex gap-2">
                <Input value={generatedInviteLink} readOnly className="text-xs font-mono h-8" />
                <Button
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedInviteLink);
                    toast.success("Copied to clipboard!");
                  }}
                >
                  <Check className="size-3.5" />
                  <span>Copy</span>
                </Button>
              </div>

              <DialogFooter>
                <Button size="sm" onClick={() => setInviteOpen(false)}>
                  Done
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
