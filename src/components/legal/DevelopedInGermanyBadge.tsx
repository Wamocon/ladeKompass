"use client";

import React from "react";
import { usePathname } from "next/navigation";

export function DevelopedInGermanyBadge() {
  const pathname = usePathname();
  if (pathname?.startsWith("/api")) return null;

  return (
    <div className="flex flex-col items-center gap-3 py-6 opacity-30 dark:opacity-55 hover:opacity-90 transition-opacity duration-300">
      <svg
        width="42"
        height="42"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="100"
          cy="100"
          r="96"
          stroke="currentColor"
          strokeWidth="4"
          className="text-[var(--border)] opacity-20"
        />
        <circle
          cx="100"
          cy="100"
          r="86"
          stroke="currentColor"
          strokeWidth="2"
          className="text-[var(--border)] opacity-10"
        />
        <polygon
          points="100,28 106,46 124,46 110,56 115,74 100,64 85,74 90,56 76,46 94,46"
          fill="currentColor"
          className="text-[var(--text-base)]"
        />
        <path
          id="lkSealTop"
          d="M 30,100 A 70,70 0 0,1 170,100"
          fill="none"
        />
        <text
          fontFamily="Inter, sans-serif"
          fontSize="16"
          fontWeight="800"
          letterSpacing="3"
          fill="currentColor"
          className="text-[var(--text-base)]"
        >
          <textPath href="#lkSealTop" startOffset="50%" textAnchor="middle">
            DEVELOPED IN
          </textPath>
        </text>
        <path
          id="lkSealBot"
          d="M 28,108 A 72,72 0 0,0 172,108"
          fill="none"
        />
        <text
          fontFamily="Inter, sans-serif"
          fontSize="16"
          fontWeight="800"
          letterSpacing="3"
          fill="currentColor"
          className="text-[var(--text-base)]"
        >
          <textPath href="#lkSealBot" startOffset="50%" textAnchor="middle">
            GERMANY
          </textPath>
        </text>
      </svg>
      <span className="text-[9px] uppercase tracking-[0.3em] font-black text-[var(--text-muted)]">
        WAMOCON GmbH · Eschborn
      </span>
    </div>
  );
}
