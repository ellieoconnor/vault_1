import { getZoneColor, type UserTargets } from '@/lib/zoneCalculator';
import type { ZoneColor } from '@/lib/zoneConstants';

interface ProgressBarProps {
    value: number | null;
    metric: 'calories' | 'protein' | 'steps';
    targets: UserTargets;
    label: string; // "Calories", "Protein", "Steps"
}

const ZONE_BG_CLASSES: Record<ZoneColor, string> = {
    'zone-amber-low': 'bg-zone-amber-low',
    'zone-green': 'bg-zone-green',
    'zone-amber-over': 'bg-zone-amber-over',
    'zone-orange': 'bg-zone-orange',
    'zone-amber': 'bg-zone-amber',
    'zone-blue': 'bg-zone-blue',
};

const ZONE_TEXT_CLASSES: Record<ZoneColor, string> = {
    'zone-amber-low': 'text-zone-amber-low',
    'zone-green': 'text-zone-green',
    'zone-amber-over': 'text-zone-amber-over',
    'zone-orange': 'text-zone-orange',
    'zone-amber': 'text-zone-amber',
    'zone-blue': 'text-zone-blue',
};

function getFillPct(
    metric: ProgressBarProps['metric'],
    value: number,
    targets: UserTargets
): number {
    if (metric === 'calories') {
        return Math.min(100, Math.round((value / targets.calorieCeiling) * 100));
    }
    if (metric === 'protein') {
        return Math.min(100, Math.round((value / targets.proteinTarget) * 100));
    }
    return Math.min(100, Math.round((value / targets.stepsTarget) * 100));
}

function getFloorPct(metric: ProgressBarProps['metric'], targets: UserTargets): number {
    if (metric === 'calories') {
        return Math.round((targets.calorieFloor / targets.calorieCeiling) * 100);
    }
    if (metric === 'protein') {
        return Math.round((targets.proteinFloor / targets.proteinTarget) * 100);
    }
    return Math.round((targets.stepsFloor / targets.stepsTarget) * 100);
}

function getAriaMax(metric: ProgressBarProps['metric'], targets: UserTargets): number {
    if (metric === 'calories') return targets.calorieCeiling;
    if (metric === 'protein') return targets.proteinTarget;
    return targets.stepsTarget;
}

export function ProgressBar({ value, metric, targets, label }: ProgressBarProps) {
    const effectiveValue = value ?? 0;
    const zoneResult = getZoneColor(metric, effectiveValue, targets);
    const fillPct = getFillPct(metric, effectiveValue, targets);
    const floorPct = getFloorPct(metric, targets);
    const ariaMax = getAriaMax(metric, targets);

    return (
        <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{label}</span>
                <span className={`text-sm font-medium ${ZONE_TEXT_CLASSES[zoneResult.color]}`}>
                    {zoneResult.label}
                </span>
            </div>
            <div
                role="progressbar"
                aria-valuenow={effectiveValue}
                aria-valuemin={0}
                aria-valuemax={ariaMax}
                aria-label={`${label}: ${zoneResult.label} — ${effectiveValue} logged`}
                className="relative h-4 w-full rounded-full bg-muted"
            >
                {/* Fill bar — wrapped in overflow-hidden to keep rounded corners on the fill */}
                <div className="absolute inset-0 overflow-hidden rounded-full">
                    <div
                        className={`absolute inset-y-0 left-0 ${ZONE_BG_CLASSES[zoneResult.color]}`}
                        style={{ width: `${fillPct}%` }}
                    />
                </div>
                {/* Floor marker — thin vertical line showing the floor boundary */}
                <div
                    className="absolute inset-y-0 w-px bg-foreground/40 z-10"
                    style={{ left: `${floorPct}%` }}
                    aria-hidden="true"
                />
            </div>
        </div>
    );
}
