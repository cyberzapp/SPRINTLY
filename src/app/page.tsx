"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signInForDemo } from "@/lib/services/auth";
import { seedDemoWorkspace } from "@/lib/services/demo-seed";
import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Kanban,
  CheckCircle2,
  Users,
  BarChart3,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  Calendar,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { PLANS } from "@/lib/plans";

export default function LandingPage() {
  const router = useRouter();
  const [demoLoading, setDemoLoading] = useState(false);

  const handleLaunchDemo = async () => {
    setDemoLoading(true);
    try {
      const user = await signInForDemo();
      await seedDemoWorkspace(user.uid, "visitor@acme.studio");
      toast.success("Acme Studio demo workspace generated!");
      router.push("/app");
    } catch (err: any) {
      toast.error(err.message || "Failed to start demo");
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
      {/* Navigation Bar */}
      <header className="h-16 border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-50 px-6 flex items-center justify-between">
        <Logo href="/" size="md" />

        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#pricing" className="hover:text-foreground transition-colors">
            Pricing
          </a>
        </nav>

        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLaunchDemo}
            disabled={demoLoading}
            className="text-xs text-primary hover:bg-primary/5 hidden sm:flex items-center gap-1.5"
          >
            <Sparkles className="size-3.5" />
            <span>{demoLoading ? "Loading Demo..." : "Explore Demo"}</span>
          </Button>

          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link href="/login">Sign In</Link>
          </Button>

          <Button asChild size="sm" className="text-xs shadow-soft font-semibold">
            <Link href="/signup">Start Free</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 max-w-6xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold shadow-2xs">
          <Sparkles className="size-3.5" />
          <span>Production-grade Project Management SaaS</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-balance max-w-4xl mx-auto leading-tight">
          Your team's work,{" "}
          <span className="bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
            finally in sync.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
          Plan projects, manage tasks with interactive Kanban boards, collaborate in real time with
          teammates, and monitor team productivity — all powered by Firebase.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Button asChild size="lg" className="w-full sm:w-auto text-sm gap-2 font-semibold shadow-soft">
            <Link href="/signup">
              <span>Start for free</span>
              <ArrowRight className="size-4" />
            </Link>
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={handleLaunchDemo}
            disabled={demoLoading}
            className="w-full sm:w-auto text-sm gap-2 border-primary/30 text-primary hover:bg-primary/5"
          >
            <Sparkles className="size-4" />
            <span>{demoLoading ? "Provisioning Demo..." : "Explore Acme Studio Demo"}</span>
          </Button>
        </div>

        {/* Hero Interactive App Mockup Preview */}
        <div className="pt-10 max-w-5xl mx-auto">
          <div className="rounded-2xl border border-border bg-surface p-2 sm:p-4 shadow-card">
            <div className="rounded-xl border border-border/80 bg-background overflow-hidden text-left">
              {/* Fake Chrome window bar */}
              <div className="h-9 bg-muted/60 border-b border-border px-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-red-400" />
                  <span className="size-2.5 rounded-full bg-amber-400" />
                  <span className="size-2.5 rounded-full bg-emerald-400" />
                </div>
                <span className="text-[11px] text-muted-foreground font-mono">
                  app.sprintly.io/app/projects/cloud-platform-2
                </span>
                <span className="text-[10px] text-primary font-semibold">Live Realtime Sync</span>
              </div>

              {/* Preview UI columns */}
              <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-muted/20">
                <div className="bg-surface p-3 rounded-lg border border-border shadow-2xs space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Backlog</span>
                    <Badge variant="outline" className="text-[9px]">4</Badge>
                  </div>
                  <div className="p-2.5 rounded border border-border bg-background text-xs space-y-1">
                    <p className="font-semibold text-foreground">API Gateway load testing</p>
                    <span className="text-[10px] text-muted-foreground">High Priority</span>
                  </div>
                </div>

                <div className="bg-surface p-3 rounded-lg border border-border shadow-2xs space-y-2">
                  <div className="flex justify-between text-xs font-bold text-primary">
                    <span>In Progress</span>
                    <Badge className="text-[9px] bg-primary">3</Badge>
                  </div>
                  <div className="p-2.5 rounded border border-primary/30 bg-primary/5 text-xs space-y-1">
                    <p className="font-semibold text-foreground">OAuth 2.0 PKCE flow</p>
                    <span className="text-[10px] text-primary">Assigned to Elena R.</span>
                  </div>
                </div>

                <div className="bg-surface p-3 rounded-lg border border-border shadow-2xs space-y-2">
                  <div className="flex justify-between text-xs font-bold text-emerald-600">
                    <span>Done</span>
                    <Badge variant="outline" className="text-[9px] text-emerald-600">8</Badge>
                  </div>
                  <div className="p-2.5 rounded border border-border bg-background text-xs space-y-1">
                    <p className="font-semibold line-through text-muted-foreground">Redis Cluster Setup</p>
                    <span className="text-[10px] text-emerald-600 font-medium">Shipped</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-muted/30 border-y border-border px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Engineered for velocity and scale
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Every detail built with real Cloud Firestore persistence, granular RBAC, and snappy interactions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-border bg-surface shadow-soft space-y-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Kanban className="size-5" />
              </div>
              <h3 className="text-base font-bold">Interactive Kanban & Lists</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Smooth drag-and-drop powered by @dnd-kit. Move tasks between stages and reorder items seamlessly.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-surface shadow-soft space-y-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Users className="size-5" />
              </div>
              <h3 className="text-base font-bold">Real-time Collaboration</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Task mentions, threaded comments, multi-user invitations, and instant notification updates.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-border bg-surface shadow-soft space-y-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <BarChart3 className="size-5" />
              </div>
              <h3 className="text-base font-bold">Productivity Analytics</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Real database aggregation charts with Recharts. Export CSV reports with a single click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Transparent, predictable pricing
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Start for free and scale as your engineering or agency team expands.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`p-6 rounded-2xl border flex flex-col justify-between space-y-6 bg-surface ${
                plan.highlighted
                  ? "border-primary shadow-card ring-2 ring-primary/20"
                  : "border-border shadow-soft"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  {plan.highlighted && (
                    <Badge className="bg-primary text-primary-foreground text-[10px]">
                      Most Popular
                    </Badge>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold">{plan.priceLabel}</span>
                  <span className="text-xs text-muted-foreground">/ month</span>
                </div>
                <p className="text-xs text-muted-foreground">{plan.tagline}</p>

                <div className="pt-4 border-t border-border space-y-2.5">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button asChild size="sm" className="w-full font-semibold">
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-10 px-6 text-xs text-muted-foreground">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo href="/" />
          <p>© {new Date().getFullYear()} Sprintly Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-foreground">Login</Link>
            <Link href="/signup" className="hover:text-foreground">Register</Link>
            <a href="#features" className="hover:text-foreground">Features</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
