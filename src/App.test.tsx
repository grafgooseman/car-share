import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { adminSessionFixture, seededAppSettings } from './test/fixtures/appSettings';

const {
  clearLocalAdminSession,
  fetchPublicSettings,
  fetchAdminSession,
  subscribeToAuthChanges,
  signInAdmin,
  signUpAdmin,
  signOutAdmin,
  updateAppSettings,
} = vi.hoisted(() => ({
  clearLocalAdminSession: vi.fn(),
  fetchPublicSettings: vi.fn(),
  fetchAdminSession: vi.fn(),
  subscribeToAuthChanges: vi.fn(),
  signInAdmin: vi.fn(),
  signUpAdmin: vi.fn(),
  signOutAdmin: vi.fn(),
  updateAppSettings: vi.fn(),
}));

vi.mock('./lib/supabaseApi', () => ({
  clearLocalAdminSession,
  fetchPublicSettings,
  fetchAdminSession,
  subscribeToAuthChanges,
  signInAdmin,
  signUpAdmin,
  signOutAdmin,
  updateAppSettings,
}));

const createDeferred = <T,>() => {
  let resolve: (value: T) => void = () => undefined;
  let reject: (error?: unknown) => void = () => undefined;
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return { promise, resolve, reject };
};

describe('App', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    clearLocalAdminSession.mockResolvedValue(undefined);
    fetchPublicSettings.mockResolvedValue(seededAppSettings);
    fetchAdminSession.mockResolvedValue({ authEmail: null, adminUser: null });
    subscribeToAuthChanges.mockReturnValue(() => undefined);
    signInAdmin.mockResolvedValue(undefined);
    signUpAdmin.mockResolvedValue(undefined);
    signOutAdmin.mockResolvedValue(undefined);
    updateAppSettings.mockResolvedValue(seededAppSettings);
  });

  afterEach(() => {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    vi.clearAllMocks();
  });

  it('renders Supabase-backed settings and the live result', async () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 2, name: 'Trip details' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'How much each person owes' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'What this calculator uses' })).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Honda Civic Sedan 2012' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: 'Kilometers' })).toHaveValue(120);
    expect(screen.getByRole('spinbutton', { name: 'Days' })).toHaveValue(1);
    expect(screen.getByRole('combobox', { name: 'Persons in car' })).toHaveValue('3');
    expect(screen.getByText('What this calculator uses')).toBeInTheDocument();
    expect(screen.getByText('How much each person owes')).toBeInTheDocument();
  });

  it('renders the calculator shell immediately with loading skeletons', () => {
    const deferredSettings = createDeferred<typeof seededAppSettings>();
    fetchPublicSettings.mockReturnValue(deferredSettings.promise);
    fetchAdminSession.mockImplementation(() => new Promise(() => undefined));

    render(<App />);

    expect(screen.getByRole('heading', { level: 2, name: 'Trip details' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'How much each person owes' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'What this calculator uses' })).toBeInTheDocument();
    expect(
      screen.getByText('Waiting for calculator settings from Supabase before running the formula.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Trip settings are loading. You can fill inputs now; calculation will start when ready.'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('hero-skeleton-title')).toBeInTheDocument();
    expect(screen.getByTestId('result-skeleton')).toBeInTheDocument();
    expect(screen.getAllByTestId('constants-skeleton-grid')).not.toHaveLength(0);
    expect(screen.queryByText('Loading calculator settings')).not.toBeInTheDocument();
  });

  it('keeps edit access neutral while the initial admin session check is still pending', () => {
    fetchPublicSettings.mockImplementation(() => new Promise(() => undefined));
    fetchAdminSession.mockImplementation(() => new Promise(() => undefined));

    render(<App />);

    expect(screen.getByRole('button', { name: 'Edit constants' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Checking admin access...' })).not.toBeInTheDocument();
  });

  it('lets users type inputs before settings load and preserves them once settings resolve', async () => {
    const user = userEvent.setup();
    const deferredSettings = createDeferred<typeof seededAppSettings>();
    fetchPublicSettings.mockReturnValue(deferredSettings.promise);

    render(<App />);

    const kilometers = screen.getByRole('spinbutton', { name: 'Kilometers' });
    const days = screen.getByRole('spinbutton', { name: 'Days' });
    const persons = screen.getByRole('spinbutton', { name: 'Persons in car' });

    await user.type(kilometers, '180');
    await user.type(days, '2');
    await user.type(persons, '7');

    expect(kilometers).toHaveValue(180);
    expect(days).toHaveValue(2);
    expect(persons).toHaveValue(7);

    deferredSettings.resolve(seededAppSettings);

    await screen.findByRole('heading', { level: 1, name: 'Honda Civic Sedan 2012' });

    expect(screen.getByRole('spinbutton', { name: 'Kilometers' })).toHaveValue(180);
    expect(screen.getByRole('spinbutton', { name: 'Days' })).toHaveValue(2);
    expect(screen.getByRole('combobox', { name: 'Persons in car' })).toHaveValue('5');
  });

  it('keeps the register page accessible while settings are still loading', async () => {
    const deferredSettings = createDeferred<typeof seededAppSettings>();
    fetchPublicSettings.mockReturnValue(deferredSettings.promise);
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#admin-sign-up`);
    window.dispatchEvent(new HashChangeEvent('hashchange'));

    render(<App />);

    expect(await screen.findByRole('heading', { level: 1, name: 'Admin sign up' })).toBeInTheDocument();
  });

  it('updates the result when trip inputs change', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole('heading', { level: 1, name: 'Honda Civic Sedan 2012' });

    const kilometers = screen.getByRole('spinbutton', { name: 'Kilometers' });
    const days = screen.getByLabelText('Days');
    const persons = screen.getByRole('combobox', { name: 'Persons in car' });

    await user.clear(kilometers);
    await user.type(kilometers, '3333');
    await user.clear(days);
    await user.type(days, '222');
    await user.selectOptions(persons, '5');

    expect(screen.getByText('$415')).toBeInTheDocument();
  });

  it('shows a Supabase-backed explanation modal', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole('heading', { level: 1, name: 'Honda Civic Sedan 2012' });

    await user.click(screen.getByRole('button', { name: /gas \/ 100 km/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByText('Fuel consumption baseline taken from the car specification in the spreadsheet.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        '9.4 L / 100 km for the specific Civic and is the consumption figure used to derive fuel cost per kilometer.',
      ),
    ).toBeInTheDocument();
  });

  it('keeps non-admin users out of the editor', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole('heading', { level: 1, name: 'Honda Civic Sedan 2012' });

    await user.click(screen.getByRole('button', { name: /edit constants/i }));

    expect(screen.getByRole('heading', { level: 2, name: 'Admin sign in' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: 'Edit constants' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Admin sign up' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('redirects to the admin sign up page and submits the special password metadata', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole('heading', { level: 1, name: 'Honda Civic Sedan 2012' });

    await user.click(screen.getByRole('button', { name: /edit constants/i }));
    await user.click(screen.getByRole('button', { name: /admin sign up/i }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Admin sign up' })).toBeInTheDocument();
    expect(window.location.hash).toBe('#admin-sign-up');

    await user.type(screen.getByLabelText('Admin display name'), 'Stepan');
    await user.type(screen.getByLabelText('Registration email'), 'admin@example.com');
    await user.type(screen.getByLabelText('Registration password'), 'Strongpass123!');
    await user.type(screen.getByLabelText('Special password'), 'stepanjew');
    await user.click(screen.getByRole('button', { name: /create admin account/i }));

    await waitFor(() => {
      expect(signUpAdmin).toHaveBeenCalledWith({
        displayName: 'Stepan',
        email: 'admin@example.com',
        password: 'Strongpass123!',
        code: 'stepanjew',
      });
    });

    expect(
      await screen.findByText('Registration created. Confirm your email, then sign in as an admin.'),
    ).toBeInTheDocument();
    expect(window.location.hash).toBe('');
  });

  it('shows inline retry states when settings fail to load', async () => {
    const user = userEvent.setup();
    fetchPublicSettings.mockRejectedValue(new Error('Loading calculator settings timed out.'));

    render(<App />);

    expect(
      await screen.findByText(
        'Trip settings could not be loaded. The calculator shell stays visible, but live values are paused.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Calculator settings could not be loaded, so the live result is unavailable.')).toBeInTheDocument();
    expect(screen.getByText('Constants could not be loaded from Supabase.')).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Retry settings load' })[0]);

    expect(fetchPublicSettings).toHaveBeenCalledTimes(2);
  });

  it('renders the calculator even if the admin session lookup never resolves', async () => {
    fetchAdminSession.mockImplementation(() => new Promise(() => undefined));

    render(<App />);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Honda Civic Sedan 2012' }),
    ).toBeInTheDocument();
    expect(screen.getByText('What this calculator uses')).toBeInTheDocument();
  });

  it('keeps the admin sign up CTA visible for signed-in non-admin users', async () => {
    const user = userEvent.setup();
    fetchAdminSession.mockResolvedValue({
      authEmail: 'not-admin@example.com',
      adminUser: null,
    });

    render(<App />);

    await screen.findByRole('heading', { level: 1, name: 'Honda Civic Sedan 2012' });

    await user.click(screen.getByRole('button', { name: /edit constants/i }));

    expect(screen.getByRole('button', { name: 'Admin sign up' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
    expect(
      screen.getByText('Signed in as not-admin@example.com, but this account is not an active app admin.'),
    ).toBeInTheDocument();
  });

  it('lets signed-in admins update settings and refreshes the UI', async () => {
    const user = userEvent.setup();
    fetchAdminSession.mockResolvedValue(adminSessionFixture);
    updateAppSettings.mockResolvedValue(
      seededAppSettings.map((setting) =>
        setting.key === 'gasPricePerLiter'
          ? {
              ...setting,
              numericValue: 2.05,
              helpText: 'Updated gas price help text.',
            }
          : setting,
      ),
    );

    render(<App />);

    await screen.findByRole('heading', { level: 1, name: 'Honda Civic Sedan 2012' });

    await user.click(screen.getByRole('button', { name: /edit constants/i }));

    expect(await screen.findByRole('heading', { level: 2, name: 'Edit constants' })).toBeInTheDocument();
    expect(screen.getByText('Editing as Stepan')).toBeInTheDocument();

    const gasPriceValue = screen.getByLabelText('Gas price / L value');
    const gasPriceHelp = screen.getByLabelText('Gas price / L explanation');

    await user.clear(gasPriceValue);
    await user.type(gasPriceValue, '2.05');
    await user.clear(gasPriceHelp);
    await user.type(gasPriceHelp, 'Updated gas price help text.');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(updateAppSettings).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            key: 'gasPricePerLiter',
            numericValue: 2.05,
            helpText: 'Updated gas price help text.',
          }),
        ]),
      );
    });

    expect(await screen.findByText('$2.05')).toBeInTheDocument();
  });
});
