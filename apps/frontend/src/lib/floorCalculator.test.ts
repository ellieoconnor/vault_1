import { describe, it, expect } from 'vitest';
import { calculateFloors } from '@/lib/floorCalculator';

describe('calculateFloors', () => {
    it('calorieFloor passes BMR through unchanged', () => {
        const result = calculateFloors(1600, 150, 8000);
        expect(result.calorieFloor).toBe(1600);
    });

    it('proteinFloor = round(proteinTarget × 0.8)', () => {
        const result = calculateFloors(1600, 150, 8000);
        expect(result.proteinFloor).toBe(120); // 150 × 0.8 = 120
    });

    it('stepsFloor = round(stepsTarget × 0.5)', () => {
        const result = calculateFloors(1600, 150, 8000);
        expect(result.stepsFloor).toBe(4000); // 8000 × 0.5 = 4000
    });

    it('proteinFloor rounds correctly for non-integer result', () => {
        // 155 × 0.8 = 124.0, round → 124
        expect(calculateFloors(1500, 155, 10000).proteinFloor).toBe(124);
    });

    it('stepsFloor rounds correctly for odd steps target', () => {
        // 7001 × 0.5 = 3500.5, round → 3501
        expect(calculateFloors(1500, 150, 7001).stepsFloor).toBe(3501);
    });

    it('returns all three metrics in one call', () => {
        const result = calculateFloors(1800, 200, 10000);
        expect(result).toEqual({
            calorieFloor: 1800,
            proteinFloor: 160,
            stepsFloor: 5000,
        });
    });
});
