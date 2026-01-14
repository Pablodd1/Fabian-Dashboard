
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IngestionPanel } from '../components/IngestionPanel';
import React from 'react';

// Mock types
type PatientData = {
  id: string;
  codeName: string;
  notes: string;
  files: any[];
  images: any[];
  audioRecordings: any[];
};

const mockPatient: PatientData = {
  id: '123',
  codeName: 'TEST_PATIENT',
  notes: '',
  files: [],
  images: [],
  audioRecordings: []
};

// Mock dependencies
vi.mock('../services/geminiService', () => ({
  transcribeAudio: vi.fn(),
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');

describe('IngestionPanel Performance', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('measures file upload performance', async () => {
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

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    // Create multiple mock files
    const files = Array.from({ length: 5 }, (_, i) =>
      new File(['test content'], `image${i}.jpg`, { type: 'image/jpeg' })
    );

    // Mock FileReader with delay
    const originalFileReader = window.FileReader;
    window.FileReader = class MockFileReader {
      readAsDataURL(file: Blob) {
        setTimeout(() => {
          // @ts-ignore
          this.onload({ target: { result: 'base64-content' } });
        }, 50); // 50ms delay per file
      }
    } as any;

    const startTime = performance.now();

    // Trigger change event
    fireEvent.change(input, { target: { files } });

    // Wait for the update to happen
    // Since handleFileUpload is async, we need to wait.
    // However, the component doesn't expose a promise we can await.
    // We can rely on onUpdatePatient being called.

    await vi.waitFor(() => {
        expect(onUpdatePatient).toHaveBeenCalled();
    }, { timeout: 1000 });

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`Upload duration: ${duration.toFixed(2)}ms`);

    // With 5 files * 50ms delay:
    // Serial: ~250ms
    // Parallel: ~50ms

    // Restore FileReader
    window.FileReader = originalFileReader;
  });
});
