import { fireEvent, render, screen } from '@testing-library/react';
import { preventScrollValueChange } from './input';

describe('preventScrollValueChange', () => {
  it('blurs a focused numeric input when the mouse wheel is used over it', () => {
    render(<input aria-label="Amount" type="number" defaultValue={12} onWheel={preventScrollValueChange} />);

    const input = screen.getByLabelText('Amount');

    input.focus();
    expect(input).toHaveFocus();

    fireEvent.wheel(input);

    expect(input).not.toHaveFocus();
    expect(input).toHaveValue(12);
  });

  it('blurs a focused select when the mouse wheel is used over it', () => {
    render(
      <select aria-label="Persons in car" defaultValue="3" onWheel={preventScrollValueChange}>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
      </select>,
    );

    const select = screen.getByLabelText('Persons in car');

    select.focus();
    expect(select).toHaveFocus();

    fireEvent.wheel(select);

    expect(select).not.toHaveFocus();
    expect(select).toHaveValue('3');
  });
});
