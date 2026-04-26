/**
 * E2E: Onboarding flow
 *
 * Tests the 3-step onboarding form that collects biometrics, goal, and targets.
 * Requires both frontend (Vite) and backend (Express) running.
 *
 * Run:
 *   npx playwright test tests/e2e/onboarding.spec.ts
 *
 * Each test registers a fresh user via API so it starts with no config.
 */

import { test, expect } from '../support/fixtures';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function registerFreshUser(
    apiRequest: (opts: {
        method: string;
        path: string;
        baseUrl: string;
        body?: object;
    }) => Promise<{ status: number; body: Record<string, unknown> }>,
) {
    const username = `onb_${Date.now()}`;
    const password = 'TestPassword123!';
    await apiRequest({
        method: 'POST',
        path: '/api/auth/register',
        baseUrl: API_URL,
        body: { username, password },
    });
    return { username, password };
}

async function loginAs(
    page: Parameters<typeof test>[1] extends { page: infer P } ? P : never,
    apiRequest: Parameters<typeof test>[1] extends { apiRequest: infer A } ? A : never,
    creds: { username: string; password: string },
) {
    await page.goto('/login');
    await page.getByPlaceholder('Username').fill(creds.username);
    await page.getByPlaceholder('Password').fill(creds.password);
    await page.getByRole('button', { name: 'Log In' }).click();
    await expect(page).toHaveURL('/onboarding');
}

// ---------------------------------------------------------------------------
// Redirect behaviour
// ---------------------------------------------------------------------------

test.describe('Onboarding redirect', () => {
    test('user with no config is redirected to /onboarding after login', async ({
        page,
        apiRequest,
    }) => {
        const creds = await registerFreshUser(apiRequest);
        await page.goto('/login');
        await page.getByPlaceholder('Username').fill(creds.username);
        await page.getByPlaceholder('Password').fill(creds.password);
        await page.getByRole('button', { name: 'Log In' }).click();
        await expect(page).toHaveURL('/onboarding');
    });
});

// ---------------------------------------------------------------------------
// Step 1 — Biometrics
// ---------------------------------------------------------------------------

test.describe('Step 1 — Biometrics', () => {
    test('shows Step 1 of 3 heading', async ({ page, apiRequest }) => {
        const creds = await registerFreshUser(apiRequest);
        await loginAs(page, apiRequest, creds);
        await expect(page.getByText('Step 1 of 3')).toBeVisible();
    });

    test('shows validation errors when Next is clicked with empty fields', async ({
        page,
        apiRequest,
    }) => {
        const creds = await registerFreshUser(apiRequest);
        await loginAs(page, apiRequest, creds);
        await page.getByRole('button', { name: 'Next' }).click();
        // At least one error message should appear (exact wording depends on zod messages)
        await expect(page.locator('span').first()).toBeVisible();
        // Should still be on step 1
        await expect(page.getByText('Step 1 of 3')).toBeVisible();
    });

    test('switches to imperial mode when Imperial button is clicked', async ({
        page,
        apiRequest,
    }) => {
        const creds = await registerFreshUser(apiRequest);
        await loginAs(page, apiRequest, creds);
        await page.getByRole('button', { name: /Imperial/i }).click();
        await expect(page.getByText('Weight (lbs)')).toBeVisible();
        await expect(page.getByText('Feet')).toBeVisible();
        await expect(page.getByText('Inches')).toBeVisible();
    });

    test('advances to Step 2 with valid metric biometrics', async ({ page, apiRequest }) => {
        const creds = await registerFreshUser(apiRequest);
        await loginAs(page, apiRequest, creds);

        await page.getByLabel('Weight (kg)').fill('70');
        await page.getByLabel('Height (cm)').fill('175');
        await page.getByLabel('Age').fill('30');
        await page.getByRole('radio', { name: 'Male' }).check();
        await page.getByLabel('Activity level').selectOption('moderately_active');
        await page.getByRole('button', { name: 'Next' }).click();

        await expect(page.getByText('Step 2 of 3')).toBeVisible();
    });
});

// ---------------------------------------------------------------------------
// Step 2 — Goal
// ---------------------------------------------------------------------------

test.describe('Step 2 — Goal', () => {
    async function reachStep2(
        page: Parameters<typeof test>[1] extends { page: infer P } ? P : never,
        apiRequest: Parameters<typeof test>[1] extends { apiRequest: infer A } ? A : never,
    ) {
        const creds = await registerFreshUser(apiRequest);
        await loginAs(page, apiRequest, creds);
        await page.getByLabel('Weight (kg)').fill('70');
        await page.getByLabel('Height (cm)').fill('175');
        await page.getByLabel('Age').fill('30');
        await page.getByRole('radio', { name: 'Male' }).check();
        await page.getByLabel('Activity level').selectOption('moderately_active');
        await page.getByRole('button', { name: 'Next' }).click();
        await expect(page.getByText('Step 2 of 3')).toBeVisible();
    }

    test('shows goal options', async ({ page, apiRequest }) => {
        await reachStep2(page, apiRequest);
        await expect(page.getByRole('button', { name: 'Lose weight' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Maintain' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Build' })).toBeVisible();
    });

    test('Back button returns to Step 1', async ({ page, apiRequest }) => {
        await reachStep2(page, apiRequest);
        await page.getByRole('button', { name: 'Back' }).click();
        await expect(page.getByText('Step 1 of 3')).toBeVisible();
    });

    test('advances to Step 3 after selecting a goal', async ({ page, apiRequest }) => {
        await reachStep2(page, apiRequest);
        await page.getByRole('button', { name: 'Maintain' }).click();
        await page.getByRole('button', { name: 'Next' }).click();
        await expect(page.getByText('Step 3 of 3')).toBeVisible();
    });
});

// ---------------------------------------------------------------------------
// Step 3 — Targets
// ---------------------------------------------------------------------------

test.describe('Step 3 — Targets', () => {
    async function reachStep3(
        page: Parameters<typeof test>[1] extends { page: infer P } ? P : never,
        apiRequest: Parameters<typeof test>[1] extends { apiRequest: infer A } ? A : never,
    ) {
        const creds = await registerFreshUser(apiRequest);
        await loginAs(page, apiRequest, creds);

        // Step 1
        await page.getByLabel('Weight (kg)').fill('70');
        await page.getByLabel('Height (cm)').fill('175');
        await page.getByLabel('Age').fill('30');
        await page.getByRole('radio', { name: 'Male' }).check();
        await page.getByLabel('Activity level').selectOption('moderately_active');
        await page.getByRole('button', { name: 'Next' }).click();

        // Step 2
        await page.getByRole('button', { name: 'Maintain' }).click();
        await page.getByRole('button', { name: 'Next' }).click();

        await expect(page.getByText('Step 3 of 3')).toBeVisible();
    }

    test('pre-fills calorie target in Suggest mode', async ({ page, apiRequest }) => {
        await reachStep3(page, apiRequest);
        // TDEE for 70kg/175cm/30yo male moderately_active ≈ 2554
        const calorieInput = page.getByLabel('Calorie target');
        await expect(calorieInput).not.toHaveValue('');
    });

    test('clears calorie target when switching to own-entry mode', async ({ page, apiRequest }) => {
        await reachStep3(page, apiRequest);
        await page.getByRole('button', { name: "I'll enter my own" }).click();
        await expect(page.getByLabel('Calorie target')).toHaveValue('');
    });

    test('submits and redirects to / on valid input', async ({ page, apiRequest }) => {
        await reachStep3(page, apiRequest);
        // Use suggested calorie target, fill remaining fields
        await page.getByLabel('Protein target (g)').fill('150');
        await page.getByLabel('Steps target').fill('10000');
        await page.getByRole('button', { name: 'Save & Continue' }).click();
        await expect(page).toHaveURL('/');
    });
});

// ---------------------------------------------------------------------------
// Complete imperial flow
// ---------------------------------------------------------------------------

test.describe('Complete flow — imperial', () => {
    test('submits full form in imperial mode and redirects to /', async ({
        page,
        apiRequest,
    }) => {
        const creds = await registerFreshUser(apiRequest);
        await loginAs(page, apiRequest, creds);

        // Step 1 — imperial
        await page.getByRole('button', { name: /Imperial/i }).click();
        await page.getByLabel('Weight (lbs)').fill('154');
        await page.getByLabel('Feet').fill('5');
        await page.getByLabel('Inches').fill('9');
        await page.getByLabel('Age').fill('30');
        await page.getByRole('radio', { name: 'Male' }).check();
        await page.getByLabel('Activity level').selectOption('sedentary');
        await page.getByRole('button', { name: 'Next' }).click();

        // Step 2
        await expect(page.getByText('Step 2 of 3')).toBeVisible();
        await page.getByRole('button', { name: 'Lose weight' }).click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Step 3
        await expect(page.getByText('Step 3 of 3')).toBeVisible();
        await page.getByRole('button', { name: "I'll enter my own" }).click();
        await page.getByLabel('Calorie target').fill('1800');
        await page.getByLabel('Protein target (g)').fill('130');
        await page.getByLabel('Steps target').fill('8000');
        await page.getByRole('button', { name: 'Save & Continue' }).click();

        await expect(page).toHaveURL('/');
    });
});
