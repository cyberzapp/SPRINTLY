import type { PlanId } from "@/types";

/**
 * Plan definitions. Entitlements are enforced server-side (Cloud Functions and
 * Firestore Security Rules read `workspaces/{id}.plan`, which clients can never
 * write). Keep in sync with `functions/src/lib/plans.ts` and `firestore.rules`.
 */
export interface PlanDefinition {
  id: PlanId;
  name: string;
  priceMonthlyInr: number | null;
  priceLabel: string;
  tagline: string;
  limits: {
    members: number;
    activeProjects: number;
    storageBytes: number;
  };
  features: string[];
  highlighted?: boolean;
}

const GB = 1024 * 1024 * 1024;

export const PLANS: PlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    priceMonthlyInr: 0,
    priceLabel: "₹0",
    tagline: "For individuals and small teams getting started.",
    limits: { members: 5, activeProjects: 3, storageBytes: 1 * GB },
    features: [
      "One workspace",
      "Up to 5 members",
      "Up to 3 active projects",
      "Kanban, list & calendar views",
      "Comments, mentions & activity",
      "1 GB file storage",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthlyInr: 499,
    priceLabel: "₹499",
    tagline: "For growing teams that ship every week.",
    limits: { members: 50, activeProjects: 10_000, storageBytes: 100 * GB },
    features: [
      "Everything in Free",
      "Up to 50 members",
      "Unlimited active projects",
      "Advanced reports & CSV exports",
      "Timeline & dependencies",
      "100 GB file storage",
    ],
    highlighted: true,
  },
  {
    id: "business",
    name: "Business",
    priceMonthlyInr: 999,
    priceLabel: "₹999",
    tagline: "For organizations that need control and scale.",
    limits: { members: 500, activeProjects: 100_000, storageBytes: 1000 * GB },
    features: [
      "Everything in Pro",
      "Up to 500 members",
      "Advanced team controls",
      "Extended reporting",
      "1 TB file storage",
      "Priority support",
    ],
  },
];

export const PLAN_MAP = Object.fromEntries(PLANS.map((p) => [p.id, p])) as Record<PlanId, PlanDefinition>;

export function getPlan(id: PlanId | undefined | null): PlanDefinition {
  return PLAN_MAP[id ?? "free"] ?? PLAN_MAP.free;
}
