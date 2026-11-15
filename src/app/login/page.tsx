"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmail, signInWithGoogle, signInForDemo } from "@/lib/services/auth";
import { seedDemoWorkspace } from "@/lib/services/demo-seed";
import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
      toast.success("Welcome back to Sprintly!");
      router.push("/app");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast.success("Signed in with Google!");
      router.push("/app");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDemoMode = async () => {
    setDemoLoading(true);
    try {
      const user = await signInForDemo();
      await seedDemoWorkspace(user.uid, user.email || "demo@acme.studio");
      toast.success("Acme Studio demo workspace generated!");
      router.push("/app");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <Logo href="/" size="lg" className="justify-center" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Sign in to your account
          </h1>
          <p className="text-xs text-muted-foreground">
            Welcome back! Choose your preferred way to continue.
          </p>
        </div>

        {/* Demo Mode Button */}
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl space-y-2 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" />
            <span>Instant Demo Showcase</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Explore with preloaded team members, real Kanban boards, and charts with zero setup.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDemoMode}
            disabled={demoLoading}
            className="w-full border-primary/30 text-primary hover:bg-primary/10 text-xs font-semibold"
          >
            {demoLoading ? "Launching Demo Sandbox..." : "Explore Acme Studio Demo →"}
          </Button>
        </div>

        <div className="relative flex items-center justify-center text-xs">
          <span className="w-full border-t border-border" />
          <span className="px-2 bg-background text-muted-foreground uppercase text-[10px]">
            Or with email
          </span>
          <span className="w-full border-t border-border" />
        </div>

        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-xs h-9"
              required
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="pass" className="text-xs">
                Password
              </Label>
              <Link href="/forgot-password" className="text-[11px] text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              id="pass"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-xs h-9"
              required
            />
          </div>

          <Button type="submit" size="sm" className="w-full font-semibold" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGoogleSignIn}
          className="w-full text-xs"
        >
          Continue with Google
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/signup" className="text-primary font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
