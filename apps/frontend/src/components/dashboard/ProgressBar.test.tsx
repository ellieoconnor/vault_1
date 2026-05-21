import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from './ProgressBar';
import type { UserTargets } from '@/lib/zoneCalculator';

const targets: UserTargets = {
    calorieFloor: 1600,
    calorieTarget: 1900,
    calorieCeiling: 2100,
    proteinFloor: 120,
    proteinTarget: 150,
    stepsFloor: 5000,
    stepsTarget: 10000,
};

describe('ProgressBar', () => {
    it('renders without crashing', () => {
        render(<ProgressBar value={0} metric="calories" targets={targets} label="Calories" />);
        expect(screen.getByRole('progressbar')).toBeDefined();
    });

    it('value=0 → aria-valuenow=0 and shows "Below floor" zone label', () => {
        render(<ProgressBar value={0} metric="calories" targets={targets} label="Calories" />);
        const bar = screen.getByRole('progressbar');
        expect(bar.getAttribute('aria-valuenow')).toBe('0');
        expect(screen.getByText('Below floor')).toBeDefined();
    });

    it('null value treated as 0 → aria-valuenow=0 and shows "Below floor"', () => {
        render(<ProgressBar value={null} metric="calories" targets={targets} label="Calories" />);
        const bar = screen.getByRole('progressbar');
        expect(bar.getAttribute('aria-valuenow')).toBe('0');
        expect(screen.getByText('Below floor')).toBeDefined();
    });

    it('calorie value at floor (1600) → zone label "On track"', () => {
        render(<ProgressBar value={1600} metric="calories" targets={targets} label="Calories" />);
        expect(screen.getByText('On track')).toBeDefined();
    });

    it('calorie value above ceiling (2200) → zone label "Rad Zone"', () => {
        render(<ProgressBar value={2200} metric="calories" targets={targets} label="Calories" />);
        expect(screen.getByText('Rad Zone')).toBeDefined();
    });

    it('protein value above target (175) → zone label "Bonus"', () => {
        render(<ProgressBar value={175} metric="protein" targets={targets} label="Protein" />);
        expect(screen.getByText('Bonus')).toBeDefined();
    });

    it('ARIA: role="progressbar" is present', () => {
        render(<ProgressBar value={500} metric="steps" targets={targets} label="Steps" />);
        expect(screen.getByRole('progressbar')).toBeDefined();
    });

    it('ARIA: aria-label contains the zone description and metric label', () => {
        render(<ProgressBar value={7500} metric="steps" targets={targets} label="Steps" />);
        const bar = screen.getByRole('progressbar');
        const ariaLabel = bar.getAttribute('aria-label') ?? '';
        expect(ariaLabel).toContain('Steps');
        expect(ariaLabel).toContain('On track');
    });

    it('ARIA: aria-valuemin is 0', () => {
        render(<ProgressBar value={100} metric="protein" targets={targets} label="Protein" />);
        expect(screen.getByRole('progressbar').getAttribute('aria-valuemin')).toBe('0');
    });

    it('ARIA: aria-valuemax equals calorieCeiling for calories metric', () => {
        render(<ProgressBar value={1800} metric="calories" targets={targets} label="Calories" />);
        expect(screen.getByRole('progressbar').getAttribute('aria-valuemax')).toBe('2100');
    });

    it('ARIA: aria-valuemax equals proteinTarget for protein metric', () => {
        render(<ProgressBar value={100} metric="protein" targets={targets} label="Protein" />);
        expect(screen.getByRole('progressbar').getAttribute('aria-valuemax')).toBe('150');
    });

    it('ARIA: aria-valuemax equals stepsTarget for steps metric', () => {
        render(<ProgressBar value={5000} metric="steps" targets={targets} label="Steps" />);
        expect(screen.getByRole('progressbar').getAttribute('aria-valuemax')).toBe('10000');
    });

    it('renders the label text', () => {
        render(<ProgressBar value={100} metric="protein" targets={targets} label="Protein" />);
        expect(screen.getByText('Protein')).toBeDefined();
    });

    it('calorie value between target and ceiling (2000) → "Heads up" zone label (AC4)', () => {
        const ac4Targets: UserTargets = {
            ...targets,
            calorieTarget: 1800,
            calorieCeiling: 2000,
        };
        render(
            <ProgressBar value={1850} metric="calories" targets={ac4Targets} label="Calories" />
        );
        expect(screen.getByText('Heads up')).toBeDefined();
    });
});
