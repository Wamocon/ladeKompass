"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import type { UserPlan } from "@/lib/legal/consent";
import type { PlanLimits } from "@/lib/plan-limits";

interface PlanGateProps {
  /** The feature key to check */
  feature: keyof PlanLimits;
  /** The user's current plan */
  userPlan: UserPlan;
  /** Minimum plan required for this feature */
  requiredPlan: UserPlan;
  /** Content to show when the user has access */
  children: React.ReactNode;
  /** Optional custom message override */
  message?: string;
}

const PLAN_ORDER: UserPlan[] = ["free", "lite", "pro"];

export function PlanGate({
  userPlan,
  requiredPlan,
  children,
  message,
}: Omit<PlanGateProps, "feature"> & { feature: keyof PlanLimits }) {
  const t = useTranslations();

  const userPlanIndex = PLAN_ORDER.indexOf(userPlan);
  const requiredPlanIndex = PLAN_ORDER.indexOf(requiredPlan);

  if (userPlanIndex >= requiredPlanIndex) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-[var(--primary-light)] flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[var(--primary)]"
        >
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <p className="text-sm font-medium text-[var(--text-muted)]">
        {message ?? t("errors.plan_required", { plan: requiredPlan })}
      </p>
      <Link
        href="/upgrade"
        className="rounded-full bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] transition-colors"
      >
        {t("plan.upgrade_cta", { plan: requiredPlan })}
      </Link>
    </div>
  );
}
