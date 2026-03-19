import { describe, it, expect } from 'vitest';
import {
  ComplianceCalculatorService,
  GHG_TARGET,
} from '../../domain/services/compliance-calculator.service';

describe('ComplianceCalculatorService', () => {
  describe('calculateGhgIntensity', () => {
    it('returns ~91.7442 for HFO', () => {
      const result = ComplianceCalculatorService.calculateGhgIntensity('HFO');
      expect(result).toBeCloseTo(91.7442, 4);
    });

    it('returns ~90.76745 for MDO', () => {
      const result = ComplianceCalculatorService.calculateGhgIntensity('MDO');
      expect(result).toBeCloseTo(90.76745, 4);
    });

    it('returns null for unknown fuel type', () => {
      expect(ComplianceCalculatorService.calculateGhgIntensity('UNKNOWN')).toBeNull();
    });
  });

  describe('calculateEnergy', () => {
    it('multiplies consumption by 41000', () => {
      expect(ComplianceCalculatorService.calculateEnergy(150)).toBe(6150000);
    });

    it('handles fractional tonnes', () => {
      expect(ComplianceCalculatorService.calculateEnergy(1)).toBe(41000);
    });
  });

  describe('calculateCB', () => {
    it('returns positive CB for compliant ship (LNG, ghg=75.5)', () => {
      const energy = ComplianceCalculatorService.calculateEnergy(100);
      const cb = ComplianceCalculatorService.calculateCB(75.5, energy);
      expect(cb).toBeGreaterThan(0);
      // (89.33680 - 75.5) * 4100000 = 567810800
      expect(cb).toBeCloseTo((GHG_TARGET - 75.5) * energy, 1);
    });

    it('returns negative CB for non-compliant ship (HFO, ghg=91.7442)', () => {
      const energy = ComplianceCalculatorService.calculateEnergy(150);
      const cb = ComplianceCalculatorService.calculateCB(91.7442, energy);
      expect(cb).toBeLessThan(0);
    });

    it('returns zero CB when ghgIntensity equals target', () => {
      const energy = ComplianceCalculatorService.calculateEnergy(100);
      const cb = ComplianceCalculatorService.calculateCB(GHG_TARGET, energy);
      expect(cb).toBeCloseTo(0, 5);
    });
  });

  describe('calculatePercentDiff', () => {
    it('returns 0 when comparison equals baseline', () => {
      expect(ComplianceCalculatorService.calculatePercentDiff(100, 100)).toBe(0);
    });

    it('returns positive value when comparison is higher', () => {
      const diff = ComplianceCalculatorService.calculatePercentDiff(110, 100);
      expect(diff).toBeCloseTo(10, 4);
    });

    it('returns negative value when comparison is lower', () => {
      const diff = ComplianceCalculatorService.calculatePercentDiff(90, 100);
      expect(diff).toBeCloseTo(-10, 4);
    });

    it('throws when baseline is zero', () => {
      expect(() => ComplianceCalculatorService.calculatePercentDiff(100, 0)).toThrow();
    });
  });

  describe('isCompliant', () => {
    it('returns true when ghgIntensity is below target', () => {
      expect(ComplianceCalculatorService.isCompliant(75)).toBe(true);
    });

    it('returns true when ghgIntensity equals target', () => {
      expect(ComplianceCalculatorService.isCompliant(GHG_TARGET)).toBe(true);
    });

    it('returns false when ghgIntensity exceeds target', () => {
      expect(ComplianceCalculatorService.isCompliant(91.74)).toBe(false);
    });
  });

  describe('allocatePool', () => {
    it('throws when total CB is negative', () => {
      expect(() =>
        ComplianceCalculatorService.allocatePool([
          { shipId: 'R001', cb: -1000 },
          { shipId: 'R003', cb: 500 },
        ]),
      ).toThrow();
    });

    it('transfers surplus from positive to deficit ships', () => {
      const results = ComplianceCalculatorService.allocatePool([
        { shipId: 'R001', cb: -500 },
        { shipId: 'R003', cb: 1000 },
      ]);

      const deficit = results.find((r) => r.shipId === 'R001')!;
      const surplus = results.find((r) => r.shipId === 'R003')!;

      expect(deficit.cbAfter).toBe(0);
      expect(surplus.cbAfter).toBe(500);
    });

    it('cbAfter is preserved for all-surplus pool', () => {
      const results = ComplianceCalculatorService.allocatePool([
        { shipId: 'R003', cb: 500 },
        { shipId: 'R004', cb: 300 },
      ]);

      expect(results.find((r) => r.shipId === 'R003')!.cbAfter).toBe(500);
      expect(results.find((r) => r.shipId === 'R004')!.cbAfter).toBe(300);
    });

    it('preserves cbBefore values', () => {
      const results = ComplianceCalculatorService.allocatePool([
        { shipId: 'R001', cb: -200 },
        { shipId: 'R003', cb: 800 },
      ]);

      const deficit = results.find((r) => r.shipId === 'R001')!;
      expect(deficit.cbBefore).toBe(-200);
    });
  });
});
