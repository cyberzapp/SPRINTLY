"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useWorkspace } from "@/providers/workspace-provider";
import { Sidebar } from "@/components/navigation/sidebar";
import { TopNav } from "@/components/navigation/top-nav";
import { CreateTaskModal } from "@/components/tasks/create-task-modal";
import { CreateProjectModal } from "@/components/projects/create-project-modal";
import { GlobalSearchModal } from "@/components/navigation/global-search-modal";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Sparkles, Building2 } from "lucide-react";
import Link from "next/link";
import { seedDemoWorkspace } from "@/lib/services/demo-seed";
import { toast } from "sonner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, profile, loading: authLoading, configured } = useAuth();
  const { workspace, memberships, loading: wsLoading } = useWorkspace();

  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [seedingDemo, setSeedingDemo] = useState(false);

  // Authentication check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const handleSeedDemo = async () => {
    if (!user) return;
    setSeedingDemo(true);
    try {
      const wsId = await seedDemoWorkspace(user.uid, user.email || "demo@example.com");
      toast.success("Demo workspace generated!");
      window.location.reload();
    } catch (err) {
      toast.error("Failed to seed demo workspace.");
      console.error(err);
    } finally {
      setSeedingDemo(false);
    }
  };

  if (authLoading || (user && wsLoading && memberships.length === 0)) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold animate-pulse text-lg">
            S
          </div>
          <p className="text-xs text-muted-foreground animate-pulse">Loading Sprintly workspace...</p>
        </div>
      </div>
    );
  }

  // If authenticated user has 0 workspaces, prompt to create or load demo
  if (user && !wsLoading && memberships.length === 0) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-6 shadow-card text-center space-y-6">
          <div className="size-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <Building2 className="size-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold tracking-tight">No Workspace Found</h2>
            <p className="text-xs text-muted-foreground">
              To start collaborating, create your first workspace or launch the interactive Acme Studio demo.
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            <Button asChild className="w-full">
              <Link href="/onboarding">Create Workspace</Link>
            </Button>
            <Button
              variant="outline"
              onClick={handleSeedDemo}
              disabled={seedingDemo}
              className="w-full gap-2 border-primary/20 text-primary hover:bg-primary/5"
            >
              <Sparkles className="size-4" />
              <span>{seedingDemo ? "Generating Demo Data..." : "Explore Acme Studio Demo"}</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <Sidebar
        onOpenCreateProject={() => setCreateProjectOpen(true)}
        className="hidden md:flex"
      />

      {/* Mobile Drawer */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-sidebar border-sidebar-border">
          <Sidebar
            onOpenCreateProject={() => {
              setMobileSidebarOpen(false);
              setCreateProjectOpen(true);
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav
          onOpenSearch={() => setSearchOpen(true)}
          onOpenCreateTask={() => setCreateTaskOpen(true)}
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6 scrollbar-thin">
          {children}
        </main>
      </div>

      {/* Modals */}
      <CreateTaskModal
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
      />
      <CreateProjectModal
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
      />
      <GlobalSearchModal
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />
    </div>
  );
}
