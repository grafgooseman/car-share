import type { WheelEvent } from 'react';

type ScrollMutableField = HTMLInputElement | HTMLSelectElement;

export const preventScrollValueChange = <T extends ScrollMutableField>(event: WheelEvent<T>) => {
  const field = event.currentTarget;

  if (document.activeElement !== field) {
    return;
  }

  event.preventDefault();
  field.blur();
};
