import { GoogleGenAI, Type, Modality } from "@google/genai";

const getAI = () => {
  const key = process.env.API_KEY;
  if (!key) {
    throw new Error("API Key is missing. Please configure process.env.API_KEY.");
  }
  return new GoogleGenAI({ apiKey: key });
};

/**
 * Helper to strip Markdown code blocks (```json ... ```) from LLM responses 
 * before parsing, ensuring robust JSON handling.
 */
const cleanAndParseJson = (text: string) => {
  try {
    // Remove markdown code block delimiters if present
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse JSON from Gemini response:", text);
    throw new Error("Invalid JSON format received from model.");
  }
};

// Logging Wrapper
const withLogging = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = (performance.now() - start).toFixed(0);
    console.log(`[Gemini Service] ${name} - Success (${duration}ms)`);
    return result;
  } catch (error) {
    const duration = (performance.now() - start).toFixed(0);
    console.error(`[Gemini Service] ${name} - Failed (${duration}ms)`, error);
    throw error;
  }
};

export type DeliverableType = 'report' | 'code' | 'presentation' | 'data_model';

export const generateStudioDeliverable = async (type: DeliverableType, prompt: string) => {
  return withLogging('generateStudioDeliverable', async () => {
    const ai = getAI();
    // Upgrade: Use Pro for all Studio deliverables for maximum fidelity
    const model = 'gemini-3-pro-preview';
    
    const systemInstructions: Record<DeliverableType, string> = {
      report: "You are a Principal Management Consultant. Create a high-fidelity, structured executive report with clear headings, data-driven conclusions, and strategic recommendations.",
      code: "You are a Senior Staff Engineer. Provide production-ready, clean, documented code following SOLID principles and enterprise design patterns. Do not wrap in markdown code blocks unless necessary for segments.",
      presentation: "You are a Head of Design. Provide a structured slide-by-slide outline including visual layout suggestions, key speaking points, and high-impact headlines.",
      data_model: "You are a Lead Data Architect. Provide a comprehensive schema or data model description including relationships, constraints, and optimization strategies."
    };

    // Upgrade: Adaptive thinking budgets based on task complexity
    const thinkingBudgets: Record<DeliverableType, number> = {
      report: 8192,      // Deep research & reasoning
      code: 4096,        // Logic & Architecture
      data_model: 4096,  // Relationships & Normalization
      presentation: 2048 // Structure & Flow
    };

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstructions[type],
        temperature: 0.2, // Lower temperature for higher fidelity and adherence
        thinkingConfig: { thinkingBudget: thinkingBudgets[type] }
      }
    });
    
    // Fallback if text is undefined (rare but possible with aggressive safety filters)
    return response.text || "Generation failed: Content filtered or empty.";
  });
};

export const exploreConceptVariations = async (concept: string) => {
  return withLogging('exploreConceptVariations', async () => {
    const ai = getAI();
    // Upgrade: Switch to Pro + Thinking for deeper strategic variations
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Explore 3 distinct variations of the following enterprise concept. 
      Focus on: 1. Aggressive Growth/Scale, 2. Risk Mitigation/Security, 3. Operational Efficiency.
      Concept: ${concept}`,
      config: {
        thinkingConfig: { thinkingBudget: 4096 }, // Enable reasoning for strategic differentiation
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              variantName: { type: Type.STRING },
              strategicFocus: { type: Type.STRING },
              pros: { type: Type.ARRAY, items: { type: Type.STRING } },
              cons: { type: Type.ARRAY, items: { type: Type.STRING } },
              implementationTimeline: { type: Type.STRING }
            },
            required: ["variantName", "strategicFocus", "pros", "cons"]
          }
        }
      }
    });

    if (!response.text) throw new Error("No content generated.");
    return cleanAndParseJson(response.text);
  });
};

export const analyzeMetrics = async (metrics: any) => {
  return withLogging('analyzeMetrics', async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyze these EPB agent metrics and provide a high-fidelity executive summary with actionable insights and potential risks. 
      Metrics: ${JSON.stringify(metrics)}`,
      config: {
        // High thinking budget for analytical depth
        thinkingConfig: { thinkingBudget: 4000 } 
      }
    });
    return response.text || "Analysis unavailable.";
  });
};

export const getComplianceUpdate = async () => {
  return withLogging('getComplianceUpdate', async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: "Summarize the latest 2024-2025 updates regarding the EU AI Act and NIST AI RMF 2.0 relevant for enterprise LLM deployments.",
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    return {
      text: response.text || "No compliance data retrieved.",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  });
};

export const speakReport = async (text: string) => {
  return withLogging('speakReport', async () => {
    const ai = getAI();
    // Use a truncated version of text if it's too long to prevent timeouts, 
    // or rely on the model to summarize it for speech.
    const speechPrompt = `Professional corporate update summary: ${text.slice(0, 1000)}...`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: speechPrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    // Use browser native AudioContext for decoding
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioBytes = decodeBase64(base64Audio);
    const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
    
    return { audioBuffer, audioContext };
  });
};

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}