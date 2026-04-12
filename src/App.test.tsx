import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { adminSessionFixture, seededAppSettings } from './test/fixtures/appSettings';

const {
  fetchPublicSettings,
  fetchAdminSession,
  subscribeToAuthChanges,
  signInAdmin,
  signUpAdmin,
  signOutAdmin,
  updateAppSettings,
} = vi.hoisted(() => ({
  fetchPublicSettings: vi.fn(),
  fetchAdminSession: vi.fn(),
  subscribeToAuthChanges: vi.fn(),
  signInAdmin: vi.fn(),
  signUpAdmin: vi.fn(),
  signOutAdmin: vi.fn(),
  updateAppSettings: vi.fn(),
}));

vi.mock('./lib/supabaseApi', () => ({
  fetchPublicSettings,
  fetchAdminSession,
  subscribeToAuthChanges,
  signInAdmin,
  signUpAdmin,
  signOutAdmin,
  updateAppSettings,
}));

describe('App', () => {
  beforeEach(() => {
    fetchPublicSettings.mockResolvedValue(seededAppSettings);
    fetchAdminSession.mockResolvedValue({ authEmail: null, adminUser: null });
    subscribeToAuthChanges.mockReturnValue(() => undefined);
    signInAdmin.mockResolvedValue(undefined);
    signUpAdmin.mockResolvedValue(undefined);
    signOutAdmin.mockResolvedValue(undefined);
    updateAppSettings.mockResolvedValue(seededAppSettings);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders Supabase-backed settings and the live result', async () => {
    render(<App />);

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Honda Civic LX 4DR Sedan 2012' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: 'Kilometers' })).toHaveValue(120);
    expect(screen.getByRole('spinbutton', { name: 'Days' })).toHaveValue(1);
    expect(screen.getByRole('combobox', { name: 'Persons in car' })).toHaveValue('3');
    expect(screen.getByText('What this calculator uses')).toBeInTheDocument();
    expect(screen.getByText('How much each person owes')).toBeInTheDocument();
  });

  it('updates the result when trip inputs change', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole('heading', { level: 1, name: 'Honda Civic LX 4DR Sedan 2012' });

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

    await screen.findByRole('heading', { level: 1, name: 'Honda Civic LX 4DR Sedan 2012' });

    await user.click(screen.getByRole('button', { name: /gas \/ 100 km/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByText('Fuel consumption baseline taken from the car specification in the spreadsheet.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        '9.4 L / 100 km reflects the spreadsheet baseline for the specific Civic and is the consumption figure used to derive fuel cost per kilometer.',
      ),
    ).toBeInTheDocument();
  });

  it('keeps non-admin users out of the editor', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole('heading', { level: 1, name: 'Honda Civic LX 4DR Sedan 2012' });

    await user.click(screen.getByRole('button', { name: /edit constants/i }));

    expect(screen.getByRole('heading', { level: 2, name: 'Admin sign in' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: 'Edit constants' })).not.toBeInTheDocument();
  });

  it('submits admin registration with the special code metadata', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole('heading', { level: 1, name: 'Honda Civic LX 4DR Sedan 2012' });

    await user.click(screen.getByRole('button', { name: /edit constants/i }));
    await user.click(screen.getAllByRole('button', { name: /register as admin/i })[0]);

    await user.type(screen.getByLabelText('Admin display name'), 'Stepan');
    await user.type(screen.getByLabelText('Registration email'), 'admin@example.com');
    await user.type(screen.getByLabelText('Registration password'), 'Strongpass123!');
    await user.clear(screen.getByLabelText('Special code'));
    await user.type(screen.getByLabelText('Special code'), 'testcode');
    await user.click(screen.getByRole('button', { name: /create admin account/i }));

    await waitFor(() => {
      expect(signUpAdmin).toHaveBeenCalledWith({
        displayName: 'Stepan',
        email: 'admin@example.com',
        password: 'Strongpass123!',
        code: 'testcode',
      });
    });

    expect(
      await screen.findByText('Registration created. Confirm your email, then sign in as an admin.'),
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

    await screen.findByRole('heading', { level: 1, name: 'Honda Civic LX 4DR Sedan 2012' });

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
