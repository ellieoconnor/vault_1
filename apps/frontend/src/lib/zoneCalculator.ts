import { ZONE_COLORS, type ZoneResult } from './zoneConstants';

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
    if (metric === 'calories') {
        return getCalorieZone(value, targets);
    }
    if (metric === 'protein') {
        return getSymmetricZone(value, targets.proteinFloor, targets.proteinTarget);
    }
    return getSymmetricZone(value, targets.stepsFloor, targets.stepsTarget);
}

// Calorie zone model is asymmetric — over-target is amber-over (neutral heads-up),
// not green. Above ceiling is orange (Rad Zone). Neither is a failure state.
function getCalorieZone(value: number, targets: UserTargets): ZoneResult {
    if (value < targets.calorieFloor) {
        return { color: ZONE_COLORS['zone-amber-low'], label: 'Below floor' };
    }
    if (value <= targets.calorieTarget) {
        return { color: ZONE_COLORS['zone-green'], label: 'On track' };
    }
    if (value <= targets.calorieCeiling) {
        return { color: ZONE_COLORS['zone-amber-over'], label: 'Heads up' };
    }
    return { color: ZONE_COLORS['zone-orange'], label: 'Rad Zone' };
}

// Protein and steps use the symmetric model:
// below floor -> amber (neutral, not failure)
// floor -> target -> green (on track)
// above target -> blue (bonus)
function getSymmetricZone(value: number, floor: number, target: number): ZoneResult {
    if (value < floor) {
        return { color: ZONE_COLORS['zone-amber'], label: 'Below floor' };
    }
    if (value <= target) {
        return { color: ZONE_COLORS['zone-green'], label: 'On track' };
    }
    return { color: ZONE_COLORS['zone-blue'], label: 'Bonus' };
}
