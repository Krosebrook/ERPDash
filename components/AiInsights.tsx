import React, { useState, useEffect } from 'react';
import { 
  speakReport, 
  generateStudioDeliverable, 
  exploreConceptVariations, 
  deepResearchReport,
  generateVeoVideo,
  extendVeoVideo,
  generatePodcastAudio,
  generateLiveChart,
  DeliverableType,
  ChartConfig
} from '../services/geminiService';
import { Agent, StrategicVariation, GroundingSource } from '../types';
import Tooltip from './Tooltip';
import AudioPlayer from './AudioPlayer';
import VideoResult from './VideoResult';
import DynamicChart from './DynamicChart';
import ReasoningLog from './ReasoningLog';
import ImageGallery from './ImageGallery';

const AiInsights: React.FC<{ agents: Agent[] }> = ({ agents }) => {
  const [activeTab, setActiveTab] = useState<'studio' | 'variations' | 'settings'>('studio');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // Settings State
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [maskedKey, setMaskedKey] = useState<string>('');

  // Feature State
  const [studioOutput, setStudioOutput] = useState<{content: string, images: string[], type?: string, sources?: GroundingSource[]} | null>(null);
  const [studioMode, setStudioMode] = useState<'text' | 'video' | 'chart'>('text');
  const [deliverableType, setDeliverableType] = useState<DeliverableType>('report');
  const [tone, setTone] = useState('Professional');
  const [imageResolution, setImageResolution] = useState<'1K' | '2K' | '4K'>('1K');
  
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [lastVideoOperation, setLastVideoOperation] = useState<any>(null);
  const [chartConfig, setChartConfig] = useState<ChartConfig | null>(null);
  const [variations, setVariations] = useState<StrategicVariation[]>([]);
  
  const [conceptInput, setConceptInput] = useState('Scalable Autonomous Fleet Orchestration in Logistics');
  const [includeImages, setIncludeImages] = useState(true);

  // Audio State
  const [audioData, setAudioData] = useState<{ buffer: AudioBuffer; ctx: AudioContext; type: 'tts' | 'podcast' } | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      const active = await window.aistudio.hasSelectedApiKey();
      setHasKey(active);
      const key = process.env.API_KEY || '';
      if (key) {
        setMaskedKey(`${key.substring(0, 8)}...${key.substring(key.length - 4)}`);
      }
    };
    checkKey();
  }, [activeTab]);

  const handleConfigureKey = async () => {
    try {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      // Assume success as per race-condition guidelines
      setHasKey(true);
      setError(null);
    } catch (e) {
      console.error("Key selection failed", e);
    }
  };

  const handleApiCall = async (name: string, fn: () => Promise<void>) => {
    setLoading(true);
    setLoadingStep(name);
    setError(null);
    try {
      await fn();
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes("Requested entity was not found")) {
        setError("API Error: Selected key does not have access to high-fidelity models. Please re-configure API access.");
        setHasKey(false);
      } else {
        setError(e.message || "Execution failed. Check your configuration.");
      }
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleStudioGenerate = () => handleApiCall('Reasoning & Drafting...', async () => {
    setStudioOutput(null);
    setVideoUrl(null);
    setChartConfig(null);
    const result = await generateStudioDeliverable(deliverableType, conceptInput, includeImages, tone, imageResolution);
    setStudioOutput({ ...result, type: 'text' });
  });

  const handleDeepResearch = () => handleApiCall('Performing Deep Research Grounding...', async () => {
    setStudioOutput(null);
    setVideoUrl(null);
    setChartConfig(null);
    const result = await deepResearchReport(conceptInput);
    setStudioOutput({ content: result.content, images: [], type: 'research', sources: result.sources });
  });

  const handleVideoGenerate = () => handleApiCall('Initializing Veo-3.1 Engine...', async () => {
     setVideoUrl(null);
     setLastVideoOperation(null);
     const result = await generateVeoVideo(conceptInput);
     setVideoUrl(result.url);
     setLastVideoOperation(result.operation);
  });

  const handleVideoExtend = () => handleApiCall('Extending Cinematic Sequence...', async () => {
    if (!lastVideoOperation) return;
    const result = await extendVeoVideo(lastVideoOperation, conceptInput);
    setVideoUrl(result.url);
    setLastVideoOperation(result.operation);
  });

  const handleChartGenerate = () => handleApiCall('Synthesizing Data Structures...', async () => {
    setChartConfig(null);
    const config = await generateLiveChart(conceptInput);
    setChartConfig(config);
  });

  const handleExploreVariations = () => handleApiCall('Branching Strategic Logic...', async () => {
    setVariations([]);
    const result = await exploreConceptVariations(conceptInput);
    setVariations(result);
  });

  const handleTTS = () => handleApiCall('Narrating Report...', async () => {
    const textToSpeak = studioOutput?.content || "";
    if (!textToSpeak) return;
    setAudioData(null); 
    const result = await speakReport(textToSpeak);
    if (result) setAudioData({ buffer: (result as any).audioBuffer, ctx: (result as any).audioContext, type: 'tts' });
  });

  const handlePodcast = () => handleApiCall('Simulating Expert Discussion...', async () => {
    const context = studioOutput?.content || conceptInput;
    setAudioData(null);
    const result = await generatePodcastAudio(conceptInput, context);
    if (result) setAudioData({ buffer: (result as any).audioBuffer, ctx: (result as any).audioContext, type: 'podcast' });
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-700 max-w-7xl mx-auto min-h-[700px]">
      
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--border-color)] pb-8">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-[var(--text-primary)]">Gemini Pro Studio</h2>
          <p className="text-[var(--text-secondary)] text-sm mt-2 font-medium opacity-80">Orchestrate high-fidelity reasoning, Veo videos, and strategic branches.</p>
        </div>
        <div className="flex bg-[var(--bg-panel)] p-1 rounded-2xl border border-[var(--border-color)] shadow-inner">
          {(['studio', 'variations', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                activeTab === tab ? 'bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.4)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab === 'settings' ? (
                <div className="flex items-center gap-2">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                   Settings
                </div>
              ) : tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Control Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-3xl p-8 shadow-2xl sticky top-24 backdrop-blur-md">
            
            {activeTab === 'settings' ? (
              <div className="space-y-8 animate-in slide-in-from-right-4">
                <div>
                   <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-4 block">Project Configuration</label>
                   <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl p-6 shadow-inner">
                      <div className="flex items-center justify-between mb-4">
                         <span className="text-xs font-bold text-slate-400">Connection Status</span>
                         <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${hasKey ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${hasKey ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                            {hasKey ? 'Active' : 'Offline'}
                         </span>
                      </div>
                      
                      <div className="space-y-1 mb-6">
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Masked API Key</span>
                         <div className="text-sm font-mono text-blue-400 truncate tracking-tighter">
                            {hasKey && maskedKey ? maskedKey : '********************'}
                         </div>
                      </div>

                      <button 
                        onClick={handleConfigureKey}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                         {hasKey ? 'RE-CONFIGURE KEY' : 'SELECT API KEY'}
                      </button>
                   </div>
                </div>

                <div className="p-4 bg-blue-900/10 border border-blue-500/20 rounded-2xl">
                   <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Requirement Notice
                   </h4>
                   <p className="text-[10px] text-slate-400 leading-relaxed">
                      High-fidelity features (Veo, Gemini 3 Pro) require a paid API key from a billable GCP project.
                      <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline block mt-2 font-bold uppercase tracking-tighter">View Billing Docs →</a>
                   </p>
                </div>
              </div>
            ) : (
              <>
                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-4 block">Strategic Prompt</label>
                <textarea 
                  value={conceptInput}
                  onChange={(e) => setConceptInput(e.target.value)}
                  className="w-full h-40 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl p-5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-all duration-300 resize-none shadow-inner mb-6 font-medium leading-relaxed"
                  placeholder="Define your strategic objective..."
                />
                
                {activeTab === 'studio' && (
                  <div className="space-y-8 animate-in slide-in-from-top-4">
                    {/* Generation Mode */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                          { id: 'text', label: 'Draft', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                          { id: 'video', label: 'Veo', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
                          { id: 'chart', label: 'Viz', icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z' }
                      ].map(m => (
                          <button
                            key={m.id}
                            onClick={() => setStudioMode(m.id as any)}
                            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all duration-300 transform active:scale-95 ${
                                studioMode === m.id 
                                ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)] scale-[1.05]' 
                                : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-slate-600 hover:bg-[var(--bg-element)] hover:scale-[1.02]'
                            }`}
                          >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={m.icon} /></svg>
                              {m.label}
                          </button>
                      ))}
                    </div>

                    {studioMode === 'text' && (
                        <div className="space-y-6 pt-6 border-t border-[var(--border-color)]">
                            <div>
                                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] block mb-3">Deliverable Persona</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {(['report', 'code', 'presentation', 'data_model'] as DeliverableType[]).map((p) => (
                                        <button
                                        key={p}
                                        onClick={() => setDeliverableType(p)}
                                        className={`px-3 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all duration-500 transform active:scale-95 relative group overflow-hidden ${
                                            deliverableType === p 
                                            ? 'border-blue-500 bg-blue-600/15 text-white shadow-[0_0_30px_-5px_rgba(59,130,246,0.5)] ring-2 ring-blue-500/60 scale-[1.05]' 
                                            : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-blue-400/50 hover:bg-slate-800/40 hover:scale-[1.03] hover:text-white'
                                        }`}
                                        >
                                            <span className="relative z-10 flex items-center justify-center gap-2">
                                                {deliverableType === p && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                                )}
                                                {p.replace('_', ' ')}
                                            </span>
                                            {/* Background Glow Effect */}
                                            {deliverableType === p && (
                                                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-transparent to-blue-400/10 animate-in fade-in duration-700" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] block mb-1">Image Resolution</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['1K', '2K', '4K'] as const).map(res => (
                                        <button
                                            key={res}
                                            onClick={() => setImageResolution(res)}
                                            className={`py-2 rounded-xl border text-[10px] font-black transition-all ${
                                                imageResolution === res 
                                                ? 'border-blue-500 bg-blue-500/10 text-blue-400' 
                                                : 'border-[var(--border-color)] text-slate-500 hover:text-white'
                                            }`}
                                        >
                                            {res}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] block mb-3">Professional Tone</label>
                                <select 
                                    value={tone}
                                    onChange={(e) => setTone(e.target.value)}
                                    className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-4 text-xs text-[var(--text-primary)] focus:border-blue-500 outline-none hover:border-slate-600 transition-all font-bold cursor-pointer"
                                >
                                    <option value="Professional">Principal Consultant</option>
                                    <option value="Academic">Detailed Technical</option>
                                    <option value="Creative">Strategic Storyteller</option>
                                    <option value="Executive">Concise Board Member</option>
                                </select>
                            </div>
                            
                            <div className="flex items-center justify-between p-4 bg-[var(--bg-main)] rounded-2xl border border-[var(--border-color)]">
                                <span className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest">Concept Imagery</span>
                                <button 
                                    onClick={() => setIncludeImages(!includeImages)}
                                    className={`w-10 h-5 rounded-full transition-all duration-500 relative ${includeImages ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'bg-slate-800'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${includeImages ? 'left-6' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>
                    )}
                  </div>
                )}

                {/* Execute Button */}
                <div className="mt-10 space-y-3">
                  {activeTab === 'studio' ? (
                      <>
                        <button 
                            onClick={studioMode === 'text' ? handleStudioGenerate : studioMode === 'video' ? handleVideoGenerate : handleChartGenerate} 
                            disabled={loading || !hasKey} 
                            className={`w-full py-4 rounded-2xl font-black text-sm tracking-[0.1em] shadow-xl transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98] ${
                                studioMode === 'video' ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/20' : 
                                studioMode === 'chart' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20' :
                                'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'
                            }`}
                        >
                            {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                            {!hasKey ? 'CONFIGURE KEY FIRST' : studioMode === 'text' ? 'EXECUTE REASONING' : studioMode === 'video' ? 'RENDER VEO VIDEO' : 'VIZ DATA'}
                        </button>
                        {studioMode === 'video' && videoUrl && (
                           <button onClick={handleVideoExtend} disabled={loading || !hasKey} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black text-[10px] tracking-[0.15em] border border-slate-700 transition-all uppercase">
                               Extend Video (+7s)
                           </button>
                        )}
                        {studioMode === 'text' && (
                            <button onClick={handleDeepResearch} disabled={loading || !hasKey} className="w-full py-3 bg-[var(--bg-element)] text-[var(--text-secondary)] hover:text-white rounded-xl font-black text-[10px] tracking-[0.15em] border border-[var(--border-color)] disabled:opacity-50 transition-all uppercase">
                                Deep Context Research
                            </button>
                        )}
                      </>
                  ) : activeTab === 'variations' && (
                      <button 
                        onClick={handleExploreVariations} 
                        disabled={loading || !hasKey} 
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm tracking-[0.1em] shadow-xl shadow-blue-900/20 transition-all disabled:opacity-50 active:scale-[0.98]"
                      >
                        {!hasKey ? 'CONFIGURE KEY FIRST' : 'BRANCH STRATEGIC LOGIC'}
                      </button>
                  )}
                </div>
              </>
            )}
            
            {loading && (
                 <div className="mt-6 p-4 bg-blue-500/10 rounded-2xl flex items-center gap-4 animate-pulse border border-blue-500/20">
                     <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                     <span className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em]">{loadingStep}</span>
                 </div>
            )}
            {error && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-[10px] text-red-400 font-bold leading-relaxed flex flex-col gap-2">
                    <span className="flex items-center gap-2">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                       FAULT DETECTED
                    </span>
                    {error}
                    {error.includes("re-configure") && (
                       <button onClick={handleConfigureKey} className="text-[9px] underline text-left uppercase font-black hover:text-red-300">Open Selector Now →</button>
                    )}
                </div>
            )}
          </div>
        </div>

        {/* Right Output Column */}
        <div className="lg:col-span-8 space-y-8">
          
          {activeTab === 'settings' ? (
             <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-3xl p-12 shadow-2xl animate-in zoom-in-95 h-full min-h-[500px] flex flex-col justify-center text-center">
                <div className="max-w-md mx-auto space-y-6">
                   <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mx-auto border border-blue-500/20">
                      <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3c1.72 0 3.347.433 4.775 1.2a10 10 0 014.542 6.228" /></svg>
                   </div>
                   <h3 className="text-2xl font-black text-white uppercase tracking-tight">Access Control Center</h3>
                   <p className="text-sm text-slate-400 leading-relaxed font-medium">
                      This studio utilizes enterprise-tier models that require specialized project credentials. 
                      Your selected key is stored securely in the browser session and used exclusively for authenticated requests to Google Generative AI.
                   </p>
                   <div className="pt-6 border-t border-[var(--border-color)]">
                      <div className="grid grid-cols-2 gap-4 text-left">
                         <div className="p-4 bg-[var(--bg-main)] rounded-2xl border border-[var(--border-color)]">
                            <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">Data Residency</span>
                            <span className="text-xs font-bold text-slate-200">Global / Low Latency</span>
                         </div>
                         <div className="p-4 bg-[var(--bg-main)] rounded-2xl border border border-[var(--border-color)]">
                            <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">Security Tier</span>
                            <span className="text-xs font-bold text-slate-200">Managed TLS 1.3</span>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          ) : (
            <>
              {/* Active Audio Overlay */}
              {audioData && (
                <div className="animate-in slide-in-from-top-6 relative z-30">
                    <div className="absolute -top-3 left-6 px-3 py-1 bg-blue-600 rounded-lg text-[10px] font-black text-white uppercase tracking-[0.2em] shadow-2xl ring-2 ring-white/10">
                        {audioData.type === 'podcast' ? 'Simulated Intelligence Discussion' : 'Gemini Studio Narration'}
                    </div>
                    <AudioPlayer audioBuffer={audioData.buffer} audioContext={audioData.ctx} onClose={() => setAudioData(null)} />
                </div>
              )}

              {/* Multimedia Results */}
              {videoUrl && <VideoResult videoUrl={videoUrl} onClose={() => setVideoUrl(null)} />}
              {chartConfig && <div className="h-[550px] animate-in zoom-in-95 duration-500"><DynamicChart config={chartConfig} /></div>}

              {/* Deliverable Rendering */}
              {activeTab === 'studio' && studioOutput && (
                <div className="space-y-8 animate-in fade-in duration-700">
                  <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-3xl p-10 shadow-2xl relative overflow-hidden backdrop-blur-sm">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-8 border-b border-[var(--border-color)] pb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-black text-2xl text-white uppercase tracking-tight">
                                    {studioOutput.type === 'research' ? 'Strategic Intelligence Brief' : `${deliverableType} DELIVERABLE`}
                                </h3>
                                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30 font-black tracking-widest">{tone.toUpperCase()}</span>
                            </div>
                            <p className="text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-[0.2em] opacity-60">Authored by Gemini 3 Pro • Thinking Budget: 16k tokens</p>
                        </div>
                        <div className="flex gap-3">
                          <Tooltip content="Generate Multi-Speaker Intelligence Podcast">
                            <button onClick={handlePodcast} className="flex items-center gap-2 px-4 py-2 bg-purple-600/15 text-purple-400 hover:bg-purple-600/25 rounded-xl text-[10px] font-black tracking-widest transition-all border border-purple-500/20 active:scale-95">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                PODCAST
                            </button>
                          </Tooltip>
                          <Tooltip content="Narrate Full Content">
                            <button onClick={handleTTS} className="p-3 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all border border-slate-700 active:scale-95">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                            </button>
                          </Tooltip>
                        </div>
                    </div>
                    
                    <div className="prose prose-invert max-w-none">
                        <div className="bg-slate-950/50 border border-slate-800/50 rounded-2xl p-8 text-base text-slate-200 leading-[1.8] whitespace-pre-wrap font-medium selection:bg-blue-500/40">
                            {studioOutput.content}
                        </div>
                    </div>

                    {/* Citations & Grounding */}
                    {studioOutput.sources && studioOutput.sources.length > 0 && (
                        <div className="mt-10 pt-10 border-t border-[var(--border-color)]">
                            <h4 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.25em] mb-6 flex items-center gap-3">
                                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Verified Intelligence Sources
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {studioOutput.sources.map((s, i) => {
                                    if (s.web?.uri) {
                                        return (
                                            <a key={i} href={s.web.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-4 p-4 bg-slate-900 hover:bg-slate-800 rounded-2xl border border-slate-800 hover:border-blue-500 transition-all group animate-in slide-in-from-bottom-2">
                                                <div className="flex-1 overflow-hidden">
                                                    <div className="text-[10px] text-blue-400 font-black truncate mb-1">{s.web.title || 'Untitled Report'}</div>
                                                    <div className="text-[9px] text-slate-500 truncate font-mono">{s.web.uri}</div>
                                                </div>
                                                <svg className="w-4 h-4 text-slate-700 group-hover:text-blue-400 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                            </a>
                                        );
                                    }
                                    return null;
                                })}
                            </div>
                        </div>
                    )}
                  </div>

                  <ImageGallery images={studioOutput.images} />
                </div>
              )}

              {/* Strategic Variations Rendering */}
              {activeTab === 'variations' && variations.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-6 duration-700">
                    {variations.map((v, i) => (
                      <div key={i} className="bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:border-blue-500/40 transition-all duration-500 flex flex-col shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                            <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                        </div>
                        <div className="flex justify-between items-start mb-6">
                          <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.25em] bg-blue-500/5 px-2 py-1 rounded border border-blue-500/20">{v.strategicFocus}</span>
                          <Tooltip content="Risk Probability Score">
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${v.riskScore > 7 ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                {v.riskScore}/10
                            </span>
                          </Tooltip>
                        </div>
                        <h4 className="font-black text-white mb-4 text-xl tracking-tight leading-tight">{v.variantName}</h4>
                        <div className="flex items-center gap-2 mb-6 opacity-60">
                            <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p className="text-[10px] font-black uppercase tracking-widest">{v.implementationTimeline}</p>
                        </div>
                        <div className="space-y-4 mb-8 flex-1">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Strategic Benefits</p>
                          <ul className="space-y-3">
                            {v.pros.map((p, j) => (
                                <li key={j} className="text-xs text-slate-300 flex gap-2 leading-relaxed">
                                    <span className="text-blue-500 font-bold tracking-tight">/</span>
                                    {p}
                                </li>
                            ))}
                          </ul>
                        </div>
                        <div className="pt-6 border-t border-slate-800 flex justify-between items-center">
                          <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Resources Required</div>
                          <div className="text-[10px] font-bold text-slate-400">{v.resourceRequirements}</div>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Enhanced Tab-Specific Empty States */}
              {!loading && activeTab === 'studio' && !studioOutput && !videoUrl && !chartConfig && (
                <div className="h-[500px] flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-[3rem] animate-in fade-in group bg-slate-900/10">
                    <div className="p-10 bg-slate-900/50 rounded-full mb-6 group-hover:bg-blue-600/10 transition-colors border border-slate-800 shadow-inner">
                        <svg className="w-16 h-16 opacity-20 group-hover:opacity-100 group-hover:text-blue-500 transition-all duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    </div>
                    <h3 className="text-lg font-black text-slate-400 uppercase tracking-[0.2em]">Studio Idle</h3>
                    <p className="text-xs text-slate-500 mt-3 font-medium tracking-wide">No insights generated yet. Click the button above to start.</p>
                </div>
              )}

              {!loading && activeTab === 'variations' && variations.length === 0 && (
                <div className="h-[500px] flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-[3rem] animate-in fade-in group bg-slate-900/10">
                    <div className="p-10 bg-slate-900/50 rounded-full mb-6 group-hover:bg-purple-600/10 transition-colors border border-slate-800 shadow-inner">
                        <svg className="w-16 h-16 opacity-20 group-hover:opacity-100 group-hover:text-purple-500 transition-all duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                    </div>
                    <h3 className="text-lg font-black text-slate-400 uppercase tracking-[0.2em]">Variations Explorer</h3>
                    <p className="text-xs text-slate-500 mt-3 font-medium tracking-wide">No variations generated yet. Click the button above to start.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiInsights;