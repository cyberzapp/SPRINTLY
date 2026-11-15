"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { createWorkspaceCall } from "@/lib/services/workspaces";
import { createProject } from "@/lib/services/projects";
import { TEAM_TYPES } from "@/lib/constants";
import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, ArrowRight, Building2, FolderPlus, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [teamType, setTeamType] = useState<string>("software");
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDesc, setWorkspaceDesc] = useState("");
  const [projectName, setProjectName] = useState("");
  const [createdWsId, setCreatedWsId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const handleNextStep = async () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (!workspaceName.trim()) {
        toast.error("Workspace name is required.");
        return;
      }
      setSubmitting(true);
      try {
        const wsId = await createWorkspaceCall({
          name: workspaceName.trim(),
          description: workspaceDesc.trim(),
          teamType,
        });
        setCreatedWsId(wsId);
        setStep(3);
      } catch (err: any) {
        toast.error(err.message || "Failed to create workspace.");
      } finally {
        setSubmitting(false);
      }
    } else if (step === 3) {
      if (!user || !createdWsId) return;

      if (projectName.trim()) {
        try {
          await createProject(user.uid, {
            workspaceId: createdWsId,
            name: projectName.trim(),
            ownerId: user.uid,
          });
        } catch (err) {
          console.warn("First project creation notice:", err);
        }
      }

      toast.success("All set! Welcome to your new workspace.");
      router.push("/app");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-card space-y-6">
        <div className="flex items-center justify-between">
          <Logo href="/" />
          <span className="text-xs text-muted-foreground font-semibold">
            Step {step} of 3
          </span>
        </div>

        {/* Step 1: Team Archetype */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold tracking-tight">What describes your team?</h2>
              <p className="text-xs text-muted-foreground">
                We'll tailor your workspace layout to match how your team works.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {TEAM_TYPES.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setTeamType(t.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    teamType === t.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <p className="text-xs font-bold text-foreground">{t.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{t.description}</p>
                </button>
              ))}
            </div>

            <Button onClick={handleNextStep} size="sm" className="w-full gap-1.5 font-semibold">
              <span>Continue</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        )}

        {/* Step 2: Workspace Details */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold tracking-tight">Create your workspace</h2>
              <p className="text-xs text-muted-foreground">
                This is the shared environment where your teammates and projects live.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="wName" className="text-xs">
                  Workspace Name
                </Label>
                <Input
                  id="wName"
                  placeholder="e.g. Acme Studio or Hyperion Labs"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="text-xs"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="wDesc" className="text-xs">
                  Short Description (Optional)
                </Label>
                <Textarea
                  id="wDesc"
                  placeholder="e.g. Next-gen software architecture and engineering team"
                  value={workspaceDesc}
                  onChange={(e) => setWorkspaceDesc(e.target.value)}
                  rows={2}
                  className="text-xs resize-none"
                />
              </div>
            </div>

            <Button
              onClick={handleNextStep}
              size="sm"
              className="w-full gap-1.5 font-semibold"
              disabled={submitting}
            >
              <span>{submitting ? "Provisioning..." : "Create Workspace"}</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        )}

        {/* Step 3: First Project Setup */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold tracking-tight">Create your first project</h2>
              <p className="text-xs text-muted-foreground">
                Kick off your work with a starter project or jump straight into the dashboard.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pName" className="text-xs">
                Project Name
              </Label>
              <Input
                id="pName"
                placeholder="e.g. Sprint 1 or Core Engine Redesign"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="text-xs"
                autoFocus
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/app")}
                className="flex-1 text-xs"
              >
                Skip for now
              </Button>
              <Button
                onClick={handleNextStep}
                size="sm"
                className="flex-1 font-semibold text-xs"
              >
                Launch Workspace
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
