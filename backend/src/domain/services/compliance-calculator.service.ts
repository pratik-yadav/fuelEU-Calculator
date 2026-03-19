/**
 * ComplianceCalculatorService — pure domain service.
 *
 * All FuelEU Maritime Regulation formulas live here.
 * No framework, no Prisma, no I/O. Safe to unit-test in isolation.
 *
 * Sources:
 *   - GHG target & GWP: FuelEU Regulation 2023/1805, Annex I
 *   - LCV / emission factors: FuelEU Annex II defaults
 *   - Energy formula (simplified): backend PRD — energy = fuelConsumption × 41000
 */

export interface FuelParams {
  lcv: number;   // MJ/g
  wtt: number;   // gCO₂eq/MJ (Well-to-Tank)
  cfCO2: number; // gCO₂/gFuel
  cfCH4: number; // gCH₄/gFuel
  cfN2O: number; // gN₂O/gFuel
}

export interface PoolMemberInput {
  shipId: string;
  cb: number; // gCO₂eq — may be negative (deficit)
}

export interface PoolAllocation {
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}

// ── Constants ──────────────────────────────────────────────────────────────

export const GHG_TARGET = 89.33680; // gCO₂eq/MJ (2025–2029 reporting period)

const GWP = { CO2: 1, CH4: 25, N2O: 298 } as const;

const FUEL_PARAMS: Record<string, FuelParams> = {
  HFO: { lcv: 0.0405, wtt: 13.5, cfCO2: 3.114, cfCH4: 0.00005, cfN2O: 0.00018 },
  MDO: { lcv: 0.0427, wtt: 14.4, cfCO2: 3.206, cfCH4: 0.00005, cfN2O: 0.00018 },
};

// ── Service ────────────────────────────────────────────────────────────────

export class ComplianceCalculatorService {
  /**
   * Tank-to-Wake emission intensity for a given fuel type.
   * TtW = (CfCO2×GWP_CO2 + CfCH4×GWP_CH4 + CfN2O×GWP_N2O) / LCV
   */
  static calculateTtW(fuelType: string): number | null {
    const p = FUEL_PARAMS[fuelType];
    if (!p) return null;
    const raw =
      (p.cfCO2 * GWP.CO2 + p.cfCH4 * GWP.CH4 + p.cfN2O * GWP.N2O) / p.lcv;
    return parseFloat(raw.toFixed(5));
  }

  /**
   * Total GHG intensity (WtT + TtW) for a known fuel type.
   * Returns null for unknown fuel types (use stored ghg_intensity instead).
   */
  static calculateGhgIntensity(fuelType: string): number | null {
    const p = FUEL_PARAMS[fuelType];
    if (!p) return null;
    const ttw = ComplianceCalculatorService.calculateTtW(fuelType)!;
    return parseFloat((p.wtt + ttw).toFixed(5));
  }

  /**
   * Energy in MJ from fuel consumption in metric tonnes.
   * Simplified formula per backend PRD: energy = fuelConsumption × 41,000
   */
  static calculateEnergy(fuelConsumptionTonnes: number): number {
    return parseFloat((fuelConsumptionTonnes * 41000).toFixed(5));
  }

  /**
   * Compliance Balance in gCO₂eq.
   * CB = (GHG_TARGET − ghgIntensity) × energy
   * Positive → surplus; Negative → deficit.
   */
  static calculateCB(ghgIntensity: number, energy: number): number {
    return parseFloat(((GHG_TARGET - ghgIntensity) * energy).toFixed(5));
  }

  /**
   * Percentage difference of a route's GHG intensity vs the baseline.
   * percentDiff = ((comparison / baseline) − 1) × 100
   */
  static calculatePercentDiff(comparison: number, baseline: number): number {
    if (baseline === 0) throw new Error('Baseline GHG intensity cannot be zero.');
    return parseFloat((((comparison / baseline) - 1) * 100).toFixed(5));
  }

  /**
   * A route is compliant when its GHG intensity is at or below the target.
   */
  static isCompliant(ghgIntensity: number): boolean {
    return ghgIntensity <= GHG_TARGET;
  }

  /**
   * Pool allocation — greedy surplus-to-deficit transfer.
   *
   * Rules:
   *   1. Pool is valid only if Σ(CB) >= 0
   *   2. Surplus ships must not go below cb_after = 0
   *   3. Deficit ships can only improve (cb_after >= cb_before)
   */
  static allocatePool(members: PoolMemberInput[]): PoolAllocation[] {
    const total = members.reduce((sum, m) => sum + m.cb, 0);
    if (total < 0) {
      throw new Error(
        `Pool total CB is ${total.toFixed(2)} gCO₂eq — must be ≥ 0 for a valid pool.`,
      );
    }

    // Work with mutable copies
    const result: PoolAllocation[] = members.map((m) => ({
      shipId: m.shipId,
      cbBefore: m.cb,
      cbAfter: m.cb,
    }));

    // Sort: highest surplus first, deepest deficit last
    result.sort((a, b) => b.cbAfter - a.cbAfter);

    let lo = 0;
    let hi = result.length - 1;

    while (lo < hi) {
      const surplus = result[lo]!;
      const deficit = result[hi]!;

      if (surplus.cbAfter <= 0) { lo++; continue; }
      if (deficit.cbAfter >= 0) { hi--; continue; }

      const transferable = Math.min(surplus.cbAfter, Math.abs(deficit.cbAfter));
      surplus.cbAfter = parseFloat((surplus.cbAfter - transferable).toFixed(5));
      deficit.cbAfter = parseFloat((deficit.cbAfter + transferable).toFixed(5));

      if (surplus.cbAfter <= 0) lo++;
      if (deficit.cbAfter >= 0) hi--;
    }

    return result;
  }
}
