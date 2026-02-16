
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
  
  // Session handling
  private sessionPromise: Promise<any> | null = null;
  
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
    this.disconnect(); // Ensure clean slate

    this.inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    // Ensure Contexts are active (Autoplay Policy)
    if (this.inputContext.state === 'suspended') await this.inputContext.resume();
    if (this.outputContext.state === 'suspended') await this.outputContext.resume();

    this.outputNode = this.outputContext.createGain();
    this.outputNode.connect(this.outputContext.destination);

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.error("[Live] Microphone access denied", err);
      throw new Error("Microphone access is required for Live Session.");
    }

    // CRITICAL: Always create a new GoogleGenAI instance right before making an API call
    const apiKey = process.env.API_KEY || '';
    if (!apiKey) throw new Error("API_KEY not found in environment.");
    
    const ai = new GoogleGenAI({ apiKey });

    // Store the promise so we can use it to send frames later
    this.sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      config: {
        responseModalities: [Modality.AUDIO],
        tools: [{ functionDeclarations: tools }],
        systemInstruction: "You are the EPB Voice Command. You control a mission-critical AI dashboard. Be concise, professional, and authoritative. When data is requested, use the provided tools. Do not make up data. If you see something through the camera, describe it in the context of enterprise security or operations.",
        speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
        }
      },
      callbacks: {
        onopen: () => {
          console.log('[Live] Connected');
          if (this.sessionPromise) this.startAudioInput(this.sessionPromise);
        },
        onmessage: async (msg: LiveServerMessage) => {
          if (this.sessionPromise) this.handleMessage(msg, this.sessionPromise);
        },
        onclose: () => console.log('[Live] Closed'),
        onerror: (err) => console.error('[Live] Error', err)
      }
    });
    
    // We await it here to ensure initial connection success, but the property holds the promise for async operations
    await this.sessionPromise;
  }

  // New method for Vision capabilities
  async sendVideoFrame(base64Image: string) {
    if (this.sessionPromise) {
        const session = await this.sessionPromise;
        session.sendRealtimeInput({
            media: {
                mimeType: 'image/jpeg',
                data: base64Image
            }
        });
    }
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
      
      // We must check if the input context is still active before sending
      if (this.inputContext?.state === 'closed') return;

      const uint8 = new Uint8Array(pcm16.buffer);
      const base64 = this.encode(uint8);

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
                    const view = (call.args as any).view;
                    this.navigateFn(view);
                    result = { status: 'navigated', view };
                } else if (call.name === 'get_dashboard_metrics' && this.getMetricsFn) {
                    result = this.getMetricsFn();
                } else if (call.name === 'get_agent_status' && this.getAgentsFn) {
                    const name = (call.args as any).agentName?.toLowerCase() || '';
                    const agent = this.getAgentsFn().find(a => a.name.toLowerCase().includes(name));
                    result = agent ? { found: true, agent } : { found: false, error: 'Agent not found' };
                } else {
                    result = { status: 'error', message: 'Unknown tool or missing capability binding' };
                }
            } catch (e: any) {
                console.error('[Live] Tool Execution Error', e);
                result = { status: 'error', message: e.message };
            }

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

    try {
        const audioBytes = this.decode(base64);
        const audioBuffer = await this.decodeAudioData(audioBytes, this.outputContext, 24000, 1);

        const currentTime = this.outputContext.currentTime;
        if (this.nextStartTime < currentTime) {
            this.nextStartTime = currentTime;
        }
        
        const source = this.outputContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.outputNode);
        source.start(this.nextStartTime);
        
        this.nextStartTime += audioBuffer.duration;
        this.sources.add(source);
        
        source.onended = () => this.sources.delete(source);
    } catch (e) {
        console.error("[Live] Audio Queue Error", e);
    }
  }

  async disconnect() {
    this.sessionPromise = null;
    
    // 1. Stop all tracks
    if (this.stream) {
        this.stream.getTracks().forEach(t => t.stop());
        this.stream = null;
    }
    
    // 2. Disconnect nodes
    if (this.processor) {
        this.processor.disconnect();
        this.processor.onaudioprocess = null; 
        this.processor = null;
    }
    if (this.source) {
        this.source.disconnect();
        this.source = null;
    }
    
    // 3. Close contexts
    if (this.inputContext && this.inputContext.state !== 'closed') {
        await this.inputContext.close();
    }
    this.inputContext = null;

    if (this.outputContext && this.outputContext.state !== 'closed') {
        await this.outputContext.close();
    }
    this.outputContext = null;

    // 4. Stop any playing sources
    this.sources.forEach(s => {
        try { s.stop(); } catch(e) {}
    });
    this.sources.clear();
    this.nextStartTime = 0;
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
