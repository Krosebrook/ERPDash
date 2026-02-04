
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";

const apiKey = process.env.API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export type DeliverableType = 'report' | 'code' | 'presentation' | 'data_model';

/**
 * Generates high-fidelity professional deliverables in specific formats.
 */
export const generateStudioDeliverable = async (type: DeliverableType, prompt: string) => {
  const model = type === 'code' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  const systemInstructions: Record<DeliverableType, string> = {
    report: "You are a Principal Management Consultant. Create a high-fidelity, structured executive report with clear headings, data-driven conclusions, and strategic recommendations.",
    code: "You are a Senior Staff Engineer. Provide production-ready, clean, documented code following SOLID principles and enterprise design patterns.",
    presentation: "You are a Head of Design. Provide a structured slide-by-slide outline including visual layout suggestions, key speaking points, and high-impact headlines.",
    data_model: "You are a Lead Data Architect. Provide a comprehensive schema or data model description including relationships, constraints, and optimization strategies."
  };

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      systemInstruction: systemInstructions[type],
      temperature: 0.2, // Low temperature for high consistency and fidelity
      thinkingConfig: { thinkingBudget: type === 'report' ? 8000 : 0 }
    }
  });
  return response.text;
};

/**
 * Explores multiple variations of a concept for client review.
 */
export const exploreConceptVariations = async (concept: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Explore 3 distinct variations of the following enterprise concept. 
    Focus on: 1. Aggressive Growth/Scale, 2. Risk Mitigation/Security, 3. Operational Efficiency.
    Concept: ${concept}`,
    config: {
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
  return JSON.parse(response.text);
};

export const analyzeMetrics = async (metrics: any) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze these EPB agent metrics and provide a high-fidelity executive summary with actionable insights and potential risks. 
    Metrics: ${JSON.stringify(metrics)}`,
    config: {
      thinkingConfig: { thinkingBudget: 4000 }
    }
  });
  return response.text;
};

export const getComplianceUpdate = async () => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: "Summarize the latest 2024-2025 updates regarding the EU AI Act and NIST AI RMF 2.0 relevant for enterprise LLM deployments.",
    config: {
      tools: [{ googleSearch: {} }]
    }
  });
  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const speakReport = async (text: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Professional corporate update: ${text}` }] }],
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

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const audioBytes = decodeBase64(base64Audio);
  const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start();
  return source;
};

// Utils for Audio
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
