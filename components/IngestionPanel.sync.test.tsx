
/// <reference types="@testing-library/jest-dom" />
import { render, screen, fireEvent, act } from '@testing-library/react';
import { IngestionPanel } from './IngestionPanel';
import { PatientData } from '../types';
import { expect, test, vi } from 'vitest';
import React from 'react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

const mockPatient: PatientData = {
  id: 'test-1',
  codeName: 'Test Patient',
  age: 30,
  gender: 'Female',
  status: 'Staging',
  location: { birth: 'A', current: 'B' },
  notes: 'Initial Notes',
  files: [],
  audioRecordings: [],
  images: [],
  rawMetrics: [],
};

test('IngestionPanel sync logic', () => {
  vi.useFakeTimers();
  const onUpdatePatient = vi.fn();
  const onAnalyze = vi.fn();

  const { rerender } = render(
    <IngestionPanel
      patient={mockPatient}
      onUpdatePatient={onUpdatePatient}
      onAnalyze={onAnalyze}
      isAnalyzing={false}
    />
  );

  const textarea = screen.getByPlaceholderText(/Inject clinical observations/i);

  // 1. Verify Initial State
  expect(textarea).toHaveValue('Initial Notes');

  // 2. Simulate Local Type 'A'. Local: 'Initial Notes A'.
  fireEvent.change(textarea, { target: { value: 'Initial Notes A' } });

  // Advance timer to trigger debounce -> onUpdatePatient called with '...A'.
  act(() => {
    vi.advanceTimersByTime(500);
  });

  expect(onUpdatePatient).toHaveBeenLastCalledWith({ notes: 'Initial Notes A' });

  // 3. Simulate Local Type 'B'. Local: 'Initial Notes AB'.
  fireEvent.change(textarea, { target: { value: 'Initial Notes AB' } });
  expect(textarea).toHaveValue('Initial Notes AB');

  // 4. Simulate Echo: Parent updates props to 'Initial Notes A' (result of step 2).
  // This update should be IGNORED because it matches what we last emitted.
  const echoPatient = { ...mockPatient, notes: 'Initial Notes A' };
  rerender(
    <IngestionPanel
      patient={echoPatient}
      onUpdatePatient={onUpdatePatient}
      onAnalyze={onAnalyze}
      isAnalyzing={false}
    />
  );

  // Expect local value to REMAIN '...AB', NOT revert to '...A'.
  expect(textarea).toHaveValue('Initial Notes AB');

  // 5. Simulate External Update: Parent updates props to 'External Change'.
  // This update should be ACCEPTED because it differs from what we last emitted ('Initial Notes A' - wait, no).
  // Last emitted was 'Initial Notes A' (step 2).
  // But wait, step 3 typed 'AB' but debounce hasn't fired yet!
  // So lastEmittedValue ref is still 'Initial Notes A'.

  // If we send 'External Change', it differs from 'Initial Notes A'. So it accepts.
  // And it should cancel the pending debounce for 'AB'.

  const externalPatient = { ...mockPatient, notes: 'External Change' };
  rerender(
    <IngestionPanel
      patient={externalPatient}
      onUpdatePatient={onUpdatePatient}
      onAnalyze={onAnalyze}
      isAnalyzing={false}
    />
  );

  // Expect local value to UPDATE to 'External Change'.
  expect(textarea).toHaveValue('External Change');

  // 6. Verify pending debounce 'AB' is cancelled.
  // Advance timer.
  onUpdatePatient.mockClear();
  act(() => {
    vi.advanceTimersByTime(500);
  });

  // Should NOT be called with 'AB'.
  expect(onUpdatePatient).not.toHaveBeenCalled();

  vi.useRealTimers();
});
