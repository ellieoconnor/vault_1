/**
 * E2E: Authentication flows
 *
 * These tests exercise the login and register flows through the browser.
 * They rely on the frontend (Vite dev server) and backend (Express) both running.
 *
 * Run locally:
 *   npx playwright test tests/e2e/auth.spec.ts
 *
 * Note: Add data-testid attributes to LoginPage, RegisterPage, etc. for
 * more resilient selectors (e.g. data-testid="username-input").
 * Until then, tests use accessible role/label selectors.
 */

import { test, expect } from '../support/fixtures';

test.describe('Login', () => {
  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByPlaceholder('Username').fill('notarealuser');
    await page.getByPlaceholder('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Log In' }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('Invalid username or password');
  });

  test('redirects to dashboard after successful login', async ({ page, apiRequest }) => {
    // Register a user via API so we have known credentials
    const username = `test_${Date.now()}`;
    const password = 'TestPassword123!';

    await apiRequest({
      method: 'POST',
      path: '/api/auth/register',
      baseUrl: process.env.API_URL ?? 'http://localhost:3000',
      body: { username, email: `${username}@example.com`, password },
    });

    await page.goto('/login');
    await page.getByPlaceholder('Username').fill(username);
    await page.getByPlaceholder('Password').fill(password);
    await page.getByRole('button', { name: 'Log In' }).click();

    await expect(page).toHaveURL('/');
  });

  test('has link to register page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('link', { name: /register/i })).toBeVisible();
  });

  test('has link to forgot password page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('link', { name: /forgot/i })).toBeVisible();
  });
});

test.describe('Register', () => {
  test('creates account and redirects to dashboard', async ({ page }) => {
    const username = `test_${Date.now()}`;

    await page.goto('/register');
    await page.getByPlaceholder('Username').fill(username);
    await page.getByPlaceholder('Email').fill(`${username}@example.com`);
    await page.getByPlaceholder('Password').fill('TestPassword123!');
    await page.getByRole('button', { name: /register/i }).click();

    await expect(page).toHaveURL('/');
  });

  test('shows error when username is already taken', async ({ page, apiRequest }) => {
    const username = `taken_${Date.now()}`;
    await apiRequest({
      method: 'POST',
      path: '/api/auth/register',
      baseUrl: process.env.API_URL ?? 'http://localhost:3000',
      body: { username, password: 'TestPassword123!' },
    });

    await page.goto('/register');
    await page.getByPlaceholder('Username').fill(username);
    await page.getByPlaceholder('Password').fill('TestPassword123!');
    await page.getByRole('button', { name: /register/i }).click();

    await expect(page.getByRole('alert')).toContainText(/taken/i);
  });
});
