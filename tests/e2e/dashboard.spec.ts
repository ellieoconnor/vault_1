/**
 * E2E: Dashboard — Day Complete & MoodPicker (Story 2.5)
 *
 * Tests the Day Complete button, MoodPicker sheet, and completion banner
 * on the dashboard. Requires both frontend (Vite) and backend (Express) running.
 *
 * Run:
 *   npx playwright test tests/e2e/dashboard.spec.ts
 *
 * Each test registers a fresh user and completes onboarding so it lands
 * on the dashboard with a clean log state.
 */

import { expect } from '@playwright/test';
import { test } from '../support/fixtures';

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
    const username = `dash_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const password = 'TestPassword123!';
    await apiRequest({
        method: 'POST',
        path: '/api/auth/register',
        baseUrl: API_URL,
        body: { username, password },
    });
    return { username, password };
}

async function reachDashboard(
    page: Parameters<typeof test>[1] extends { page: infer P } ? P : never,
    apiRequest: Parameters<typeof test>[1] extends { apiRequest: infer A } ? A : never,
) {
    const creds = await registerFreshUser(apiRequest);

    await page.goto('/login');
    await page.getByPlaceholder('Username').fill(creds.username);
    await page.getByPlaceholder('Password').fill(creds.password);
    await page.getByRole('button', { name: 'Log In' }).click();
    await expect(page).toHaveURL('/onboarding');

    // Step 1 — Biometrics
    await page.getByLabel('Weight (kg)').fill('70');
    await page.getByLabel('Height (cm)').fill('175');
    await page.getByLabel('Age').fill('30');
    await page.getByRole('radio', { name: 'Male' }).check();
    await page.getByLabel('Activity level').selectOption('moderately_active');
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 2 — Goal
    await page.getByRole('button', { name: 'Maintain' }).click();
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 3 — Targets
    await page.getByLabel('Protein target (g)').fill('150');
    await page.getByLabel('Steps target').fill('10000');
    await page.getByRole('button', { name: 'Save & Continue' }).click();

    await expect(page).toHaveURL('/');
}

// ---------------------------------------------------------------------------
// Day Complete button
// ---------------------------------------------------------------------------

test.describe('Day Complete button', () => {
    test('shows DAY COMPLETE button when the day is not yet logged', async ({
        page,
        apiRequest,
    }) => {
        await reachDashboard(page, apiRequest);
        await expect(page.getByRole('button', { name: 'Complete today\'s log' })).toBeVisible();
    });

    test('clicking DAY COMPLETE opens the MoodPicker sheet', async ({ page, apiRequest }) => {
        await reachDashboard(page, apiRequest);
        await page.getByRole('button', { name: 'Complete today\'s log' }).click();
        await expect(page.getByText('How are you feeling?')).toBeVisible();
    });
});

// ---------------------------------------------------------------------------
// MoodPicker — selecting a mood
// ---------------------------------------------------------------------------

test.describe('MoodPicker — selecting a mood', () => {
    test('selecting a mood closes the picker and shows the completion banner', async ({
        page,
        apiRequest,
    }) => {
        await reachDashboard(page, apiRequest);
        await page.getByRole('button', { name: 'Complete today\'s log' }).click();
        await expect(page.getByText('How are you feeling?')).toBeVisible();

        await page.getByRole('button', { name: 'Mood: Solid' }).click();

        await expect(page.getByText('DAY LOGGED. VAULT SECURE.')).toBeVisible();
        await expect(
            page.getByRole('button', { name: 'Complete today\'s log' }),
        ).not.toBeVisible();
    });

    test('selected mood label is shown in the completion banner', async ({
        page,
        apiRequest,
    }) => {
        await reachDashboard(page, apiRequest);
        await page.getByRole('button', { name: 'Complete today\'s log' }).click();
        await page.getByRole('button', { name: 'Mood: Crushing It' }).click();

        await expect(page.getByText('DAY LOGGED. VAULT SECURE.')).toBeVisible();
        await expect(page.getByText(/Crushing It/)).toBeVisible();
    });
});

// ---------------------------------------------------------------------------
// MoodPicker — dismissing without selecting
// ---------------------------------------------------------------------------

test.describe('MoodPicker — dismissing without a mood', () => {
    test('closing the picker without selecting still completes the day', async ({
        page,
        apiRequest,
    }) => {
        await reachDashboard(page, apiRequest);
        await page.getByRole('button', { name: 'Complete today\'s log' }).click();
        await expect(page.getByText('How are you feeling?')).toBeVisible();

        await page.getByRole('button', { name: /close/i }).click();

        await expect(page.getByText('DAY LOGGED. VAULT SECURE.')).toBeVisible();
    });
});

// ---------------------------------------------------------------------------
// Completion banner persistence
// ---------------------------------------------------------------------------

test.describe('Completion banner', () => {
    test('banner persists after page reload', async ({ page, apiRequest }) => {
        await reachDashboard(page, apiRequest);
        await page.getByRole('button', { name: 'Complete today\'s log' }).click();
        await page.getByRole('button', { name: 'Mood: Okay' }).click();
        await expect(page.getByText('DAY LOGGED. VAULT SECURE.')).toBeVisible();

        await page.reload();

        await expect(page.getByText('DAY LOGGED. VAULT SECURE.')).toBeVisible();
        await expect(
            page.getByRole('button', { name: 'Complete today\'s log' }),
        ).not.toBeVisible();
    });
});
