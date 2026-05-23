import { GoogleGenAI, Type } from "@google/genai";
import { PatientData, AnalysisResult, PerformanceResult } from "../types.ts";

// Model constants as per latest guidelines
const ANALYSIS_MODEL = "gemini-3-pro-preview";
const TRANSCRIPTION_MODEL = "gemini-3-flash-preview"; 

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is not configured.");
  }
  return new GoogleGenAI({ apiKey });
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    const ai = getAIClient();
    const base64Data = await blobToBase64(audioBlob);
    
    const response = await ai.models.generateContent({
      model: TRANSCRIPTION_MODEL,
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: audioBlob.type || "audio/webm",
                data: base64Data
              }
            },
            { text: "ROLE: Precision Medical Scribe. TASK: Transcribe this audio exactly. Correct spelling for pharmaceutical peptides like BPC-157, TB-500, and clinical biomarkers." }
          ]
        }
      ]
    });

    return response.text || "Transcription unavailable.";
  } catch (error) {
    console.error("Transcription failed:", error);
    throw error;
  }
};

export const analyzePatientData = async (patient: PatientData): Promise<AnalysisResult> => {
  try {
    const ai = getAIClient();
    const parts: any[] = [];

    let promptText = `
      ROLE: World-Class Functional Medicine Doctor and Strategist.
      TASK: Synthesize the following patient data into a comprehensive, user-friendly, root-cause analysis medical report. 
      Ensure proper OCR and extraction from ALL provided documents without limitation. Use the data to drastically improve the recommendations.
      RED FLAG any missing markers or labs that are required for further comprehensive investigation and better decision making.
      Provide a 3-phase Optimization Roadmap (Phase 1, Phase 2, Phase 3) tailored to this patient's specific needs.
      PATIENT PROFILE: ${patient.codeName}, ${patient.age}y ${patient.gender}.
      WEARABLE METRICS: ${JSON.stringify(patient.rawMetrics)}
      CLINICAL NOTES: ${patient.notes}
    `;

    if (patient.audioRecordings.length > 0) {
      promptText += "\nTRANSCRIPTIONS:\n" + patient.audioRecordings.map(r => r.transcription).join("\n");
    }

    parts.push({ text: promptText });

    const getBase64Data = (base64: string): Promise<string> => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(base64.split(',')[1] || base64);
        }, 0);
      });
    };

    // Include multimodal imagery
    for (const img of patient.images) {
      const base64Data = await getBase64Data(img.base64);
      parts.push({ 
        inlineData: { 
          mimeType: img.mimeType || 'image/jpeg', 
          data: base64Data 
        } 
      });
      parts.push({ text: `Analyze patient imaging asset: ${img.name}` });
    }

    // Include document OCR/data extraction
    for (const f of patient.files) {
      if (f.base64) {
        const base64Data = f.base64.split(',')[1] || f.base64;
        parts.push({ 
          inlineData: { 
             mimeType: f.type || 'application/pdf', 
             data: base64Data 
          } 
        });
        parts.push({ text: `Extract all medical data and perform OCR from this document: ${f.name}` });
      } else if (f.content) {
        parts.push({ text: `Content from document ${f.name}: ${f.content}` });
      }
    }

    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: [{ parts: parts }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rootCause: { type: Type.ARRAY, items: { type: Type.STRING } },
            brainPowerScore: { type: Type.NUMBER },
            longevityScore: { type: Type.NUMBER },
            imagingFindings: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingLabs: { type: Type.ARRAY, items: { type: Type.STRING } },
            discoveryQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            nutrientDepletions: { type: Type.ARRAY, items: { type: Type.STRING } },
            therapeuticSynergies: { type: Type.ARRAY, items: { type: Type.STRING } },
            lifestyleRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            peptideProtocol: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  dosage: { type: Type.STRING },
                  mechanism: { type: Type.STRING },
                  expectedOutcome: { type: Type.STRING }
                },
                required: ["name", "dosage", "mechanism"]
              }
            },
            labOrders: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  testName: { type: Type.STRING },
                  cptCode: { type: Type.STRING },
                  reason: { type: Type.STRING }
                }
              }
            },
            optimizationRoadmap: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  phase: { type: Type.STRING, description: "Phase 1, Phase 2, or Phase 3" },
                  title: { type: Type.STRING, description: "e.g. Stabilization, Detoxification" },
                  description: { type: Type.STRING }
                },
                required: ["phase", "title", "description"]
              }
            },
            summary: { type: Type.STRING },
            disclaimer: { type: Type.STRING }
          },
          required: ["rootCause", "summary", "brainPowerScore", "optimizationRoadmap"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return parsed as AnalysisResult;
  } catch (error) {
    console.error("Engine Reasoning Error:", error);
    throw error;
  }
};

export const askAIChat = async (patient: PatientData, question: string): Promise<string> => {
  try {
    const ai = getAIClient();
    const parts: any[] = [];

    parts.push({ text: `
      ROLE: Clinical Assistant AI.
      TASK: Answer the practitioner's question based strictly on the patient data provided.
      PATIENT PROFILE: ${patient.codeName}, ${patient.age}y ${patient.gender}.
      WEARABLE METRICS: ${JSON.stringify(patient.rawMetrics)}
      CLINICAL NOTES: ${patient.notes}
      QUESTION: ${question}
    ` });

    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: [{ parts }],
    });

    return response.text || "No insights found.";
  } catch (err) {
    console.error("AI Chat Error:", err);
    throw new Error("Unable to query AI. Check API Key or connection.");
  }
};

export const generatePerformanceReport = async (patient: PatientData): Promise<PerformanceResult> => {
  try {
    const ai = getAIClient();
    const parts: any[] = [];

    let promptText = `
      ROLE: Elite Performance Coach and Exercise Physiologist.
      TASK: Analyze the athlete's wearable data, workout history, and recovery metrics to generate a personalized training plan and coaching report.
      Extract ALL data from provided screenshots, CSVs, and documents using OCR.
      PATIENT PROFILE: ${patient.codeName}, ${patient.age}y ${patient.gender}.
      LOCATION: ${patient.location.current}.
      WEARABLE METRICS: ${JSON.stringify(patient.rawMetrics)}
      CLINICAL NOTES: ${patient.notes}
    `;

    parts.push({ text: promptText });

    // Include uploaded images (screenshots from Whoop, Garmin, Strava)
    for (const img of patient.images) {
      const base64Data = img.base64.split(',')[1] || img.base64;
      parts.push({
        inlineData: {
          mimeType: img.mimeType || 'image/jpeg',
          data: base64Data
        }
      });
      parts.push({ text: `Extract all training, recovery, and biometric data from this screenshot/document: ${img.name}` });
    }

    // Include files
    for (const f of patient.files) {
      if (f.base64) {
        const base64Data = f.base64.split(',')[1] || f.base64;
        parts.push({
          inlineData: {
            mimeType: f.type || 'text/plain',
            data: base64Data
          }
        });
        parts.push({ text: `Parse all workout and recovery data from this file: ${f.name}` });
      } else if (f.content) {
        parts.push({ text: `Content from file ${f.name}: ${f.content}` });
      }
    }

    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: [{ parts: parts }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            athleteProfile: {
              type: Type.OBJECT,
              properties: {
                currentFitness: { type: Type.STRING },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                injuryRisk: { type: Type.STRING, enum: ["low", "medium", "high"] }
              },
              required: ["currentFitness", "strengths", "weaknesses", "injuryRisk"]
            },
            trainingZones: {
              type: Type.OBJECT,
              properties: {
                zone1: { type: Type.STRING },
                zone2: { type: Type.STRING },
                zone3: { type: Type.STRING },
                zone4: { type: Type.STRING },
                zone5: { type: Type.STRING }
              },
              required: ["zone1", "zone2", "zone3", "zone4", "zone5"]
            },
            weeklyPlan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING },
                  focus: { type: Type.STRING },
                  workout: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  intensity: { type: Type.STRING, enum: ["easy", "moderate", "hard"] }
                },
                required: ["day", "focus", "workout", "duration", "intensity"]
              }
            },
            keyMetrics: {
              type: Type.OBJECT,
              properties: {
                vo2max: { type: Type.NUMBER },
                threshold: { type: Type.STRING },
                fatigueLevel: { type: Type.NUMBER },
                form: { type: Type.NUMBER },
                fitness: { type: Type.NUMBER }
              },
              required: ["fatigueLevel", "form", "fitness"]
            },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            recoveryProtocol: { type: Type.ARRAY, items: { type: Type.STRING } },
            nutritionTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING },
            disclaimer: { type: Type.STRING }
          },
          required: ["athleteProfile", "trainingZones", "weeklyPlan", "keyMetrics", "summary", "disclaimer"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    return parsed as PerformanceResult;
  } catch (error) {
    console.error("Performance Engine Error:", error);
    throw error;
  }
};

export const askPerformanceAI = async (patient: PatientData, question: string): Promise<string> => {
  try {
    const ai = getAIClient();
    const parts: any[] = [];

    parts.push({ text: `
      ROLE: Elite Performance Coach AI.
      TASK: Answer the athlete's/coach's question based strictly on the patient data and performance analysis provided.
      PATIENT PROFILE: ${patient.codeName}, ${patient.age}y ${patient.gender}.
      WEARABLE METRICS: ${JSON.stringify(patient.rawMetrics)}
      PERFORMANCE DATA: ${patient.performanceResult ? JSON.stringify(patient.performanceResult) : 'No performance report yet.'}
      QUESTION: ${question}
    ` });

    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: [{ parts }],
    });

    return response.text || "No insights found.";
  } catch (err) {
    console.error("Performance AI Chat Error:", err);
    throw new Error("Unable to query AI. Check API Key or connection.");
  }
};