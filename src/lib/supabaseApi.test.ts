import { beforeEach, describe, expect, it, vi } from 'vitest';

const signUp = vi.fn();

vi.mock('./supabase', () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      signUp,
    },
  }),
}));

import { resolveAdminAuthRedirectUrl, signUpAdmin } from './supabaseApi';

describe('supabaseApi auth redirects', () => {
  beforeEach(() => {
    signUp.mockReset();
    signUp.mockResolvedValue({ error: null });
  });

  it('builds the production redirect from the app base path', () => {
    expect(resolveAdminAuthRedirectUrl({ baseUrl: '/car-share/' })).toBe(
      'https://grafgooseman.github.io/car-share/',
    );
  });

  it('prefers an explicit public site url when configured', () => {
    expect(
      resolveAdminAuthRedirectUrl({ siteUrl: 'https://example.com/custom-app' }),
    ).toBe('https://example.com/custom-app/');
  });

  it('passes the admin signup redirect to Supabase', async () => {
    await signUpAdmin({
      displayName: 'Stepan',
      email: 'admin@example.com',
      password: 'Strongpass123!',
      code: 'stepanjew',
    });

    expect(signUp).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'Strongpass123!',
      options: {
        emailRedirectTo: 'https://grafgooseman.github.io/car-share/',
        data: {
          signup_kind: 'admin',
          admin_signup_code: 'stepanjew',
          display_name: 'Stepan',
        },
      },
    });
  });
});
