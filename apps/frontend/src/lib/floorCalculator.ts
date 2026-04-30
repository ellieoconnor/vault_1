export interface FloorResult {
    calorieFloor: number; // = bmr
    proteinFloor: number; // = round(proteinTarget × 0.8)
    stepsFloor: number; // = round(stepsTarget × 0.5)
}

export function calculateFloors(
    bmr: number,
    proteinTarget: number,
    stepsTarget: number
): FloorResult {
    return {
        calorieFloor: bmr,
        proteinFloor: Math.round(proteinTarget * 0.8),
        stepsFloor: Math.round(stepsTarget * 0.5),
    };
}
