import { HARD_MIN_CALORIES, type ZoneResult } from '@/lib/zoneConstants';

// Shape of user targets as persisted in UserConfig.
// All floor and ceiling values are pre-computed server-side:
// calorieFloor = BMR (Mifflin-St Jeor, calculated in Story 2.1)
// calorieCeiling = calorieTarget + 200
// proteinFloor = round(proteinTarget x 0.8)
// stepsFloor = round(stepsTarget x 0.5)
export interface UserTargets {
    calorieFloor: number;
    calorieTarget: number;
    calorieCeiling: number;
    proteinFloor: number;
    proteinTarget: number;
    stepsFloor: number;
    stepsTarget: number;
}

// Returns the zone color identifier and display label for a given metric value.
// All callers must use this function — no inline zone logic anywhere in the app.
export function getZoneColor(
    metric: 'calories' | 'protein' | 'steps',
    value: number,
    targets: UserTargets
): ZoneResult {
    switch (metric) {
        case 'calories':
            return getCalorieZone(value, targets);
        case 'protein':
            return getSymmetricZone(value, targets.proteinFloor, targets.proteinTarget);
        case 'steps':
            return getSymmetricZone(value, targets.stepsFloor, targets.stepsTarget);
    }
}

// Calorie zone model is asymmetric — over-target is amber-over (neutral heads-up),
// not green. Above ceiling is orange (Rad Zone). Neither is a failure state.
function getCalorieZone(value: number, targets: UserTargets): ZoneResult {
    if (value < HARD_MIN_CALORIES || value < targets.calorieFloor) {
        return { color: 'zone-amber-low', label: 'Below floor' };
    }
    if (value <= targets.calorieTarget) {
        return { color: 'zone-green', label: 'On track' };
    }
    if (value <= targets.calorieCeiling) {
        return { color: 'zone-amber-over', label: 'Heads up' };
    }
    return { color: 'zone-orange', label: 'Rad Zone' };
}

// Protein and steps use the symmetric model:
// below floor -> amber (neutral, not failure)
// floor -> target -> green (on track)
// above target -> blue (bonus)
function getSymmetricZone(value: number, floor: number, target: number): ZoneResult {
    if (value < floor) {
        return { color: 'zone-amber', label: 'Below floor' };
    }
    if (value <= target) {
        return { color: 'zone-green', label: 'On track' };
    }
    return { color: 'zone-blue', label: 'Bonus' };
}
