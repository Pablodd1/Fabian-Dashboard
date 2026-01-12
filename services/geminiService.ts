import { GoogleGenAI, Type } from "@google/genai";
import { PatientData, AnalysisResult } from "../types";

// Using the latest Pro model for complex reasoning and high-fidelity vision tasks
const ANALYSIS_MODEL = "gemini-3-pro-preview";
const TRANSCRIPTION_MODEL = "gemini-3-flash-preview"; 

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    const base64Data = await blobToBase64(audioBlob);
    
    const response = await genAI.models.generateContent({
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
    const parts: any[] = [];

    // 1. Construct the System/Context Prompt with Elite Clinical Radiologist & Functional MD Persona
    let promptText = `
      ROLE: You are an Elite Functional Medicine Physician, Clinical Radiologist, and Pharmacologist.
      Your analytical capabilities match the top 0.1% of clinicians globally, specializing in pattern recognition across disparate data types.

      TASK: Perform a "Multimodal Correlative Root Cause Analysis".
      
      PATIENT CONTEXT:
      ID: ${patient.codeName} | Age: ${patient.age} | Gender: ${patient.gender}
      Environmental Context: Birth in ${patient.location.birth}, currently residing in ${patient.location.current}.

      CRITICAL ANALYSIS GUIDELINES:
      
      1. **Inter-modal Correlation (Connect the Dots)**: 
         - DO NOT analyze data in silos. 
         - If an image shows inflammation, look for mentions of pain in the audio transcripts.
         - If a metric (e.g., HRV) is low, look for physiological stressors in the imaging or clinical notes.
         - Explicitly state the evidence-based link between modality A (Imaging) and modality B (Symptoms/Metrics).
      
      2. **Advanced Radiological Deduction**: 
         - Analyze any attached images with forensic precision.
         - Describe findings using formal medical nomenclature (e.g., "hyperechoic foci," "cortical thinning," "T2 hyperintensity").
         - Correlate these specific visual findings with the patient's reported clinical presentation.
      
      3. **Mechanistic Root Cause Analysis**: 
         - Go beyond symptoms. Identify the cellular or metabolic failure (e.g., mitochondrial dysfunction, HPA-axis dysregulation, oxidative stress).
         - Reference specific biomarkers from the provided metrics to support your theory.
      
      4. **Evidence-Based Protocols**:
         - Suggest interventions (Peptides, Nootropics, Lifestyle) that specifically address the identified mechanistic failures.
         - Use precise dosages and explain the biochemical mechanism of action (MOA).

      OUTPUT FORMAT (Strict JSON):
      {
        "rootCause": ["Evidence-linked primary drivers"],
        "brainPowerScore": number (0-100),
        "longevityScore": number (0-100),
        "imagingFindings": ["Findings mapped to clinical context: 'Finding X suggests Y in context of symptom Z'"],
        "missingLabs": ["Specific tests to confirm cross-modal hypotheses"],
        "discoveryQuestions": ["Targeted questions to resolve data conflicts between modalities"],
        "nutrientDepletions": ["Specific deficiencies supported by the clinical profile"],
        "therapeuticSynergies": ["Positive physiological interactions observed"],
        "lifestyleRecommendations": ["Bio-individual interventions"],
        "peptideProtocol": [
           {
             "name": "Compound", 
             "dosage": "Precise dosage", 
             "mechanism": "Link back to identified root cause",
             "expectedOutcome": "Clinical delta"
           }
        ],
        "labOrders": [
           {"testName": "Panel", "cptCode": "CPT", "reason": "Specific rationale linked to current data gaps"}
        ],
        "summary": "Unified Clinical Narrative: An integrated explanation of how the visual evidence, quantitative metrics, and verbal reports combine into a single physiological state.",
        "disclaimer": "Standard Medical Disclaimer."
      }
      
      RAW DATA:
      ${patient.rawMetrics.map(m => `${m.source}: ${m.key} = ${m.value}`).join('\n')}

      NOTES:
      ${patient.notes}
    `;

    // 2. Add Audio Transcriptions
    if (patient.audioRecordings.length > 0) {
      promptText += "\n\nAUDIO CONSULTATION EVIDENCE:\n";
      for (const audio of patient.audioRecordings) {
        if (audio.transcription) {
          promptText += `[Recording ${audio.id}]: ${audio.transcription}\n`;
        }
      }
    }

    parts.push({ text: promptText });

    // 3. Add Imaging Data (Multimodal)
    for (const img of patient.images) {
      const base64Data = img.base64.split(',')[1]; 
      parts.push({
        inlineData: {
          mimeType: img.mimeType,
          data: base64Data
        }
      });
      parts.push({ text: `Analyze the image named "${img.name}" as a clinical diagnostic asset. Look for specific visual markers that explain the patient's metrics or symptoms.` });
    }

    // 4. Add Files
    for (const file of patient.files) {
      parts.push({ text: `\nSUPPLEMENTAL DOCUMENT: ${file.name}\n${file.content}\n` });
    }

    const response = await genAI.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: {
        parts: parts
      },
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
