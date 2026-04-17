import { describe, it, expect } from "vitest";
import {
  PLAN_LIMITS,
  getPlanLimits,
  canUseFeature,
  hasRouteQuota,
  hasFavoriteQuota,
} from "../plan-limits";

describe("PLAN_LIMITS shape", () => {
  it("defines limits for all three plans", () => {
    expect(PLAN_LIMITS).toHaveProperty("free");
    expect(PLAN_LIMITS).toHaveProperty("lite");
    expect(PLAN_LIMITS).toHaveProperty("pro");
  });

  it("free plan: map is true, tariffComparison is false, maxRoutesPerMonth is 5", () => {
    expect(PLAN_LIMITS.free.map).toBe(true);
    expect(PLAN_LIMITS.free.tariffComparison).toBe(false);
    expect(PLAN_LIMITS.free.maxRoutesPerMonth).toBe(5);
    expect(PLAN_LIMITS.free.maxFavorites).toBe(0);
    expect(PLAN_LIMITS.free.dashboard).toBe(false);
    expect(PLAN_LIMITS.free.newsFeed).toBe(false);
    expect(PLAN_LIMITS.free.advancedFilters).toBe(false);
  });

  it("lite plan: tariffComparison true, maxRoutesPerMonth 30, maxFavorites 10", () => {
    expect(PLAN_LIMITS.lite.tariffComparison).toBe(true);
    expect(PLAN_LIMITS.lite.maxRoutesPerMonth).toBe(30);
    expect(PLAN_LIMITS.lite.maxFavorites).toBe(10);
    expect(PLAN_LIMITS.lite.dashboard).toBe(true);
    expect(PLAN_LIMITS.lite.newsFeed).toBe(false);
  });

  it("pro plan: all unlimited / true", () => {
    expect(PLAN_LIMITS.pro.maxRoutesPerMonth).toBeNull();
    expect(PLAN_LIMITS.pro.maxFavorites).toBeNull();
    expect(PLAN_LIMITS.pro.tariffComparison).toBe(true);
    expect(PLAN_LIMITS.pro.dashboard).toBe(true);
    expect(PLAN_LIMITS.pro.newsFeed).toBe(true);
    expect(PLAN_LIMITS.pro.advancedFilters).toBe(true);
    expect(PLAN_LIMITS.pro.map).toBe(true);
  });
});

describe("getPlanLimits", () => {
  it("returns the correct limits object for free", () => {
    expect(getPlanLimits("free")).toStrictEqual(PLAN_LIMITS.free);
  });

  it("returns the correct limits object for lite", () => {
    expect(getPlanLimits("lite")).toStrictEqual(PLAN_LIMITS.lite);
  });

  it("returns the correct limits object for pro", () => {
    expect(getPlanLimits("pro")).toStrictEqual(PLAN_LIMITS.pro);
  });
});

describe("canUseFeature", () => {
  it("returns true for map on all plans", () => {
    expect(canUseFeature("free", "map")).toBe(true);
    expect(canUseFeature("lite", "map")).toBe(true);
    expect(canUseFeature("pro", "map")).toBe(true);
  });

  it("returns false for tariffComparison on free", () => {
    expect(canUseFeature("free", "tariffComparison")).toBe(false);
  });

  it("returns true for tariffComparison on lite and pro", () => {
    expect(canUseFeature("lite", "tariffComparison")).toBe(true);
    expect(canUseFeature("pro", "tariffComparison")).toBe(true);
  });

  it("returns false for newsFeed on free and lite", () => {
    expect(canUseFeature("free", "newsFeed")).toBe(false);
    expect(canUseFeature("lite", "newsFeed")).toBe(false);
  });

  it("returns true for newsFeed on pro", () => {
    expect(canUseFeature("pro", "newsFeed")).toBe(true);
  });

  it("returns false for maxFavorites on free (value 0)", () => {
    expect(canUseFeature("free", "maxFavorites")).toBe(false);
  });

  it("returns true for maxFavorites on lite (value > 0)", () => {
    expect(canUseFeature("lite", "maxFavorites")).toBe(true);
  });

  it("returns true for maxFavorites on pro (null = unlimited)", () => {
    expect(canUseFeature("pro", "maxFavorites")).toBe(true);
  });

  it("returns true for maxRoutesPerMonth on free (5 > 0)", () => {
    expect(canUseFeature("free", "maxRoutesPerMonth")).toBe(true);
  });

  it("returns true for maxRoutesPerMonth on pro (null)", () => {
    expect(canUseFeature("pro", "maxRoutesPerMonth")).toBe(true);
  });
});

describe("hasRouteQuota", () => {
  it("free: allows routes below limit (0 < 5)", () => {
    expect(hasRouteQuota("free", 0)).toBe(true);
  });

  it("free: allows routes at limit - 1 (4 < 5)", () => {
    expect(hasRouteQuota("free", 4)).toBe(true);
  });

  it("free: blocks routes at limit (5 >= 5)", () => {
    expect(hasRouteQuota("free", 5)).toBe(false);
  });

  it("free: blocks routes above limit", () => {
    expect(hasRouteQuota("free", 99)).toBe(false);
  });

  it("lite: allows routes below limit (29 < 30)", () => {
    expect(hasRouteQuota("lite", 29)).toBe(true);
  });

  it("lite: blocks routes at limit (30 >= 30)", () => {
    expect(hasRouteQuota("lite", 30)).toBe(false);
  });

  it("pro: always allows routes (null limit)", () => {
    expect(hasRouteQuota("pro", 0)).toBe(true);
    expect(hasRouteQuota("pro", 9999)).toBe(true);
  });
});

describe("hasFavoriteQuota", () => {
  it("free: always blocks favorites (maxFavorites = 0)", () => {
    expect(hasFavoriteQuota("free", 0)).toBe(false);
  });

  it("lite: allows when below limit (9 < 10)", () => {
    expect(hasFavoriteQuota("lite", 9)).toBe(true);
  });

  it("lite: blocks at limit (10 >= 10)", () => {
    expect(hasFavoriteQuota("lite", 10)).toBe(false);
  });

  it("lite: blocks above limit", () => {
    expect(hasFavoriteQuota("lite", 11)).toBe(false);
  });

  it("pro: always allows favorites (null limit)", () => {
    expect(hasFavoriteQuota("pro", 0)).toBe(true);
    expect(hasFavoriteQuota("pro", 9999)).toBe(true);
  });
});
