import { GoogleGenAI, Type } from "@google/genai";
import { PatientData, AnalysisResult } from "../types.ts";

// Model constants as per latest guidelines
const ANALYSIS_MODEL = "gemini-3-pro-preview";
const TRANSCRIPTION_MODEL = "gemini-3-flash-preview"; 

let aiClientInstance: GoogleGenAI | null = null;

const getAIClient = () => {
  if (aiClientInstance) {
    return aiClientInstance;
  }
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is not configured.");
  }
  aiClientInstance = new GoogleGenAI({ apiKey });
  return aiClientInstance;
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
      ROLE: World-Class Functional Medicine Strategist.
      TASK: Synthesize the following patient data into a root-cause analysis report.
      PATIENT PROFILE: ${patient.codeName}, ${patient.age}y ${patient.gender}.
      WEARABLE METRICS: ${JSON.stringify(patient.rawMetrics)}
      CLINICAL NOTES: ${patient.notes}
    `;

    if (patient.audioRecordings.length > 0) {
      promptText += "\nTRANSCRIPTIONS:\n" + patient.audioRecordings.map(r => r.transcription).join("\n");
    }

    parts.push({ text: promptText });

    // Include multimodal imagery
    for (const img of patient.images) {
      const base64Data = img.base64.split(',')[1] || img.base64; 
      parts.push({ 
        inlineData: { 
          mimeType: img.mimeType || 'image/jpeg', 
          data: base64Data 
        } 
      });
      parts.push({ text: `Analyze patient imaging asset: ${img.name}` });
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
            summary: { type: Type.STRING },
            disclaimer: { type: Type.STRING }
          },
          required: ["rootCause", "summary", "brainPowerScore"]
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