"use client";

import dynamic from "next/dynamic";

const StationMapWrapper = dynamic(
  () => import("./StationMapWrapper"),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-elevated)] min-h-[calc(100vh-56px)]">
        <div className="flex flex-col items-center gap-3 text-[var(--text-muted)]">
          <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Karte wird geladen…</span>
        </div>
      </div>
    ),
  },
);

export function MapClientLoader() {
  return <StationMapWrapper />;
}
