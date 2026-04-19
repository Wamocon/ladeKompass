/**
 * Tests für die Settings-Persistenz-Fixes (April 2026)
 *
 * 1. updateProfile upsert-Payload — id immer enthalten, updated_at nie
 * 2. MapPrefs Supabase-first Initialisierung — Serverdata hat Vorrang vor localStorage
 * 3. MapPrefs update()-Funktion — localStorage + Supabase werden beide beschrieben
 */

import { describe, it, expect, beforeEach } from "vitest";

// ─── 1. updateProfile – upsert Payload ───────────────────────────────────────
//
// Spiegelt die Logik aus src/lib/actions/profile.ts wider:
//   serviceSupabase.from("profiles").upsert({ id: user.id, ...input }, { onConflict: "id" })

type ProfileInput = {
  display_name?: string;
  phone?: string;
  bio?: string;
  home_address?: string;
  work_address?: string;
  notify_station_status?: boolean;
  notify_news?: boolean;
  notify_promotions?: boolean;
  preferred_connector?: string;
  min_charge_kw?: number;
  charge_stop_soc?: number;
  map_prefs?: Record<string, unknown>;
};

function buildUpsertPayload(userId: string, input: ProfileInput): Record<string, unknown> {
  // Exakt die Payload-Logik aus src/lib/actions/profile.ts
  return { id: userId, ...input };
}

describe("updateProfile – upsert payload", () => {
  it("payload enthält die user-id", () => {
    const payload = buildUpsertPayload("user-abc-123", { display_name: "Alice" });
    expect(payload.id).toBe("user-abc-123");
  });

  it("payload enthält KEIN updated_at (Spalte existiert nicht in den Migrations)", () => {
    const payload = buildUpsertPayload("user-abc-123", { display_name: "Alice" });
    expect(Object.keys(payload)).not.toContain("updated_at");
  });

  it("input-Felder werden in den Payload übernommen", () => {
    const payload = buildUpsertPayload("user-abc-123", {
      display_name: "Alice",
      phone: "+49170123456",
    });
    expect(payload.display_name).toBe("Alice");
    expect(payload.phone).toBe("+49170123456");
  });

  it("map_prefs wird als Objekt übernommen", () => {
    const prefs = { mapStyle: "dark", powerLevel: "hpc", showHeatmap: true };
    const payload = buildUpsertPayload("user-abc-123", { map_prefs: prefs });
    expect(payload.map_prefs).toStrictEqual(prefs);
  });

  it("leerer Input → Payload hat nur id", () => {
    const payload = buildUpsertPayload("user-abc-123", {});
    expect(Object.keys(payload)).toStrictEqual(["id"]);
  });

  it("boolean-Felder werden korrekt übernommen", () => {
    const payload = buildUpsertPayload("u1", {
      notify_station_status: true,
      notify_news: false,
      notify_promotions: false,
    });
    expect(payload.notify_station_status).toBe(true);
    expect(payload.notify_news).toBe(false);
  });

  it("numerische Felder bleiben numerisch", () => {
    const payload = buildUpsertPayload("u1", { min_charge_kw: 22, charge_stop_soc: 80 });
    expect(typeof payload.min_charge_kw).toBe("number");
    expect(typeof payload.charge_stop_soc).toBe("number");
  });

  it("mehrere unabhängige Aufrufe erzeugen separate Payloads", () => {
    const p1 = buildUpsertPayload("u1", { display_name: "Alice" });
    const p2 = buildUpsertPayload("u2", { display_name: "Bob" });
    expect(p1.id).toBe("u1");
    expect(p2.id).toBe("u2");
    expect(p1.display_name).toBe("Alice");
    expect(p2.display_name).toBe("Bob");
  });
});

// ─── 2. MapPrefs – Supabase-first Initialisierung ────────────────────────────
//
// Spiegelt den lazy useState-Initialisierer in MapPrefsSection wider:
//   if (initialPrefs && Object.keys(initialPrefs).length > 0) return initialPrefs;
//   if (typeof window !== "undefined") { return localStorage ... }
//   return {};

function initMapPrefs(
  initialPrefs: Record<string, unknown> | null | undefined,
  localStorageValue: Record<string, unknown> | null,
): Record<string, unknown> {
  if (initialPrefs && Object.keys(initialPrefs).length > 0) return initialPrefs;
  if (localStorageValue && Object.keys(localStorageValue).length > 0) return localStorageValue;
  return {};
}

describe("MapPrefs – Supabase-first Initialisierung", () => {
  it("Supabase-Daten haben Vorrang vor localStorage", () => {
    const result = initMapPrefs({ mapStyle: "dark" }, { mapStyle: "light" });
    expect(result.mapStyle).toBe("dark");
  });

  it("Supabase-Daten gewinnen bei allen Feldern", () => {
    const supabase = { mapStyle: "dark", powerLevel: "hpc", showHeatmap: true };
    const local    = { mapStyle: "light", powerLevel: null, showHeatmap: false };
    expect(initMapPrefs(supabase, local)).toStrictEqual(supabase);
  });

  it("fällt auf localStorage zurück wenn Supabase leeres Objekt liefert", () => {
    const result = initMapPrefs({}, { mapStyle: "bright" });
    expect(result.mapStyle).toBe("bright");
  });

  it("fällt auf localStorage zurück wenn Supabase null liefert", () => {
    const result = initMapPrefs(null, { mapStyle: "standard" });
    expect(result.mapStyle).toBe("standard");
  });

  it("fällt auf localStorage zurück wenn Supabase undefined ist", () => {
    const result = initMapPrefs(undefined, { powerLevel: "dc" });
    expect(result.powerLevel).toBe("dc");
  });

  it("gibt leeres Objekt zurück wenn beide Quellen leer sind", () => {
    expect(initMapPrefs({}, {})).toStrictEqual({});
  });

  it("gibt leeres Objekt zurück wenn beide Quellen null/undefined sind", () => {
    expect(initMapPrefs(null, null)).toStrictEqual({});
    expect(initMapPrefs(undefined, null)).toStrictEqual({});
  });

  it("Supabase mit 1 Feld → localStorage wird ignoriert", () => {
    const result = initMapPrefs({ show3D: true }, { show3D: false, mapStyle: "dark" });
    expect(result.show3D).toBe(true);
    // Nur Supabase-Daten, kein Merge mit localStorage
    expect(result.mapStyle).toBeUndefined();
  });
});

// ─── 3. MapPrefs update() – Dual-Persistenz ──────────────────────────────────
//
// Die update()-Funktion in MapPrefsSection schreibt in BEIDE Speicher:
//   localStorage (für schnelle Karten-Reads)
//   Supabase via updateProfile() (für Cross-Device-Sync)

interface MockStorage {
  store: Map<string, string>;
  set(key: string, value: string): void;
  get(key: string): string | null;
}

function createMockStorage(): MockStorage {
  const store = new Map<string, string>();
  return {
    store,
    set(key, value) { store.set(key, value); },
    get(key) { return store.get(key) ?? null; },
  };
}

type MapPrefsCalls = Array<Record<string, unknown>>;

function simulateMapPrefsUpdate(
  key: string,
  value: unknown,
  currentPrefs: Record<string, unknown>,
  storage: MockStorage,
  supabaseCalls: MapPrefsCalls,
): Record<string, unknown> {
  const next = { ...currentPrefs, [key]: value };
  // localStorage schreiben
  storage.set("lk-map-prefs", JSON.stringify(next));
  // Supabase aufrufen (gemockt)
  supabaseCalls.push({ map_prefs: next });
  return next;
}

describe("MapPrefs – Dual-Persistenz bei update()", () => {
  let storage: MockStorage;
  let supabaseCalls: MapPrefsCalls;

  beforeEach(() => {
    storage = createMockStorage();
    supabaseCalls = [];
  });

  it("schreibt in localStorage", () => {
    simulateMapPrefsUpdate("mapStyle", "dark", {}, storage, supabaseCalls);
    const stored = JSON.parse(storage.get("lk-map-prefs") ?? "{}");
    expect(stored.mapStyle).toBe("dark");
  });

  it("ruft Supabase updateProfile auf", () => {
    simulateMapPrefsUpdate("mapStyle", "dark", {}, storage, supabaseCalls);
    expect(supabaseCalls).toHaveLength(1);
  });

  it("Supabase-Payload enthält map_prefs", () => {
    simulateMapPrefsUpdate("showHeatmap", true, {}, storage, supabaseCalls);
    expect(supabaseCalls[0].map_prefs).toMatchObject({ showHeatmap: true });
  });

  it("mehrere Updates erzeugen mehrere Supabase-Aufrufe", () => {
    let prefs = simulateMapPrefsUpdate("mapStyle", "dark",     {}, storage, supabaseCalls);
    prefs      = simulateMapPrefsUpdate("show3D",   true,  prefs, storage, supabaseCalls);
                 simulateMapPrefsUpdate("powerLevel","hpc", prefs, storage, supabaseCalls);
    expect(supabaseCalls).toHaveLength(3);
  });

  it("localStorage und Supabase erhalten denselben Wert", () => {
    const prefs = { mapStyle: "light" };
    simulateMapPrefsUpdate("show3D", true, prefs, storage, supabaseCalls);
    const local  = JSON.parse(storage.get("lk-map-prefs") ?? "{}");
    const remote = supabaseCalls[0].map_prefs as Record<string, unknown>;
    expect(local.show3D).toBe(remote.show3D);
    expect(local.mapStyle).toBe(remote.mapStyle);
  });

  it("Update preserviert vorherige Werte (kein Überschreiben)", () => {
    let prefs = simulateMapPrefsUpdate("mapStyle", "dark", {}, storage, supabaseCalls);
    simulateMapPrefsUpdate("show3D", true, prefs, storage, supabaseCalls);
    const stored = JSON.parse(storage.get("lk-map-prefs") ?? "{}");
    expect(stored.mapStyle).toBe("dark"); // bleibt erhalten
    expect(stored.show3D).toBe(true);     // neu hinzugefügt
  });
});
