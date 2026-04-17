/**
 * Tariff cost estimator for EV charging sessions.
 * All prices in EUR; energy in kWh; time in minutes.
 */

export interface TariffInput {
  /** Price per kWh (€/kWh), optional if flat-rate */
  pricePerKwh?: number;
  /** Price per minute of charging (€/min), optional */
  pricePerMinute?: number;
  /** One-time session start fee (€) */
  baseFee?: number;
  /** Blocking/parking fee per minute after charging ends (€/min) */
  blockingFee?: number;
}

export interface ChargeSessionInput {
  /** Vehicle battery capacity in kWh */
  batteryCapacityKwh: number;
  /** Current State of Charge (0-100) */
  currentSocPercent: number;
  /** Target State of Charge (0-100) */
  targetSocPercent: number;
  /** How many minutes charging is expected to take */
  estimatedMinutes?: number;
  /** How many minutes vehicle stays after charging is complete */
  blockingMinutes?: number;
}

export interface CostEstimate {
  energyNeededKwh: number;
  energyCost: number;
  timeCost: number;
  baseFee: number;
  blockingCost: number;
  totalCost: number;
}

/**
 * Calculate the estimated cost for a charging session.
 */
export function estimateChargingCost(
  tariff: TariffInput,
  session: ChargeSessionInput,
): CostEstimate {
  const socDelta = Math.max(0, session.targetSocPercent - session.currentSocPercent);
  const energyNeededKwh = (socDelta / 100) * session.batteryCapacityKwh;

  const energyCost =
    tariff.pricePerKwh != null ? energyNeededKwh * tariff.pricePerKwh : 0;

  const timeCost =
    tariff.pricePerMinute != null && session.estimatedMinutes != null
      ? session.estimatedMinutes * tariff.pricePerMinute
      : 0;

  const base = tariff.baseFee ?? 0;

  const blockingCost =
    tariff.blockingFee != null && session.blockingMinutes != null
      ? session.blockingMinutes * tariff.blockingFee
      : 0;

  const totalCost = base + energyCost + timeCost + blockingCost;

  return {
    energyNeededKwh,
    energyCost,
    timeCost,
    baseFee: base,
    blockingCost,
    totalCost,
  };
}

/**
 * Format a cost estimate as a human-readable string (EUR).
 */
export function formatCost(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)} €`;
}
