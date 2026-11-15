"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useWorkspace } from "@/providers/workspace-provider";
import { signOut } from "@/lib/services/auth";
import { UserAvatar } from "@/components/common/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Plus,
  Bell,
  HelpCircle,
  LogOut,
  User,
  Settings,
  Shield,
  Menu,
} from "lucide-react";
import { toast } from "sonner";

interface TopNavProps {
  onOpenSearch?: () => void;
  onOpenCreateTask?: () => void;
  onToggleMobileSidebar?: () => void;
}

export function TopNav({
  onOpenSearch,
  onOpenCreateTask,
  onToggleMobileSidebar,
}: TopNavProps) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { workspace, role } = useWorkspace();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully.");
      router.push("/login");
    } catch {
      toast.error("Failed to sign out.");
    }
  };

  return (
    <header className="h-14 border-b border-border bg-surface px-4 flex items-center justify-between shrink-0 gap-4">
      {/* Left: Mobile hamburger & breadcrumbs */}
      <div className="flex items-center gap-3">
        {onToggleMobileSidebar && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onToggleMobileSidebar}
          >
            <Menu className="size-5" />
          </Button>
        )}
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <span className="text-foreground font-semibold">{workspace?.name || "Workspace"}</span>
          <span>/</span>
          <span className="capitalize">{role || "Member"}</span>
        </div>
      </div>

      {/* Center: Global Search trigger */}
      <div className="flex-1 max-w-md">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted/50 text-muted-foreground text-xs transition-colors shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <Search className="size-3.5" />
            <span>Search tasks, projects, teammates...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Quick actions, notifications, user avatar */}
      <div className="flex items-center gap-2">
        {onOpenCreateTask && (
          <Button
            size="sm"
            onClick={onOpenCreateTask}
            className="gap-1.5 text-xs shadow-soft font-semibold"
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">New Task</span>
          </Button>
        )}

        <Button variant="ghost" size="icon" asChild className="relative size-8">
          <Link href="/app/inbox" title="Notifications">
            <Bell className="size-4 text-muted-foreground" />
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <UserAvatar
                name={profile?.displayName || user?.displayName || user?.email}
                photoURL={profile?.photoURL || user?.photoURL}
                size="sm"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none truncate">
                  {profile?.displayName || user?.displayName || "User"}
                </p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {user?.email || "No email"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/app/settings/profile" className="cursor-pointer text-xs flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                <span>Profile Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/app/settings/workspace" className="cursor-pointer text-xs flex items-center gap-2">
                <Settings className="size-4 text-muted-foreground" />
                <span>Workspace Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/app/settings/billing" className="cursor-pointer text-xs flex items-center gap-2">
                <Shield className="size-4 text-muted-foreground" />
                <span>Plan & Billing</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer text-xs text-destructive focus:text-destructive flex items-center gap-2"
            >
              <LogOut className="size-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
