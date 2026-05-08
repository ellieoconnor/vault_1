export type ZoneColor =
    | 'zone-amber-low'
    | 'zone-green'
    | 'zone-amber-over'
    | 'zone-orange'
    | 'zone-amber'
    | 'zone-blue';

export interface ZoneResult {
    color: ZoneColor;
    label: string;
}

// Zone identifier strings — all zone color values across the app must come from here.
// Components map these to Tailwind classes or CSS custom properties.
export const ZONE_COLORS: Record<ZoneColor, ZoneColor> = {
    'zone-amber-low': 'zone-amber-low', // calorie: below floor
    'zone-green': 'zone-green', // all metrics: floor -> target (on track)
    'zone-amber-over': 'zone-amber-over', //calorie: target -> ceiling (heads up, not failure)
    'zone-orange': 'zone-orange', //calorie: above ceiling (rad zone)
    'zone-amber': 'zone-amber', // protein/steps: below floor (neutral, not failure)
    'zone-blue': 'zone-blue', // protein/steps: above target (bonus)
};

// TODO: Weekly consistency tier labels (used by consistencyCalc.ts in story 4.1)
export const TIER_LABELS = {
    STANDING: 'Still Standing', // <60%
    SURVIVING: 'Surving the Wasteland', // 60-74%
    VETERAN: 'Wasteland Veteran', // 75-89%
    CHOSEN: 'The Chosen One', // 90%+
} as const;

// Absolute calorie minimum — used as test boundary for zone calculator.
// Below this value, the calorie zone is always zone-amber-low regardless of floor.
export const HARD_MIN_CALORIES = 1200;

// Buffer added to calorieTarget to compute calorieCeiling.
// calorieCeiling = calorieTarget + CALORIE_CEILING_BUFFER
export const CALORIE_CEILING_BUFFER = 200;
