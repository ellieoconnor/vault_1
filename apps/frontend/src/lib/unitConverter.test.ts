import { describe, it, expect } from 'vitest';
import { lbsToKg, ftInToCm } from '@/lib/unitConverter';

describe('lbsToKg', () => {
    it('converts 150 lbs to approximately 68.04 kg', () => {
        expect(lbsToKg(150)).toBeCloseTo(68.04, 1);
    });

    it('converts 0 lbs to 0 kg', () => {
        expect(lbsToKg(0)).toBe(0);
    });

    it('round-trip: converting 70 kg to lbs and back stays within 0.01 kg', () => {
        const lbs = 70 / 0.453592;
        expect(lbsToKg(lbs)).toBeCloseTo(70, 2);
    });
});

describe('ftInToCm', () => {
    it('converts 5ft 10in to approximately 177.8 cm', () => {
        expect(ftInToCm(5, 10)).toBeCloseTo(177.8, 1);
    });

    it('converts 6ft 0in to 182.88 cm', () => {
        expect(ftInToCm(6, 0)).toBeCloseTo(182.88, 1);
    });

    it('converts 0ft 0in to 0 cm', () => {
        expect(ftInToCm(0, 0)).toBe(0);
    });

    it('only feet with 0 inches: 5ft = 152.4 cm', () => {
        expect(ftInToCm(5, 0)).toBeCloseTo(152.4, 1);
    });

    it('only inches with 0 feet: 11in ≈ 27.94 cm', () => {
        expect(ftInToCm(0, 11)).toBeCloseTo(27.94, 1);
    });
});
