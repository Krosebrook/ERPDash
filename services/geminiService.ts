import { GoogleGenAI, Type, Modality, FunctionDeclaration } from "@google/genai";
import { StrategicVariation, GroundingSource } from "../types";

// Define ChartConfig interface to be used by visualization components
export interface ChartConfig {
  title: string;
  type: 'bar' | 'line' | 'area' | 'pie';
  description: string;
  xAxisKey: string;
  dataKeys: string[];
  colors: string[];
  data: any[];
}

const getAI = () => {
  const key = process.env.API_KEY;
  if (!key) {
    throw new Error("API Key is missing. The application requires a valid API_KEY environment variable.");
  }
  return new GoogleGenAI({ apiKey: key });
};

const cleanAndParseJson = (text: string) => {
  try {
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    try {
        const start = text.indexOf('[');
        const end = text.lastIndexOf(']');
        if (start !== -1 && end !== -1) {
            return JSON.parse(text.substring(start, end + 1));
        }
        const startObj = text.indexOf('{');
        const endObj = text.lastIndexOf('}');
        if (startObj !== -1 && endObj !== -1) {
            return JSON.parse(text.substring(startObj, endObj + 1));
        }
    } catch (e2) { /* ignore */ }
    throw new Error("Invalid JSON format from model.");
  }
};

/**
 * Enhanced logging wrapper that tracks performance and token consumption.
 */
const withLogging = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = (performance.now() - start).toFixed(0);
    
    // Attempt to extract usage metadata if the result contains a Gemini response object
    let usageLog = "";
    const possibleResponse = (result as any)?._rawResponse || result;
    if (possibleResponse && typeof possibleResponse === 'object' && 'usageMetadata' in possibleResponse) {
      const usage = possibleResponse.usageMetadata;
      usageLog = ` | Tokens: ${usage.totalTokenCount} (P:${usage.promptTokenCount}/C:${usage.candidatesTokenCount})`;
    }

    console.log(`[Gemini SDK Telemetry] ${name} - SUCCESS (${duration}ms)${usageLog}`);
    return result;
  } catch (error) {
    console.error(`[Gemini SDK Telemetry] ${name} - FAILED`, error);
    throw error;
  }
};

export type DeliverableType = 'report' | 'code' | 'presentation' | 'data_model';

// --- CORE STUDIO FEATURES ---

export const generateStudioDeliverable = async (
    type: DeliverableType, 
    prompt: string, 
    includeImages: boolean = false,
    tone: string = 'Professional',
    imageSize: '1K' | '2K' | '4K' = '1K'
) => {
  return withLogging('generateStudioDeliverable', async () => {
    const ai = getAI();
    const model = 'gemini-3-pro-preview';
    
    const baseInstruction = `Tone: ${tone}. Focus on high-fidelity, production-grade output. Ground all claims in real-world data.`;
    
    const systemInstructions: Record<DeliverableType, string> = {
      report: `${baseInstruction} You are a Principal Strategy Consultant. Provide an exhaustive executive report with deep reasoning blocks. Use Google Search to ground news and trends.`,
      code: `${baseInstruction} You are a Senior Staff Engineer. Provide production-ready, highly optimized code and architectural designs with reasoning on selected patterns.`,
      presentation: `${baseInstruction} You are a Head of Design. Provide a slide-by-slide visual strategy and content outline for an executive pitch deck.`,
      data_model: `${baseInstruction} You are a Lead Data Architect. Provide sophisticated ERDs and schema documentation with focus on scalability.`
    };

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstructions[type],
        temperature: 0.3,
        thinkingConfig: { thinkingBudget: 16384 },
        tools: [{ googleSearch: {} }]
      }
    });
    
    const text = response.text || "";
    let images: string[] = [];

    if (includeImages) {
      try {
        images = await generateImageVariations(prompt, imageSize);
      } catch (e) {
        console.warn("Image variations failed, continuing with text-only.", e);
      }
    }

    return {
      content: text,
      images: images,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
      _rawResponse: response // Allow logger to see metadata
    };
  });
};

export const exploreConceptVariations = async (concept: string): Promise<StrategicVariation[]> => {
  return withLogging('exploreConceptVariations', async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Branch strategic variations for the following concept: "${concept}". Return exactly 3 distinct, high-fidelity strategic variants. Each should explore a different risk/reward profile.`,
      config: {
        thinkingConfig: { thinkingBudget: 8192 },
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
              implementationTimeline: { type: Type.STRING },
              riskScore: { type: Type.NUMBER },
              resourceRequirements: { type: Type.STRING }
            },
            required: ["variantName", "strategicFocus", "pros", "cons", "riskScore", "implementationTimeline", "resourceRequirements"]
          }
        }
      }
    });

    const parsed = cleanAndParseJson(response.text || "[]");
    // Attach raw response for telemetry
    (parsed as any)._rawResponse = response;
    return parsed;
  });
};

export const generateConceptImage = async (prompt: string, style: string = 'photorealistic', size: '1K' | '2K' | '4K' = '1K'): Promise<string | null> => {
  return withLogging('generateConceptImage', async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { 
        parts: [{ 
            text: `${prompt} . Visual Style: ${style}, high-fidelity corporate aesthetics, 8k resolution, crisp detail.` 
        }] 
      },
      config: {
        imageConfig: { 
            aspectRatio: "16:9",
            imageSize: size
        }
      }
    });

    let data = null;
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        data = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
    
    if (data) (data as any)._rawResponse = response;
    return data;
  });
};

export const generateImageVariations = async (prompt: string, size: '1K' | '2K' | '4K' = '1K'): Promise<string[]> => {
    const variations = [
        { style: 'cinematic photorealistic', suffix: 'ultra-high detail, professional lighting, masterpiece' },
        { style: 'minimalist technical blueprint', suffix: 'clean lines, isometric view, architectural style' }
    ];

    const promises = variations.map(v => 
        generateConceptImage(`${prompt}, ${v.suffix}`, v.style, size)
    );

    const results = await Promise.allSettled(promises);
    
    return results
        .filter(r => r.status === 'fulfilled' && r.value !== null)
        .map(r => (r as PromiseFulfilledResult<string>).value);
};

export const deepResearchReport = async (topic: string) => {
  return withLogging('deepResearchReport', async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Perform an exhaustive deep research analysis on: ${topic}. Ground all findings in real-time data and news. Include multiple authoritative sources.`,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 12288 }
      }
    });

    return {
      content: response.text || "",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
      _rawResponse: response
    };
  });
};

export const chatWithSystemCopilot = async (
    message: string, 
    history: any[], 
    onNavigate: (view: string) => void
): Promise<string> => {
    return withLogging('chatWithSystemCopilot', async () => {
        const ai = getAI();
        
        const navTool: FunctionDeclaration = {
            name: 'navigate_app',
            description: 'Navigate the user to a specific section of the dashboard.',
            parameters: {
              type: Type.OBJECT,
              properties: {
                view: {
                  type: Type.STRING,
                  enum: ['home', 'observability', 'cost', 'hitl', 'insights', 'playground', 'knowledge'],
                  description: 'Target view destination.'
                }
              },
              required: ['view']
            }
        };

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [
                ...history,
                { role: 'user', parts: [{ text: message }] }
            ],
            config: {
                systemInstruction: "You are the EPB OS Copilot. Use navigation tools when asked. Be concise and professional.",
                tools: [{ functionDeclarations: [navTool] }]
            }
        });

        const call = response.functionCalls?.[0];
        let resultText = response.text || "Processed.";
        
        if (call && call.name === 'navigate_app') {
            const targetView = (call.args as any).view;
            onNavigate(targetView);
            resultText = `Navigating to ${targetView.toUpperCase()} view.`;
        }

        (resultText as any)._rawResponse = response;
        return resultText;
    });
};

export const generateVeoVideo = async (prompt: string) => {
  const ai = getAI(); 
  return withLogging('generateVeoVideo', async () => {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `${prompt}. High fidelity corporate cinematic video.`,
      config: {
        numberOfVideos: 1,
        resolution: '1080p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed.");

    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return {
      url: URL.createObjectURL(blob),
      operation: operation
    };
  });
};

export const extendVeoVideo = async (previousOperation: any, prompt: string) => {
  const ai = getAI();
  return withLogging('extendVeoVideo', async () => {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-generate-preview',
      prompt: prompt || 'The scene continues with more detailed motion and cinematic progression.',
      video: previousOperation.response?.generatedVideos?.[0]?.video,
      config: {
        numberOfVideos: 1,
        resolution: '720p', // Extensions are limited to 720p
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video extension failed.");

    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return {
      url: URL.createObjectURL(blob),
      operation: operation
    };
  });
};

// Returns a ChartConfig object for data visualization
export const generateLiveChart = async (query: string): Promise<ChartConfig> => {
    return withLogging('generateLiveChart', async () => {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Generate a high-fidelity data visualization dataset for: ${query}. Include multiple data points.`,
            config: {
                responseMimeType: "application/json",
                thinkingConfig: { thinkingBudget: 4096 },
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ['bar', 'line', 'area', 'pie'] },
                        description: { type: Type.STRING },
                        xAxisKey: { type: Type.STRING },
                        dataKeys: { type: Type.ARRAY, items: { type: Type.STRING } },
                        colors: { type: Type.ARRAY, items: { type: Type.STRING } },
                        data: { type: Type.ARRAY, items: { type: Type.OBJECT } }
                    },
                    required: ["title", "type", "data", "xAxisKey", "dataKeys", "colors"]
                }
            }
        });

        const parsed = cleanAndParseJson(response.text || "{}");
        (parsed as any)._rawResponse = response;
        return parsed;
    });
};

export const speakReport = async (text: string) => {
  return withLogging('speakReport', async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text.slice(0, 500) }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioBytes = decodeBase64(base64Audio);
    const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
    
    return { audioBuffer, audioContext, _rawResponse: response };
  });
};

export const generatePodcastAudio = async (topic: string, context: string) => {
  return withLogging('generatePodcastAudio', async () => {
    const ai = getAI();
    const prompt = `TTS the following conversation between Joe (Tech Strategist) and Jane (Design Lead) about: ${topic}.
      Context: ${context}
      Joe: I've been reviewing the latest variations for ${topic}. The scalability looks promising.
      Jane: I agree, Joe. The visual concepts we generated really highlight the professional fidelity.
      Joe: Exactly. We need to focus on low-latency orchestration to ensure high-fidelity outputs across the fleet.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: 'Joe',
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
              },
              {
                speaker: 'Jane',
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
              }
            ]
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioBytes = decodeBase64(base64Audio);
    const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);

    return { audioBuffer, audioContext, _rawResponse: response };
  });
};

export const simulateKnowledgeRetrieval = async (query: string) => {
  return withLogging('simulateKnowledgeRetrieval', async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Simulate high-fidelity RAG retrieval for: "${query}". Return relevant document chunks.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              source: { type: Type.STRING },
              chunk: { type: Type.STRING },
              score: { type: Type.NUMBER }
            },
            required: ["source", "chunk", "score"]
          }
        }
      }
    });

    const parsed = cleanAndParseJson(response.text || "[]");
    (parsed as any)._rawResponse = response;
    return parsed;
  });
};

export const generateAgentConfiguration = async (intent?: string) => {
    return withLogging('generateAgentConfiguration', async () => {
        const ai = getAI();
        const basePrompt = intent 
            ? `Optimize an enterprise agent configuration for: "${intent}".`
            : `Create a unique Enterprise Agent configuration for a niche industrial domain.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `${basePrompt} Return JSON configuration.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        systemInstruction: { type: Type.STRING },
                        userPrompt: { type: Type.STRING },
                        model: { type: Type.STRING, enum: ['gemini-3-pro-preview', 'gemini-3-flash-preview'] },
                        temperature: { type: Type.NUMBER }
                    },
                    required: ["name", "description", "systemInstruction", "userPrompt", "model", "temperature"]
                }
            }
        });

        const parsed = cleanAndParseJson(response.text || "{}");
        (parsed as any)._rawResponse = response;
        return parsed;
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
