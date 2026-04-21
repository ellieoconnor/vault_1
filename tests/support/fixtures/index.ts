import { mergeTests } from '@playwright/test';
import { test as apiRequestFixture } from '@seontechnologies/playwright-utils/api-request/fixtures';
import { test as authFixture } from '@seontechnologies/playwright-utils/auth-session/fixtures';
import { test as networkErrorFixture } from '@seontechnologies/playwright-utils/network-error-monitor/fixtures';
import { test as logFixture } from '@seontechnologies/playwright-utils/log/fixtures';
import { setAuthProvider } from '@seontechnologies/playwright-utils/auth-session';
import authProvider from '../helpers/auth-provider';

setAuthProvider(authProvider);

export const test = mergeTests(apiRequestFixture, authFixture, networkErrorFixture, logFixture);

export { expect } from '@playwright/test';
