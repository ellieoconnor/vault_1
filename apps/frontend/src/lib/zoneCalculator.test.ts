import { describe, it, expect } from 'vitest';
import { getZoneColor, type UserTargets } from '@/lib/zoneCalculator';
import { HARD_MIN_CALORIES } from '@/lib/zoneConstants';

const targets: UserTargets = {
    calorieFloor: 1600, // represents BMR
    calorieTarget: 1900,
    calorieCeiling: 2100, // calorieTarget + 200
    proteinFloor: 120, // round(150 × 0.8)
    proteinTarget: 150,
    stepsFloor: 5000, // round(10000 × 0.5)
    stepsTarget: 10000,
};

describe('getZoneColor — calories (asymmetric zone model)', () => {
    it('3.1 value below HARD_MIN_CALORIES (800) → zone-amber-low', () => {
        const result = getZoneColor('calories', 800, targets);
        expect(result.color).toBe('zone-amber-low');
        expect(result.label).toBe('Below floor');
    });

    it('3.2 value at calorieFloor exactly (1600) → zone-green', () => {
        const result = getZoneColor('calories', 1600, targets);
        expect(result.color).toBe('zone-green');
        expect(result.label).toBe('On track');
    });

    it('3.3 value 1 below calorieFloor (1599) → zone-amber-low', () => {
        const result = getZoneColor('calories', 1599, targets);
        expect(result.color).toBe('zone-amber-low');
        expect(result.label).toBe('Below floor');
    });

    it('3.4 value between floor and target (1750) → zone-green', () => {
        const result = getZoneColor('calories', 1750, targets);
        expect(result.color).toBe('zone-green');
        expect(result.label).toBe('On track');
    });

    it('3.5 value at calorieTarget exactly (1900) → zone-green', () => {
        const result = getZoneColor('calories', 1900, targets);
        expect(result.color).toBe('zone-green');
        expect(result.label).toBe('On track');
    });

    it('3.6 value 1 above calorieTarget (1901) → zone-amber-over', () => {
        const result = getZoneColor('calories', 1901, targets);
        expect(result.color).toBe('zone-amber-over');
        expect(result.label).toBe('Heads up');
    });

    it('3.7 value between target and ceiling (2000) → zone-amber-over', () => {
        const result = getZoneColor('calories', 2000, targets);
        expect(result.color).toBe('zone-amber-over');
        expect(result.label).toBe('Heads up');
    });

    it('3.8 value at calorieCeiling exactly (2100) → zone-amber-over', () => {
        const result = getZoneColor('calories', 2100, targets);
        expect(result.color).toBe('zone-amber-over');
        expect(result.label).toBe('Heads up');
    });

    it('3.9 value 1 above calorieCeiling (2101) → zone-orange', () => {
        const result = getZoneColor('calories', 2101, targets);
        expect(result.color).toBe('zone-orange');
        expect(result.label).toBe('Rad Zone');
    });

    it('value of 0 → zone-amber-low (below floor)', () => {
        const result = getZoneColor('calories', 0, targets);
        expect(result.color).toBe('zone-amber-low');
        expect(result.label).toBe('Below floor');
    });

    it('HARD_MIN_CALORIES constant is 1200', () => {
        expect(HARD_MIN_CALORIES).toBe(1200);
    });
});

describe('getZoneColor — protein (symmetric zone model)', () => {
    it('3.10 value below proteinFloor (100) → zone-amber', () => {
        const result = getZoneColor('protein', 100, targets);
        expect(result.color).toBe('zone-amber');
        expect(result.label).toBe('Below floor');
    });

    it('3.11 value at proteinFloor exactly (120) → zone-green', () => {
        const result = getZoneColor('protein', 120, targets);
        expect(result.color).toBe('zone-green');
        expect(result.label).toBe('On track');
    });

    it('3.12 value between floor and target (135) → zone-green', () => {
        const result = getZoneColor('protein', 135, targets);
        expect(result.color).toBe('zone-green');
        expect(result.label).toBe('On track');
    });

    it('3.13 value at proteinTarget exactly (150) → zone-green', () => {
        const result = getZoneColor('protein', 150, targets);
        expect(result.color).toBe('zone-green');
        expect(result.label).toBe('On track');
    });

    it('3.14 value above proteinTarget (175) → zone-blue', () => {
        const result = getZoneColor('protein', 175, targets);
        expect(result.color).toBe('zone-blue');
        expect(result.label).toBe('Bonus');
    });

    it('value of 0 → zone-amber (below floor)', () => {
        const result = getZoneColor('protein', 0, targets);
        expect(result.color).toBe('zone-amber');
        expect(result.label).toBe('Below floor');
    });
});

describe('getZoneColor — steps (symmetric zone model, mirrors protein)', () => {
    it('3.15a value below stepsFloor (3000) → zone-amber', () => {
        const result = getZoneColor('steps', 3000, targets);
        expect(result.color).toBe('zone-amber');
        expect(result.label).toBe('Below floor');
    });

    it('3.15b value at stepsFloor exactly (5000) → zone-green', () => {
        const result = getZoneColor('steps', 5000, targets);
        expect(result.color).toBe('zone-green');
        expect(result.label).toBe('On track');
    });

    it('3.15c value between floor and target (7500) → zone-green', () => {
        const result = getZoneColor('steps', 7500, targets);
        expect(result.color).toBe('zone-green');
        expect(result.label).toBe('On track');
    });

    it('3.15d value at stepsTarget exactly (10000) → zone-green', () => {
        const result = getZoneColor('steps', 10000, targets);
        expect(result.color).toBe('zone-green');
        expect(result.label).toBe('On track');
    });

    it('3.15e value above stepsTarget (12000) → zone-blue', () => {
        const result = getZoneColor('steps', 12000, targets);
        expect(result.color).toBe('zone-blue');
        expect(result.label).toBe('Bonus');
    });

    it('value of 0 → zone-amber (below floor)', () => {
        const result = getZoneColor('steps', 0, targets);
        expect(result.color).toBe('zone-amber');
        expect(result.label).toBe('Below floor');
    });
});

describe('3.16 — all results have a non-undefined label string', () => {
    const cases: Array<['calories' | 'protein' | 'steps', number]> = [
        ['calories', 800],
        ['calories', 1600],
        ['calories', 1750],
        ['calories', 1900],
        ['calories', 2000],
        ['calories', 2101],
        ['protein', 100],
        ['protein', 120],
        ['protein', 150],
        ['protein', 175],
        ['steps', 3000],
        ['steps', 5000],
        ['steps', 10000],
        ['steps', 12000],
    ];

    cases.forEach(([metric, value]) => {
        it(`${metric} value ${value} has a defined label`, () => {
            const result = getZoneColor(metric, value, targets);
            expect(result.label).toBeDefined();
            expect(typeof result.label).toBe('string');
            expect(result.label.length).toBeGreaterThan(0);
        });
    });
});
