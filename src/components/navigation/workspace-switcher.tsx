"use client";

import { useWorkspace } from "@/providers/workspace-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Plus, Sparkles, Building2 } from "lucide-react";
import Link from "next/link";

export function WorkspaceSwitcher() {
  const { workspace, memberships, switchWorkspace } = useWorkspace();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between h-11 px-2.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground border border-sidebar-border bg-sidebar-accent/50"
        >
          <div className="flex items-center gap-2.5 overflow-hidden text-left">
            <div className="size-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
              {workspace?.name ? workspace.name[0].toUpperCase() : "W"}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs font-semibold truncate leading-tight">
                {workspace?.name || "Select Workspace"}
              </span>
              <span className="text-[10px] text-sidebar-muted truncate capitalize">
                {workspace?.plan || "free"} plan {workspace?.isDemo && "• Demo"}
              </span>
            </div>
          </div>
          <ChevronsUpDown className="size-4 shrink-0 text-sidebar-muted" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Workspaces
        </DropdownMenuLabel>
        {memberships.map((m) => {
          const isSelected = m.workspaceId === workspace?.id;
          return (
            <DropdownMenuItem
              key={m.id}
              onClick={() => switchWorkspace(m.workspaceId)}
              className="flex items-center justify-between cursor-pointer py-2"
            >
              <div className="flex items-center gap-2 truncate">
                <Building2 className="size-4 text-muted-foreground shrink-0" />
                <span className={`truncate text-sm ${isSelected ? "font-semibold text-primary" : ""}`}>
                  {m.workspaceName || "Workspace"}
                </span>
              </div>
              {isSelected && <Check className="size-4 text-primary shrink-0" />}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/onboarding" className="flex items-center gap-2 cursor-pointer text-xs">
            <Plus className="size-4" />
            <span>Create Workspace</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
