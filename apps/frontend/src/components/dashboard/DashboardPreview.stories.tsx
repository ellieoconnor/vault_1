import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CheatCode } from '@/api/useCheatCodes';
import type { UserTargets } from '@/lib/zoneCalculator';
import { ProgressBar } from './ProgressBar';
import { CheatCodes } from './CheatCodes';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const TARGETS: UserTargets = {
    calorieFloor: 1600,
    calorieTarget: 1900,
    calorieCeiling: 2100,
    proteinFloor: 120,
    proteinTarget: 150,
    stepsFloor: 5000,
    stepsTarget: 10000,
};

const CHEAT_CODES: CheatCode[] = [
    {
        id: '1',
        userId: 'u1',
        text: 'Eat protein first — it fills you up before you get to the bread',
        sortOrder: 0,
        createdAt: '',
        updatedAt: '',
    },
    {
        id: '2',
        userId: 'u1',
        text: 'Walk 10 mins after dinner — counts toward steps',
        sortOrder: 1,
        createdAt: '',
        updatedAt: '',
    },
    {
        id: '3',
        userId: 'u1',
        text: "Log before you eat — just do it anyway, even if it's late",
        sortOrder: 2,
        createdAt: '',
        updatedAt: '',
    },
];

// ─── Dashboard shell ──────────────────────────────────────────────────────────

interface DashboardShellProps {
    calories: number | null;
    protein: number | null;
    steps: number | null;
}

function DashboardShell({ calories, protein, steps }: DashboardShellProps) {
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="mx-auto flex max-w-[480px] flex-col gap-4 p-4">
            {/* App header */}
            <header className="flex items-baseline justify-between">
                <h1 className="font-mono text-2xl font-bold tracking-widest text-[#FFD700]">
                    WIN THE DAY
                </h1>
                <span className="text-xs text-muted-foreground">{today}</span>
            </header>

            {/* Cheat Codes band */}
            <CheatCodes />

            {/* Today's Metrics panel */}
            <section className="flex flex-col gap-4 rounded-xl border p-4 ring-1 ring-foreground/10">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Today's Metrics
                </h2>
                <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-sm">
                            <span>Calories</span>
                            <span className="tabular-nums">{calories ?? 0}</span>
                        </div>
                        <ProgressBar
                            value={calories}
                            metric="calories"
                            targets={TARGETS}
                            label="Calories"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-sm">
                            <span>Protein</span>
                            <span className="tabular-nums">{protein ?? 0}g</span>
                        </div>
                        <ProgressBar
                            value={protein}
                            metric="protein"
                            targets={TARGETS}
                            label="Protein"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-sm">
                            <span>Steps</span>
                            <span className="tabular-nums">{steps ?? 0}</span>
                        </div>
                        <ProgressBar value={steps} metric="steps" targets={TARGETS} label="Steps" />
                    </div>
                </div>
            </section>

            {/* Active Goals panel — Epic 3 placeholder */}
            <section className="rounded-xl border p-4 ring-1 ring-foreground/10">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Active Goals
                </h2>
                <p className="text-sm text-muted-foreground">
                    Set up your weekly goals to track them here.
                </p>
            </section>

            {/* Day Complete placeholder — Story 2.5 */}
            <button
                type="button"
                disabled
                className="w-full cursor-not-allowed rounded-xl border-2 border-[#FFD700] py-4 font-mono text-sm font-bold uppercase tracking-widest text-[#FFD700] opacity-40"
            >
                DAY COMPLETE
            </button>
        </div>
    );
}

// ─── Story wrapper with QueryClient ──────────────────────────────────────────

function makeDecorator(cheatCodes: CheatCode[]) {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(['cheatCodes'], cheatCodes);
    return (Story: React.ComponentType) => (
        <QueryClientProvider client={queryClient}>
            <Story />
        </QueryClientProvider>
    );
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof DashboardShell> = {
    title: 'Pages/Dashboard Preview',
    component: DashboardShell,
    parameters: {
        layout: 'fullscreen',
    },
    args: {
        calories: 0,
        protein: 0,
        steps: 0,
    },
};

export default meta;
type Story = StoryObj<typeof DashboardShell>;

// ─── Stories ─────────────────────────────────────────────────────────────────

export const EmptyDay: Story = {
    name: 'Empty day (no log yet)',
    decorators: [makeDecorator(CHEAT_CODES)],
    args: { calories: null, protein: null, steps: null },
};

export const MidDay: Story = {
    name: 'Mid-day check-in (on track)',
    decorators: [makeDecorator(CHEAT_CODES)],
    args: { calories: 1750, protein: 135, steps: 6500 },
};

export const HeadsUp: Story = {
    name: 'Calories heads-up zone (target → ceiling)',
    decorators: [makeDecorator(CHEAT_CODES)],
    args: { calories: 2000, protein: 160, steps: 9200 },
};

export const BonusDay: Story = {
    name: 'Bonus day (all metrics above target)',
    decorators: [makeDecorator(CHEAT_CODES)],
    args: { calories: 1850, protein: 175, steps: 12000 },
};

export const NoCheatCodes: Story = {
    name: 'No cheat codes set up yet',
    decorators: [makeDecorator([])],
    args: { calories: 1200, protein: 80, steps: 3000 },
};
