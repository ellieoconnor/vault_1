import { describe, it, expect } from 'vitest';
import { calculateBMR, calculateTDEE, type ActivityLevel } from '@/lib/bmrCalculator';

// Reference values computed from Mifflin-St Jeor:
// Male:   BMR = (10 × w) + (6.25 × h) - (5 × age) + 5
// Female: BMR = (10 × w) + (6.25 × h) - (5 × age) - 161

describe('calculateBMR — male formula', () => {
    it('calculates male BMR correctly (70 kg, 175 cm, 30 years)', () => {
        // (10×70) + (6.25×175) - (5×30) + 5 = 700 + 1093.75 - 150 + 5 = 1648.75 → 1649
        expect(calculateBMR(70, 175, 30, 'male')).toBe(1649);
    });

    it('calculates male BMR at minimum reasonable age (13 years)', () => {
        // (10×50) + (6.25×160) - (5×13) + 5 = 500 + 1000 - 65 + 5 = 1440
        expect(calculateBMR(50, 160, 13, 'male')).toBe(1440);
    });
});

describe('calculateBMR — female formula', () => {
    it('calculates female BMR correctly (60 kg, 165 cm, 25 years)', () => {
        // (10×60) + (6.25×165) - (5×25) - 161 = 600 + 1031.25 - 125 - 161 = 1345.25 → 1345
        expect(calculateBMR(60, 165, 25, 'female')).toBe(1345);
    });

    it('female BMR is always lower than male for identical inputs', () => {
        const male = calculateBMR(70, 170, 35, 'male');
        const female = calculateBMR(70, 170, 35, 'female');
        expect(female).toBeLessThan(male);
        // Difference should be exactly 166 before rounding
        expect(male - female).toBeCloseTo(166, 0);
    });
});

describe('calculateTDEE', () => {
    const bmr = 1600;

    it('sedentary: BMR × 1.2', () => {
        expect(calculateTDEE(bmr, 'sedentary')).toBe(Math.round(1600 * 1.2));
    });

    it('lightly_active: BMR × 1.375', () => {
        expect(calculateTDEE(bmr, 'lightly_active')).toBe(Math.round(1600 * 1.375));
    });

    it('moderately_active: BMR × 1.55', () => {
        expect(calculateTDEE(bmr, 'moderately_active')).toBe(Math.round(1600 * 1.55));
    });

    it('very_active: BMR × 1.725', () => {
        expect(calculateTDEE(bmr, 'very_active')).toBe(Math.round(1600 * 1.725));
    });

    it('extra_active: BMR × 1.9', () => {
        expect(calculateTDEE(bmr, 'extra_active')).toBe(Math.round(1600 * 1.9));
    });

    it('all activity levels produce values in ascending order', () => {
        const levels: ActivityLevel[] = [
            'sedentary',
            'lightly_active',
            'moderately_active',
            'very_active',
            'extra_active',
        ];
        const tdees = levels.map((l) => calculateTDEE(bmr, l));
        for (let i = 1; i < tdees.length; i++) {
            expect(tdees[i]).toBeGreaterThan(tdees[i - 1]);
        }
    });
});
