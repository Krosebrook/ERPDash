
import React, { useState, useEffect } from 'react';
import { 
  speakReport, 
  generateStudioDeliverable, 
  exploreConceptVariations, 
  generateVeoVideo,
  generateLiveChart,
  generatePodcastAudio,
  generateInputSuggestion,
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
  "Initializing...",
  "Gathering signals...",
  "Spatial retrieval...",
  "Knowledge graph...",
  "Iterative loops...",
  "Synthesizing...",
  "Finalizing..."
];

const AiInsights: React.FC<{ agents: Agent[] }> = ({ agents }) => {
  const [activeTab, setActiveTab] = useState<'studio' | 'settings'>('studio');
  const [loading, setLoading] = useState(false);
  const [reasoningProgress, setReasoningProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [maskedKey, setMaskedKey] = useState<string>('');

  const [studioOutput, setStudioOutput] = useState<{content: string, images: string[], type?: string, sources?: GroundingSource[]} | null>(null);
  const [studioMode, setStudioMode] = useState<'text' | 'video' | 'chart'>('text');
  const [deliverableType, setDeliverableType] = useState<DeliverableType>('report');
  const [tone, setTone] = useState('Professional');
  const [imageResolution, setImageResolution] = useState<'1K' | '2K' | '4K'>('1K');
  const [useGrounding, setUseGrounding] = useState(true);
  const [useLocation, setUseLocation] = useState(false);
  
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [chartConfig, setChartConfig] = useState<ChartConfig | null>(null);
  const [variations, setVariations] = useState<StrategicVariation[]>([]);
  
  // Scoping Form State
  const [conceptInput, setConceptInput] = useState('Scalable Autonomous Fleet Orchestration');
  const [targetAudience, setTargetAudience] = useState('');
  const [constraints, setConstraints] = useState('');
  const [focusArea, setFocusArea] = useState('');
  
  // Suggestion State Handlers
  const [suggestingField, setSuggestingField] = useState<string | null>(null);
  
  const [includeImages, setIncludeImages] = useState(true);
  const [autoVariations, setAutoVariations] = useState(true);

  const [audioData, setAudioData] = useState<{ buffer: AudioBuffer; ctx: AudioContext; type: 'tts' | 'podcast' } | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      try {
        // @ts-ignore
        const active = await window.aistudio.hasSelectedApiKey();
        setHasKey(active);
        const key = process.env.API_KEY || '';
        if (key && active) {
          setMaskedKey(`${key.substring(0, 6)}••••${key.substring(key.length - 4)}`);
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

  const constructDetailedPrompt = () => {
    let base = `Strategic Objective: ${conceptInput}.`;
    if (targetAudience) base += ` Target Audience: ${targetAudience}.`;
    if (focusArea) base += ` Primary Focus Area: ${focusArea}.`;
    if (constraints) base += ` Key Constraints: ${constraints}.`;
    return base;
  };

  const handleStudioGenerate = () => simulateReasoning(async () => {
    setStudioOutput(null);
    setVideoUrl(null);
    setChartConfig(null);
    setVariations([]);
    
    const prompt = constructDetailedPrompt();

    try {
      const result = await generateStudioDeliverable(deliverableType, prompt, includeImages, tone, imageResolution, useLocation);
      setStudioOutput({ ...result, type: 'text', sources: result.sources as GroundingSource[] | undefined });
      if (autoVariations) {
        const variants = await exploreConceptVariations(prompt);
        setVariations(variants);
      }
    } catch (e: any) {
      setError(e.message);
    }
  });

  const handleVideoGenerate = () => simulateReasoning(async () => {
     setVideoUrl(null);
     const prompt = constructDetailedPrompt();
     const result = await generateVeoVideo(prompt);
     setVideoUrl(result.url);
  });

  const handleChartGenerate = () => simulateReasoning(async () => {
    setChartConfig(null);
    const prompt = constructDetailedPrompt();
    const config = await generateLiveChart(prompt);
    setChartConfig(config);
  });

  const handleSuggestion = async (field: 'strategic_intent' | 'target_audience' | 'constraints' | 'focus_area') => {
    if (suggestingField) return;
    setSuggestingField(field);
    try {
        let current = "";
        if (field === 'strategic_intent') current = conceptInput;
        if (field === 'target_audience') current = targetAudience;
        if (field === 'constraints') current = constraints;
        if (field === 'focus_area') current = focusArea;

        const context = `Overall Objective: ${conceptInput}`;
        const suggestion = await generateInputSuggestion(field, current, context);
        
        if (suggestion) {
            if (field === 'strategic_intent') setConceptInput(suggestion);
            if (field === 'target_audience') setTargetAudience(suggestion);
            if (field === 'constraints') setConstraints(suggestion);
            if (field === 'focus_area') setFocusArea(suggestion);
        }
    } catch (e) {
        console.error("Suggestion failed", e);
    } finally {
        setSuggestingField(null);
    }
  };

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

  const handleCopy = () => {
    if (!studioOutput?.content) return;
    navigator.clipboard.writeText(studioOutput.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700 w-full overflow-hidden pb-20">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--border-color)] pb-6 md:pb-8">
        <div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-[var(--text-primary)] uppercase italic">Intelligence Studio</h2>
          <p className="text-[var(--text-secondary)] text-xs md:text-sm mt-2 md:mt-3 font-medium opacity-70 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            High-Fidelity Neural Synthesis
          </p>
        </div>
        <div className="flex bg-[var(--bg-panel)] p-1 md:p-1.5 rounded-2xl md:rounded-[2rem] border border-[var(--border-color)] shadow-xl w-fit">
          {(['studio', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 md:px-8 py-2 md:py-3 rounded-xl md:rounded-[1.5rem] text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 md:gap-10">
        
        {/* Control Panel */}
        <div className="w-full lg:w-[400px] shrink-0 space-y-6 md:space-y-8">
          <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl relative overflow-hidden">
            
            {loading && (
              <div className="absolute inset-0 z-40 bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95">
                 <div className="w-20 h-20 md:w-32 md:h-32 border-4 md:border-8 border-blue-500/10 border-t-blue-500 rounded-full animate-spin mb-6 md:mb-10"></div>
                 <h4 className="text-sm md:text-xl font-black text-white uppercase tracking-tighter mb-4">
                    {REASONING_STEPS[Math.floor((reasoningProgress / 100) * REASONING_STEPS.length)] || "Synthesizing..."}
                 </h4>
                 <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mt-2 border border-slate-800">
                    <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${reasoningProgress}%` }}></div>
                 </div>
              </div>
            )}

            {activeTab === 'settings' ? (
              <div className="space-y-6 md:space-y-8 animate-in slide-in-from-right-4">
                 <label className="text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] md:tracking-[0.3em] block">Credential Vault</label>
                 <div className="bg-slate-950/50 border border-slate-800 rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-inner">
                    <div className="space-y-4 md:space-y-6">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 mb-2 block">API Key Status</label>
                            <div className="flex flex-col gap-3">
                                <div className={`flex-1 bg-slate-900 border ${hasKey ? 'border-slate-700' : 'border-red-900/50'} rounded-xl px-4 py-3 flex items-center justify-between`}>
                                    <div className="font-mono text-[10px] md:text-sm text-slate-300 truncate">
                                        {hasKey ? (maskedKey || 'KEY_PRESENT') : 'DISCONNECTED'}
                                    </div>
                                    {hasKey && <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                </div>
                                <button onClick={handleConfigureKey} className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all">
                                    {hasKey ? 'Manage Keys' : 'Connect Billing'}
                                </button>
                            </div>
                        </div>
                    </div>
                 </div>
              </div>
            ) : (
              <div className="space-y-6 md:space-y-8">
                
                {/* SCOPING CARD / FORM */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-[1.5rem] p-5 md:p-6 shadow-inner relative group focus-within:border-blue-500/50 transition-colors duration-300">
                   <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity">
                      <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                   </div>
                   
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Intelligence Scoping Protocol</h3>
                   
                   <div className="space-y-5">
                      {/* Strategic Objective */}
                      <div className="relative">
                         <div className="flex justify-between items-center mb-1">
                             <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Strategic Objective</label>
                             <button onClick={() => handleSuggestion('strategic_intent')} disabled={!!suggestingField} className="text-blue-500 hover:text-white transition-colors disabled:opacity-50">
                                {suggestingField === 'strategic_intent' ? <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                             </button>
                         </div>
                         <textarea 
                           value={conceptInput} 
                           onChange={(e) => setConceptInput(e.target.value)} 
                           className="w-full h-20 bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:border-blue-500 outline-none transition-all resize-none leading-relaxed" 
                           placeholder="Define core objective..." 
                         />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         {/* Audience */}
                         <div className="relative">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Audience</label>
                                <button onClick={() => handleSuggestion('target_audience')} disabled={!!suggestingField} className="text-blue-500 hover:text-white transition-colors disabled:opacity-50">
                                    {suggestingField === 'target_audience' ? <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                                </button>
                            </div>
                            <input 
                              type="text"
                              value={targetAudience} 
                              onChange={(e) => setTargetAudience(e.target.value)} 
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-blue-500 outline-none transition-all" 
                              placeholder="e.g. C-Suite" 
                            />
                         </div>

                         {/* Focus Area */}
                         <div className="relative">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Focus Area</label>
                                <button onClick={() => handleSuggestion('focus_area')} disabled={!!suggestingField} className="text-blue-500 hover:text-white transition-colors disabled:opacity-50">
                                    {suggestingField === 'focus_area' ? <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                                </button>
                            </div>
                            <input 
                              type="text"
                              value={focusArea} 
                              onChange={(e) => setFocusArea(e.target.value)} 
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-blue-500 outline-none transition-all" 
                              placeholder="e.g. Efficiency" 
                            />
                         </div>
                      </div>

                       {/* Constraints */}
                       <div className="relative">
                         <div className="flex justify-between items-center mb-1">
                             <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Operational Constraints</label>
                             <button onClick={() => handleSuggestion('constraints')} disabled={!!suggestingField} className="text-blue-500 hover:text-white transition-colors disabled:opacity-50">
                                {suggestingField === 'constraints' ? <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                             </button>
                         </div>
                         <input 
                           type="text"
                           value={constraints} 
                           onChange={(e) => setConstraints(e.target.value)} 
                           className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-blue-500 outline-none transition-all" 
                           placeholder="e.g. Budget < $500k, Q3 Deadline" 
                         />
                      </div>
                   </div>
                </div>


                <div className="space-y-6 md:space-y-8">
                   <div className="grid grid-cols-3 gap-2 md:gap-3">
                      {[
                        { id: 'text', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Draft' },
                        { id: 'video', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14', label: 'Veo' },
                        { id: 'chart', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2', label: 'Viz' }
                      ].map(m => (
                        <button key={m.id} onClick={() => setStudioMode(m.id as any)} className={`flex flex-col items-center justify-center gap-2 md:gap-3 p-3 md:p-5 rounded-2xl md:rounded-[2rem] border transition-all duration-300 active:scale-95 ${studioMode === m.id ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-600'}`}>
                          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={m.icon} /></svg>
                          <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                        </button>
                      ))}
                   </div>

                   {studioMode === 'text' && (
                     <div className="space-y-4 md:space-y-6 animate-in slide-in-from-top-4">
                        <div className="grid grid-cols-2 gap-2 md:gap-3">
                           {(['report', 'code', 'presentation', 'financial_audit', 'strategy_map'] as DeliverableType[]).map(d => (
                             <button key={d} onClick={() => setDeliverableType(d)} className={`px-2 md:px-4 py-3 md:py-4 rounded-xl md:rounded-2xl border text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all duration-300 relative overflow-hidden group/card ${deliverableType === d ? 'bg-blue-600 border-blue-400 text-white shadow-xl scale-105 ring-1 ring-blue-400/50' : 'bg-slate-950/50 border-slate-800 text-slate-500 hover:text-white'}`}>
                               <span className="relative z-10">{d.replace('_', ' ')}</span>
                             </button>
                           ))}
                        </div>

                        <div className="space-y-3 md:space-y-4 pt-4 md:pt-6 border-t border-slate-800/50">
                           <div className="flex items-center justify-between">
                              <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Search Grounding</span>
                              <button onClick={() => setUseGrounding(!useGrounding)} className={`w-8 md:w-10 h-4 md:h-5 rounded-full relative transition-all ${useGrounding ? 'bg-blue-600' : 'bg-slate-800'}`}>
                                 <div className={`absolute top-0.5 md:top-1 w-3 h-3 bg-white rounded-full transition-all ${useGrounding ? 'left-4.5 md:left-6' : 'left-0.5 md:left-1'}`}></div>
                              </button>
                           </div>
                           <div className="flex items-center justify-between">
                              <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Spatial Data</span>
                              <button onClick={() => setUseLocation(!useLocation)} className={`w-8 md:w-10 h-4 md:h-5 rounded-full relative transition-all ${useLocation ? 'bg-emerald-600' : 'bg-slate-800'}`}>
                                 <div className={`absolute top-0.5 md:top-1 w-3 h-3 bg-white rounded-full transition-all ${useLocation ? 'left-4.5 md:left-6' : 'left-0.5 md:left-1'}`}></div>
                              </button>
                           </div>
                        </div>
                     </div>
                   )}
                </div>

                <button onClick={studioMode === 'text' ? handleStudioGenerate : studioMode === 'video' ? handleVideoGenerate : handleChartGenerate} disabled={loading || !hasKey} className="w-full py-4 md:py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl md:rounded-[2rem] font-black text-[10px] md:text-xs tracking-[0.2em] shadow-xl transition-all active:scale-95 disabled:opacity-30 uppercase">
                  Initiate Synthesis
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Output Area */}
        <div className="flex-1 min-w-0 space-y-6 md:space-y-10">
          {audioData && (
             <div className="fixed bottom-4 left-4 right-4 md:bottom-10 md:left-auto md:right-10 z-50 animate-in slide-in-from-bottom-10 max-w-full">
                <AudioPlayer audioBuffer={audioData.buffer} audioContext={audioData.ctx} onClose={() => setAudioData(null)} />
             </div>
          )}

          {videoUrl && <VideoResult videoUrl={videoUrl} onClose={() => setVideoUrl(null)} />}
          {chartConfig && <div className="h-[400px] md:h-[600px] animate-in zoom-in-95 overflow-hidden"><DynamicChart config={chartConfig} /></div>}

          {variations.length > 0 && (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 animate-in slide-in-from-bottom-6">
                {variations.map((v, i) => (
                   <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 hover:border-blue-500/40 transition-all shadow-xl">
                      <div className="flex justify-between items-start mb-4 md:mb-6">
                         <span className="text-[8px] md:text-[9px] font-black text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/20 uppercase truncate">{v.strategicFocus}</span>
                      </div>
                      <h4 className="font-black text-sm md:text-lg text-white mb-4 leading-tight uppercase tracking-tight line-clamp-2">{v.variantName}</h4>
                      <ul className="space-y-2 mb-6">
                         {v.pros.slice(0, 2).map((p, j) => (
                            <li key={j} className="text-[9px] md:text-[10px] text-slate-400 flex items-start gap-2">
                               <span className="text-blue-500">•</span>
                               <span className="line-clamp-2">{p}</span>
                            </li>
                         ))}
                      </ul>
                      <div className="pt-4 border-t border-slate-800 text-[8px] font-black text-slate-600 uppercase tracking-widest">
                         Timeline: {v.implementationTimeline}
                      </div>
                   </div>
                ))}
             </div>
          )}

          {studioOutput && (
            <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in duration-1000">
               <div className="p-6 md:p-10 border-b border-[var(--border-color)] bg-slate-900/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 z-10">
                  <div className="flex items-center gap-3 md:gap-6">
                     <h3 className="text-xl md:text-3xl font-black text-white uppercase tracking-tighter truncate max-w-[150px] md:max-w-none">
                        {deliverableType.replace('_', ' ')}
                     </h3>
                     <span className="text-[8px] md:text-[10px] text-blue-400 font-black uppercase tracking-widest">{tone}</span>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                     <Tooltip content={copied ? "Copied!" : "Copy Output"}>
                        <button 
                          onClick={handleCopy} 
                          className={`flex-1 sm:flex-none p-3 md:p-4 rounded-xl transition-all border flex items-center justify-center gap-2 ${copied ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-400'}`}
                        >
                          {copied ? (
                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                          ) : (
                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                          )}
                          <span className="text-[10px] font-black uppercase tracking-widest sm:hidden">Copy</span>
                        </button>
                     </Tooltip>
                     <button onClick={handleTTS} className="flex-1 sm:flex-none p-3 md:p-4 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl transition-all border border-slate-700">
                        <svg className="w-5 h-5 md:w-6 md:h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                     </button>
                     <button onClick={handlePodcast} className="flex-[2] sm:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 md:py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl md:rounded-2xl font-black text-[8px] md:text-[10px] tracking-widest transition-all">
                        <span className="truncate">SIMULATE PODCAST</span>
                     </button>
                  </div>
               </div>

               <div className="p-6 md:p-12 space-y-8 md:space-y-12 bg-slate-950/40">
                  <div className="bg-slate-900/40 border border-slate-800 rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 text-sm md:text-lg text-slate-200 leading-[1.6] md:leading-[1.8] whitespace-pre-wrap font-medium">
                    {studioOutput.content}
                  </div>

                  <ImageGallery images={studioOutput.images} />

                  {studioOutput.sources && studioOutput.sources.length > 0 && (
                    <div className="pt-8 md:pt-12 border-t border-slate-800">
                       <h5 className="text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-widest mb-6 md:mb-8">Intelligence Sources</h5>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5">
                          {studioOutput.sources.map((source, idx) => (
                             source.web?.uri && (
                               <a key={idx} href={source.web.uri} target="_blank" rel="noopener noreferrer" className="p-4 md:p-5 bg-slate-900 hover:bg-slate-800 rounded-2xl md:rounded-3xl border border-slate-800 hover:border-blue-500 transition-all flex flex-col justify-between h-24 md:h-32 group">
                                  <div className="text-[9px] md:text-[10px] font-black text-blue-400 uppercase truncate group-hover:text-blue-300">
                                     {source.web.title || "External Intelligence"}
                                  </div>
                                  <div className="flex items-center justify-between mt-auto">
                                     <span className="text-[8px] text-slate-600 truncate max-w-[150px]">{source.web.uri}</span>
                                     <svg className="w-3 h-3 text-slate-700 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
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

          {!loading && !studioOutput && !videoUrl && !chartConfig && (
             <div className="h-[400px] md:h-[700px] border-4 border-dashed border-slate-900 rounded-[2rem] md:rounded-[4rem] flex flex-col items-center justify-center text-center p-8 md:p-20 opacity-30">
                <svg className="w-12 h-12 md:w-16 md:h-16 text-slate-700 mb-6 md:mb-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                <h3 className="text-xl md:text-3xl font-black text-slate-700 uppercase tracking-tighter mb-2 md:mb-4">No Insights Generated</h3>
                <p className="text-xs md:text-sm text-slate-500 font-medium max-w-xs leading-relaxed italic">Click "Initiate Synthesis" to start.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiInsights;
