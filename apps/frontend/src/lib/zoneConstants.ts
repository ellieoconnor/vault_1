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

// TODO: Weekly consistency tier labels (used by consistencyCalc.ts in story 4.1)
export const TIER_LABELS = {
    STANDING: 'Still Standing', // <60%
    SURVIVING: 'Surviving the Wasteland', // 60-74%
    VETERAN: 'Wasteland Veteran', // 75-89%
    CHOSEN: 'The Chosen One', // 90%+
} as const;

// Absolute calorie minimum — below this value the calorie zone is always
// zone-amber-low regardless of the user's configured floor.
export const HARD_MIN_CALORIES = 1200;

export const MOOD_OPTIONS = [
    { value: 'crushing-it', label: 'Crushing it', emoji: '🔥' },
    { value: 'solid', label: 'Solid', emoji: '💪' },
    { value: 'powered-up', label: 'Powered up', emoji: '⚡' },
    { value: 'okay', label: 'Okay', emoji: '👍' },
    { value: 'scattered', label: 'Scattered', emoji: '🌀' },
    { value: 'drained', label: 'Drained', emoji: '😴' },
    { value: 'rough', label: 'Rough', emoji: '😮‍💨' },
] as const;

export type MoodValue = (typeof MOOD_OPTIONS)[number]['value'];
