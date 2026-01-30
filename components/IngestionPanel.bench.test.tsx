
import { render, screen, fireEvent, act } from '@testing-library/react';
import { IngestionPanel } from './IngestionPanel';
import { PatientData } from '../types';
import { expect, test, vi } from 'vitest';
import React from 'react';

const mockPatient: PatientData = {
  id: 'test-1',
  codeName: 'Test Patient',
  age: 30,
  gender: 'Female',
  status: 'Staging',
  location: { birth: 'A', current: 'B' },
  notes: '',
  files: [],
  audioRecordings: [],
  images: [],
  rawMetrics: [],
};

test('IngestionPanel performance benchmark', () => {
  vi.useFakeTimers();
  const onUpdatePatient = vi.fn();
  const onAnalyze = vi.fn();

  render(
    <IngestionPanel
      patient={mockPatient}
      onUpdatePatient={onUpdatePatient}
      onAnalyze={onAnalyze}
      isAnalyzing={false}
    />
  );

  const textarea = screen.getByPlaceholderText(/Inject clinical observations/i);

  // Simulate typing "Hello" rapidly
  // We fire change events directly.
  fireEvent.change(textarea, { target: { value: 'H' } });
  fireEvent.change(textarea, { target: { value: 'He' } });
  fireEvent.change(textarea, { target: { value: 'Hel' } });
  fireEvent.change(textarea, { target: { value: 'Hell' } });
  fireEvent.change(textarea, { target: { value: 'Hello' } });

  // Should not have called update yet (debounce 500ms)
  expect(onUpdatePatient).toHaveBeenCalledTimes(0);

  // Advance time by 500ms to trigger debounce
  act(() => {
    vi.advanceTimersByTime(500);
  });

  // Now it should be called ONCE with the final value
  expect(onUpdatePatient).toHaveBeenCalledTimes(1);
  expect(onUpdatePatient).toHaveBeenCalledWith({ notes: 'Hello' });

  vi.useRealTimers();
});
