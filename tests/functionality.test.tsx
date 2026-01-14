
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
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

describe('IngestionPanel Functionality', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('correctly processes uploaded files and images', async () => {
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

    // Create mix of files
    // We need to patch the File object to have .text() method if it's missing in the environment
    const createFileWithText = (content: string, name: string, type: string) => {
        const file = new File([content], name, { type });
        if (!file.text) {
            file.text = async () => content;
        }
        return file;
    };

    const files = [
        createFileWithText('image content', 'image1.jpg', 'image/jpeg'),
        createFileWithText('text content', 'doc1.txt', 'text/plain'),
        createFileWithText('dicom content', 'scan.dcm', 'application/dicom')
    ];

    // Mock FileReader
    const originalFileReader = window.FileReader;
    window.FileReader = class MockFileReader {
      readAsDataURL(file: Blob) {
        setTimeout(() => {
           // @ts-ignore
           this.onload({ target: { result: 'base64-content' } });
        }, 10);
      }
    } as any;

    fireEvent.change(input, { target: { files } });

    await vi.waitFor(() => {
        expect(onUpdatePatient).toHaveBeenCalled();
    }, { timeout: 1000 });

    const calls = onUpdatePatient.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const updateArg = calls[0][0];

    // Verify images (jpg + dcm)
    expect(updateArg.images).toBeDefined();
    // image1.jpg and scan.dcm should be in images
    expect(updateArg.images).toHaveLength(2);
    const imageNames = updateArg.images.map((i: any) => i.name);
    expect(imageNames).toContain('image1.jpg');
    expect(imageNames).toContain('scan.dcm');

    // Verify files (txt)
    expect(updateArg.files).toBeDefined();
    expect(updateArg.files).toHaveLength(1);
    expect(updateArg.files[0].name).toBe('doc1.txt');
    expect(updateArg.files[0].content).toBe('text content');

    window.FileReader = originalFileReader;
  });
});
