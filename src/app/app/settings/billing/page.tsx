"use client";

import { useWorkspace } from "@/providers/workspace-provider";
import { PLANS } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function BillingSettingsPage() {
  const { workspace } = useWorkspace();

  const currentPlanId = workspace?.plan || "free";

  const handleUpgradeIntent = (planName: string) => {
    toast.info(
      `Razorpay payment gateway integration will process the upgrade to ${planName}. Server endpoints are prepared!`
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Plan & Billing
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Upgrade your workspace for higher teammate limits, storage, and advanced reports.
        </p>
      </div>

      <div className="flex gap-2 border-b border-border pb-3">
        <Button variant="ghost" size="sm" className="text-xs" asChild>
          <Link href="/app/settings/workspace">General</Link>
        </Button>
        <Button variant="ghost" size="sm" className="text-xs" asChild>
          <Link href="/app/settings/profile">Profile</Link>
        </Button>
        <Button variant="secondary" size="sm" className="text-xs" asChild>
          <Link href="/app/settings/billing">Plan & Billing</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlanId;

          return (
            <div
              key={plan.id}
              className={`p-5 rounded-xl border flex flex-col justify-between space-y-4 bg-surface transition-all ${
                plan.highlighted
                  ? "border-primary shadow-soft ring-1 ring-primary/30"
                  : "border-border shadow-2xs"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-foreground">{plan.name}</h3>
                  {isCurrent && (
                    <Badge variant="outline" className="text-[10px] border-primary text-primary">
                      Current Plan
                    </Badge>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold text-foreground">
                    {plan.priceLabel}
                  </span>
                  <span className="text-xs text-muted-foreground">/ month</span>
                </div>
                <p className="text-xs text-muted-foreground">{plan.tagline}</p>

                <div className="pt-3 border-t border-border space-y-2">
                  {plan.features.map((feat) => (
                    <div key={feat} className="flex items-center gap-2 text-xs">
                      <Check className="size-3.5 text-primary shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                {isCurrent ? (
                  <Button variant="outline" size="sm" disabled className="w-full text-xs">
                    Current Active Plan
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => handleUpgradeIntent(plan.name)}
                  >
                    Upgrade to {plan.name}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
