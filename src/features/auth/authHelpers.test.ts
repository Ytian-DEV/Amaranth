import { friendlyAuthError, passwordProblem } from './authHelpers';

describe('auth helpers', () => {
  it('translates Supabase auth errors', () => {
    expect(friendlyAuthError(new Error('Invalid login credentials'))).toMatch(/don’t match/);
    expect(friendlyAuthError({ message: 'Email rate limit exceeded' })).toMatch(/Too many/);
  });

  it('validates new passwords', () => {
    expect(passwordProblem('short', 'short')).toMatch(/at least 8/);
    expect(passwordProblem('longenough', 'different1')).toMatch(/don’t match/);
    expect(passwordProblem('longenough', 'longenough')).toBeNull();
  });
});
