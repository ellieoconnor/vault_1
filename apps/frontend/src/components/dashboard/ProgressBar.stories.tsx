import type { Meta, StoryObj } from '@storybook/react-vite';
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

const meta: Meta<typeof ProgressBar> = {
    title: 'Components/Dashboard/ProgressBar',
    component: ProgressBar,
    parameters: {
        layout: 'padded',
    },
    args: {
        targets,
        label: 'Calories',
        metric: 'calories',
        value: 0,
    },
};

export default meta;
type Story = StoryObj<typeof ProgressBar>;

// --- Calories ---

export const CaloriesZero: Story = {
    name: 'Calories — Below floor (0)',
    args: { metric: 'calories', label: 'Calories', value: 0 },
};

export const CaloriesAtFloor: Story = {
    name: 'Calories — On track (at floor)',
    args: { metric: 'calories', label: 'Calories', value: 1600 },
};

export const CaloriesMidRange: Story = {
    name: 'Calories — On track (mid range)',
    args: { metric: 'calories', label: 'Calories', value: 1750 },
};

export const CaloriesHeadsUp: Story = {
    name: 'Calories — Heads up (target → ceiling)',
    args: { metric: 'calories', label: 'Calories', value: 2000 },
};

export const CaloriesRadZone: Story = {
    name: 'Calories — Rad Zone (above ceiling)',
    args: { metric: 'calories', label: 'Calories', value: 2300 },
};

// AC4: 1850 cal, 1800 target, 2000 ceiling → "Heads up"
export const CaloriesAC4: Story = {
    name: 'Calories — AC4 scenario (1850 with 1800 target)',
    args: {
        metric: 'calories',
        label: 'Calories',
        value: 1850,
        targets: { ...targets, calorieTarget: 1800, calorieCeiling: 2000 },
    },
};

// --- Protein ---

export const ProteinBelowFloor: Story = {
    name: 'Protein — Below floor',
    args: { metric: 'protein', label: 'Protein', value: 80 },
};

export const ProteinOnTrack: Story = {
    name: 'Protein — On track',
    args: { metric: 'protein', label: 'Protein', value: 135 },
};

export const ProteinBonus: Story = {
    name: 'Protein — Bonus (above target)',
    args: { metric: 'protein', label: 'Protein', value: 175 },
};

// --- Steps ---

export const StepsBelowFloor: Story = {
    name: 'Steps — Below floor',
    args: { metric: 'steps', label: 'Steps', value: 2000 },
};

export const StepsOnTrack: Story = {
    name: 'Steps — On track',
    args: { metric: 'steps', label: 'Steps', value: 7500 },
};

export const StepsBonus: Story = {
    name: 'Steps — Bonus (above target)',
    args: { metric: 'steps', label: 'Steps', value: 12000 },
};

// --- Null value (initial state, no log yet) ---

export const NullValue: Story = {
    name: 'No log yet (null value)',
    args: { metric: 'calories', label: 'Calories', value: null },
};

// --- All three bars together ---

export const AllMetrics: Story = {
    name: 'All three metrics',
    render: (args) => (
        <div className="flex flex-col gap-6 max-w-sm">
            <ProgressBar {...args} metric="calories" label="Calories" value={1750} />
            <ProgressBar {...args} metric="protein" label="Protein" value={135} />
            <ProgressBar {...args} metric="steps" label="Steps" value={7500} />
        </div>
    ),
};
