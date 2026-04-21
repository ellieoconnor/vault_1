import path from 'node:path';
import { PactV4 } from '@pact-foundation/pact';

export const createPact = (overrides?: { consumer?: string; provider?: string }) =>
  new PactV4({
    dir: path.resolve(process.cwd(), 'pacts'),
    consumer: overrides?.consumer ?? 'vault-1-frontend',
    provider: overrides?.provider ?? 'vault-1-backend',
    logLevel: 'warn',
  });
