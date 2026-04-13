
export enum AppView {
  PATIENT_LIST = 'PATIENT_LIST',
  INGESTION = 'INGESTION',
  ANALYSIS = 'ANALYSIS',
  PERFORMANCE = 'PERFORMANCE',
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
  analysisResult?: AnalysisResult | null;
  performanceResult?: PerformanceResult | null;
  chatHistory?: ChatMessage[];
  performanceChatHistory?: ChatMessage[];
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
  optimizationRoadmap: {
    phase: string;
    title: string;
    description: string;
  }[];
  disclaimer: string;
  summary: string;
}

// Performance Coaching Types
export interface WorkoutData {
  id: string;
  date: string;
  type: 'run' | 'cycle' | 'swim' | 'strength' | 'hiit' | 'other';
  duration: number; // minutes
  distance?: number; // km
  calories?: number;
  avgHr?: number;
  maxHr?: number;
  notes: string;
}

export interface RecoveryMetrics {
  date: string;
  sleepScore?: number;
  hrv?: number;
  restingHr?: number;
  recoveryScore?: number;
  strain?: number;
}

export interface PerformanceResult {
  athleteProfile: {
    currentFitness: string;
    strengths: string[];
    weaknesses: string[];
    injuryRisk: 'low' | 'medium' | 'high';
  };
  trainingZones: {
    zone1: string;
    zone2: string;
    zone3: string;
    zone4: string;
    zone5: string;
  };
  weeklyPlan: {
    day: string;
    focus: string;
    workout: string;
    duration: string;
    intensity: 'easy' | 'moderate' | 'hard';
  }[];
  keyMetrics: {
    vo2max?: number;
    threshold?: string;
    fatigueLevel: number;
    form: number;
    fitness: number;
  };
  recommendations: string[];
  recoveryProtocol: string[];
  nutritionTips: string[];
  summary: string;
  disclaimer: string;
}
