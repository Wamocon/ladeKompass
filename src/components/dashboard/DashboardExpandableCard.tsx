"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Navigation } from "lucide-react";

interface DashboardExpandableCardProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  desc: string;
  details?: React.ReactNode;
  navigateLabel?: string;
}

export function DashboardExpandableCard({
  href,
  icon,
  label,
  desc,
  details,
  navigateLabel = "Öffnen",
}: DashboardExpandableCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden hover:border-[var(--primary)] transition-colors">
      {/* Clickable header row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-[var(--primary-light-soft)] transition-colors"
      >
        <div className="shrink-0 w-9 h-9 rounded-xl bg-[var(--primary-light-soft)] flex items-center justify-center group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--text-base)]">{label}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{desc}</p>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="shrink-0 text-[var(--text-muted)] mt-1" />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-[var(--text-muted)] mt-1" />
        )}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-[var(--border)] px-4 py-3 space-y-3">
          {details && (
            <div className="text-sm text-[var(--text-muted)]">
              {details}
            </div>
          )}
          <Link
            href={href}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Navigation size={14} />
            {navigateLabel}
          </Link>
        </div>
      )}
    </div>
  );
}
