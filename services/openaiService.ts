import OpenAI from "openai";
import { PatientData, AnalysisResult } from "../types.ts";

const getAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not configured.");
  }
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });
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
    const openai = getAIClient();

    // OpenAI expects a File object. Convert Blob to File.
    const file = new File([audioBlob], "recording.webm", { type: audioBlob.type || "audio/webm" });

    const response = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      prompt: "Precision Medical Scribe. Transcribe exactly. Correct spelling for peptides like BPC-157, TB-500, and biomarkers."
    });

    return response.text || "Transcription unavailable.";
  } catch (error) {
    console.error("Transcription failed:", error);
    throw error;
  }
};

export const analyzePatientData = async (patient: PatientData): Promise<AnalysisResult> => {
  try {
    const openai = getAIClient();

    let promptText = `
      PATIENT PROFILE: ${patient.codeName}, ${patient.age}y ${patient.gender}.
      WEARABLE METRICS: ${JSON.stringify(patient.rawMetrics)}
      CLINICAL NOTES: ${patient.notes}
    `;

    if (patient.audioRecordings.length > 0) {
      promptText += "\nTRANSCRIPTIONS:\n" + patient.audioRecordings.map(r => r.transcription).join("\n");
    }

    const content: any[] = [
        { type: "text", text: promptText }
    ];

    // Include multimodal imagery
    for (const img of patient.images) {
      let base64Data = "";

      if (img.originalFile) {
        base64Data = await blobToBase64(img.originalFile);
      } else if (img.base64) {
        base64Data = img.base64.split(',')[1] || img.base64;
      }

      if (base64Data) {
        content.push({
            type: "image_url",
            image_url: {
                url: `data:${img.mimeType || 'image/jpeg'};base64,${base64Data}`
            }
        });
        content.push({ type: "text", text: `Analyze patient imaging asset: ${img.name}` });
      }
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `ROLE: World-Class Functional Medicine Strategist.
          TASK: Synthesize the patient data into a root-cause analysis report in JSON format.

          You MUST output valid JSON matching this schema:
          {
            "rootCause": ["string"],
            "brainPowerScore": number (0-100),
            "longevityScore": number (0-100),
            "imagingFindings": ["string"],
            "missingLabs": ["string"],
            "discoveryQuestions": ["string"],
            "nutrientDepletions": ["string"],
            "therapeuticSynergies": ["string"],
            "lifestyleRecommendations": ["string"],
            "peptideProtocol": [
              { "name": "string", "dosage": "string", "mechanism": "string", "expectedOutcome": "string" }
            ],
            "labOrders": [
              { "testName": "string", "cptCode": "string", "reason": "string" }
            ],
            "summary": "string",
            "disclaimer": "string"
          }`
        },
        {
          role: "user",
          content: content
        }
      ],
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(response.choices[0].message.content || "{}");
    return parsed as AnalysisResult;
  } catch (error) {
    console.error("Engine Reasoning Error:", error);
    throw error;
  }
};
