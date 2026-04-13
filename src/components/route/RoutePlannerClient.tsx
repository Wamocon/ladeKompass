"use client";

import dynamic from "next/dynamic";

const RoutePlanner = dynamic(
  () => import("./RoutePlanner").then((m) => m.RoutePlanner),
  {
    ssr: false,
    loading: () => (
      <div className="h-40 flex items-center justify-center text-sm text-[var(--text-muted)]">
        Lade Routenplaner…
      </div>
    ),
  },
);

export function RoutePlannerClient() {
  return <RoutePlanner />;
}
