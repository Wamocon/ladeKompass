"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export interface RouteStop {
  lat: number;
  lng: number;
  name: string;
  stationId?: string;
  energyAddedKwh?: number;
  estimatedCostEur?: number;
}

export interface CalculateRouteInput {
  startLat: number;
  startLng: number;
  startName: string;
  endLat: number;
  endLng: number;
  endName: string;
  batteryCapacityKwh: number;
  currentSocPercent: number;
  minArrivalSocPercent?: number;
}

export interface RouteResult {
  stops: RouteStop[];
  totalDistanceKm: number;
  estimatedTimeMin: number;
  totalEstimatedCostEur: number;
  error?: string;
}

export async function calculateRoute(
  input: CalculateRouteInput,
): Promise<RouteResult> {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let userId: string | null = null;

  if (supabaseUrl && supabaseKey) {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      db: { schema: process.env.SUPABASE_DB_SCHEMA ?? "ladekompass-dev" },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;

    if (userId) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan, monthly_routes_used, monthly_routes_limit")
        .eq("user_id", userId)
        .maybeSingle();

      if (sub) {
        const plan = sub.plan ?? "free";
        const used = sub.monthly_routes_used ?? 0;
        const limit = sub.monthly_routes_limit ?? (plan === "pro" ? null : plan === "lite" ? 30 : 5);

        if (limit !== null && used >= limit) {
          return {
            stops: [],
            totalDistanceKm: 0,
            estimatedTimeMin: 0,
            totalEstimatedCostEur: 0,
            error: "QUOTA_EXCEEDED",
          };
        }

        await supabase
          .from("subscriptions")
          .update({ monthly_routes_used: used + 1 })
          .eq("user_id", userId);
      }
    }
  }

  // Estimate haversine distance between start and end
  const R = 6371;
  const dLat = ((input.endLat - input.startLat) * Math.PI) / 180;
  const dLng = ((input.endLng - input.startLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((input.startLat * Math.PI) / 180) *
      Math.cos((input.endLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const totalDistanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Simplified range estimation: 18 kWh/100km on average
  const consumptionKwhPer100km = 18;
  const usableKwh =
    ((input.currentSocPercent - (input.minArrivalSocPercent ?? 10)) / 100) *
    input.batteryCapacityKwh;
  const rangeKm = (usableKwh / consumptionKwhPer100km) * 100;

  const stops: RouteStop[] = [
    {
      lat: input.startLat,
      lng: input.startLng,
      name: input.startName,
    },
  ];

  // If destination is within range, no charging stop needed
  if (totalDistanceKm > rangeKm) {
    // Find a midpoint charging stop
    const midLat = (input.startLat + input.endLat) / 2;
    const midLng = (input.startLng + input.endLng) / 2;

    const energyNeeded =
      ((totalDistanceKm - rangeKm) / 100) * consumptionKwhPer100km;

    stops.push({
      lat: midLat,
      lng: midLng,
      name: "Ladestation (automatisch)",
      energyAddedKwh: Math.min(energyNeeded * 1.1, input.batteryCapacityKwh * 0.8),
      estimatedCostEur: energyNeeded * 1.1 * 0.35,
    });
  }

  stops.push({
    lat: input.endLat,
    lng: input.endLng,
    name: input.endName,
  });

  const chargingStop = stops.find((s) => s.stationId || s.energyAddedKwh);
  const totalEstimatedCostEur = chargingStop?.estimatedCostEur ?? 0;
  const estimatedTimeMin = Math.round((totalDistanceKm / 100) * 75);

  return {
    stops,
    totalDistanceKm: Math.round(totalDistanceKm),
    estimatedTimeMin,
    totalEstimatedCostEur,
  };
}
