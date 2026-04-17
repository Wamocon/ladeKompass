import { describe, it, expect } from "vitest";
import {
  estimateChargingCost,
  formatCost,
  type TariffInput,
  type ChargeSessionInput,
} from "../tariff-calculator";

describe("estimateChargingCost", () => {
  const base: ChargeSessionInput = {
    batteryCapacityKwh: 60,
    currentSocPercent: 20,
    targetSocPercent: 80,
  };

  it("calculates energy needed from SoC delta", () => {
    const result = estimateChargingCost({}, base);
    // 80 - 20 = 60 % of 60 kWh = 36 kWh
    expect(result.energyNeededKwh).toBeCloseTo(36, 5);
  });

  it("calculates energy cost when pricePerKwh is set", () => {
    const result = estimateChargingCost({ pricePerKwh: 0.45 }, base);
    expect(result.energyCost).toBeCloseTo(36 * 0.45, 5);
  });

  it("returns zero energy cost when pricePerKwh is not set", () => {
    const result = estimateChargingCost({}, base);
    expect(result.energyCost).toBe(0);
  });

  it("calculates time cost when pricePerMinute and estimatedMinutes are set", () => {
    const tariff: TariffInput = { pricePerMinute: 0.05 };
    const session: ChargeSessionInput = { ...base, estimatedMinutes: 30 };
    const result = estimateChargingCost(tariff, session);
    expect(result.timeCost).toBeCloseTo(0.05 * 30, 5);
  });

  it("returns zero time cost when estimatedMinutes is not set", () => {
    const result = estimateChargingCost({ pricePerMinute: 0.05 }, base);
    expect(result.timeCost).toBe(0);
  });

  it("returns zero time cost when pricePerMinute is not set", () => {
    const result = estimateChargingCost({}, { ...base, estimatedMinutes: 30 });
    expect(result.timeCost).toBe(0);
  });

  it("adds base fee to total", () => {
    const result = estimateChargingCost({ baseFee: 1.5 }, base);
    expect(result.baseFee).toBe(1.5);
    expect(result.totalCost).toBeCloseTo(1.5, 5);
  });

  it("returns zero base fee when not set", () => {
    const result = estimateChargingCost({}, base);
    expect(result.baseFee).toBe(0);
  });

  it("calculates blocking cost when blockingFee and blockingMinutes are set", () => {
    const tariff: TariffInput = { blockingFee: 0.1 };
    const session: ChargeSessionInput = { ...base, blockingMinutes: 10 };
    const result = estimateChargingCost(tariff, session);
    expect(result.blockingCost).toBeCloseTo(0.1 * 10, 5);
  });

  it("returns zero blocking cost when blockingMinutes is not set", () => {
    const result = estimateChargingCost({ blockingFee: 0.1 }, base);
    expect(result.blockingCost).toBe(0);
  });

  it("returns zero blocking cost when blockingFee is not set", () => {
    const result = estimateChargingCost({}, { ...base, blockingMinutes: 10 });
    expect(result.blockingCost).toBe(0);
  });

  it("calculates total cost as sum of all components", () => {
    const tariff: TariffInput = {
      pricePerKwh: 0.40,
      pricePerMinute: 0.02,
      baseFee: 1.0,
      blockingFee: 0.05,
    };
    const session: ChargeSessionInput = {
      batteryCapacityKwh: 100,
      currentSocPercent: 10,
      targetSocPercent: 90,
      estimatedMinutes: 60,
      blockingMinutes: 15,
    };
    const result = estimateChargingCost(tariff, session);
    // energy = 80 kWh, energyCost = 80 * 0.40 = 32
    // timeCost = 60 * 0.02 = 1.2
    // baseFee = 1.0
    // blockingCost = 15 * 0.05 = 0.75
    expect(result.energyNeededKwh).toBeCloseTo(80, 5);
    expect(result.energyCost).toBeCloseTo(32, 5);
    expect(result.timeCost).toBeCloseTo(1.2, 5);
    expect(result.baseFee).toBe(1.0);
    expect(result.blockingCost).toBeCloseTo(0.75, 5);
    expect(result.totalCost).toBeCloseTo(34.95, 5);
  });

  it("clamps energy to zero when targetSoc <= currentSoc", () => {
    const result = estimateChargingCost(
      { pricePerKwh: 0.5 },
      { batteryCapacityKwh: 60, currentSocPercent: 80, targetSocPercent: 20 },
    );
    expect(result.energyNeededKwh).toBe(0);
    expect(result.energyCost).toBe(0);
  });

  it("handles targetSoc == currentSoc (fully charged at target)", () => {
    const result = estimateChargingCost(
      { pricePerKwh: 0.5 },
      { batteryCapacityKwh: 60, currentSocPercent: 100, targetSocPercent: 100 },
    );
    expect(result.energyNeededKwh).toBe(0);
    expect(result.totalCost).toBe(0);
  });

  it("handles empty tariff object gracefully", () => {
    const result = estimateChargingCost({}, base);
    expect(result.totalCost).toBe(0);
    expect(result.energyNeededKwh).toBeGreaterThan(0);
  });
});

describe("formatCost", () => {
  it("formats value with 2 decimal places and EUR sign", () => {
    expect(formatCost(3.5)).toBe("3.50 €");
  });

  it("respects custom decimal places", () => {
    expect(formatCost(3.14159, 3)).toBe("3.142 €");
  });

  it("formats zero correctly", () => {
    expect(formatCost(0)).toBe("0.00 €");
  });

  it("formats large numbers", () => {
    expect(formatCost(1234.5)).toBe("1234.50 €");
  });

  it("formats 0 decimals", () => {
    expect(formatCost(7.9, 0)).toBe("8 €");
  });
});
