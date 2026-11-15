"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { acceptInvitationCall } from "@/lib/services/workspaces";
import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { UserCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function InviteAcceptancePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const { user, loading: authLoading } = useAuth();

  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    setError(null);
    try {
      const res = await acceptInvitationCall(token);
      toast.success("Welcome! You have joined the workspace.");
      router.push("/app");
    } catch (err: any) {
      setError(err.message || "Failed to accept invitation.");
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-card text-center space-y-6">
        <Logo href="/" className="justify-center" />

        <div className="size-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
          <UserCheck className="size-6" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            You've been invited!
          </h1>
          <p className="text-xs text-muted-foreground">
            A teammate has invited you to collaborate in their Sprintly workspace.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg">
            {error}
          </div>
        )}

        {authLoading ? (
          <p className="text-xs text-muted-foreground animate-pulse">Checking credentials...</p>
        ) : user ? (
          <Button
            onClick={handleAccept}
            disabled={accepting}
            size="sm"
            className="w-full gap-2 font-semibold"
          >
            <span>{accepting ? "Joining Workspace..." : "Accept Invitation & Join"}</span>
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Sign in or create an account to accept this invitation:
            </p>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" className="flex-1 text-xs">
                <a href={`/login?redirect=/invite/${token}`}>Sign In</a>
              </Button>
              <Button asChild size="sm" className="flex-1 text-xs font-semibold">
                <a href={`/signup?redirect=/invite/${token}`}>Create Account</a>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
