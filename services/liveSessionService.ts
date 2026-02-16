import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from "@google/genai";
import { Agent } from "../types";

// Tools available to the Live Agent
const tools: FunctionDeclaration[] = [
  {
    name: 'navigate_app',
    description: 'Change the current view of the application dashboard.',
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
  },
  {
    name: 'get_dashboard_metrics',
    description: 'Get the current live high-level metrics of the system (cost, agents, tokens, latency).',
    parameters: { type: Type.OBJECT, properties: {} }
  },
  {
    name: 'get_agent_status',
    description: 'Get detailed status and telemetry for a specific agent.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        agentName: { type: Type.STRING, description: 'Fuzzy name of the agent to look up.' }
      },
      required: ['agentName']
    }
  }
];

export class LiveSessionService {
  private inputContext: AudioContext | null = null;
  private outputContext: AudioContext | null = null;
  private outputNode: GainNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  
  // App State Bindings
  private navigateFn: ((view: string) => void) | null = null;
  private getMetricsFn: (() => any) | null = null;
  private getAgentsFn: (() => Agent[]) | null = null;

  public onVolumeUpdate: ((vol: number) => void) | null = null;

  constructor() {
    // ai instance is created fresh in connect() per guidelines
  }

  bindActions(
    navigate: (view: string) => void,
    getMetrics: () => any,
    getAgents: () => Agent[]
  ) {
    this.navigateFn = navigate;
    this.getMetricsFn = getMetrics;
    this.getAgentsFn = getAgents;
  }

  async connect() {
    this.inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    this.outputNode = this.outputContext.createGain();
    this.outputNode.connect(this.outputContext.destination);

    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // CRITICAL: Always create a new GoogleGenAI instance right before making an API call
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      config: {
        responseModalities: [Modality.AUDIO],
        tools: [{ functionDeclarations: tools }],
        systemInstruction: "You are the EPB Voice Command. You control a mission-critical AI dashboard. Be concise, professional, and authoritative. When data is requested, use the provided tools. Do not make up data.",
        speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
        }
      },
      callbacks: {
        onopen: () => {
          console.log('[Live] Connected');
          this.startAudioInput(sessionPromise);
        },
        onmessage: async (msg: LiveServerMessage) => {
          this.handleMessage(msg, sessionPromise);
        },
        onclose: () => console.log('[Live] Closed'),
        onerror: (err) => console.error('[Live] Error', err)
      }
    });
  }

  private startAudioInput(sessionPromise: Promise<any>) {
    if (!this.inputContext || !this.stream) return;

    this.source = this.inputContext.createMediaStreamSource(this.stream);
    this.processor = this.inputContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Volume Visualization
      if (this.onVolumeUpdate) {
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
        this.onVolumeUpdate(Math.sqrt(sum / inputData.length));
      }

      // Convert to PCM16
      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        pcm16[i] = inputData[i] * 32768;
      }
      
      const uint8 = new Uint8Array(pcm16.buffer);
      const base64 = this.encode(uint8);

      // CRITICAL: Solely rely on sessionPromise resolves
      sessionPromise.then(session => {
        session.sendRealtimeInput({
          media: {
            mimeType: 'audio/pcm;rate=16000',
            data: base64
          }
        });
      });
    };

    this.source.connect(this.processor);
    this.processor.connect(this.inputContext.destination);
  }

  private async handleMessage(message: LiveServerMessage, sessionPromise: Promise<any>) {
    // 1. Handle Audio Output
    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (audioData) {
      this.queueAudio(audioData);
    }

    // 2. Handle Tool Calls
    const toolCall = message.toolCall;
    if (toolCall) {
        for (const call of toolCall.functionCalls) {
            console.log('[Live] Tool Call:', call.name, call.args);
            let result: Record<string, any> = { status: 'ok' };
            
            try {
                if (call.name === 'navigate_app' && this.navigateFn) {
                    this.navigateFn((call.args as any).view);
                    result = { status: 'navigated', view: (call.args as any).view };
                } else if (call.name === 'get_dashboard_metrics' && this.getMetricsFn) {
                    result = this.getMetricsFn();
                } else if (call.name === 'get_agent_status' && this.getAgentsFn) {
                    const name = (call.args as any).agentName.toLowerCase();
                    const agent = this.getAgentsFn().find(a => a.name.toLowerCase().includes(name));
                    result = agent ? { found: true, agent } : { found: false, error: 'Agent not found' };
                }
            } catch (e: any) {
                result = { status: 'error', message: e.message };
            }

            // CRITICAL: Send tool response back to model via sessionPromise
            sessionPromise.then(session => {
                session.sendToolResponse({ 
                    functionResponses: {
                        id: call.id,
                        name: call.name,
                        response: { result: result },
                    }
                });
            });
        }
    }
  }

  private async queueAudio(base64: string) {
    if (!this.outputContext || !this.outputNode) return;

    const audioBytes = this.decode(base64);
    const audioBuffer = await this.decodeAudioData(audioBytes, this.outputContext, 24000, 1);

    // Schedule: Always schedule the next audio chunk to start at the exact end time of the previous one
    this.nextStartTime = Math.max(this.nextStartTime, this.outputContext.currentTime);
    
    const source = this.outputContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputNode);
    source.start(this.nextStartTime);
    
    this.nextStartTime += audioBuffer.duration;
    this.sources.add(source);
    
    source.onended = () => this.sources.delete(source);
  }

  // --- Utils Following Coding Guidelines ---

  async disconnect() {
    this.stream?.getTracks().forEach(t => t.stop());
    this.processor?.disconnect();
    this.source?.disconnect();
    this.inputContext?.close();
    this.outputContext?.close();
    this.sources.forEach(s => s.stop());
  }

  private encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private decode(base64: string): Uint8Array {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  private async decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
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
}