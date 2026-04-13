"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Bell, Zap, AlertTriangle, Info, ChevronDown } from "lucide-react";
import { subscribeNewsFeed } from "@/lib/realtime";
import type { NewsFeedItem } from "@/lib/realtime";

const PAGE_SIZE = 10;

export function NewsFeed() {
  const t = useTranslations("news_feed");
  const [items, setItems] = useState<NewsFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const schema =
    process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? "ladekompass-dev";

  // Initial load via API
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/news-feed?page=${page}&limit=${PAGE_SIZE}`);
        if (res.ok) {
          const data = await res.json();
          setItems((prev) =>
            page === 1 ? data.items ?? [] : [...prev, ...(data.items ?? [])],
          );
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page]);

  // Realtime subscription
  useEffect(() => {
    const unsub = subscribeNewsFeed(schema, (item) => {
      setItems((prev) => [item, ...prev]);
    });
    return unsub;
  }, [schema]);

  const formatTime = useCallback((iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t("just_now", { fallback: "Gerade eben" });
    if (mins < 60) return `${mins} ${t("minutes_ago", { fallback: "Min." })}`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} ${t("hours_ago", { fallback: "Std." })}`;
    return new Date(iso).toLocaleDateString("de-DE");
  }, [t]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Bell size={16} className="text-[var(--primary)]" />
        <h2 className="text-sm font-bold text-[var(--text-base)]">
          {t("title", { fallback: "Community-Feed" })}
        </h2>
      </div>

      {loading && items.length === 0 && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] animate-pulse"
            />
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <p className="text-sm text-[var(--text-muted)] text-center py-8">
          {t("empty", { fallback: "Noch keine Meldungen. Sei der Erste!" })}
        </p>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <FeedItemCard key={item.id} item={item} formatTime={formatTime} />
        ))}
      </div>

      {!loading && items.length >= page * PAGE_SIZE && (
        <button
          onClick={() => setPage((p) => p + 1)}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] py-2 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] transition-colors"
        >
          <ChevronDown size={13} />
          {t("load_more", { fallback: "Mehr laden" })}
        </button>
      )}
    </div>
  );
}

function FeedItemCard({
  item,
  formatTime,
}: {
  item: NewsFeedItem;
  formatTime: (iso: string) => string;
}) {
  const t = useTranslations("news_feed");
  const p = item.payload;

  const reportTypeColors: Record<string, string> = {
    available: "text-green-600 dark:text-green-400",
    occupied: "text-amber-600 dark:text-amber-400",
    defect: "text-red-600 dark:text-red-400",
  };

  const iconMap = {
    community_report: <AlertTriangle size={14} />,
    station_status_change: <Zap size={14} />,
    system: <Info size={14} />,
  };

  const colorMap = {
    community_report: "text-amber-500",
    station_status_change: "text-[var(--primary)]",
    system: "text-blue-500",
  };

  return (
    <div className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-3">
      <div className={`shrink-0 mt-0.5 ${colorMap[item.type]}`}>
        {iconMap[item.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[var(--text-base)] truncate">
          {(p.stationName as string | undefined) ??
            t(`type_${item.type}`, { fallback: item.type })}
        </p>
        {item.type === "community_report" && (
          <p
            className={`text-xs mt-0.5 ${
              reportTypeColors[(p.reportType as string) ?? ""] ??
              "text-[var(--text-muted)]"
            }`}
          >
            {t(
              `report_${p.reportType as string}`,
              { fallback: (p.reportType as string) ?? "" },
            )}
            {p.description ? ` — ${p.description as string}` : ""}
          </p>
        )}
        {item.type === "station_status_change" && (
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {t("status_changed", { fallback: "Status geändert" })}
          </p>
        )}
      </div>
      <span className="text-[10px] text-[var(--text-muted)] shrink-0 mt-0.5">
        {formatTime(item.created_at)}
      </span>
    </div>
  );
}
