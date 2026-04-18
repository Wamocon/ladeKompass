"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface MobileSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Height of the sheet. Default: "auto" (content-driven, max 90vh) */
  height?: "auto" | "full" | "half";
  children: React.ReactNode;
}

const HEIGHT_CLASSES: Record<NonNullable<MobileSheetProps["height"]>, string> = {
  auto: "max-h-[90vh]",
  full: "h-[90vh]",
  half: "h-[50vh]",
};

/**
 * Bottom Sheet component for mobile.
 * On desktop it renders children inline (no sheet frame).
 */
export function MobileSheet({
  open,
  onClose,
  title,
  height = "auto",
  children,
}: MobileSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on backdrop click
  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock body scroll when sheet is open on mobile
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    // Backdrop
    <div
      className="md:hidden fixed inset-0 z-50 bg-black/40 flex items-end"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
      aria-label={title}
    >
      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`w-full bg-[var(--bg-surface)] rounded-t-2xl shadow-2xl flex flex-col overflow-hidden ${HEIGHT_CLASSES[height]} animate-slide-up`}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* Handle bar + header */}
        <div className="flex flex-col items-center pt-3 pb-1 px-4 shrink-0">
          <div className="w-10 h-1 rounded-full bg-[var(--border)] mb-3" />
          {(title) && (
            <div className="flex items-center justify-between w-full mb-1">
              <span className="text-sm font-bold text-[var(--text-base)] truncate">{title}</span>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] transition-colors ml-2 shrink-0"
                aria-label="Schließen"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}
