
import React, { useState } from 'react';
import { generateStudioDeliverable, generateAgentConfiguration } from '../services/geminiService';
import { TraceSpan } from '../types';
import Tooltip from './Tooltip';

interface Props {
  onAddTrace?: (trace: TraceSpan) => void;
}

const AgentPlayground: React.FC<Props> = ({ onAddTrace }) => {
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant.');
  const [userPrompt, setUserPrompt] = useState('');
  const [model, setModel] = useState('gemini-3-flash-preview');
  const [temperature, setTemperature] = useState(0.7);
  const [output, setOutput] = useState('');
  
  // State for AI Generation features
  const [loading, setLoading] = useState(false);
  const [generatingConfig, setGeneratingConfig] = useState(false);
  const [agentName, setAgentName] = useState('New Agent');
  const [niche, setNiche] = useState<string | null>(null);
  const [reasoningRecommended, setReasoningRecommended] = useState(false);

  const handleRun = async () => {
    if (!userPrompt.trim()) return;
    setLoading(true);
    const start = Date.now();
    try {
       const result = await generateStudioDeliverable('report', userPrompt + `\n[SYSTEM CONTEXT: ${systemPrompt}]`);
       setOutput(result.content);
       
       // Log the trace to observability
       if (onAddTrace) {
           const duration = Date.now() - start;
           onAddTrace({
               id: `trace-${Date.now()}`,
               timestamp: new Date().toISOString(),
               spanName: `playground.${agentName.toLowerCase().replace(/\s+/g, '_')}`,
               durationMs: duration,
               status: 'ok',
               tokens: Math.floor(result.content.length / 4), // Rough estimate
               cost: duration * 0.0001,
               attributes: { model, temperature, mode: 'playground' }
           });
       }

    } catch (e) {
       setOutput("Error executing playground prompt. Please verify your connection.");
       if (onAddTrace) {
           onAddTrace({
               id: `trace-${Date.now()}`,
               timestamp: new Date().toISOString(),
               spanName: `playground.${agentName.toLowerCase().replace(/\s+/g, '_')}`,
               durationMs: Date.now() - start,
               status: 'error',
               tokens: 0,
               cost: 0,
               attributes: { error: 'Execution failed', model }
           });
       }
    } finally {
       setLoading(false);
    }
  };

  const handleAutoGenerate = async (type: 'surprise' | 'optimize') => {
      setGeneratingConfig(true);
      try {
          const intent = type === 'optimize' 
            ? `Optimize an agent based on this partial instruction: ${systemPrompt.slice(0, 150)}`
            : undefined;

          const config = await generateAgentConfiguration(intent);
          
          setSystemPrompt(config.systemInstruction);
          setUserPrompt(config.userPrompt);
          setModel(config.model);
          setTemperature(config.temperature);
          setAgentName(config.name);
          setNiche(config.niche);
          setReasoningRecommended(config.reasoningRequired);
      } catch (e) {
          console.error("Failed to auto-generate agent", e);
      } finally {
          setGeneratingConfig(false);
      }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-140px)] animate-in fade-in duration-500">
        {/* Configuration Panel */}
        <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-3xl p-8 flex flex-col gap-8 overflow-y-auto relative transition-all duration-500 shadow-2xl">
            
            {/* AI Generator Overlay */}
            {generatingConfig && (
                <div className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center text-blue-400 p-12 text-center animate-in zoom-in-95">
                    <div className="relative mb-10 scale-125">
                        <div className="w-24 h-24 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-10 h-10 text-blue-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                    </div>
                    <span className="text-2xl font-black uppercase tracking-tighter text-white mb-4">Synthesizing Domain Expertise</span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.4em] max-w-sm leading-relaxed">
                        Orchestrating niche industrial personas and generating complex edge-case scenarios...
                    </span>
                    <div className="mt-8 flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce delay-75"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce delay-150"></div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between md:items-start border-b border-[var(--border-color)] pb-8 gap-6">
                <div className="space-y-2">
                    <h3 className="text-3xl font-black text-[var(--text-primary)] flex items-center gap-4 tracking-tight">
                        <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20">
                            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        </div>
                        {agentName}
                    </h3>
                    {niche && (
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 uppercase tracking-[0.2em]">{niche}</span>
                            {reasoningRecommended && (
                                <Tooltip content="Gemini recommends Pro models for this high-complexity niche.">
                                    <span className="text-[10px] font-black text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 uppercase tracking-[0.2em] animate-pulse">Deep Reasoning Recommended</span>
                                </Tooltip>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex gap-3">
                    <Tooltip content="Generate a random niche enterprise expert persona with edge-case testing">
                        <button 
                            onClick={() => handleAutoGenerate('surprise')}
                            disabled={loading || generatingConfig}
                            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-purple-900/20 disabled:opacity-30"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            Surprise Me
                        </button>
                    </Tooltip>
                    <Tooltip content="Refine and complete the current system instruction draft">
                        <button 
                            onClick={() => handleAutoGenerate('optimize')}
                            disabled={loading || generatingConfig}
                            className="flex items-center gap-2 px-6 py-3 bg-[var(--bg-element)] hover:bg-slate-700 text-[var(--text-secondary)] hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-[var(--border-color)] active:scale-95 disabled:opacity-30"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            Auto-Draft
                        </button>
                    </Tooltip>
                </div>
            </div>
            
            <div className="space-y-8 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group">
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 tracking-[0.3em] group-focus-within:text-blue-500 transition-colors">Compute Infrastructure</label>
                        <div className="relative">
                            <select 
                                value={model} 
                                onChange={(e) => setModel(e.target.value)} 
                                className={`w-full bg-slate-950 border rounded-2xl p-5 text-xs font-bold transition-all focus:outline-none appearance-none cursor-pointer ${model === 'gemini-3-pro-preview' ? 'border-blue-500/50 text-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.15)]' : 'border-slate-800 text-slate-400'}`}
                            >
                                <option value="gemini-3-pro-preview">gemini-3-pro-preview (Deep Reasoning)</option>
                                <option value="gemini-3-flash-preview">gemini-3-flash-preview (High Speed)</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-3">
                             <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Creative Variance</label>
                             <span className="text-[10px] font-black text-blue-400 font-mono">{temperature.toFixed(1)}</span>
                        </div>
                        <input 
                            type="range" min="0" max="1" step="0.1" 
                            value={temperature} 
                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-h-[250px] relative">
                    <div className="flex justify-between items-center mb-3">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Core Persona Logic</label>
                        <span className="text-[9px] text-slate-700 font-black uppercase tracking-[0.2em] italic">Strict Expert Boundary Enforced</span>
                    </div>
                    <textarea 
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-[2rem] p-8 text-xs font-mono text-slate-300 focus:border-blue-600 outline-none resize-none leading-[1.8] shadow-inner selection:bg-blue-500/20"
                        placeholder="Define the core logic and constraints for your agent persona..."
                    />
                    <div className="absolute bottom-4 right-8 flex items-center gap-2 opacity-30">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                        <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Logic Hub v2</span>
                    </div>
                </div>
                
                 <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-3">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Edge-Case Scenario Test</label>
                        <Tooltip content="The model recommended this specific prompt to test logic boundaries.">
                            <div className="p-1 rounded-md bg-slate-800 text-slate-500">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></div >
                        </Tooltip>
                    </div>
                    <textarea 
                        value={userPrompt}
                        onChange={(e) => setUserPrompt(e.target.value)}
                        className="w-full h-36 bg-slate-950 border border-slate-800 rounded-2xl p-6 text-sm text-slate-300 focus:border-blue-600 outline-none resize-none transition-all placeholder:text-slate-700 font-medium"
                        placeholder="Enter a complex testing scenario to challenge the agent..."
                    />
                </div>
            </div>

            <button 
                onClick={handleRun}
                disabled={loading || !userPrompt.trim()}
                className={`w-full py-5 rounded-[1.25rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl transition-all duration-500 flex items-center justify-center gap-4 disabled:opacity-20 active:scale-[0.98] ${loading ? 'bg-slate-800 text-slate-500' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40 ring-4 ring-blue-600/10'}`}
            >
                {loading ? (
                    <>
                       <div className="w-5 h-5 border-3 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                       <span>Streaming Inference...</span>
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Initialize Operation
                    </>
                )}
            </button>
        </div>

        {/* Output Panel */}
        <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-3xl p-8 flex flex-col shadow-2xl overflow-hidden group">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Fidelity Trace Output</h3>
                    <div className="flex gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-blue-500/40 animate-pulse"></div>
                        <div className="w-1 h-1 rounded-full bg-blue-500/40 animate-pulse delay-150"></div>
                        <div className="w-1 h-1 rounded-full bg-blue-500/40 animate-pulse delay-300"></div>
                    </div>
                </div>
                <div className="text-[9px] font-black text-slate-600 bg-slate-900 px-3 py-1 rounded-full border border-slate-800 uppercase tracking-widest">Read Only</div>
            </div>

            <div className="flex-1 bg-slate-950 rounded-[2.5rem] border border-slate-800/50 p-10 font-mono text-xs text-slate-200 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner selection:bg-blue-600/30 custom-scrollbar">
                {output ? (
                    <div className="animate-in fade-in duration-1000 slide-in-from-bottom-4">
                        {output}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-800 opacity-60">
                        <div className="p-10 bg-slate-900/30 rounded-full border border-slate-800 mb-6 group-hover:bg-blue-600/5 transition-all">
                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <span className="font-black uppercase tracking-[0.3em] text-[10px]">Awaiting Operation Signal</span>
                    </div>
                )}
            </div>

             <div className="mt-8 flex flex-col md:flex-row justify-between items-center px-6 gap-6">
                <div className="flex items-center gap-10">
                    <div className="space-y-1.5">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Payload Weight</p>
                        <p className="text-[11px] font-black text-slate-400 font-mono">~{output ? Math.floor(output.length / 3.8) : 0} <span className="text-[8px] opacity-40">TKNS</span></p>
                    </div>
                    <div className="w-px h-8 bg-slate-800"></div>
                    <div className="space-y-1.5">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Inference Core</p>
                        <p className="text-[11px] font-black text-slate-400 font-mono">{model.replace('-preview', '').toUpperCase()}</p>
                    </div>
                </div>
                <button 
                    disabled={!output}
                    onClick={() => {
                        navigator.clipboard.writeText(output);
                    }}
                    className="flex items-center gap-3 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-0 active:scale-95 border border-slate-700 shadow-xl"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    Capture Buffer
                </button>
            </div>
        </div>
    </div>
  );
};

export default AgentPlayground;
