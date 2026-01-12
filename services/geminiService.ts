import { GoogleGenAI, Type } from "@google/genai";
import { PatientData, AnalysisResult } from "../types";

// Using the recommended models
const ANALYSIS_MODEL = "gemini-3-pro-preview";
const TRANSCRIPTION_MODEL = "gemini-3-flash-preview"; 

// Helper to convert Blob to base64 for the API
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const base64Data = await blobToBase64(audioBlob);
    
    const response = await ai.models.generateContent({
      model: TRANSCRIPTION_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: audioBlob.type || "audio/webm",
              data: base64Data
            }
          },
          { text: "ROLE: Medical Transcriptionist. TASK: Transcribe this audio verbatim. Ensure correct spelling of all medications, supplements, and medical conditions. Do not add markdown or conversational text, just the transcript." }
        ]
      }
    });

    return response.text || "Transcription unavailable.";
  } catch (error) {
    console.error("Transcription failed:", error);
    throw new Error("Failed to transcribe audio.");
  }
};

export const analyzePatientData = async (patient: PatientData): Promise<AnalysisResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const parts: any[] = [];

    let promptText = `
      ROLE: You are an Elite Functional Medicine Physician, Clinical Radiologist, and Pharmacologist.
      TASK: Perform a "Multimodal Correlative Root Cause Analysis".
      
      PATIENT CONTEXT:
      ID: ${patient.codeName} | Age: ${patient.age} | Gender: ${patient.gender}
      Environmental Context: Birth in ${patient.location.birth}, currently residing in ${patient.location.current}.

      CRITICAL ANALYSIS GUIDELINES:
      1. Inter-modal Correlation: Connect imaging findings with reported symptoms and biometric metrics.
      2. Mechanistic Analysis: Identify cellular pathways (e.g. HPA-axis, mitochondrial) causing the issues.
      3. Precise Interventions: Suggest specific peptides, nutrients, and protocols.

      OUTPUT FORMAT (Strict JSON):
      {
        "rootCause": ["primary drivers"],
        "brainPowerScore": number,
        "longevityScore": number,
        "imagingFindings": ["clinical findings"],
        "missingLabs": ["recommended tests"],
        "discoveryQuestions": ["follow up questions"],
        "nutrientDepletions": ["deficiencies"],
        "therapeuticSynergies": ["synergistic effects"],
        "lifestyleRecommendations": ["hacks"],
        "peptideProtocol": [{"name": "", "dosage": "", "mechanism": "", "expectedOutcome": ""}],
        "labOrders": [{"testName": "", "cptCode": "", "reason": ""}],
        "summary": "Unified narrative",
        "disclaimer": "Standard disclaimer"
      }
      
      RAW DATA:
      ${patient.rawMetrics.map(m => `${m.source}: ${m.key} = ${m.value}`).join('\n')}
      NOTES: ${patient.notes}
    `;

    if (patient.audioRecordings.length > 0) {
      promptText += "\n\nAUDIO CONSULTATION EVIDENCE:\n";
      for (const audio of patient.audioRecordings) {
        if (audio.transcription) {
          promptText += `[Recording ${audio.id}]: ${audio.transcription}\n`;
        }
      }
    }

    parts.push({ text: promptText });

    for (const img of patient.images) {
      const base64Data = img.base64.split(',')[1]; 
      parts.push({
        inlineData: {
          mimeType: img.mimeType,
          data: base64Data
        }
      });
      parts.push({ text: `Analyze image "${img.name}" as a clinical diagnostic asset.` });
    }

    for (const file of patient.files) {
      parts.push({ text: `\nSUPPLEMENTAL DOCUMENT: ${file.name}\n${file.content}\n` });
    }

    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 32768 },
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
                }
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
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AnalysisResult;
    } else {
      throw new Error("No response from AI");
    }
  } catch (error) {
    console.error("Deep Analysis Error:", error);
    return {
      rootCause: ["Critical Analysis Failure"],
      brainPowerScore: 0,
      longevityScore: 0,
      imagingFindings: ["Imaging analysis failed during multimodal processing."],
      missingLabs: [],
      discoveryQuestions: [],
      nutrientDepletions: [],
      therapeuticSynergies: [],
      lifestyleRecommendations: [],
      peptideProtocol: [],
      labOrders: [],
      summary: "The analysis engine encountered a structural error. This may be due to image resolution or processing load.",
      disclaimer: "System Error."
    };
  }
};