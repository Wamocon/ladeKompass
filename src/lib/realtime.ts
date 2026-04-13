import { createBrowserClient } from "@supabase/ssr";
import type { RealtimeChannel } from "@supabase/supabase-js";

/** Create a browser Supabase client (singleton per call). */
function getClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: {
        schema:
          process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? "ladekompass-dev",
      },
    },
  );
}

export interface NewsFeedItem {
  id: string;
  created_at: string;
  type: "community_report" | "station_status_change" | "system";
  user_id?: string;
  payload: Record<string, unknown>;
}

type NewsFeedCallback = (item: NewsFeedItem) => void;

/**
 * Subscribe to the `news_feed` table via Supabase Realtime.
 * Returns an unsubscribe function.
 */
export function subscribeNewsFeed(
  schema: string,
  onInsert: NewsFeedCallback,
): () => void {
  const supabase = getClient();

  const channel: RealtimeChannel = supabase
    .channel("public:news_feed")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema,
        table: "news_feed",
      },
      (payload) => {
        onInsert(payload.new as NewsFeedItem);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to status changes for a specific station
 * (via news_feed WHERE payload->>stationId = id).
 */
export function subscribeStationFavorites(
  schema: string,
  stationIds: string[],
  onUpdate: NewsFeedCallback,
): () => void {
  const supabase = getClient();

  const channel: RealtimeChannel = supabase
    .channel("station_favorites_feed")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema,
        table: "news_feed",
        filter: `type=eq.station_status_change`,
      },
      (payload) => {
        const item = payload.new as NewsFeedItem;
        const sid = item.payload.stationId as string | undefined;
        if (sid && stationIds.includes(sid)) {
          onUpdate(item);
        }
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
