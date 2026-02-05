import React, { useState } from 'react';
import { analyzeMetrics, getComplianceUpdate, speakReport, generateStudioDeliverable, exploreConceptVariations, DeliverableType } from '../services/geminiService';
import { Agent } from '../types';
import Tooltip from './Tooltip';
import AudioPlayer from './AudioPlayer';

const AiInsights: React.FC<{ agents: Agent[] }> = ({ agents }) => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'studio' | 'variations' | 'guide'>('analysis');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // Feature State
  const [insight, setInsight] = useState<string | null>(null);
  const [compliance, setCompliance] = useState<any | null>(null);
  const [studioOutput, setStudioOutput] = useState<string | null>(null);
  const [deliverableType, setDeliverableType] = useState<DeliverableType>('report');
  const [variations, setVariations] = useState<any[]>([]);
  const [conceptInput, setConceptInput] = useState('Dynamic Multi-Tenant Agent Scaling Strategy');

  // UI State
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<{ buffer: AudioBuffer; ctx: AudioContext } | null>(null);

  const handleApiCall = async (fn: () => Promise<void>) => {
    setLoading(true);
    setError(null);
    try {
      await fn();
    } catch (e: any) {
      console.error(e);
      let msg = "An unexpected error occurred.";
      if (e.message.includes("API Key")) msg = "Missing API Key configuration.";
      if (e.message.includes("403")) msg = "Access Denied. Check API Key permissions.";
      if (e.message.includes("503")) msg = "Service unavailable. Please try again later.";
      if (e.message.includes("JSON")) msg = "AI Response Malformed. Please retry.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = () => handleApiCall(async () => {
    const result = await analyzeMetrics(agents);
    setInsight(result);
  });

  const handleStudioGenerate = () => handleApiCall(async () => {
    const result = await generateStudioDeliverable(deliverableType, conceptInput);
    setStudioOutput(result);
  });

  const handleExploreVariations = () => handleApiCall(async () => {
    const result = await exploreConceptVariations(conceptInput);
    setVariations(result);
  });

  const handleCompliance = () => handleApiCall(async () => {
    const result = await getComplianceUpdate();
    setCompliance(result);
  });

  const handleTTS = () => handleApiCall(async () => {
    if (!insight) return;
    // Clear previous audio before generating new one to prevent context overlap
    setAudioData(null); 
    const result = await speakReport(insight);
    if (result) {
        setAudioData({ buffer: result.audioBuffer, ctx: result.audioContext });
    }
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const tabDescriptions = {
    analysis: 'Deep-reasoning performance analysis',
    studio: 'High-fidelity professional deliverables',
    variations: 'Strategic concept branch exploration',
    guide: 'Gemini advanced prompting manual'
  };

  const personas = [
    { 
      id: 'report' as DeliverableType, 
      title: 'Principal Consultant', 
      subtitle: 'Management Specialist',
      desc: 'Optimized for executive reports, strategic plans, and data-driven insights.' 
    },
    { 
      id: 'code' as DeliverableType, 
      title: 'Senior Staff Engineer', 
      subtitle: 'Architecture Lead',
      desc: 'Optimized for production-ready code, SOLID design patterns, and documentation.' 
    },
    { 
      id: 'presentation' as DeliverableType, 
      title: 'Head of Design', 
      subtitle: 'Creative Director',
      desc: 'Optimized for slide-by-slide outlines, visual layout cues, and high-impact headlines.' 
    },
    { 
      id: 'data_model' as DeliverableType, 
      title: 'Lead Data Architect', 
      subtitle: 'Infrastructure Specialist',
      desc: 'Optimized for complex schemas, entity relationships, and database optimization.' 
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700 max-w-7xl mx-auto relative">
      
      {/* Settings Modal */}
      {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 p-8">
               <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Gemini Configuration</h3>
               <p className="text-[var(--text-secondary)] text-sm mb-6">Global settings for the EPB Pro Studio engine.</p>
               
               <div className="space-y-4">
                  <div>
                      <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest block mb-2">Gemini API Key</label>
                      <div className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-green-500 font-mono text-sm flex items-center gap-2 shadow-inner">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                         Securely Managed by Environment
                      </div>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-2">API Keys are injected via the secure <code>process.env.API_KEY</code> variable.</p>
                  </div>
                  
                  <div>
                      <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest block mb-2">Default Region</label>
                       <select className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-[var(--text-primary)] text-sm focus:border-blue-500 focus:outline-none transition-colors">
                           <option>us-central1 (Iowa)</option>
                           <option>europe-west4 (Netherlands)</option>
                           <option>asia-northeast1 (Tokyo)</option>
                       </select>
                  </div>
               </div>

               <div className="flex justify-end gap-3 mt-8">
                   <button onClick={() => setShowSettings(false)} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors">Close</button>
               </div>
            </div>
          </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Gemini Pro Studio</h2>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Enterprise-grade output engine powered by Google GenAI</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="flex bg-[var(--bg-panel)] p-1 rounded-xl border border-[var(--border-color)] shadow-inner">
            {(['analysis', 'studio', 'variations', 'guide'] as const).map((tab) => (
                <Tooltip key={tab} content={tabDescriptions[tab]} position="bottom">
                <button
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    activeTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                >
                    {tab}
                </button>
                </Tooltip>
            ))}
            </div>
            <Tooltip content="Configure Gemini Studio">
                <button onClick={() => setShowSettings(true)} className="p-2.5 bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)] transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
            </Tooltip>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Input & Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xl">
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-3 block">Context / Concept</label>
            <textarea 
              value={conceptInput}
              onChange={(e) => setConceptInput(e.target.value)}
              className="w-full h-32 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-colors resize-none shadow-inner mb-6"
              placeholder="Enter the concept or strategy to process..."
            />
            
            {activeTab === 'studio' && (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest block">Select Professional Persona</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {personas.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setDeliverableType(p.id)}
                      className={`text-left p-4 rounded-xl border transition-all duration-300 flex flex-col gap-1 group relative overflow-hidden transform ${
                        deliverableType === p.id 
                        ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.2)] scale-[1.02] ring-1 ring-blue-500/50' 
                        : 'border-[var(--border-color)] bg-[var(--bg-main)] hover:border-blue-400/50 hover:shadow-xl hover:scale-[1.03] hover:-translate-y-1'
                      }`}
                    >
                      <div className="flex justify-between items-center z-10 relative">
                        <span className={`text-xs font-bold uppercase tracking-wide transition-colors ${deliverableType === p.id ? 'text-blue-400' : 'text-[var(--text-primary)] group-hover:text-blue-300'}`}>
                          {p.title}
                        </span>
                        {deliverableType === p.id && (
                          <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center animate-in zoom-in">
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-[var(--text-secondary)] font-medium z-10 relative">{p.subtitle}</span>
                      <p className="text-[9px] text-[var(--text-secondary)] mt-1 leading-relaxed z-10 relative opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-2 left-4">{p.desc}</p>
                      
                      {/* Hover Effect Background */}
                      <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${deliverableType === p.id ? 'opacity-100' : ''}`}></div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 space-y-3">
              {activeTab === 'analysis' && (
                <Tooltip content="Launch Gemini-3-Pro with Deep Reasoning" position="right" className="w-full">
                  <button onClick={handleAnalyze} disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2">
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Start Reasoning Analysis'}
                  </button>
                </Tooltip>
              )}
              {activeTab === 'studio' && (
                <Tooltip content="Generate finalized professional content with enhanced fidelity" position="right" className="w-full">
                  <button onClick={handleStudioGenerate} disabled={loading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center gap-2">
                     {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Generate Deliverable'}
                  </button>
                </Tooltip>
              )}
              {activeTab === 'variations' && (
                <Tooltip content="Execute strategic branch brainstorming with reasoning" position="right" className="w-full">
                  <button onClick={handleExploreVariations} disabled={loading} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center gap-2">
                     {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Explore Variations'}
                  </button>
                </Tooltip>
              )}
              <Tooltip content="Query Google Search for latest web data" position="right" className="w-full">
                <button onClick={handleCompliance} disabled={loading} className="w-full py-3 bg-[var(--bg-element)] hover:bg-[var(--border-color)] text-[var(--text-primary)] rounded-xl font-bold text-sm transition-all border border-[var(--border-color)]">
                  Ground via Google Search
                </button>
              </Tooltip>
            </div>
            
            {/* Error Message Box */}
            {error && (
                <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded-xl animate-in slide-in-from-top-2">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <div>
                            <h4 className="text-xs font-bold text-red-400 uppercase">Connection Error</h4>
                            <p className="text-xs text-red-300 mt-1 leading-relaxed">{error}</p>
                        </div>
                    </div>
                </div>
            )}
          </div>

          {/* Prompting Guide Snippet */}
          <div className="bg-blue-900/10 border border-blue-500/20 rounded-2xl p-6">
            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Pro Tip: System Personas</h4>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed italic">
              "Fidelity increases by 30% when you assign a high-status persona. Instead of 'Write a report', use 'You are a Senior Solutions Architect with 20 years of experience...'"
            </p>
          </div>
        </div>

        {/* Right Column: Dynamic Results */}
        <div className="lg:col-span-8 space-y-6">
          {activeTab === 'analysis' && (
            <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl p-8 min-h-[500px] shadow-2xl flex flex-col relative overflow-hidden transition-all duration-300">
               {loading && (
                 <div className="absolute inset-0 bg-[var(--bg-panel)]/90 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300">
                   <div className="flex flex-col items-center gap-6">
                     <div className="relative">
                       <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full"></div>
                       <div className="absolute top-0 left-0 w-16 h-16 border-4 border-t-blue-500 rounded-full animate-spin"></div>
                     </div>
                     <div className="text-center">
                        <h4 className="text-lg font-bold text-[var(--text-primary)] mb-1">Analyzing Telemetry</h4>
                        <span className="text-sm font-mono text-blue-400 animate-pulse">Consulting Gemini 3 Pro...</span>
                     </div>
                   </div>
                 </div>
               )}
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-[var(--text-primary)]">Deep Reasoning Insights</h3>
                <div className="flex items-center gap-4">
                     {insight && (
                        <Tooltip content={copiedId === 'analysis' ? "Copied!" : "Copy text to clipboard"}>
                            <button 
                                onClick={() => handleCopy(insight, 'analysis')}
                                className="p-2 bg-[var(--bg-element)] rounded-full hover:bg-[var(--border-color)] text-[var(--text-secondary)] transition-all hover:text-blue-400"
                            >
                                {copiedId === 'analysis' ? (
                                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                )}
                            </button>
                        </Tooltip>
                    )}
                    {insight && !audioData && (
                        <Tooltip content="Play professional audio narration of this report">
                            <button onClick={handleTTS} disabled={loading} className="p-2 bg-[var(--bg-element)] rounded-full hover:bg-[var(--border-color)] text-[var(--text-secondary)] transition-all hover:text-blue-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                            </button>
                        </Tooltip>
                    )}
                </div>
              </div>

              {/* Audio Player Integration */}
              {audioData && (
                 <div className="mb-6 animate-in slide-in-from-top-4">
                    <AudioPlayer 
                        audioBuffer={audioData.buffer} 
                        audioContext={audioData.ctx} 
                        onClose={() => setAudioData(null)}
                    />
                 </div>
              )}

              <div className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-6 text-[var(--text-primary)] text-sm leading-relaxed whitespace-pre-wrap shadow-inner min-h-[400px] flex-1 relative">
                {insight ? insight : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-secondary)] gap-4 animate-in fade-in">
                        <div className="w-16 h-16 rounded-full bg-[var(--bg-panel)] border border-[var(--border-color)] flex items-center justify-center shadow-lg">
                            <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <div className="text-center max-w-xs">
                          <p className="font-bold text-[var(--text-primary)] mb-1">No insights generated yet</p>
                          <p className="text-xs">Click the "Start Reasoning Analysis" button above to start.</p>
                        </div>
                    </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'studio' && (
            <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl p-8 min-h-[500px] shadow-2xl relative overflow-hidden transition-all duration-300">
               {loading && (
                 <div className="absolute inset-0 bg-[var(--bg-panel)]/90 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300">
                   <div className="flex flex-col items-center gap-6">
                     <div className="relative">
                       <div className="w-16 h-16 border-4 border-indigo-500/20 rounded-full"></div>
                       <div className="absolute top-0 left-0 w-16 h-16 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
                     </div>
                     <div className="text-center">
                        <h4 className="text-lg font-bold text-[var(--text-primary)] mb-1">Drafting Content</h4>
                        <span className="text-sm font-mono text-indigo-400 animate-pulse">Running {deliverableType.toUpperCase()} Pipeline...</span>
                     </div>
                   </div>
                 </div>
               )}
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-[var(--text-primary)] uppercase tracking-wider">Professional {deliverableType.replace('_', ' ')}</h3>
                {studioOutput && (
                  <Tooltip content={copiedId === 'studio' ? "Copied!" : "Copy deliverable to clipboard"}>
                    <button 
                        onClick={() => handleCopy(studioOutput, 'studio')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border ${
                            copiedId === 'studio' 
                            ? 'bg-green-500/10 text-green-500 border-green-500/50' 
                            : 'bg-[var(--bg-element)] text-[var(--text-secondary)] border-[var(--border-color)] hover:text-blue-400 hover:border-blue-400/50'
                        }`}
                    >
                         {copiedId === 'studio' ? (
                            <>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Copied!
                            </>
                         ) : (
                            <>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                Copy Output
                            </>
                         )}
                    </button>
                  </Tooltip>
                )}
              </div>
              <div className={`bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-6 ${deliverableType === 'code' ? 'font-mono text-xs text-blue-400' : 'text-[var(--text-primary)] text-sm'} leading-relaxed whitespace-pre-wrap shadow-inner min-h-[400px] relative`}>
                {studioOutput ? studioOutput : (
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-secondary)] gap-4 animate-in fade-in">
                        <div className="w-16 h-16 rounded-full bg-[var(--bg-panel)] border border-[var(--border-color)] flex items-center justify-center shadow-lg">
                             <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </div>
                        <div className="text-center max-w-xs">
                          <p className="font-bold text-[var(--text-primary)] mb-1">Workspace Empty</p>
                          <p className="text-xs">Select a persona on the left and click "Generate Deliverable" to start.</p>
                        </div>
                     </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'variations' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative min-h-[300px]">
                {loading && (
                 <div className="absolute inset-0 bg-[var(--bg-panel)]/90 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in rounded-2xl">
                   <div className="flex flex-col items-center gap-6">
                     <div className="relative">
                       <div className="w-16 h-16 border-4 border-purple-500/20 rounded-full"></div>
                       <div className="absolute top-0 left-0 w-16 h-16 border-4 border-t-purple-500 rounded-full animate-spin"></div>
                     </div>
                     <div className="text-center">
                        <h4 className="text-lg font-bold text-[var(--text-primary)] mb-1">Exploring Strategy</h4>
                        <span className="text-sm font-mono text-purple-400 animate-pulse">Simulating 3 Scenarios...</span>
                     </div>
                   </div>
                 </div>
               )}
              {variations.length > 0 ? variations.map((v, i) => (
                <div key={i} className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl p-5 hover:border-purple-500/30 transition-all flex flex-col shadow-xl">
                  <span className="text-[10px] font-bold text-purple-400 uppercase mb-1">{v.variantName}</span>
                  <h4 className="font-bold text-[var(--text-primary)] mb-3">{v.strategicFocus}</h4>
                  <div className="space-y-3 flex-1">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">Pros</p>
                      {v.pros.map((p: string, j: number) => <div key={j} className="text-[11px] text-green-500/80">• {p}</div>)}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[var(--border-color)] text-[11px] text-[var(--text-secondary)]">
                    Timeline: <span className="text-[var(--text-primary)] font-bold">{v.implementationTimeline || 'N/A'}</span>
                  </div>
                </div>
              )) : (
                <div className="col-span-3 bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl p-10 text-center text-[var(--text-secondary)] shadow-xl flex flex-col items-center justify-center gap-6 h-full">
                    <div className="w-16 h-16 rounded-full bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-center shadow-lg">
                         <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    </div>
                   <div className="text-center max-w-sm">
                      <p className="font-bold text-[var(--text-primary)] mb-1">Strategic Map Blank</p>
                      <p className="text-sm">Click "Explore Variations" to let Gemini 3 brainstorm aggressive, secure, and efficient strategic branches.</p>
                   </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl p-8 space-y-8 shadow-2xl">
              <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">Mastering Gemini Fidelity</h3>
                <p className="text-[var(--text-secondary)] text-sm mb-6">Techniques used in this studio to ensure professional-grade results:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <Tooltip content="Increases reasoning accuracy for complex tasks">
                     <div className="p-5 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)] cursor-help hover:border-blue-500/30 transition-colors">
                       <h5 className="font-bold text-blue-400 mb-2">Thinking Budget</h5>
                       <p className="text-xs text-[var(--text-secondary)] leading-relaxed">By setting <code>thinkingConfig</code>, we force the model to reason through chain-of-thought steps before outputting.</p>
                     </div>
                   </Tooltip>
                   <Tooltip content="Eliminates hallucinations with real-time web data">
                     <div className="p-5 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)] cursor-help hover:border-green-500/30 transition-colors">
                       <h5 className="font-bold text-green-400 mb-2">Search Grounding</h5>
                       <p className="text-xs text-[var(--text-secondary)] leading-relaxed">The <code>googleSearch</code> tool retrieves current web data, essential for compliance and market analysis.</p>
                     </div>
                   </Tooltip>
                   <Tooltip content="Enforces strict structured JSON interfaces">
                     <div className="p-5 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)] cursor-help hover:border-purple-500/30 transition-colors">
                       <h5 className="font-bold text-purple-400 mb-2">Response Schemas</h5>
                       <p className="text-xs text-[var(--text-secondary)] leading-relaxed">Using <code>responseSchema</code> ensures that machine-readable outputs follow the correct interface.</p>
                     </div>
                   </Tooltip>
                   <Tooltip content="High-fidelity voice synthesis for reports">
                     <div className="p-5 bg-[var(--bg-main)] rounded-xl border border-[var(--border-color)] cursor-help hover:border-orange-500/30 transition-colors">
                       <h5 className="font-bold text-orange-400 mb-2">Multi-Modal TTS</h5>
                       <p className="text-xs text-[var(--text-secondary)] leading-relaxed">Professional audio synthesis allows for 'eyes-free' executive updates, converting dense reports into narrated summaries.</p>
                     </div>
                   </Tooltip>
                </div>
              </div>
            </div>
          )}

          {/* Grounding Source Footer */}
          {compliance && (
             <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl p-6 animate-in slide-in-from-top-4 duration-500 shadow-2xl relative overflow-hidden">
                {loading && (
                 <div className="absolute inset-0 bg-[var(--bg-panel)]/80 backdrop-blur-sm flex items-center justify-center z-10 animate-in fade-in">
                   <div className="flex flex-col items-center gap-4">
                     <div className="w-10 h-10 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
                   </div>
                 </div>
               )}
                <h3 className="text-xs font-bold text-green-400 uppercase tracking-widest mb-4">Verified Grounding Sources</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {compliance.sources?.map((s: any, i: number) => s.web && (
                    <Tooltip key={i} content="Visit authoritative web source" position="top" className="w-full">
                      <a href={s.web.uri} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-[var(--bg-main)] rounded-lg border border-[var(--border-color)] hover:border-blue-500/40 transition-all">
                         <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center text-blue-400 text-[10px] font-bold">PDF</div>
                         <div className="overflow-hidden">
                           <div className="text-xs font-bold text-[var(--text-primary)] truncate">{s.web.title}</div>
                           <div className="text-[10px] text-[var(--text-secondary)] truncate">{s.web.uri}</div>
                         </div>
                      </a>
                    </Tooltip>
                  ))}
                </div>
                <div className="mt-4 text-xs text-[var(--text-secondary)] bg-[var(--bg-main)] p-4 rounded-lg border border-[var(--border-color)] leading-relaxed">
                  {compliance.text}
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiInsights;