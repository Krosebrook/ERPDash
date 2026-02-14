
import React, { useState } from 'react';
import { 
  analyzeMetrics, 
  getComplianceUpdate, 
  speakReport, 
  generateStudioDeliverable, 
  exploreConceptVariations, 
  deepResearchReport,
  generateVeoVideo,
  generatePodcastAudio,
  generateLiveChart,
  DeliverableType,
  ChartConfig
} from '../services/geminiService';
import { Agent } from '../types';
import Tooltip from './Tooltip';
import AudioPlayer from './AudioPlayer';
import VideoResult from './VideoResult';
import DynamicChart from './DynamicChart';
import ReasoningLog from './ReasoningLog';
import ImageGallery from './ImageGallery';

const AiInsights: React.FC<{ agents: Agent[] }> = ({ agents }) => {
  const [activeTab, setActiveTab] = useState<'studio' | 'variations' | 'guide'>('studio');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // Feature State
  const [studioOutput, setStudioOutput] = useState<{content: string, images: string[], type?: string, sources?: any[]} | null>(null);
  const [studioMode, setStudioMode] = useState<'text' | 'video' | 'chart'>('text');
  const [deliverableType, setDeliverableType] = useState<DeliverableType>('report');
  const [tone, setTone] = useState('Professional'); // New Tone State
  
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [chartConfig, setChartConfig] = useState<ChartConfig | null>(null);
  const [variations, setVariations] = useState<any[]>([]);
  
  const [conceptInput, setConceptInput] = useState('Sustainable Multi-Tenant AI Orchestration');
  const [includeImages, setIncludeImages] = useState(true);

  // Audio State
  const [audioData, setAudioData] = useState<{ buffer: AudioBuffer; ctx: AudioContext; type: 'tts' | 'podcast' } | null>(null);

  const handleApiCall = async (name: string, fn: () => Promise<void>) => {
    setLoading(true);
    setLoadingStep(name);
    setError(null);
    try {
      await fn();
    } catch (e: any) {
      console.error(e);
      setError(e.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  // 1. Text/Report Generation
  const handleStudioGenerate = () => handleApiCall('Generating Reasoning Chain...', async () => {
    setStudioOutput(null);
    // Pass Tone
    const result = await generateStudioDeliverable(deliverableType, conceptInput, includeImages, tone);
    setStudioOutput({ ...result, type: 'text' });
  });

  const handleDeepResearch = () => handleApiCall('Searching & Synthesizing...', async () => {
    setStudioOutput(null);
    const result = await deepResearchReport(conceptInput);
    setStudioOutput({ content: result.content, images: [], type: 'research', sources: result.sources });
  });

  // 2. Video Generation (Veo)
  const handleVideoGenerate = () => handleApiCall('Initializing Veo-3.1...', async () => {
     setVideoUrl(null);
     const url = await generateVeoVideo(conceptInput);
     setVideoUrl(url);
  });

  // 3. Chart Generation (Vis)
  const handleChartGenerate = () => handleApiCall('Computing Visualization...', async () => {
    setChartConfig(null);
    const config = await generateLiveChart(conceptInput);
    setChartConfig(config);
  });

  // 4. Variations
  const handleExploreVariations = () => handleApiCall('Branching Strategies...', async () => {
    const result = await exploreConceptVariations(conceptInput);
    setVariations(result);
  });

  // 5. Audio Handlers
  const handleTTS = () => handleApiCall('Synthesizing Speech...', async () => {
    const textToSpeak = studioOutput?.content || "";
    if (!textToSpeak) return;
    setAudioData(null); 
    const result = await speakReport(textToSpeak);
    if (result) setAudioData({ buffer: result.audioBuffer, ctx: result.audioContext, type: 'tts' });
  });

  const handlePodcast = () => handleApiCall('Recording Multi-Speaker Podcast...', async () => {
    const context = studioOutput?.content || conceptInput;
    setAudioData(null);
    const result = await generatePodcastAudio(conceptInput, context);
    if (result) setAudioData({ buffer: result.audioBuffer, ctx: result.audioContext, type: 'podcast' });
  });

  const getDeliverableIcon = (type: DeliverableType) => {
    switch (type) {
        case 'report': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
        case 'code': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;
        case 'presentation': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>;
        case 'data_model': return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 max-w-7xl mx-auto relative min-h-[600px]">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Gemini Pro Studio</h2>
          <p className="text-[var(--text-secondary)] text-sm mt-1">High-fidelity reasoning, Veo video generation, and multimodal deliverables.</p>
        </div>
        <div className="flex bg-[var(--bg-panel)] p-1 rounded-xl border border-[var(--border-color)]">
          {(['studio', 'variations'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xl sticky top-24">
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-3 block">Contextual Prompt</label>
            <textarea 
              value={conceptInput}
              onChange={(e) => setConceptInput(e.target.value)}
              className="w-full h-32 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-colors resize-none shadow-inner mb-6"
            />
            
            {activeTab === 'studio' && (
              <div className="space-y-6 animate-in slide-in-from-top-2">
                
                {/* Mode Selection */}
                <div className="grid grid-cols-3 gap-2">
                   {[
                       { id: 'text', label: 'Report', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                       { id: 'video', label: 'Veo Video', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
                       { id: 'chart', label: 'Data Viz', icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z' }
                   ].map(m => (
                       <button
                         key={m.id}
                         onClick={() => setStudioMode(m.id as any)}
                         className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border text-[10px] font-bold uppercase transition-all ${
                             studioMode === m.id 
                             ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-inner' 
                             : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-slate-500 hover:bg-[var(--bg-element)]'
                         }`}
                       >
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={m.icon} /></svg>
                           {m.label}
                       </button>
                   ))}
                </div>

                {/* Sub-options for Text Mode */}
                {studioMode === 'text' && (
                    <div className="space-y-4 pt-4 border-t border-[var(--border-color)]">
                        <div>
                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase block mb-2">Target Persona</label>
                            <div className="grid grid-cols-2 gap-3">
                                {(['report', 'code', 'presentation', 'data_model'] as DeliverableType[]).map((p) => (
                                    <button
                                    key={p}
                                    onClick={() => setDeliverableType(p)}
                                    className={`
                                        flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 relative overflow-hidden group
                                        ${deliverableType === p 
                                            ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)] ring-1 ring-blue-500' 
                                            : 'border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:border-blue-400 hover:scale-[1.03] hover:shadow-lg'
                                        }
                                    `}
                                    >
                                        <div className={`mb-2 transition-transform duration-300 ${deliverableType === p ? 'scale-110' : 'group-hover:scale-110'}`}>
                                            {getDeliverableIcon(p)}
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider">{p.replace('_', ' ')}</span>
                                        {deliverableType === p && (
                                            <div className="absolute inset-0 bg-blue-400/5 mix-blend-overlay animate-pulse pointer-events-none" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase block mb-2">Tone & Style</label>
                            <select 
                                value={tone}
                                onChange={(e) => setTone(e.target.value)}
                                className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg p-3 text-xs text-[var(--text-primary)] focus:border-blue-500 outline-none hover:border-[var(--text-secondary)] transition-colors cursor-pointer"
                            >
                                <option value="Professional">Professional & Direct</option>
                                <option value="Academic">Academic & Detailed</option>
                                <option value="Creative">Creative & Storytelling</option>
                                <option value="Executive">Executive Summary (Concise)</option>
                            </select>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-xs font-bold text-[var(--text-secondary)]">Include Concept Art</span>
                            <button 
                                onClick={() => setIncludeImages(!includeImages)}
                                className={`w-8 h-4 rounded-full transition-colors relative ${includeImages ? 'bg-blue-600' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${includeImages ? 'left-4.5' : 'left-0.5'}`} />
                            </button>
                        </div>
                    </div>
                )}
              </div>
            )}

            {/* Execute Buttons */}
            <div className="mt-8 space-y-3">
              {activeTab === 'studio' ? (
                  <>
                    {studioMode === 'text' && (
                        <button 
                            onClick={handleStudioGenerate} 
                            disabled={loading} 
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            Execute Reasoning
                        </button>
                    )}
                    {studioMode === 'video' && (
                        <button 
                            onClick={handleVideoGenerate} 
                            disabled={loading} 
                            className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            Generate Veo Video
                        </button>
                    )}
                    {studioMode === 'chart' && (
                        <button 
                            onClick={handleChartGenerate} 
                            disabled={loading} 
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            Visualize Data
                        </button>
                    )}
                  </>
              ) : (
                  <button 
                    onClick={handleExploreVariations} 
                    disabled={loading} 
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50"
                  >
                    Generate Strategic Branches
                  </button>
              )}
              
              {/* Secondary Actions */}
              {activeTab === 'studio' && studioMode === 'text' && (
                 <button onClick={handleDeepResearch} disabled={loading} className="w-full py-2 bg-[var(--bg-element)] text-[var(--text-secondary)] rounded-xl font-bold text-xs border border-[var(--border-color)] disabled:opacity-50 hover:bg-[var(--bg-panel)] transition-colors">
                    Deep Research (Reasoning + Search)
                 </button>
              )}
            </div>
            
            {/* Status Bar */}
            {loading && (
                 <div className="mt-4 p-3 bg-blue-500/10 rounded-lg flex items-center gap-3 animate-pulse">
                     <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                     <span className="text-xs text-blue-400 font-mono">{loadingStep}</span>
                 </div>
            )}
            {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 break-words">
                    {error}
                </div>
            )}
          </div>
        </div>

        {/* Right Column: Output */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Audio Player */}
          {audioData && (
             <div className="animate-in slide-in-from-top-4 relative z-20">
                <div className="absolute -top-3 left-4 px-2 py-0.5 bg-blue-600 rounded text-[9px] font-bold text-white uppercase tracking-wider shadow-lg">
                    {audioData.type === 'podcast' ? 'GEMINI 2.5 PODCAST' : 'GEMINI TTS READOUT'}
                </div>
                <AudioPlayer audioBuffer={audioData.buffer} audioContext={audioData.ctx} onClose={() => setAudioData(null)} />
             </div>
          )}

          {/* Veo Video Result */}
          {videoUrl && (
              <VideoResult videoUrl={videoUrl} onClose={() => setVideoUrl(null)} />
          )}

          {/* Dynamic Chart Result */}
          {chartConfig && (
              <div className="h-[500px] animate-in zoom-in-95">
                  <DynamicChart config={chartConfig} />
              </div>
          )}

          {/* Text Deliverables */}
          {activeTab === 'studio' && studioOutput && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                 <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 border-b border-[var(--border-color)] pb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg text-white uppercase tracking-wider">
                                {studioOutput.type === 'research' ? 'Deep Research Report' : `Professional ${deliverableType}`}
                            </h3>
                            {tone && studioOutput.type !== 'research' && (
                                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">{tone} Mode</span>
                            )}
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">Generated by gemini-3-pro-preview • {new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                       <Tooltip content="Generate Multi-Speaker Podcast Discussion">
                        <button onClick={handlePodcast} className="flex items-center gap-2 px-3 py-1.5 bg-purple-600/10 text-purple-400 hover:bg-purple-600/20 rounded-lg text-xs font-bold transition-colors border border-purple-500/20">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                            Podcast
                        </button>
                      </Tooltip>
                      <Tooltip content="Read Aloud">
                        <button onClick={handleTTS} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                        </button>
                      </Tooltip>
                    </div>
                 </div>
                 <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-sans selection:bg-blue-500/30">
                    {studioOutput.content}
                 </div>

                 {/* Sources / Grounding Data */}
                 {studioOutput.sources && studioOutput.sources.length > 0 && (
                     <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                         <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Verified Sources (Google Search Grounding)</h4>
                         <div className="flex flex-wrap gap-2">
                             {studioOutput.sources.map((s: any, i: number) => {
                                 if (s.web?.uri) {
                                     return (
                                        <a key={i} href={s.web.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 hover:border-blue-500 transition-colors group">
                                            <span className="text-[10px] text-blue-400 font-bold max-w-[150px] truncate">{s.web.title || s.web.uri}</span>
                                            <svg className="w-3 h-3 text-slate-500 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                        </a>
                                     )
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

          {/* Variations Tab */}
          {activeTab === 'variations' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {variations.map((v, i) => (
                  <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 transition-all flex flex-col shadow-xl animate-in slide-in-from-bottom duration-500">
                    <div className="flex justify-between items-start mb-4">
                       <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{v.strategicFocus}</span>
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${v.riskScore > 7 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>Risk: {v.riskScore}/10</span>
                    </div>
                    <h4 className="font-bold text-white mb-3 text-lg">{v.variantName}</h4>
                    <p className="text-xs text-slate-400 mb-4 font-medium">Timeline: {v.implementationTimeline}</p>
                    <div className="space-y-2 mb-6 flex-1">
                       <p className="text-[10px] font-bold text-slate-500 uppercase">Strategic Pros</p>
                       {v.pros.map((p: string, j: number) => <div key={j} className="text-xs text-slate-300">• {p}</div>)}
                    </div>
                    <div className="pt-4 border-t border-slate-800 text-[10px] font-mono text-slate-500">
                       RESOURCES: {v.resourceRequirements}
                    </div>
                  </div>
                ))}
             </div>
          )}

          {/* Empty State */}
          {!loading && (
            (activeTab === 'studio' && !studioOutput && !videoUrl && !chartConfig) || 
            (activeTab === 'variations' && variations.length === 0)
          ) && (
             <div className="h-[400px] flex flex-col items-center justify-center text-slate-600 border border-dashed border-slate-800 rounded-3xl animate-in fade-in">
                <div className="p-6 bg-slate-900 rounded-full mb-4">
                    <svg className="w-10 h-10 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                </div>
                <p className="text-sm font-medium text-slate-400">No insights generated yet.</p>
                <p className="text-xs text-slate-500 mt-2">Click the button above to start.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiInsights;
