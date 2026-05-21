import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useLogout } from '@/api/useAuth';
import { useTodayLog, useUpsertLog } from '@/api/useDailyLog';
import { useUserConfig } from '@/api/useUserConfig';
import { CheatCodes } from '@/components/dashboard/CheatCodes';
import { ProgressBar } from '@/components/dashboard/ProgressBar';
import { Checkbox } from '@/components/ui/checkbox';
import type { UserTargets } from '@/lib/zoneCalculator';

export default function DashboardPage() {
    const logout = useLogout();
    const { data: todayLog } = useTodayLog();
    const { data: userConfig, isLoading: configLoading } = useUserConfig();
    const upsertLog = useUpsertLog();

    const [caloriesInput, setCaloriesInput] = useState('');
    const [proteinInput, setProteinInput] = useState('');
    const [stepsInput, setStepsInput] = useState('');
    const [workoutDone, setWorkoutDone] = useState(false);

    useEffect(() => {
        if (todayLog) {
            setCaloriesInput(todayLog.calories?.toString() ?? '');
            setProteinInput(todayLog.protein?.toString() ?? '');
            setStepsInput(todayLog.steps?.toString() ?? '');
            setWorkoutDone(todayLog.workoutDone);
        }
    }, [todayLog]);

    const caloriesValue = caloriesInput === '' ? null : parseInt(caloriesInput, 10) || 0;
    const proteinValue = proteinInput === '' ? null : parseInt(proteinInput, 10) || 0;
    const stepsValue = stepsInput === '' ? null : parseInt(stepsInput, 10) || 0;

    const targets: UserTargets | null = userConfig
        ? {
              calorieFloor: userConfig.calorieFloor,
              calorieTarget: userConfig.calorieTarget,
              calorieCeiling: userConfig.calorieCeiling,
              proteinFloor: userConfig.proteinFloor,
              proteinTarget: userConfig.proteinTarget,
              stepsFloor: userConfig.stepsFloor,
              stepsTarget: userConfig.stepsTarget,
          }
        : null;

    const todayDate = new Date().toISOString().split('T')[0];

    const handleCaloriesBlur = () => {
        upsertLog.mutate({ logDate: todayDate, calories: caloriesValue });
    };

    const handleProteinBlur = () => {
        upsertLog.mutate({ logDate: todayDate, protein: proteinValue });
    };

    const handleStepsBlur = () => {
        upsertLog.mutate({ logDate: todayDate, steps: stepsValue });
    };

    const handleWorkoutChange = (checked: boolean | 'indeterminate') => {
        const done = checked === true;
        setWorkoutDone(done);
        upsertLog.mutate({ logDate: todayDate, workoutDone: done });
    };

    const displayDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div className="mx-auto flex max-w-[480px] flex-col gap-4 p-4 pb-8">
            {/* App header */}
            <header className="flex items-baseline justify-between">
                <h1 className="font-mono text-2xl font-bold tracking-widest text-[#FFD700]">
                    WIN THE DAY
                </h1>
                <span className="text-xs text-muted-foreground">{displayDate}</span>
            </header>

            {/* Cheat Codes band */}
            <CheatCodes />

            {/* Today's Metrics panel */}
            <section className="flex flex-col gap-4 rounded-xl border p-4 ring-1 ring-foreground/10">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Today's Metrics
                </h2>

                {configLoading ? (
                    <p className="text-sm text-muted-foreground">Loading your targets…</p>
                ) : targets ? (
                    <div className="flex flex-col gap-5">
                        {/* Calories row */}
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between gap-2">
                                <label htmlFor="calories-input" className="text-sm">
                                    Calories
                                </label>
                                <input
                                    id="calories-input"
                                    type="number"
                                    inputMode="decimal"
                                    min="0"
                                    value={caloriesInput}
                                    onChange={(e) => setCaloriesInput(e.target.value)}
                                    onBlur={handleCaloriesBlur}
                                    className="min-h-[44px] w-24 rounded-lg border border-input bg-transparent px-2 text-right text-[16px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                                    aria-label="Calories logged"
                                />
                            </div>
                            <ProgressBar
                                value={caloriesValue}
                                metric="calories"
                                targets={targets}
                                label="Calories"
                            />
                        </div>

                        {/* Protein row */}
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between gap-2">
                                <label htmlFor="protein-input" className="text-sm">
                                    Protein
                                </label>
                                <input
                                    id="protein-input"
                                    type="number"
                                    inputMode="decimal"
                                    min="0"
                                    value={proteinInput}
                                    onChange={(e) => setProteinInput(e.target.value)}
                                    onBlur={handleProteinBlur}
                                    className="min-h-[44px] w-24 rounded-lg border border-input bg-transparent px-2 text-right text-[16px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                                    aria-label="Protein logged in grams"
                                />
                            </div>
                            <ProgressBar
                                value={proteinValue}
                                metric="protein"
                                targets={targets}
                                label="Protein"
                            />
                        </div>

                        {/* Steps row */}
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between gap-2">
                                <label htmlFor="steps-input" className="text-sm">
                                    Steps
                                </label>
                                <input
                                    id="steps-input"
                                    type="number"
                                    inputMode="decimal"
                                    min="0"
                                    value={stepsInput}
                                    onChange={(e) => setStepsInput(e.target.value)}
                                    onBlur={handleStepsBlur}
                                    className="min-h-[44px] w-24 rounded-lg border border-input bg-transparent px-2 text-right text-[16px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                                    aria-label="Steps logged"
                                />
                            </div>
                            <ProgressBar
                                value={stepsValue}
                                metric="steps"
                                targets={targets}
                                label="Steps"
                            />
                        </div>

                        {/* Workout row */}
                        <div className="flex items-center gap-3">
                            <Checkbox
                                id="workout-checkbox"
                                checked={workoutDone}
                                onCheckedChange={handleWorkoutChange}
                            />
                            <label
                                htmlFor="workout-checkbox"
                                className="flex min-h-[44px] cursor-pointer items-center text-sm"
                            >
                                Workout done
                            </label>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        No targets configured yet.{' '}
                        <Link to="/settings" className="underline underline-offset-4">
                            Set up your targets in Settings
                        </Link>
                        .
                    </p>
                )}
            </section>

            {/* Active Goals panel — Epic 3 placeholder */}
            <section className="rounded-xl border p-4 ring-1 ring-foreground/10">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Active Goals
                </h2>
                <p className="text-sm text-muted-foreground">
                    Set up your weekly goals to track them here
                </p>
            </section>

            {/* Day Complete placeholder — Story 2.5 */}
            <button
                type="button"
                disabled
                className="min-h-[44px] w-full cursor-not-allowed rounded-xl border-2 border-[#FFD700] py-3 font-mono text-sm font-bold uppercase tracking-widest text-[#FFD700] opacity-40"
            >
                DAY COMPLETE
            </button>

            {/* Nav — small, non-competing */}
            <div className="flex justify-between text-sm">
                <Link
                    to="/settings"
                    className="text-muted-foreground underline underline-offset-4"
                >
                    Settings
                </Link>
                <button
                    type="button"
                    onClick={() => logout.mutate()}
                    disabled={logout.isPending}
                    className="text-muted-foreground underline underline-offset-4 disabled:opacity-50"
                >
                    {logout.isPending ? 'Logging out…' : 'Log Out'}
                </button>
            </div>
        </div>
    );
}
