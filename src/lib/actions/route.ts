"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import {
  haversineKm,
  estimateRangeKm,
  usableEnergyKwh,
  energyForDistanceKwh,
  estimateTravelMinutes,
  validateRouteInput,
} from "@/lib/route-calc";

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

  // Validate input
  const validationResult = validateRouteInput({
    ...input,
    minArrivalSocPercent: input.minArrivalSocPercent ?? 10,
  });
  if (validationResult.errors) {
    return {
      stops: [],
      totalDistanceKm: 0,
      estimatedTimeMin: 0,
      totalEstimatedCostEur: 0,
      error: validationResult.errors.map((e) => e.message).join("; "),
    };
  }
  const validated = validationResult.data;

  const totalDistanceKm = haversineKm(
    validated.startLat,
    validated.startLng,
    validated.endLat,
    validated.endLng,
  );

  const usableKwh = usableEnergyKwh(
    validated.batteryCapacityKwh,
    validated.currentSocPercent,
    validated.minArrivalSocPercent,
  );
  const rangeKm = estimateRangeKm(usableKwh);

  const stops: RouteStop[] = [
    {
      lat: validated.startLat,
      lng: validated.startLng,
      name: validated.startName,
    },
  ];

  // If destination is within range, no charging stop needed
  if (totalDistanceKm > rangeKm) {
    // Find a midpoint charging stop
    const midLat = (validated.startLat + validated.endLat) / 2;
    const midLng = (validated.startLng + validated.endLng) / 2;

    const energyNeeded = energyForDistanceKwh(totalDistanceKm - rangeKm);

    stops.push({
      lat: midLat,
      lng: midLng,
      name: "Ladestation (automatisch)",
      energyAddedKwh: Math.min(energyNeeded * 1.1, validated.batteryCapacityKwh * 0.8),
      estimatedCostEur: energyNeeded * 1.1 * 0.35,
    });
  }

  stops.push({
    lat: validated.endLat,
    lng: validated.endLng,
    name: validated.endName,
  });

  const chargingStop = stops.find((s) => s.stationId || s.energyAddedKwh);
  const totalEstimatedCostEur = chargingStop?.estimatedCostEur ?? 0;
  const estimatedTimeMin = estimateTravelMinutes(totalDistanceKm);

  return {
    stops,
    totalDistanceKm: Math.round(totalDistanceKm),
    estimatedTimeMin,
    totalEstimatedCostEur,
  };
}
