"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWorkspace } from "@/providers/workspace-provider";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { Logo } from "@/components/common/logo";
import {
  LayoutDashboard,
  CheckCircle2,
  Inbox,
  FolderKanban,
  CalendarDays,
  Users,
  BarChart3,
  Settings,
  Plus,
  Compass,
} from "lucide-react";
import { ProjectIcon } from "@/components/common/project-icon";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  onOpenCreateProject?: () => void;
  className?: string;
}

export function Sidebar({ onOpenCreateProject, className = "" }: SidebarProps) {
  const pathname = usePathname();
  const { projects } = useWorkspace();

  const mainNav = [
    { label: "Overview", href: "/app", icon: LayoutDashboard },
    { label: "My Tasks", href: "/app/my-tasks", icon: CheckCircle2 },
    { label: "Inbox", href: "/app/inbox", icon: Inbox },
    { label: "Projects", href: "/app/projects", icon: FolderKanban },
    { label: "Calendar", href: "/app/calendar", icon: CalendarDays },
    { label: "Team", href: "/app/team", icon: Users },
    { label: "Reports", href: "/app/reports", icon: BarChart3 },
    { label: "Settings", href: "/app/settings/workspace", icon: Settings },
  ];

  return (
    <aside
      className={`w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col shrink-0 select-none ${className}`}
    >
      {/* Brand & Workspace Switcher */}
      <div className="p-4 flex flex-col gap-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <Logo href="/app" />
          <Badge variant="outline" className="text-[10px] bg-sidebar-accent border-sidebar-border text-sidebar-muted py-0">
            v1.0
          </Badge>
        </div>
        <WorkspaceSwitcher />
      </div>

      {/* Primary Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
        <nav className="space-y-1">
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Favorite / Active Projects */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">
              Projects ({projects.length})
            </span>
            {onOpenCreateProject && (
              <button
                onClick={onOpenCreateProject}
                className="text-sidebar-muted hover:text-sidebar-foreground p-0.5 rounded hover:bg-sidebar-accent transition-colors"
                title="New Project"
              >
                <Plus className="size-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-0.5">
            {projects.slice(0, 8).map((p) => {
              const isProjActive = pathname.startsWith(`/app/projects/${p.id}`);
              return (
                <Link
                  key={p.id}
                  href={`/app/projects/${p.id}`}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors truncate ${
                    isProjActive
                      ? "bg-sidebar-accent text-sidebar-foreground font-semibold"
                      : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }`}
                >
                  <ProjectIcon name={p.icon} size="sm" className="shrink-0 text-muted-foreground" />
                  <span className="truncate">{p.name}</span>
                </Link>
              );
            })}
            {projects.length > 8 && (
              <Link
                href="/app/projects"
                className="block px-3 py-1 text-[11px] text-primary hover:underline"
              >
                + {projects.length - 8} more projects
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-sidebar-border text-[11px] text-sidebar-muted flex items-center justify-between">
        <span>© {new Date().getFullYear()} Sprintly</span>
        <Link href="/pricing" className="text-primary hover:underline">
          Upgrade
        </Link>
      </div>
    </aside>
  );
}
