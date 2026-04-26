# Test Automation Summary

Generated: 2026-04-24
Branch: feat/2-1-task-2-create-config-route

## Generated Tests

### API Tests

- [x] `apps/backend/tests/api/users-config.test.ts` — GET + POST /api/users/config (12 tests, all passing)

### E2E Tests

- [ ] `tests/e2e/onboarding.spec.ts` — 3-step onboarding form (8 tests, not yet run — requires both servers running)

---

## API Test Coverage — `/api/users/config`

### GET /api/users/config

| Case                                      | Status |
| ----------------------------------------- | ------ |
| Unauthenticated → 401                     | ✅     |
| Authenticated, no config → 404            | ✅     |
| Authenticated, config exists → 200 + body | ✅     |

### POST /api/users/config

| Case                                                | Status |
| --------------------------------------------------- | ------ |
| Unauthenticated → 401                               | ✅     |
| Empty body → 400                                    | ✅     |
| Invalid measurementSystem → 400                     | ✅     |
| Age below minimum (13) → 400                        | ✅     |
| calorieTarget below 1200 → 400                      | ✅     |
| Valid metric payload (male) → 201 + computed fields | ✅     |
| Imperial lbs/ft-in → kg/cm conversion               | ✅     |
| Female BMR (-161 offset)                            | ✅     |
| Duplicate config (unique constraint) → 409          | ✅     |

**Computed field verification (metric, male, 70kg/175cm/30yo):**

- `calorieFloor` = BMR = 1649 ✅
- `calorieCeiling` = calorieTarget + 200 = 2200 ✅
- `proteinFloor` = round(150 × 0.8) = 120 ✅
- `stepsFloor` = round(10000 × 0.5) = 5000 ✅

---

## E2E Test Coverage — Onboarding Page

### Redirect behaviour

- [ ] New user (no config) redirected to `/onboarding` after login

### Step 1 — Biometrics

- [ ] Shows "Step 1 of 3" heading
- [ ] Validation errors on empty Next click
- [ ] Switches to imperial mode (shows lbs/ft/in labels)
- [ ] Advances to Step 2 with valid metric input

### Step 2 — Goal

- [ ] Shows lose/maintain/build options
- [ ] Back button returns to Step 1
- [ ] Advances to Step 3 after selecting goal

### Step 3 — Targets

- [ ] Pre-fills calorie target in Suggest mode
- [ ] Clears calorie target when switching to own-entry mode
- [ ] Submits and redirects to `/` on valid input

### Complete imperial flow

- [ ] Full form in imperial → redirects to `/`

---

## Issues Found During Test Generation

- **`prisma generate` had not been run** after the `UserConfig` model was added to the schema. The route was deployed with a stale generated client — `prisma.userConfig` was `undefined` at runtime. Fixed by running `npx prisma generate`.

---

## Next Steps

- Run E2E tests: `npx playwright test tests/e2e/onboarding.spec.ts` (requires dev servers)
- Add `npx prisma generate` as a post-migration step in the dev workflow / CI pipeline
- Story 2.7: add PATCH /api/users/config tests when that endpoint is built
