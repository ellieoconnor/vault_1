import { useNavigate, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { z } from 'zod';
import { useUserConfig, useSetUserConfig } from '@/api/useUserConfig';
import type { SetTargetsInput } from '@/api/useUserConfig';
import { calculateBMR, calculateTDEE } from '@/lib/bmrCalculator';
import type { ActivityLevel } from '@/lib/bmrCalculator';
import { lbsToKg, ftInToCm } from '@/lib/unitConverter';
import { step1Schema, step2Schema, step3Schema } from '@/schemas/onboarding';

interface FormState {
    // Step 1 biometrics
    measurementSystem: 'metric' | 'imperial';
    weightInput: string; // lbs or kg display value
    heightInputPrimary: string; // cm (metric) or feet (imperial)
    heightInputSecondary: string; // inches only - imperial mode
    age: string;
    sex: '' | 'male' | 'female';
    activityLevel:
        | ''
        | 'sedentary'
        | 'lightly_active'
        | 'moderately_active'
        | 'very_active'
        | 'extra_active';
    // Step 2 - Goal
    goalType: '' | 'lose' | 'maintain' | 'build';
    // Step 3 - Targets
    targetMode: 'suggest' | 'own';
    calorieTarget: string;
    proteinTarget: string;
    stepsTarget: string;
}

const initialFormState: FormState = {
    measurementSystem: 'metric',
    weightInput: '',
    heightInputPrimary: '',
    heightInputSecondary: '',
    age: '',
    sex: '',
    activityLevel: '',
    goalType: '',
    targetMode: 'suggest',
    calorieTarget: '',
    proteinTarget: '',
    stepsTarget: '',
};

function computeTDEE(form: FormState): number {
    let weightKg: number;
    let heightCm: number;
    if (form.measurementSystem === 'imperial') {
        weightKg = lbsToKg(Number(form.weightInput));
        heightCm = ftInToCm(Number(form.heightInputPrimary), Number(form.heightInputSecondary));
    } else {
        weightKg = Number(form.weightInput);
        heightCm = Number(form.heightInputPrimary);
    }

    return calculateTDEE(
        calculateBMR(weightKg, heightCm, Number(form.age), form.sex as 'male' | 'female'),
        form.activityLevel as ActivityLevel
    );
}

export default function OnboardingPage({ initialStep = 1 }: { initialStep?: 1 | 2 | 3 }) {
    const navigate = useNavigate();
    const { data: config, isLoading, isError } = useUserConfig();
    const setUserConfig = useSetUserConfig();

    const [step, setStep] = useState<1 | 2 | 3>(initialStep);
    const [form, setForm] = useState<FormState>(initialFormState);
    const [step1Errors, setStep1Errors] = useState<Record<string, string[]>>({});
    const [step2Errors, setStep2Errors] = useState<Record<string, string[]>>({});
    const [step3Errors, setStep3Errors] = useState<Record<string, string[]>>({});

    if (isLoading) return <div>Loading...</div>;
    if (isError) return <div>Something went wrong. Please refresh the page.</div>;
    if (config) return <Navigate to="/" replace />;

    function handleMeasurementToggle(system: 'metric' | 'imperial') {
        setForm((f) => ({
            ...f,
            measurementSystem: system,
            weightInput: '',
            heightInputPrimary: '',
            heightInputSecondary: '',
        }));
    }

    function handleNextStep1() {
        const result = step1Schema.safeParse(form);
        if (!result.success) {
            setStep1Errors(z.flattenError(result.error).fieldErrors);
            return;
        }
        setStep1Errors({});
        setStep(2);
    }

    function handleNextStep2() {
        const result = step2Schema.safeParse({ goalType: form.goalType });
        if (!result.success) {
            setStep2Errors(z.flattenError(result.error).fieldErrors);
            return;
        }
        if (form.targetMode === 'suggest') {
            const tdee = computeTDEE(form);
            setForm((f) => ({ ...f, calorieTarget: String(tdee) }));
        }
        setStep2Errors({});
        setStep(3);
    }

    function handleTargetModeChange(mode: 'suggest' | 'own') {
        if (mode === 'own') {
            setForm((f) => ({ ...f, targetMode: 'own', calorieTarget: '' }));
        } else {
            const tdee = computeTDEE(form);
            setForm((f) => ({ ...f, targetMode: 'suggest', calorieTarget: String(tdee) }));
        }
    }

    function handleSubmit() {
        const result = step3Schema.safeParse({
            calorieTarget: form.calorieTarget,
            proteinTarget: form.proteinTarget,
            stepsTarget: form.stepsTarget,
        });
        if (!result.success) {
            setStep3Errors(z.flattenError(result.error).fieldErrors);
            return;
        }
        const payload = {
            measurementSystem: form.measurementSystem,
            weightInput: Number(form.weightInput),
            heightInputPrimary: Number(form.heightInputPrimary),
            heightInputSecondary:
                form.measurementSystem === 'imperial'
                    ? Number(form.heightInputSecondary)
                    : undefined,
            age: Number(form.age),
            sex: form.sex as 'male' | 'female',
            activityLevel: form.activityLevel as SetTargetsInput['activityLevel'],
            goalType: form.goalType as 'lose' | 'maintain' | 'build',
            calorieTarget: Number(form.calorieTarget),
            proteinTarget: Number(form.proteinTarget),
            stepsTarget: Number(form.stepsTarget),
        };
        setUserConfig.mutate(payload, {
            onSuccess: () => navigate('/', { replace: true }),
            onError: () => setStep3Errors({ form: ['Something went wrong. Please try again.'] }),
        });
    }

    return (
        <main>
            {step === 1 && (
                <form>
                    <h1>Step 1 of 3</h1>

                    <div>
                        <button
                            type="button"
                            onClick={() => handleMeasurementToggle('metric')}
                            style={{
                                minHeight: '44px',
                                fontWeight: form.measurementSystem === 'metric' ? 'bold' : 'normal',
                            }}
                        >
                            Metric (kg, cm)
                        </button>
                        <button
                            type="button"
                            onClick={() => handleMeasurementToggle('imperial')}
                            style={{
                                minHeight: '44px',
                                fontWeight:
                                    form.measurementSystem === 'imperial' ? 'bold' : 'normal',
                            }}
                        >
                            Imperial (lbs, ft + in)
                        </button>
                    </div>

                    <label>
                        {form.measurementSystem === 'metric' ? 'Weight (kg)' : 'Weight (lbs)'}
                        <input
                            type="number"
                            value={form.weightInput}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, weightInput: e.target.value }))
                            }
                            style={{ fontSize: '16px', minHeight: '44px' }}
                        />
                    </label>
                    {step1Errors.weightInput?.[0] && <span>{step1Errors.weightInput[0]}</span>}

                    {form.measurementSystem === 'metric' ? (
                        <>
                            <label>
                                Height (cm)
                                <input
                                    type="number"
                                    value={form.heightInputPrimary}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            heightInputPrimary: e.target.value,
                                        }))
                                    }
                                    style={{ fontSize: '16px', minHeight: '44px' }}
                                />
                            </label>
                            {step1Errors.heightInputPrimary?.[0] && (
                                <span>{step1Errors.heightInputPrimary[0]}</span>
                            )}
                        </>
                    ) : (
                        <>
                            <label>
                                Feet
                                <input
                                    type="number"
                                    value={form.heightInputPrimary}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            heightInputPrimary: e.target.value,
                                        }))
                                    }
                                    style={{ fontSize: '16px', minHeight: '44px' }}
                                />
                            </label>
                            {step1Errors.heightInputPrimary?.[0] && (
                                <span>{step1Errors.heightInputPrimary[0]}</span>
                            )}
                            <label>
                                Inches
                                <input
                                    type="number"
                                    value={form.heightInputSecondary}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            heightInputSecondary: e.target.value,
                                        }))
                                    }
                                    style={{ fontSize: '16px', minHeight: '44px' }}
                                />
                            </label>
                            {step1Errors.heightInputSecondary?.[0] && (
                                <span>{step1Errors.heightInputSecondary[0]}</span>
                            )}
                        </>
                    )}

                    <label>
                        Age
                        <input
                            type="number"
                            value={form.age}
                            onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                            style={{ fontSize: '16px', minHeight: '44px' }}
                        />
                    </label>
                    {step1Errors.age?.[0] && <span>{step1Errors.age[0]}</span>}

                    <fieldset>
                        <legend>Biological sex</legend>
                        <label style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}>
                            <input
                                type="radio"
                                name="sex"
                                value="male"
                                checked={form.sex === 'male'}
                                onChange={() => setForm((f) => ({ ...f, sex: 'male' }))}
                            />
                            Male
                        </label>
                        <label style={{ minHeight: '44px', display: 'flex', alignItems: 'center' }}>
                            <input
                                type="radio"
                                name="sex"
                                value="female"
                                checked={form.sex === 'female'}
                                onChange={() => setForm((f) => ({ ...f, sex: 'female' }))}
                            />
                            Female
                        </label>
                    </fieldset>
                    {step1Errors.sex?.[0] && <span>{step1Errors.sex[0]}</span>}

                    <label>
                        Activity level
                        <select
                            value={form.activityLevel}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    activityLevel: e.target.value as FormState['activityLevel'],
                                }))
                            }
                            style={{ fontSize: '16px', minHeight: '44px' }}
                        >
                            <option value="">Select...</option>
                            <option value="sedentary">Sedentary</option>
                            <option value="lightly_active">Lightly Active</option>
                            <option value="moderately_active">Moderately Active</option>
                            <option value="very_active">Very Active</option>
                            <option value="extra_active">Extra Active</option>
                        </select>
                    </label>
                    {step1Errors.activityLevel?.[0] && <span>{step1Errors.activityLevel[0]}</span>}

                    <button type="button" onClick={handleNextStep1} style={{ minHeight: '44px' }}>
                        Next
                    </button>
                </form>
            )}

            {step === 2 && (
                <form>
                    <h1>Step 2 of 3</h1>

                    <div>
                        {(['lose', 'maintain', 'build'] as const).map((type) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setForm((f) => ({ ...f, goalType: type }))}
                                style={{
                                    minHeight: '44px',
                                    fontWeight: form.goalType === type ? 'bold' : 'normal',
                                }}
                            >
                                {type === 'lose'
                                    ? 'Lose weight'
                                    : type === 'maintain'
                                      ? 'Maintain'
                                      : 'Build'}
                            </button>
                        ))}
                    </div>
                    {step2Errors.goalType?.[0] && <span>{step2Errors.goalType[0]}</span>}

                    <button
                        type="button"
                        onClick={() => {
                            setStep(1);
                            setStep1Errors({});
                        }}
                        style={{ minHeight: '44px' }}
                    >
                        Back
                    </button>
                    <button type="button" onClick={handleNextStep2} style={{ minHeight: '44px' }}>
                        Next
                    </button>
                </form>
            )}

            {step === 3 && (
                <form>
                    <h1>Step 3 of 3</h1>

                    <div>
                        <button
                            type="button"
                            onClick={() => handleTargetModeChange('suggest')}
                            style={{
                                minHeight: '44px',
                                fontWeight: form.targetMode === 'suggest' ? 'bold' : 'normal',
                            }}
                        >
                            Suggest a target for me
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTargetModeChange('own')}
                            style={{
                                minHeight: '44px',
                                fontWeight: form.targetMode === 'own' ? 'bold' : 'normal',
                            }}
                        >
                            I'll enter my own
                        </button>
                    </div>

                    <label>
                        Calorie target
                        <input
                            type="number"
                            value={form.calorieTarget}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, calorieTarget: e.target.value }))
                            }
                            style={{ fontSize: '16px', minHeight: '44px' }}
                        />
                    </label>
                    {step3Errors.calorieTarget?.[0] && <span>{step3Errors.calorieTarget[0]}</span>}

                    <label>
                        Protein target (g)
                        <input
                            type="number"
                            value={form.proteinTarget}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, proteinTarget: e.target.value }))
                            }
                            style={{ fontSize: '16px', minHeight: '44px' }}
                        />
                    </label>
                    {step3Errors.proteinTarget?.[0] && <span>{step3Errors.proteinTarget[0]}</span>}

                    <label>
                        Steps target
                        <input
                            type="number"
                            value={form.stepsTarget}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, stepsTarget: e.target.value }))
                            }
                            style={{ fontSize: '16px', minHeight: '44px' }}
                        />
                    </label>
                    {step3Errors.stepsTarget?.[0] && <span>{step3Errors.stepsTarget[0]}</span>}

                    {step3Errors.form?.[0] && <p>{step3Errors.form[0]}</p>}

                    <button
                        type="button"
                        onClick={() => {
                            setStep(2);
                            setStep3Errors({});
                        }}
                        style={{ minHeight: '44px' }}
                    >
                        Back
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={setUserConfig.isPending}
                        style={{ minHeight: '44px' }}
                    >
                        {setUserConfig.isPending ? 'Saving...' : 'Save & Continue'}
                    </button>
                </form>
            )}
        </main>
    );
}
