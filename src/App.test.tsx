import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('App', () => {
  it('renders the default constants and live result', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Honda Civic LX 4DR Sedan 2012' }),
    ).toBeInTheDocument();
    expect(screen.getByText('What this calculator uses')).toBeInTheDocument();
    expect(screen.getByText('How much each person owes')).toBeInTheDocument();
  });

  it('updates the result when trip inputs change', async () => {
    const user = userEvent.setup();
    render(<App />);

    const kilometers = screen.getByLabelText('Kilometers');
    const days = screen.getByLabelText('Days');
    const persons = screen.getByLabelText('Persons in car');

    await user.clear(kilometers);
    await user.type(kilometers, '3333');
    await user.clear(days);
    await user.type(days, '222');
    await user.clear(persons);
    await user.type(persons, '5');

    expect(screen.getByText('$415')).toBeInTheDocument();
  });

  it('shows an explanation modal and protects constant editing behind verification', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /gas cost \/ km/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/gasPricePerLiter × gasPer100Km ÷ 100/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /close modal/i }));

    await user.click(screen.getByRole('button', { name: /edit constants/i }));
    expect(screen.getByText('Please verify yourself')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Who are you'), 'Stepan');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: /^verify$/i }));

    expect(screen.getByText('Incorrect password.')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Password'));
    await user.type(screen.getByLabelText('Password'), 'test-password');
    await user.click(screen.getByRole('button', { name: /^verify$/i }));

    expect(screen.getByRole('heading', { level: 2, name: 'Edit constants' })).toBeInTheDocument();
    expect(screen.getByText('Editing as Stepan')).toBeInTheDocument();
  });
});
