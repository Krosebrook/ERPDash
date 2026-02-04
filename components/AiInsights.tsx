
import React, { useState } from 'react';
import { analyzeMetrics, getComplianceUpdate, speakReport, generateStudioDeliverable, exploreConceptVariations, DeliverableType } from '../services/geminiService';
import { Agent } from '../types';
import Tooltip from './Tooltip';

const AiInsights: React.FC<{ agents: Agent[] }> = ({ agents }) => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'studio' | 'variations' | 'guide'>('analysis');
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [compliance, setCompliance] = useState<any | null>(null);
  const [studioOutput, setStudioOutput] = useState<string | null>(null);
  const [deliverableType, setDeliverableType] = useState<DeliverableType>('report');
  const [variations, setVariations] = useState<any[]>([]);
  const [conceptInput, setConceptInput] = useState('Dynamic Multi-Tenant Agent Scaling Strategy');

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const result = await analyzeMetrics(agents);
      setInsight(result);
    } catch (e) {
      setInsight("Error generating analysis. Ensure your API key is active.");
    } finally {
      setLoading(false);
    }
  };

  const handleStudioGenerate = async () => {
    setLoading(true);
    try {
      const result = await generateStudioDeliverable(deliverableType, conceptInput);
      setStudioOutput(result);
    } catch (e) {
      setStudioOutput("Error generating deliverable.");
    } finally {
      setLoading(false);
    }
  };

  const handleExploreVariations = async () => {
    setLoading(true);
    try {
      const result = await exploreConceptVariations(conceptInput);
      setVariations(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCompliance = async () => {
    setLoading(true);
    try {
      const result = await getComplianceUpdate();
      setCompliance(result);
    } catch (e) {
      setCompliance({ text: "Grounding request failed." });
    } finally {
      setLoading(false);
    }
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
    <div className="space-y-6 animate-in fade-in duration-700 max-w-7xl mx-auto">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Gemini Pro Studio</h2>
          <p className="text-slate-400 text-sm mt-1">Enterprise-grade output engine powered by Google GenAI</p>
        </div>
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-inner">
          {(['analysis', 'studio', 'variations', 'guide'] as const).map((tab) => (
            <Tooltip key={tab} content={tabDescriptions[tab]} position="bottom">
              <button
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab}
              </button>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Input & Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">Context / Concept</label>
            <textarea 
              value={conceptInput}
              onChange={(e) => setConceptInput(e.target.value)}
              className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-colors resize-none shadow-inner mb-6"
              placeholder="Enter the concept or strategy to process..."
            />
            
            {activeTab === 'studio' && (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Select Professional Persona</label>
                <div className="grid grid-cols-1 gap-3">
                  {personas.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setDeliverableType(p.id)}
                      className={`text-left p-3 rounded-xl border transition-all flex flex-col gap-1 group ${
                        deliverableType === p.id 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`text-xs font-bold uppercase tracking-wide transition-colors ${deliverableType === p.id ? 'text-blue-400' : 'text-slate-300'}`}>
                          {p.title}
                        </span>
                        {deliverableType === p.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>}
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">{p.subtitle}</span>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 space-y-3">
              {activeTab === 'analysis' && (
                <Tooltip content="Launch Gemini-3-Pro with 4k reasoning tokens" position="right" className="w-full">
                  <button onClick={handleAnalyze} disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2">
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Start Reasoning Analysis'}
                  </button>
                </Tooltip>
              )}
              {activeTab === 'studio' && (
                <Tooltip content="Generate finalized professional content" position="right" className="w-full">
                  <button onClick={handleStudioGenerate} disabled={loading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center gap-2">
                     {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Generate Deliverable'}
                  </button>
                </Tooltip>
              )}
              {activeTab === 'variations' && (
                <Tooltip content="Execute strategic branch brainstorming" position="right" className="w-full">
                  <button onClick={handleExploreVariations} disabled={loading} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center gap-2">
                     {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Explore Variations'}
                  </button>
                </Tooltip>
              )}
              <Tooltip content="Query Google Search for latest web data" position="right" className="w-full">
                <button onClick={handleCompliance} disabled={loading} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-sm transition-all border border-slate-700">
                  Ground via Google Search
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Prompting Guide Snippet */}
          <div className="bg-blue-900/10 border border-blue-500/20 rounded-2xl p-6">
            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Pro Tip: System Personas</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed italic">
              "Fidelity increases by 30% when you assign a high-status persona. Instead of 'Write a report', use 'You are a Senior Solutions Architect with 20 years of experience...'"
            </p>
          </div>
        </div>

        {/* Right Column: Dynamic Results */}
        <div className="lg:col-span-8 space-y-6">
          {activeTab === 'analysis' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 min-h-[500px] shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-slate-100">Deep Reasoning Insights</h3>
                {insight && (
                  <Tooltip content="Play professional audio narration of this report">
                    <button onClick={() => speakReport(insight)} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-400 transition-all">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                    </button>
                  </Tooltip>
                )}
              </div>
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-6 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap shadow-inner min-h-[400px]">
                {insight || "Run reasoning analysis to see deep-dive insights generated with a Thinking Budget."}
              </div>
            </div>
          )}

          {activeTab === 'studio' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 min-h-[500px] shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-slate-100 uppercase tracking-wider">Professional {deliverableType.replace('_', ' ')}</h3>
                {studioOutput && (
                  <Tooltip content="Copy deliverable to clipboard">
                    <button className="text-xs text-blue-400 font-bold hover:underline">Copy Content</button>
                  </Tooltip>
                )}
              </div>
              <div className={`bg-slate-950/50 border border-slate-800 rounded-xl p-6 ${deliverableType === 'code' ? 'font-mono text-xs text-blue-300' : 'text-slate-300 text-sm'} leading-relaxed whitespace-pre-wrap shadow-inner min-h-[400px]`}>
                {studioOutput || "Select a deliverable type and generate your high-fidelity output."}
              </div>
            </div>
          )}

          {activeTab === 'variations' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {variations.length > 0 ? variations.map((v, i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-purple-500/30 transition-all flex flex-col shadow-xl">
                  <span className="text-[10px] font-bold text-purple-400 uppercase mb-1">{v.variantName}</span>
                  <h4 className="font-bold text-slate-100 mb-3">{v.strategicFocus}</h4>
                  <div className="space-y-3 flex-1">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pros</p>
                      {v.pros.map((p: string, j: number) => <div key={j} className="text-[11px] text-green-400/80">• {p}</div>)}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-500">
                    Timeline: <span className="text-slate-300 font-bold">{v.implementationTimeline || 'N/A'}</span>
                  </div>
                </div>
              )) : (
                <div className="col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-500 shadow-xl">
                  Generate concept variations to explore different strategic branches.
                </div>
              )}
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-8 shadow-2xl">
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Mastering Gemini Fidelity</h3>
                <p className="text-slate-400 text-sm mb-6">Techniques used in this studio to ensure professional-grade results:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <Tooltip content="Increases reasoning accuracy for complex tasks">
                     <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 cursor-help hover:border-blue-500/30 transition-colors">
                       <h5 className="font-bold text-blue-400 mb-2">Thinking Budget</h5>
                       <p className="text-xs text-slate-500 leading-relaxed">By setting <code>thinkingConfig</code>, we force the model to reason through chain-of-thought steps before outputting.</p>
                     </div>
                   </Tooltip>
                   <Tooltip content="Eliminates hallucinations with real-time web data">
                     <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 cursor-help hover:border-green-500/30 transition-colors">
                       <h5 className="font-bold text-green-400 mb-2">Search Grounding</h5>
                       <p className="text-xs text-slate-500 leading-relaxed">The <code>googleSearch</code> tool retrieves current web data, essential for compliance and market analysis.</p>
                     </div>
                   </Tooltip>
                   <Tooltip content="Enforces strict structured JSON interfaces">
                     <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 cursor-help hover:border-purple-500/30 transition-colors">
                       <h5 className="font-bold text-purple-400 mb-2">Response Schemas</h5>
                       <p className="text-xs text-slate-500 leading-relaxed">Using <code>responseSchema</code> ensures that machine-readable outputs follow the correct interface.</p>
                     </div>
                   </Tooltip>
                   <Tooltip content="High-fidelity voice synthesis for reports">
                     <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 cursor-help hover:border-orange-500/30 transition-colors">
                       <h5 className="font-bold text-orange-400 mb-2">Multi-Modal TTS</h5>
                       <p className="text-xs text-slate-500 leading-relaxed">Professional audio synthesis allows for 'eyes-free' executive updates, converting dense reports into narrated summaries.</p>
                     </div>
                   </Tooltip>
                </div>
              </div>
            </div>
          )}

          {/* Grounding Source Footer */}
          {compliance && (
             <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-in slide-in-from-top-4 duration-500 shadow-2xl">
                <h3 className="text-xs font-bold text-green-400 uppercase tracking-widest mb-4">Verified Grounding Sources</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {compliance.sources?.map((s: any, i: number) => s.web && (
                    <Tooltip key={i} content="Visit authoritative web source" position="top" className="w-full">
                      <a href={s.web.uri} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800 hover:border-blue-500/40 transition-all">
                         <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center text-blue-400 text-[10px] font-bold">PDF</div>
                         <div className="overflow-hidden">
                           <div className="text-xs font-bold text-slate-200 truncate">{s.web.title}</div>
                           <div className="text-[10px] text-slate-500 truncate">{s.web.uri}</div>
                         </div>
                      </a>
                    </Tooltip>
                  ))}
                </div>
                <div className="mt-4 text-xs text-slate-400 bg-slate-950 p-4 rounded-lg border border-slate-800 leading-relaxed">
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
