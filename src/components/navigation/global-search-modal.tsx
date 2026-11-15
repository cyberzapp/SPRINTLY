"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/providers/workspace-provider";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { FolderKanban, CheckSquare, User } from "lucide-react";
import { ProjectIcon } from "@/components/common/project-icon";

interface GlobalSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTask?: (taskId: string) => void;
}

export function GlobalSearchModal({
  open,
  onOpenChange,
  onSelectTask,
}: GlobalSearchModalProps) {
  const router = useRouter();
  const { projects, tasks, members } = useWorkspace();

  // Handle cmd+K keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type to search tasks, projects, or team..." />
      <CommandList>
        <CommandEmpty>No matching results found.</CommandEmpty>

        {/* Projects */}
        <CommandGroup heading="Projects">
          {projects.map((p) => (
            <CommandItem
              key={p.id}
              onSelect={() => {
                router.push(`/app/projects/${p.id}`);
                onOpenChange(false);
              }}
              className="flex items-center gap-2 cursor-pointer text-xs"
            >
              <ProjectIcon name={p.icon} size="sm" className="shrink-0 text-muted-foreground" />
              <span className="font-semibold">{p.name}</span>
              <span className="text-[10px] text-muted-foreground uppercase">{p.key}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Tasks */}
        <CommandGroup heading="Tasks">
          {tasks.slice(0, 15).map((t) => (
            <CommandItem
              key={t.id}
              onSelect={() => {
                if (onSelectTask) {
                  onSelectTask(t.id);
                } else {
                  router.push(`/app/projects/${t.projectId}?task=${t.id}`);
                }
                onOpenChange(false);
              }}
              className="flex items-center gap-2 cursor-pointer text-xs"
            >
              <CheckSquare className="size-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{t.title}</span>
              <span className="text-[10px] text-muted-foreground ml-auto capitalize">
                {t.status.replace("_", " ")}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Team Members */}
        <CommandGroup heading="Team Members">
          {members.map((m) => (
            <CommandItem
              key={m.userId}
              onSelect={() => {
                router.push(`/app/team`);
                onOpenChange(false);
              }}
              className="flex items-center gap-2 cursor-pointer text-xs"
            >
              <User className="size-3.5 text-muted-foreground shrink-0" />
              <span>{m.displayName}</span>
              <span className="text-[10px] text-muted-foreground">{m.email}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
