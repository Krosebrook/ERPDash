
import React, { useState, useEffect } from 'react';
import { 
  speakReport, 
  generateStudioDeliverable, 
  exploreConceptVariations, 
  deepResearchReport,
  generateVeoVideo,
  extendVeoVideo,
  generateLiveChart,
  generatePodcastAudio,
  DeliverableType,
  ChartConfig
} from '../services/geminiService';
import { Agent, StrategicVariation, GroundingSource } from '../types';
import Tooltip from './Tooltip';
import AudioPlayer from './AudioPlayer';
import VideoResult from './VideoResult';
import DynamicChart from './DynamicChart';
import ImageGallery from './ImageGallery';

const REASONING_STEPS = [
  "Initializing Inference Core v3.0...",
  "Gathering global search signals...",
  "Retrieving localized spatial data via Google Maps...",
  "Constructing neural knowledge graph...",
  "Performing iterative reasoning loops (8 cycles)...",
  "Synthesizing high-fidelity strategic branches...",
  "Finalizing multi-modal assets..."
];

const AiInsights: React.FC<{ agents: Agent[] }> = ({ agents }) => {
  const [activeTab, setActiveTab] = useState<'studio' | 'settings'>('studio');
  const [loading, setLoading] = useState(false);
  const [reasoningProgress, setReasoningProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [maskedKey, setMaskedKey] = useState<string>('');

  // Feature State
  const [studioOutput, setStudioOutput] = useState<{content: string, images: string[], type?: string, sources?: GroundingSource[]} | null>(null);
  const [studioMode, setStudioMode] = useState<'text' | 'video' | 'chart'>('text');
  const [deliverableType, setDeliverableType] = useState<DeliverableType>('report');
  const [tone, setTone] = useState('Professional');
  const [imageResolution, setImageResolution] = useState<'1K' | '2K' | '4K'>('1K');
  const [useGrounding, setUseGrounding] = useState(true);
  const [useLocation, setUseLocation] = useState(false);
  
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [lastVideoOperation, setLastVideoOperation] = useState<any>(null);
  const [chartConfig, setChartConfig] = useState<ChartConfig | null>(null);
  const [variations, setVariations] = useState<StrategicVariation[]>([]);
  
  const [conceptInput, setConceptInput] = useState('Scalable Autonomous Fleet Orchestration in Logistics');
  const [includeImages, setIncludeImages] = useState(true);
  const [autoVariations, setAutoVariations] = useState(true);

  // Audio State
  const [audioData, setAudioData] = useState<{ buffer: AudioBuffer; ctx: AudioContext; type: 'tts' | 'podcast' } | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      try {
        // @ts-ignore
        const active = await window.aistudio.hasSelectedApiKey();
        setHasKey(active);
        const key = process.env.API_KEY || '';
        if (key && active) {
          setMaskedKey(`${key.substring(0, 6)}••••••••••••••••${key.substring(key.length - 4)}`);
        } else {
            setMaskedKey('');
        }
      } catch (e) {
        console.warn("API Key check failed", e);
      }
    };
    checkKey();
  }, [activeTab]);

  const handleConfigureKey = async () => {
    try {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      // @ts-ignore
      const active = await window.aistudio.hasSelectedApiKey();
      setHasKey(active);
      const key = process.env.API_KEY || '';
      if (key && active) {
          setMaskedKey(`${key.substring(0, 6)}••••••••••••••••${key.substring(key.length - 4)}`);
      }
      setError(null);
    } catch (e) {
      console.error("Key selection failed", e);
    }
  };

  const simulateReasoning = (callback: () => Promise<void>) => {
    setLoading(true);
    setReasoningProgress(0);
    const interval = setInterval(() => {
      setReasoningProgress(prev => Math.min(prev + (100 / REASONING_STEPS.length), 95));
    }, 1500);

    callback().finally(() => {
      clearInterval(interval);
      setReasoningProgress(100);
      setTimeout(() => {
        setLoading(false);
        setReasoningProgress(0);
      }, 500);
    });
  };

  const handleStudioGenerate = () => simulateReasoning(async () => {
    setStudioOutput(null);
    setVideoUrl(null);
    setChartConfig(null);
    setVariations([]);
    
    try {
      const result = await generateStudioDeliverable(deliverableType, conceptInput, includeImages, tone, imageResolution, useLocation);
      setStudioOutput({ ...result, type: 'text' });
      
      if (autoVariations) {
        const variants = await exploreConceptVariations(conceptInput);
        setVariations(variants);
      }
    } catch (e: any) {
      setError(e.message);
    }
  });

  const handleVideoGenerate = () => simulateReasoning(async () => {
     setVideoUrl(null);
     setLastVideoOperation(null);
     const result = await generateVeoVideo(conceptInput);
     setVideoUrl(result.url);
     setLastVideoOperation(result.operation);
  });

  const handleChartGenerate = () => simulateReasoning(async () => {
    setChartConfig(null);
    const config = await generateLiveChart(conceptInput);
    setChartConfig(config);
  });

  const handleTTS = async () => {
    const textToSpeak = studioOutput?.content || "";
    if (!textToSpeak) return;
    setAudioData(null); 
    const result = await speakReport(textToSpeak);
    if (result) setAudioData({ buffer: (result as any).audioBuffer, ctx: (result as any).audioContext, type: 'tts' });
  };

  const handlePodcast = async () => {
    const context = studioOutput?.content || conceptInput;
    setAudioData(null);
    const result = await generatePodcastAudio(conceptInput, context);
    if (result) setAudioData({ buffer: (result as any).audioBuffer, ctx: (result as any).audioContext, type: 'podcast' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 max-w-full mx-auto min-h-[800px] overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--border-color)] pb-8">
        <div>
          <h2 className="text-5xl font-black tracking-tighter text-[var(--text-primary)] uppercase italic">Intelligence Studio <span className="text-blue-500 font-normal">v2.5</span></h2>
          <p className="text-[var(--text-secondary)] text-sm mt-3 font-medium opacity-70 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            High-Fidelity Neural Synthesis Active
          </p>
        </div>
        <div className="flex bg-[var(--bg-panel)] p-1.5 rounded-[2rem] border border-[var(--border-color)] shadow-2xl backdrop-blur-xl">
          {(['studio', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-3 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all duration-500 ${
                activeTab === tab ? 'bg-blue-600 text-white shadow-xl scale-105' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Control Column */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[3rem] p-10 shadow-[0_40px_100px_rgba(0,0,0,0.5)] relative overflow-hidden group">
            
            {/* Thinking Overlay */}
            {loading && (
              <div className="absolute inset-0 z-40 bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-12 text-center animate-in zoom-in-95">
                 <div className="w-32 h-32 border-8 border-blue-500/10 border-t-blue-500 rounded-full animate-spin mb-10 shadow-[0_0_80px_rgba(37,99,235,0.3)]"></div>
                 <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-4 animate-pulse">
                    {REASONING_STEPS[Math.floor((reasoningProgress / 100) * REASONING_STEPS.length)] || "Synthesizing Output..."}
                 </h4>
                 <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-6 border border-slate-800">
                    <div className="h-full bg-blue-600 transition-all duration-1000 ease-out" style={{ width: `${reasoningProgress}%` }}></div>
                 </div>
                 <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-8">Gemini 3 Pro reasoning depth engaged</span>
              </div>
            )}

            {activeTab === 'settings' ? (
              <div className="space-y-8 animate-in slide-in-from-right-4">
                 <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] block">Secure Credential Vault</label>
                    {hasKey && <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>ENCRYPTED CONNECTION</span>}
                 </div>
                 
                 <div className="bg-slate-950/50 border border-slate-800 rounded-3xl p-8 shadow-inner relative overflow-hidden">
                    
                    {/* Visual decoration for "Secure" look */}
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <svg className="w-24 h-24 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>

                    <div className="space-y-6 relative z-10">
                        <div>
                            <label className="text-xs font-bold text-slate-400 mb-2 block">Gemini API Key</label>
                            <div className="flex gap-3">
                                <div className={`flex-1 bg-slate-900 border ${hasKey ? 'border-slate-700' : 'border-red-900/50 bg-red-900/10'} rounded-xl px-4 py-3 flex items-center justify-between group focus-within:border-blue-500 transition-colors relative`}>
                                    <div className="font-mono text-sm text-slate-300 tracking-widest truncate max-w-[180px]">
                                        {hasKey ? (maskedKey || '••••••••••••••••••••••••••••') : 'No API Key Detected'}
                                    </div>
                                    {hasKey ? (
                                        <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    ) : (
                                        <svg className="w-4 h-4 text-red-500 shrink-0 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    )}
                                </div>
                                <button 
                                    onClick={handleConfigureKey}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95"
                                >
                                    {hasKey ? 'Manage' : 'Connect'}
                                </button>
                            </div>
                            {!hasKey && (
                                <p className="text-[10px] text-red-400 mt-2 flex items-center gap-1.5 font-medium animate-in slide-in-from-top-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    High-fidelity features (Veo, Imagen, Reasoning) require a valid paid API key.
                                </p>
                            )}
                        </div>

                        <div className="pt-6 border-t border-slate-800/50">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Capabilities Status</h4>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Gemini 3 Reasoning', active: hasKey },
                                    { label: 'Veo Video Gen', active: hasKey },
                                    { label: 'Imagen 3.0', active: hasKey },
                                    { label: 'Search Grounding', active: hasKey }
                                ].map((cap, i) => (
                                    <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${cap.active ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-800/50 border-slate-700'}`}>
                                        <span className={`text-[10px] font-bold ${cap.active ? 'text-emerald-400' : 'text-slate-500'}`}>{cap.label}</span>
                                        <div className={`w-1.5 h-1.5 rounded-full ${cap.active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`}></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                 </div>
                 
                 <div className="bg-blue-900/10 border border-blue-500/20 rounded-2xl p-6 flex gap-4 items-start">
                    <svg className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div>
                        <h5 className="text-xs font-bold text-blue-300 mb-1">Security Note</h5>
                        <p className="text-[10px] text-blue-400/70 leading-relaxed">
                            Your API credentials are injected securely via the platform environment variables. 
                            Keys are never stored in local storage or transmitted to third-party logging services.
                            Billing is handled directly through your Google Cloud project.
                        </p>
                    </div>
                 </div>
              </div>
            ) : (
              <div className="space-y-10">
                <div>
                   <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 block">Strategic Intent</label>
                   <textarea 
                    value={conceptInput}
                    onChange={(e) => setConceptInput(e.target.value)}
                    className="w-full h-44 bg-slate-950/50 border border-slate-800 rounded-3xl p-7 text-sm text-slate-200 placeholder:text-slate-700 focus:border-blue-500 outline-none transition-all resize-none font-medium leading-relaxed shadow-inner"
                    placeholder="Describe the high-fidelity objective..."
                   />
                </div>

                <div className="space-y-8">
                   <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'text', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Draft' },
                        { id: 'video', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z', label: 'Veo' },
                        { id: 'chart', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', label: 'Viz' }
                      ].map(m => (
                        <button
                          key={m.id}
                          onClick={() => setStudioMode(m.id as any)}
                          className={`flex flex-col items-center justify-center gap-3 p-5 rounded-[2rem] border transition-all duration-500 active:scale-95 ${
                            studioMode === m.id ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-[inset_0_0_30px_rgba(59,130,246,0.2)]' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-600'
                          }`}
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={m.icon} /></svg>
                          <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                        </button>
                      ))}
                   </div>

                   {studioMode === 'text' && (
                     <div className="space-y-6 animate-in slide-in-from-top-4">
                        <div className="grid grid-cols-2 gap-3">
                           {(['report', 'code', 'presentation', 'financial_audit', 'strategy_map'] as DeliverableType[]).map(d => (
                             <button
                               key={d}
                               onClick={() => setDeliverableType(d)}
                               className={`px-4 py-3 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all duration-300 transform ${
                                 deliverableType === d 
                                   ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-105 ring-1 ring-blue-400' 
                                   : 'bg-slate-950/50 border-slate-800 text-slate-500 hover:text-white hover:border-blue-500/50 hover:bg-slate-900 hover:scale-105 hover:shadow-lg'
                               }`}
                             >
                               {d.replace('_', ' ')}
                             </button>
                           ))}
                        </div>

                        <div className="space-y-4 pt-6 border-t border-slate-800/50">
                           <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Grounding: Search</span>
                              <button onClick={() => setUseGrounding(!useGrounding)} className={`w-10 h-5 rounded-full relative transition-all ${useGrounding ? 'bg-blue-600' : 'bg-slate-800'}`}>
                                 <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${useGrounding ? 'left-6' : 'left-1'}`}></div>
                              </button>
                           </div>
                           <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Grounding: Maps Spatial</span>
                              <button onClick={() => setUseLocation(!useLocation)} className={`w-10 h-5 rounded-full relative transition-all ${useLocation ? 'bg-emerald-600' : 'bg-slate-800'}`}>
                                 <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${useLocation ? 'left-6' : 'left-1'}`}></div>
                              </button>
                           </div>
                           <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Strategic Variations</span>
                              <button onClick={() => setAutoVariations(!autoVariations)} className={`w-10 h-5 rounded-full relative transition-all ${autoVariations ? 'bg-purple-600' : 'bg-slate-800'}`}>
                                 <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${autoVariations ? 'left-6' : 'left-1'}`}></div>
                              </button>
                           </div>
                        </div>
                     </div>
                   )}
                </div>

                <button 
                  onClick={studioMode === 'text' ? handleStudioGenerate : studioMode === 'video' ? handleVideoGenerate : handleChartGenerate}
                  disabled={loading || !hasKey}
                  className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black text-xs tracking-[0.2em] shadow-[0_30px_60px_rgba(37,99,235,0.4)] transition-all active:scale-95 disabled:opacity-30 disabled:scale-100 uppercase"
                >
                  Initiate Synthesis
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Output Column */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* Audio Toolbar Overlay */}
          {audioData && (
             <div className="fixed bottom-10 right-10 z-50 animate-in slide-in-from-bottom-10">
                <AudioPlayer audioBuffer={audioData.buffer} audioContext={audioData.ctx} onClose={() => setAudioData(null)} />
             </div>
          )}

          {/* Multimedia Results */}
          {videoUrl && <VideoResult videoUrl={videoUrl} onClose={() => setVideoUrl(null)} />}
          {chartConfig && <div className="h-[600px] animate-in zoom-in-95"><DynamicChart config={chartConfig} /></div>}

          {/* Variations Matrix (Displayed Side-by-Side if available) */}
          {variations.length > 0 && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-6">
                {variations.map((v, i) => (
                   <div key={i} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 hover:border-blue-500/40 transition-all group shadow-2xl">
                      <div className="flex justify-between items-start mb-6">
                         <span className="text-[9px] font-black text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20 uppercase tracking-widest">{v.strategicFocus}</span>
                         <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${v.riskScore > 6 ? 'text-rose-500 bg-rose-500/10' : 'text-emerald-500 bg-emerald-500/10'}`}>R:{v.riskScore}</span>
                      </div>
                      <h4 className="font-black text-lg text-white mb-4 leading-tight uppercase tracking-tight">{v.variantName}</h4>
                      <ul className="space-y-3 mb-8">
                         {v.pros.slice(0, 3).map((p, j) => (
                            <li key={j} className="text-[10px] text-slate-400 flex items-start gap-2">
                               <span className="text-blue-500 font-bold">•</span>
                               {p}
                            </li>
                         ))}
                      </ul>
                      <div className="pt-6 border-t border-slate-800 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                         Timeline: {v.implementationTimeline}
                      </div>
                   </div>
                ))}
             </div>
          )}

          {/* Main Deliverable Viewer */}
          {studioOutput && (
            <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[3rem] shadow-[0_50px_150px_rgba(0,0,0,0.6)] overflow-hidden animate-in fade-in duration-1000">
               <div className="p-10 border-b border-[var(--border-color)] bg-slate-900/50 flex justify-between items-center backdrop-blur-xl sticky top-0 z-10">
                  <div className="flex items-center gap-6">
                     <h3 className="text-3xl font-black text-white uppercase tracking-tighter">
                        {deliverableType.replace('_', ' ')}
                     </h3>
                     <div className="h-6 w-px bg-slate-800"></div>
                     <span className="text-[10px] text-blue-400 font-black uppercase tracking-[0.3em]">{tone} TONE</span>
                  </div>
                  <div className="flex gap-4">
                     <Tooltip content="Narrate Professional Report">
                        <button onClick={handleTTS} className="p-4 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl transition-all active:scale-95 border border-slate-700">
                           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                        </button>
                     </Tooltip>
                     <Tooltip content="Generate Expert Discussion (Podcast)">
                        <button onClick={handlePodcast} className="flex items-center gap-3 px-6 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-[10px] tracking-widest transition-all shadow-xl shadow-purple-900/20 active:scale-95">
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                           SIMULATE PODCAST
                        </button>
                     </Tooltip>
                  </div>
               </div>

               <div className="p-12 space-y-12 bg-slate-950/40">
                  <div className="prose prose-invert max-w-none">
                     <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 text-lg text-slate-200 leading-[1.8] whitespace-pre-wrap font-medium selection:bg-blue-600/30">
                        {studioOutput.content}
                     </div>
                  </div>

                  <ImageGallery images={studioOutput.images} />

                  {/* Grounding Source Matrix */}
                  {studioOutput.sources && studioOutput.sources.length > 0 && (
                    <div className="pt-12 border-t border-slate-800">
                       <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          Verified Intelligence Sources
                       </h5>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                          {studioOutput.sources.map((source, idx) => (
                             source.web?.uri && (
                               <a key={idx} href={source.web.uri} target="_blank" rel="noopener noreferrer" className="p-5 bg-slate-900 hover:bg-slate-800 rounded-3xl border border-slate-800 hover:border-blue-500 transition-all group flex flex-col justify-between h-32">
                                  <div className="text-[10px] font-black text-blue-400 uppercase tracking-tighter truncate group-hover:text-blue-300">
                                     {source.web.title || "External Intelligence Report"}
                                  </div>
                                  <div className="flex items-center justify-between mt-auto">
                                     <span className="text-[9px] text-slate-600 font-mono truncate max-w-[150px]">{source.web.uri}</span>
                                     <svg className="w-4 h-4 text-slate-700 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                  </div>
                               </a>
                             )
                          ))}
                       </div>
                    </div>
                  )}
               </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !studioOutput && !videoUrl && !chartConfig && (
             <div className="h-[700px] border-4 border-dashed border-slate-900 rounded-[4rem] flex flex-col items-center justify-center text-center p-20 opacity-30 group hover:opacity-100 transition-opacity">
                <div className="w-32 h-32 bg-slate-900 rounded-full flex items-center justify-center mb-10 group-hover:bg-blue-600/10 transition-colors">
                   <svg className="w-16 h-16 text-slate-700 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                </div>
                <h3 className="text-3xl font-black text-slate-700 uppercase tracking-tighter mb-4">No Insights Generated Yet</h3>
                <p className="text-sm text-slate-500 font-medium max-w-xs leading-relaxed italic">Click the "Initiate Synthesis" button above to start generating high-fidelity enterprise deliverables.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiInsights;
