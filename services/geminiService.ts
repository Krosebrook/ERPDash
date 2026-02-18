
import { GoogleGenAI, Type, Modality, FunctionDeclaration } from "@google/genai";
import { StrategicVariation, GroundingSource, KnowledgeDoc } from "../types";

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
  if (!text) return null;
  try {
    let cleaned = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    try {
      const start = text.indexOf('[');
      const end = text.lastIndexOf(']');
      if (start !== -1 && end !== -1 && end > start) {
        return JSON.parse(text.substring(start, end + 1));
      }
      const startObj = text.indexOf('{');
      const endObj = text.lastIndexOf('}');
      if (startObj !== -1 && endObj !== -1 && endObj > startObj) {
        return JSON.parse(text.substring(startObj, endObj + 1));
      }
    } catch (e2) { /* ignore */ }
    return null;
  }
};

const withLogging = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = (performance.now() - start).toFixed(0);
    console.log(`[Gemini SDK Telemetry] ${name} - SUCCESS (${duration}ms)`);
    return result;
  } catch (error) {
    console.error(`[Gemini SDK Telemetry] ${name} - FAILED`, error);
    throw error;
  }
};

export type DeliverableType = 'report' | 'code' | 'presentation' | 'data_model' | 'financial_audit' | 'strategy_map';

// --- NEW FEATURE: Field-Level Suggestions ---
export const generateInputSuggestion = async (
  contextType: 'strategic_intent' | 'system_instruction' | 'user_prompt' | 'hitl_note' | 'compliance_query' | 'target_audience' | 'constraints' | 'focus_area',
  currentValue: string = "",
  additionalContext: string = ""
) => {
  return withLogging('generateInputSuggestion', async () => {
    const ai = getAI();
    const prompt = `
      You are an AI assistant for an Enterprise Dashboard.
      Task: Generate a single, high-quality, professional suggestion to fill a text input.
      Field Type: ${contextType}
      Current Input (partial): "${currentValue}"
      Additional Context: ${additionalContext}

      Requirements:
      - Return ONLY the suggested text. No explanations.
      - Be specific to enterprise/corporate scenarios.
      - If 'strategic_intent', focus on business strategy (e.g., "Optimize supply chain logistics...").
      - If 'system_instruction', create a robust persona definition.
      - If 'user_prompt', create a complex edge-case test scenario.
      - If 'hitl_note', write a justification for approval/rejection based on the transaction.
      - If 'compliance_query', write a natural language search query for audit logs (e.g., "Show failed logins...").
      - If 'target_audience', suggest a stakeholder group (e.g., "C-Suite & Board of Directors", "Engineering Leads").
      - If 'constraints', suggest a realistic limitation (e.g., "Budget cap of $500k", "Must be GDPR compliant").
      - If 'focus_area', suggest a specific domain (e.g., "Q3 Revenue Growth", "Cybersecurity Resilience").
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 200,
      }
    });

    return response.text?.trim() || "";
  });
};

export const generateStudioDeliverable = async (
  type: DeliverableType,
  prompt: string,
  includeImages: boolean = false,
  tone: string = 'Professional',
  imageSize: '1K' | '2K' | '4K' = '1K',
  locationAware: boolean = false
) => {
  return withLogging('generateStudioDeliverable', async () => {
    const ai = getAI();
    // Maps grounding is only supported in Gemini 2.5 series models.
    const model = locationAware ? 'gemini-2.5-flash' : 'gemini-3-pro-preview';
    // Max thinking budget for 2.5 Flash is 24576, 3 Pro is 32768.
    const thinkingBudget = locationAware ? 24576 : 32768;
    
    const baseInstruction = `Tone: ${tone}. Focus on high-fidelity, production-grade output. Ground all claims in real-world data and authoritative sources.`;
    
    const systemInstructions: Record<DeliverableType, string> = {
      report: `${baseInstruction} You are a Principal Strategy Consultant. Provide an exhaustive executive report with deep reasoning blocks.`,
      code: `${baseInstruction} You are a Senior Staff Engineer. Provide production-ready, highly optimized code and architectural designs.`,
      presentation: `${baseInstruction} You are a Head of Design. Provide a slide-by-slide visual strategy and content outline.`,
      data_model: `${baseInstruction} You are a Lead Data Architect. Provide sophisticated ERDs and schema documentation.`,
      financial_audit: `${baseInstruction} You are a Senior Financial Auditor. Analyze concepts with extreme fiscal scrutiny and risk assessment.`,
      strategy_map: `${baseInstruction} You are a Chief Operations Officer. Map concepts to long-term enterprise scalability and operational efficiency.`
    };

    const tools: any[] = [{ googleSearch: {} }];
    let toolConfig: any = undefined;

    if (locationAware) {
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
        tools.push({ googleMaps: {} });
        toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude
            }
          }
        };
      } catch (e) {
        console.warn("Geolocation failed or denied, proceeding with Search grounding only.");
      }
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstructions[type],
        temperature: 0.3,
        thinkingConfig: { thinkingBudget: thinkingBudget },
        tools: tools,
        toolConfig: toolConfig
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
      _rawResponse: response
    };
  });
};

export const generateImageVariations = async (prompt: string, size: '1K' | '2K' | '4K' = '1K'): Promise<string[]> => {
  const variations = [
    { style: 'cinematic photorealistic', suffix: 'ultra-high detail, professional lighting, masterpiece' },
    { style: 'minimalist technical blueprint', suffix: 'clean lines, isometric view, architectural style' }
  ];

  const variationsPayload = variations.map(v => 
    generateConceptImage(`${prompt}, ${v.suffix}`, v.style, size)
  );

  const results = await Promise.allSettled(variationsPayload);
  
  return results
    .filter(r => r.status === 'fulfilled' && r.value !== null)
    .map(r => (r as PromiseFulfilledResult<string>).value);
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

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  });
};

export const generateAgentConfiguration = async (intent?: string) => {
  return withLogging('generateAgentConfiguration', async () => {
    const ai = getAI();
    const basePrompt = intent 
      ? `Optimize an enterprise agent configuration for the following intent: "${intent}". Provide exhaustive, expert-level system instructions including reasoning constraints and persona guardrails. Recommend the best model ('gemini-3-pro-preview' for reasoning, 'gemini-3-flash-preview' for speed).`
      : `Create an exhaustive, high-fidelity Enterprise Agent configuration for a HIGHLY SPECIFIC niche industrial domain. Return JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `${basePrompt} Return the result strictly in the specified JSON format.`,
      config: {
        thinkingConfig: { thinkingBudget: 16384 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            niche: { type: Type.STRING },
            systemInstruction: { type: Type.STRING },
            userPrompt: { type: Type.STRING },
            model: { type: Type.STRING, enum: ['gemini-3-pro-preview', 'gemini-3-flash-preview'] },
            temperature: { type: Type.NUMBER },
            reasoningRequired: { type: Type.BOOLEAN }
          },
          required: ["name", "description", "niche", "systemInstruction", "userPrompt", "model", "temperature", "reasoningRequired"]
        }
      }
    });

    return cleanAndParseJson(response.text || "{}") || {};
  });
};

export const exploreConceptVariations = async (concept: string): Promise<StrategicVariation[]> => {
  return withLogging('exploreConceptVariations', async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Branch strategic variations for the following concept: "${concept}". Return exactly 3 distinct strategic variants.`,
      config: {
        thinkingConfig: { thinkingBudget: 16384 },
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

    return cleanAndParseJson(response.text || "[]") || [];
  });
};

export const deepResearchReport = async (topic: string, locationAware: boolean = false) => {
  return withLogging('deepResearchReport', async () => {
    const ai = getAI();
    // Maps grounding is only supported in Gemini 2.5 series models.
    const model = locationAware ? 'gemini-2.5-flash' : 'gemini-3-pro-preview';
    const thinkingBudget = locationAware ? 24576 : 32768;
    
    const tools: any[] = [{ googleSearch: {} }];
    let toolConfig: any = undefined;

    if (locationAware) {
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
        tools.push({ googleMaps: {} });
        toolConfig = {
          retrievalConfig: { latLng: { latitude: pos.coords.latitude, longitude: pos.coords.longitude } }
        };
      } catch (e) {
        console.warn("Geolocation failed.");
      }
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: `Deep research report on: ${topic}.`,
      config: {
        tools: tools,
        toolConfig: toolConfig,
        thinkingConfig: { thinkingBudget: thinkingBudget }
      }
    });

    return {
      content: response.text || "",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  });
};

export const generateVeoVideo = async (prompt: string) => {
  const ai = getAI(); 
  return withLogging('generateVeoVideo', async () => {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `${prompt}. Corporate cinematic style.`,
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
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return { url: URL.createObjectURL(blob), operation: operation };
  });
};

// Implement missing extendVeoVideo following SDK guidelines for video extension.
export const extendVeoVideo = async (prompt: string, previousOperation: any) => {
  const ai = getAI(); 
  return withLogging('extendVeoVideo', async () => {
    const previousVideo = previousOperation.response?.generatedVideos?.[0]?.video;
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-generate-preview',
      prompt: prompt,
      video: previousVideo,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: previousVideo?.aspectRatio,
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return { url: URL.createObjectURL(blob), operation: operation };
  });
};

export const generateLiveChart = async (query: string): Promise<ChartConfig> => {
  return withLogging('generateLiveChart', async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Data visualization for: ${query}.`,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 8192 },
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

    return cleanAndParseJson(response.text || "{}") || {};
  });
};

export const speakReport = async (text: string) => {
  return withLogging('speakReport', async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text.slice(0, 1000) }] }],
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
    
    return { audioBuffer, audioContext };
  });
};

export const generatePodcastAudio = async (topic: string, context: string) => {
  return withLogging('generatePodcastAudio', async () => {
    const ai = getAI();
    const prompt = `Joe and Jane podcast on: ${topic}. Context: ${context}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              { speaker: 'Joe', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
              { speaker: 'Jane', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
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

    return { audioBuffer, audioContext };
  });
};

export const chatWithSystemCopilot = async (
    message: string, 
    history: any[], 
    onNavigate: (view: string) => void,
    systemContext?: string
) => {
  return withLogging('chatWithSystemCopilot', async () => {
    const ai = getAI();
    const navigateTool: FunctionDeclaration = {
      name: 'navigate',
      parameters: {
        type: Type.OBJECT,
        description: 'Navigate views',
        properties: {
          view: { type: Type.STRING, enum: ['home', 'observability', 'cost', 'hitl', 'insights', 'playground', 'knowledge'] }
        },
        required: ['view']
      }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [...history, { role: 'user', parts: [{ text: message }] }],
      config: {
        systemInstruction: "You help users navigate.",
        tools: [{ functionDeclarations: [navigateTool] }]
      }
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      if (call.name === 'navigate') {
          onNavigate((call.args as any).view);
          return `Navigating.`;
      }
    }

    return response.text || "Processed.";
  });
};

export const simulateKnowledgeRetrieval = async (query: string, corpus: KnowledgeDoc[] = []) => {
  return withLogging('simulateKnowledgeRetrieval', async () => {
    const ai = getAI();
    
    // Filter docs that have actual content ingested
    const contextDocs = corpus.filter(d => d.content && d.status === 'indexed');
    let promptContext = "";
    
    if (contextDocs.length > 0) {
        // Build an exhaustive context string from the uploaded docs
        promptContext = contextDocs.map(d => `SOURCE: ${d.name}\nTYPE: ${d.type}\nCONTENT:\n${d.content}`).join('\n\n---\n\n'); 
    }

    const contents = `
      Perform a precise semantic search (RAG) retrieval simulation.
      
      USER QUERY: "${query}"
      
      UPLOADED DOCUMENTS (The Grounding Source):
      ${promptContext || "NO USER DOCUMENTS UPLOADED. Generate generic enterprise mock results if no context is provided."}
      
      INSTRUCTIONS:
      1. Your primary goal is to find relevant content in the UPLOADED DOCUMENTS provided above.
      2. If matching content exists, extract EXACT snippets and calculate a relevance score (0.0 to 1.0).
      3. If no documents match, inform the user or return low-score generic samples.
      4. DO NOT hallucinate facts outside the provided context if context exists.
      5. Return the result strictly in the specified JSON format.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        temperature: 0.1, // High precision
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              documentName: { type: Type.STRING },
              relevanceScore: { type: Type.NUMBER },
              snippet: { type: Type.STRING }
            },
            required: ["documentName", "relevanceScore", "snippet"]
          }
        }
      }
    });
    return cleanAndParseJson(response.text || "[]") || [];
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
