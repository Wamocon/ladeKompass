import { subscribeStationFavorites } from "./realtime";
import type { NewsFeedItem } from "./realtime";

export type NotificationHandler = (message: string, stationId: string) => void;

/**
 * Subscribe to push notifications for a user's favorite stations.
 * Calls `onNotify` whenever a Realtime event arrives for a watched station.
 * Returns an unsubscribe function.
 */
export function subscribeFavoriteNotifications(
  schema: string,
  stationIds: string[],
  onNotify: NotificationHandler,
): () => void {
  if (stationIds.length === 0) return () => undefined;

  return subscribeStationFavorites(schema, stationIds, (item: NewsFeedItem) => {
    const stationId = item.payload.stationId as string | undefined;
    const stationName = (item.payload.stationName as string | undefined) ?? stationId ?? "Station";
    const reportType = item.payload.reportType as string | undefined;

    let message = `${stationName}: Status-Änderung`;
    if (reportType === "available") {
      message = `${stationName} ist jetzt verfügbar ⚡`;
    } else if (reportType === "defect") {
      message = `${stationName}: Defekt gemeldet`;
    } else if (reportType === "occupied") {
      message = `${stationName}: Belegt gemeldet`;
    }

    if (stationId) {
      onNotify(message, stationId);
    }
  });
}

/**
 * Show a browser toast notification (if user granted permission).
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const result = await Notification.requestPermission();
  return result === "granted";
}

export function showBrowserNotification(title: string, body?: string): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  new Notification(title, {
    body,
    icon: "/logo.svg",
    badge: "/logo.svg",
    tag: "ladekompass-station",
  });
}
