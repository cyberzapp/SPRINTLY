export type PlanId = "free" | "pro" | "business";

export interface PlanLimits {
  members: number;
  activeProjects: number;
  storageBytes: number;
}

const GB = 1024 * 1024 * 1024;

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    members: 5,
    activeProjects: 3,
    storageBytes: 1 * GB,
  },
  pro: {
    members: 50,
    activeProjects: 10000,
    storageBytes: 100 * GB,
  },
  business: {
    members: 500,
    activeProjects: 100000,
    storageBytes: 1000 * GB,
  },
};
