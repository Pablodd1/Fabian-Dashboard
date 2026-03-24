
export enum AppView {
  PATIENT_LIST = 'PATIENT_LIST',
  INGESTION = 'INGESTION',
  ANALYSIS = 'ANALYSIS',
  SETTINGS = 'SETTINGS'
}

export interface PatientData {
  id: string;
  codeName: string;
  age: number;
  gender: string;
  status: 'Staging' | 'Analyzing' | 'Complete';
  notes: string;
  files: FileRecord[];
  audioRecordings: AudioRecord[];
  images: ImageRecord[];
  rawMetrics: MetricRecord[];
  location: {
    birth: string;
    current: string;
  };
  analysisResult?: AnalysisResult | null; // Persist analysis per patient
  chatHistory?: ChatMessage[];
}

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

export interface FileRecord {
  id: string;
  name: string;
  type: string;
  content: string; 
  base64?: string;
}

export interface AudioRecord {
  id: string;
  blob: Blob;
  url: string;
  transcription?: string;
}

export interface ImageRecord {
  id: string;
  name: string;
  url: string;
  base64: string;
  mimeType: string;
}

export interface MetricRecord {
  source: 'Whoop' | 'Oura' | 'DNA' | 'Blood' | 'Manual';
  key: string;
  value: string | number;
}

export interface AnalysisResult {
  rootCause: string[];
  brainPowerScore: number;
  longevityScore: number;
  imagingFindings: string[];
  missingLabs: string[];
  discoveryQuestions: string[];
  nutrientDepletions: string[];
  therapeuticSynergies: string[];
  lifestyleRecommendations: string[];
  peptideProtocol: {
    name: string;
    dosage: string;
    mechanism: string;
    expectedOutcome: string;
  }[];
  labOrders: {
    testName: string;
    cptCode: string;
    reason: string;
  }[];
  disclaimer: string;
  summary: string;
}
