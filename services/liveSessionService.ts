import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from "@google/genai";
import { Agent, MetricData } from "../types";

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
  private ai: GoogleGenAI;
  private session: any = null;
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

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
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

    const sessionPromise = this.ai.live.connect({
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

    this.session = await sessionPromise;
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
      const base64 = this.arrayBufferToBase64(uint8);

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
        const responses: any[] = [];
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

            responses.push({
                id: call.id,
                name: call.name,
                response: { result }
            });
        }

        // Send Tool Response
        const session = await sessionPromise;
        session.sendToolResponse({ functionResponses: responses });
    }
  }

  private async queueAudio(base64: string) {
    if (!this.outputContext || !this.outputNode) return;

    const arrayBuffer = this.base64ToArrayBuffer(base64);
    const audioBuffer = await this.decodeAudioData(new Uint8Array(arrayBuffer), this.outputContext);

    // Schedule
    this.nextStartTime = Math.max(this.nextStartTime, this.outputContext.currentTime);
    
    const source = this.outputContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputNode);
    source.start(this.nextStartTime);
    
    this.nextStartTime += audioBuffer.duration;
    this.sources.add(source);
    
    source.onended = () => this.sources.delete(source);
  }

  // --- Utils ---

  async disconnect() {
    this.stream?.getTracks().forEach(t => t.stop());
    this.processor?.disconnect();
    this.source?.disconnect();
    this.inputContext?.close();
    this.outputContext?.close();
    this.sources.forEach(s => s.stop());
    // No explicit close on session object in current SDK typings, but we drop ref
    this.session = null;
  }

  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const len = buffer.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(buffer[i]);
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }

  private async decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
      const dataInt16 = new Int16Array(data.buffer);
      const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) {
          channelData[i] = dataInt16[i] / 32768.0;
      }
      return buffer;
  }
}