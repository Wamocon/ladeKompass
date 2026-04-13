import type { UserPlan } from "@/lib/legal/consent";

export interface PlanLimits {
  /** Max routes per month. null = unlimited */
  maxRoutesPerMonth: number | null;
  /** Max favorites. null = unlimited */
  maxFavorites: number | null;
  /** Whether tariff comparison is available */
  tariffComparison: boolean;
  /** Whether the dashboard is available */
  dashboard: boolean;
  /** Whether the live news feed is available */
  newsFeed: boolean;
  /** Whether advanced filters are available */
  advancedFilters: boolean;
  /** Whether map + navigation is available */
  map: boolean;
}

export const PLAN_LIMITS: Record<UserPlan, PlanLimits> = {
  free: {
    maxRoutesPerMonth: 5,
    maxFavorites: 0,
    tariffComparison: false,
    dashboard: false,
    newsFeed: false,
    advancedFilters: false,
    map: true,
  },
  lite: {
    maxRoutesPerMonth: 30,
    maxFavorites: 10,
    tariffComparison: true,
    dashboard: true,
    newsFeed: false,
    advancedFilters: false,
    map: true,
  },
  pro: {
    maxRoutesPerMonth: null,
    maxFavorites: null,
    tariffComparison: true,
    dashboard: true,
    newsFeed: true,
    advancedFilters: true,
    map: true,
  },
};

export function getPlanLimits(plan: UserPlan): PlanLimits {
  return PLAN_LIMITS[plan];
}

export function canUseFeature(
  plan: UserPlan,
  feature: keyof PlanLimits,
): boolean {
  const limits = PLAN_LIMITS[plan];
  const value = limits[feature];
  if (typeof value === "boolean") return value;
  if (value === null) return true;
  return (value as number) > 0;
}

export function hasRouteQuota(
  plan: UserPlan,
  usedThisMonth: number,
): boolean {
  const limits = PLAN_LIMITS[plan];
  if (limits.maxRoutesPerMonth === null) return true;
  return usedThisMonth < limits.maxRoutesPerMonth;
}

export function hasFavoriteQuota(
  plan: UserPlan,
  currentCount: number,
): boolean {
  const limits = PLAN_LIMITS[plan];
  if (limits.maxFavorites === null) return true;
  return currentCount < limits.maxFavorites;
}
