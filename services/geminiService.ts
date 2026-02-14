
import { GoogleGenAI, Type, Modality, FunctionDeclaration } from "@google/genai";

const getAI = () => {
  const key = process.env.API_KEY;
  if (!key) {
    throw new Error("API Key is missing. Please configure process.env.API_KEY.");
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

const withLogging = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    console.log(`[Gemini] ${name} - Success (${(performance.now() - start).toFixed(0)}ms)`);
    return result;
  } catch (error) {
    console.error(`[Gemini] ${name} - Failed`, error);
    throw error;
  }
};

export type DeliverableType = 'report' | 'code' | 'presentation' | 'data_model';

// --- CORE STUDIO FEATURES ---

export const generateStudioDeliverable = async (
    type: DeliverableType, 
    prompt: string, 
    includeImages: boolean = false,
    tone: string = 'Professional'
) => {
  return withLogging('generateStudioDeliverable', async () => {
    const ai = getAI();
    const model = 'gemini-3-pro-preview';
    
    const baseInstruction = `Tone: ${tone}. Maintain high fidelity and depth.`;
    
    const systemInstructions: Record<DeliverableType, string> = {
      report: `${baseInstruction} You are a Principal Consultant. Provide an exhaustive executive report with deep reasoning blocks included in a 'THOUGHTS:' prefix section.`,
      code: `${baseInstruction} You are a Senior Staff Engineer. Provide production-ready architecture and implementation code with reasoning on patterns used. Ensure code is high-performance.`,
      presentation: `${baseInstruction} You are a Head of Design. Provide slide-by-slide outlines and visual prompts for AI image generation. Focus on storytelling.`,
      data_model: `${baseInstruction} You are a Lead Data Architect. Provide ERDs (as Mermaid/Markdown) and schema validation rules. Focus on scalability and integrity.`
    };

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstructions[type],
        temperature: 0.3,
        thinkingConfig: { thinkingBudget: 8192 }
      }
    });
    
    const text = response.text || "";
    let images: string[] = [];

    if (includeImages) {
      try {
        images = await generateImageVariations(prompt);
      } catch (e) {
        console.warn("Image generation failed, continuing with text-only.", e);
      }
    }

    return {
      content: text,
      images: images
    };
  });
};

export const deepResearchReport = async (topic: string) => {
  return withLogging('deepResearchReport', async () => {
    const ai = getAI();
    // Use search tools for grounding, then a reasoning model to synthesize
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Conduct deep research on: ${topic}. Synthesize findings into a strategic briefing. Cite sources explicitly.`,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 4096 } // Reasoning + Grounding
      }
    });

    return {
      content: response.text || "Research compilation failed.",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  });
};

// --- AGENT CONFIGURATION GENERATOR ---

export interface AgentConfiguration {
    systemInstruction: string;
    userPrompt: string;
    temperature: number;
    model: string;
    name: string;
    description: string;
}

export const generateAgentConfiguration = async (intent?: string): Promise<AgentConfiguration> => {
    return withLogging('generateAgentConfiguration', async () => {
        const ai = getAI();
        
        const basePrompt = intent 
            ? `Refine and optimize a high-fidelity enterprise agent configuration for this specific goal: "${intent}". Ensure strict adherence to enterprise standards.`
            : `Create a unique, sophisticated, and high-value Enterprise Agent configuration for a randomly selected niche domain.
               
               Possible Domains (Select one or similar):
               - Advanced Cybersecurity (e.g. Zero-Day Threat Hunter, Packet Forensics)
               - Complex Legal Tech (e.g. Patent Claim Analysis, M&A Contract Risk Assessor)
               - Computational Biology (e.g. CRISPR Target Validator, Protein Folding Simulator)
               - Fintech Compliance (e.g. Anti-Money Laundering Graph Analyst, Basel III Liquidity Optimizer)
               - Industrial IoT (e.g. Predictive Maintenance for Jet Engines, SCADA Anomaly Detection)
               
               The Agent must be highly specialized, not generic. Avoid generic customer support or writing assistants.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', // Upgraded to Pro for better persona generation
            contents: `${basePrompt}
            
            Return a JSON object defining the agent's full configuration.
            
            Requirements:
            1. 'systemInstruction': A deep, multi-paragraph system prompt. It MUST include sections for: 
               - ROLE & PERSONA: Define a specific expert identity (e.g. "Senior Forensic Accountant").
               - CORE OBJECTIVES: What is the primary mission?
               - CONSTRAINTS & COMPLIANCE: (e.g. "Do not infer PII", "Adhere to NIST 800-53").
               - RESPONSE STYLE: (e.g. "Concise JSON", "Detailed Technical Report", "Socratic Questioning").
               
            2. 'userPrompt': A challenging, complex edge-case scenario to test the agent's reasoning capabilities. 
               Do not ask simple questions. Provide a scenario with ambiguity or conflicting data points that requires the agent to think.
               
            3. 'model': Select the best fit from ['gemini-3-pro-preview', 'gemini-3-flash-preview']. 
               - Use 'gemini-3-pro-preview' for heavy reasoning/analysis.
               - Use 'gemini-3-flash-preview' for high-speed/lower complexity.
               
            4. 'temperature': A number between 0 and 1. Lower for strict tasks, higher for creative ones.
            
            5. 'name': A creative, professional name for the agent (e.g. "Sentiel-9", "LexAI-Pro", "BioGraph-X").
            
            6. 'description': A short executive summary of what this agent does.
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "A creative name for the agent" },
                        description: { type: Type.STRING, description: "Short description of what it does" },
                        systemInstruction: { type: Type.STRING, description: "Detailed system prompt with Role, Objective, Constraints" },
                        userPrompt: { type: Type.STRING, description: "Complex edge-case test scenario" },
                        model: { type: Type.STRING, enum: ['gemini-3-pro-preview', 'gemini-3-flash-preview'] },
                        temperature: { type: Type.NUMBER }
                    },
                    required: ["name", "description", "systemInstruction", "userPrompt", "model", "temperature"]
                }
            }
        });

        return cleanAndParseJson(response.text || "{}");
    });
};

// --- COPILOT & FUNCTION CALLING ---

const navToolDeclaration: FunctionDeclaration = {
    name: 'navigate_app',
    description: 'Navigate to a specific section of the application.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        view: {
          type: Type.STRING,
          enum: ['home', 'observability', 'cost', 'hitl', 'insights', 'playground', 'knowledge'],
          description: 'The target view ID.'
        }
      },
      required: ['view']
    }
};

export const chatWithSystemCopilot = async (
    message: string, 
    history: any[], 
    onNavigate: (view: string) => void
): Promise<string> => {
    return withLogging('chatWithSystemCopilot', async () => {
        const ai = getAI();
        
        // 1. Initial Request with Tools
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [
                ...history,
                { role: 'user', parts: [{ text: message }] }
            ],
            config: {
                systemInstruction: "You are the EPB OS Copilot. You control the dashboard. Use tools to navigate or fetch data. Be concise and helpful.",
                tools: [{ functionDeclarations: [navToolDeclaration] }]
            }
        });

        const call = response.functionCalls?.[0];
        
        // 2. Handle Function Call
        if (call && call.name === 'navigate_app') {
            const targetView = (call.args as any).view;
            onNavigate(targetView);
            
            // 3. Send Tool Response back to model
            const toolResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: [
                    ...history,
                    { role: 'user', parts: [{ text: message }] },
                    { role: 'model', parts: [{ functionCall: call }] },
                    { role: 'function', parts: [{ functionResponse: { name: 'navigate_app', response: { result: 'success', view: targetView } } }] }
                ]
            });
            return toolResponse.text || `Navigated to ${targetView}.`;
        }

        return response.text || "I processed that.";
    });
};

// --- KNOWLEDGE BASE SIMULATION ---

export const simulateKnowledgeRetrieval = async (query: string) => {
    return withLogging('simulateKnowledgeRetrieval', async () => {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Simulate a RAG retrieval for the query: "${query}". 
            Return a JSON object with 'chunks' array containing simulated relevant text segments and 'relevanceScore' (0-1).`,
            config: {
                responseMimeType: "application/json",
                tools: [{ googleSearch: {} }] // Hybrid search
            }
        });
        return cleanAndParseJson(response.text || "{}");
    });
};

// --- MULTIMODAL GENERATION ---

export const generateConceptImage = async (prompt: string, style: string = 'photorealistic'): Promise<string | null> => {
  return withLogging('generateConceptImage', async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { 
        parts: [{ 
            text: `${prompt} . Style: ${style}, 8k resolution, highly detailed, professional lighting, corporate aesthetics.` 
        }] 
      },
      config: {
        imageConfig: { 
            aspectRatio: "16:9",
            imageSize: "1K"
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

export const generateImageVariations = async (prompt: string): Promise<string[]> => {
    return withLogging('generateImageVariations', async () => {
        const variations = [
            { style: 'photorealistic cinematic', suffix: 'cinematic lighting, depth of field' },
            { style: 'minimalist vector art', suffix: 'clean lines, flat design, technical blue' }
        ];

        const promises = variations.map(v => 
            generateConceptImage(`${prompt}, ${v.suffix}`, v.style)
        );

        const results = await Promise.allSettled(promises);
        
        return results
            .filter(r => r.status === 'fulfilled' && r.value !== null)
            .map(r => (r as PromiseFulfilledResult<string>).value);
    });
}

// --- VEO VIDEO GENERATION ---

export const generateVeoVideo = async (prompt: string): Promise<string | null> => {
  if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
          const success = await window.aistudio.openSelectKey();
      }
  }

  const ai = getAI(); 

  return withLogging('generateVeoVideo', async () => {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `${prompt}. Cinematic, high quality, 4k, professional corporate video.`,
      config: {
        numberOfVideos: 1,
        resolution: '1080p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed to return a URI.");

    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  });
};

// --- AUDIO / PODCAST ---

export const generatePodcastAudio = async (topic: string, context: string) => {
  return withLogging('generatePodcastAudio', async () => {
    const ai = getAI();
    
    const dialoguePrompt = `Generate a 2-minute podcast script discussion about: "${topic}". 
    Context: ${context}.
    Speakers: 
    - Host (Kore): Energetic, curious, professional.
    - Expert (Puck): Deeply technical, calm, authoritative.
    Format the output as a natural conversation.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: dialoguePrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                    {
                        speaker: 'Host',
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                    },
                    {
                        speaker: 'Expert',
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
    
    return { audioBuffer, audioContext };
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

// --- DATA VISUALIZATION ---

export interface ChartConfig {
    title: string;
    type: 'bar' | 'line' | 'area' | 'pie';
    data: any[];
    dataKeys: string[];
    xAxisKey: string;
    colors: string[];
    description: string;
}

export const generateLiveChart = async (query: string): Promise<ChartConfig> => {
    return withLogging('generateLiveChart', async () => {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', // Upgraded to Pro for complex logic
            contents: `Generate a High-Fidelity Data Visualization dataset for: ${query}. 
            Return a JSON object compatible with Recharts. 
            Ensure at least 7 data points.
            Use professional corporate colors (Blues, Teals, Slates).`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ['bar', 'line', 'area', 'pie'] },
                        description: { type: Type.STRING },
                        xAxisKey: { type: Type.STRING },
                        dataKeys: { type: Type.ARRAY, items: { type: Type.STRING } },
                        colors: { type: Type.ARRAY, items: { type: Type.STRING } },
                        data: { 
                            type: Type.ARRAY, 
                            items: { type: Type.OBJECT, properties: {}, description: "Array of data objects" } 
                        }
                    },
                    required: ["title", "type", "data", "xAxisKey", "dataKeys", "colors"]
                }
            }
        });

        return cleanAndParseJson(response.text || "{}");
    });
}

// --- UTILS ---

export const exploreConceptVariations = async (concept: string) => {
  return withLogging('exploreConceptVariations', async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Perform strategic branching for: ${concept}. Create 3 distinct variations: 1. Exponential Scale, 2. Maximum Security, 3. Peak Efficiency. Ensure high level of detail in pros/cons.`,
      config: {
        thinkingConfig: { thinkingBudget: 4096 },
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
            required: ["variantName", "strategicFocus", "pros", "cons", "riskScore"]
          }
        }
      }
    });

    return cleanAndParseJson(response.text || "[]");
  });
};

export const analyzeMetrics = async (metrics: any) => {
  return withLogging('analyzeMetrics', async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyze these EPB metrics with executive depth: ${JSON.stringify(metrics)}`,
      config: { 
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
      contents: "EU AI Act Compliance status 2025 and NIST AI RMF updates.",
      config: { 
          tools: [{ googleSearch: {} }] 
      }
    });
    return {
      text: response.text || "No compliance data.",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
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
