import type { ProviderStateInput } from './consumer-helpers';

export const userExists = (user: { email: string; username: string }): ProviderStateInput => ({
  name: 'A user exists with the given credentials',
  params: user,
});

export const userDoesNotExist = (): ProviderStateInput => ({
  name: 'No user exists with the given email',
  params: {},
});

export const passwordResetTokenExists = (data: { email: string; token: string }): ProviderStateInput => ({
  name: 'A valid password reset token exists',
  params: data,
});
