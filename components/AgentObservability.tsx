
import React, { useState, useMemo } from 'react';
import { Agent, TraceSpan, AgentType } from '../types';
import { generateAgentConfiguration } from '../services/geminiService';
import Tooltip from './Tooltip';
import TraceTimeline from './TraceTimeline';

interface Props {
  agents: Agent[];
  selectedAgent: Agent | null;
  onAgentSelect: (agent: Agent) => void;
  onAddAgent: (agent: Agent) => void;
  traces: TraceSpan[];
}

const PERSONA_TEMPLATES: Record<string, string> = {
  'General Assistant': 'You are a helpful, professional AI assistant designed to support enterprise operations with clear, concise, and accurate information.',
  'Data Analyst': 'You are a Senior Data Analyst. Your goal is to interpret complex datasets, generate SQL queries, and identify statistical anomalies.',
  'Security Guardian': 'You are a Cybersecurity Operations Expert. Continuously monitor access logs and flag suspicious patterns.',
  'Creative Strategist': 'You are a Chief Strategy Officer. Propose multiple divergent strategic approaches for any given business problem.'
};

const StatusIndicator: React.FC<{ status: Agent['status'] }> = ({ status }) => {
  const configs = {
    active: {
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/20',
      border: 'border-emerald-500/40',
      shadow: 'shadow-[0_0_20px_rgba(16,185,129,0.4)]',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ),
      pulse: true
    },
    suspended: {
      color: 'text-rose-400',
      bg: 'bg-rose-500/20',
      border: 'border-rose-500/40',
      shadow: 'shadow-none',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6" />
        </svg>
      ),
      pulse: false
    },
    draft: {
      color: 'text-slate-400',
      bg: 'bg-slate-800/60',
      border: 'border-slate-700',
      shadow: 'shadow-none',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
      pulse: false
    }
  };

  const config = configs[status] || configs.draft;

  return (
    <div className="relative flex items-center justify-center transition-all duration-500">
      {config.pulse && (
        <div className={`absolute inset-0 rounded-xl ${config.bg} animate-ping opacity-30`}></div>
      )}
      <div 
        className={`w-9 h-9 rounded-xl ${config.bg} ${config.color} ${config.border} ${config.shadow} border flex items-center justify-center relative z-10 transition-all duration-500 transform hover:scale-110`}
      >
        {config.icon}
      </div>
    </div>
  );
};

const AgentObservability: React.FC<Props> = ({ agents, selectedAgent, onAgentSelect, onAddAgent, traces }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  const [newAgentData, setNewAgentData] = useState<Partial<Agent>>({
    name: '',
    description: '',
    type: AgentType.COPILOT,
    status: 'active',
    model: 'gemini-3-flash-preview',
    temperature: 0.7,
    systemInstruction: PERSONA_TEMPLATES['General Assistant']
  });

  const filteredAgents = useMemo(() => {
    return agents.filter(agent => 
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [agents, searchTerm]);

  const handleOptimizingPrompt = async () => {
    if (!newAgentData.name) return;
    setIsOptimizing(true);
    try {
      const intent = `Agent Name: ${newAgentData.name}, Type: ${newAgentData.type}. Context/Description: ${newAgentData.description || 'General Purpose'}`;
      const config = await generateAgentConfiguration(intent);
      
      setNewAgentData(prev => ({
        ...prev,
        systemInstruction: config.systemInstruction,
        temperature: config.temperature,
        model: config.model
      }));
    } catch (e) {
      console.error("Optimization failed", e);
      // Fallback or user notification could go here
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCreate = () => {
    const id = `agent-${Date.now()}`;
    onAddAgent({ 
      ...newAgentData, 
      id,
      successRate: 0,
      avgLatencyMs: 0,
      totalTokens: 0,
      costUSD: 0,
      hitlPending: 0
    } as Agent);
    
    // Reset and Close
    setIsWizardOpen(false);
    setWizardStep(1);
    setNewAgentData({ 
        name: '', 
        description: '',
        type: AgentType.COPILOT, 
        status: 'active', 
        model: 'gemini-3-flash-preview',
        temperature: 0.7,
        systemInstruction: PERSONA_TEMPLATES['General Assistant']
    });
  };

  const steps = [
    { id: 1, label: 'Identity' },
    { id: 2, label: 'Archetype' },
    { id: 3, label: 'Parameters' },
    { id: 4, label: 'Persona' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in slide-in-from-bottom duration-500 relative">
      
      {/* Creation Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-hidden">
          <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[3rem] w-full max-w-2xl shadow-[0_0_150px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh] transition-all">
             
             {/* Wizard Header */}
             <div className="bg-slate-900/40 border-b border-[var(--border-color)] p-12 relative overflow-hidden">
               {/* Decorative background element */}
               <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

               <div className="flex justify-between items-center mb-10 relative z-10">
                 <div>
                   <h3 className="text-white font-black text-4xl uppercase tracking-tighter">Forge Engine</h3>
                   <p className="text-slate-500 text-xs font-black uppercase tracking-[0.4em] mt-2">Initializing Industrial Logic</p>
                 </div>
                 <button onClick={() => setIsWizardOpen(false)} className="p-4 text-slate-400 hover:text-white transition-all bg-[var(--bg-element)] rounded-2xl hover:bg-slate-800 active:scale-90">
                   <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
               </div>

               {/* Step Indicator */}
               <div className="flex items-center justify-between relative px-6 z-10">
                  <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-slate-800 -translate-y-1/2 z-0 mx-16"></div>
                  {steps.map((s) => (
                    <div key={s.id} className="relative z-10 flex flex-col items-center gap-4">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg transition-all duration-700 ${
                         wizardStep === s.id ? 'bg-blue-600 text-white shadow-[0_0_40px_rgba(37,99,235,0.6)] ring-4 ring-blue-600/20 scale-110' : 
                         wizardStep > s.id ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500 border border-slate-700'
                       }`}>
                         {wizardStep > s.id ? (
                           <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                         ) : s.id}
                       </div>
                       <span className={`text-[11px] font-black uppercase tracking-[0.3em] ${wizardStep === s.id ? 'text-blue-400' : 'text-slate-600'}`}>{s.label}</span>
                    </div>
                  ))}
               </div>
             </div>
             
             {/* Wizard Body */}
             <div className="p-12 overflow-y-auto flex-1 custom-scrollbar bg-slate-950/40">
               
               {/* Step 1: Identity */}
               {wizardStep === 1 && (
                 <div className="space-y-10 animate-in slide-in-from-right duration-500">
                   <div className="space-y-4">
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Operational Designation</label>
                      <input 
                        autoFocus
                        type="text" 
                        placeholder="ENTER AGENT CODENAME" 
                        className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-7 text-xl text-white placeholder:text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-8 focus:ring-blue-600/5 transition-all font-black uppercase tracking-tight"
                        value={newAgentData.name}
                        onChange={(e) => setNewAgentData({...newAgentData, name: e.target.value})}
                      />
                   </div>
                   <div className="space-y-4">
                      <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Mission Parameters</label>
                      <textarea 
                        placeholder="Define primary execution objectives..."
                        className="w-full h-44 bg-slate-900 border border-slate-800 rounded-3xl p-7 text-sm text-slate-300 placeholder:text-slate-700 focus:border-blue-600 focus:outline-none transition-all resize-none leading-relaxed font-medium"
                        value={newAgentData.description}
                        onChange={(e) => setNewAgentData({...newAgentData, description: e.target.value})}
                      />
                   </div>
                 </div>
               )}

               {/* Step 2: Archetype */}
               {wizardStep === 2 && (
                 <div className="grid grid-cols-1 gap-5 animate-in slide-in-from-right duration-500">
                   <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Architecture Selection</label>
                   {[
                     { type: AgentType.COPILOT, label: 'Copilot', desc: 'Hybrid intelligence for professional assistance.', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857' },
                     { type: AgentType.ANALYST, label: 'Analyst', desc: 'Synthesizing vast datasets for strategic insights.', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6' },
                     { type: AgentType.AUTOMATION_BOT, label: 'Bot', desc: 'Deterministic task orchestration at scale.', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
                     { type: AgentType.CUSTOM, label: 'Custom', desc: 'Specialized logic with deep grounding tools.', icon: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3' }
                   ].map(arch => (
                      <button 
                        key={arch.type}
                        onClick={() => setNewAgentData({...newAgentData, type: arch.type})}
                        className={`p-7 rounded-[2rem] border text-left transition-all flex items-center gap-7 group relative overflow-hidden active:scale-95 ${newAgentData.type === arch.type ? 'border-blue-500 bg-blue-600/10 shadow-2xl ring-2 ring-blue-500/20' : 'border-slate-800 bg-slate-900/60 hover:border-slate-600'}`}
                      >
                         <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 ${newAgentData.type === arch.type ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-600'}`}>
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={arch.icon} /></svg>
                         </div>
                         <div className="flex-1">
                            <h4 className={`font-black text-lg uppercase tracking-tight mb-1 ${newAgentData.type === arch.type ? 'text-white' : 'text-slate-400'}`}>{arch.label}</h4>
                            <p className="text-[11px] text-slate-500 font-bold leading-relaxed">{arch.desc}</p>
                         </div>
                      </button>
                   ))}
                 </div>
               )}

               {/* Step 3: Parameters */}
               {wizardStep === 3 && (
                 <div className="space-y-12 animate-in slide-in-from-right duration-500">
                    <div>
                        <label className="block text-[11px] font-black text-slate-500 uppercase mb-6 tracking-[0.3em]">Inference Core</label>
                        <div className="grid grid-cols-2 gap-5">
                            {[
                              { id: 'gemini-3-pro-preview', name: 'Gemini Pro', sub: 'Max Reasoning', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
                              { id: 'gemini-3-flash-preview', name: 'Gemini Flash', sub: 'Max Latency', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' }
                            ].map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setNewAgentData({...newAgentData, model: m.id})}
                                    className={`p-7 rounded-[2rem] border text-left transition-all flex flex-col gap-5 active:scale-95 ${newAgentData.model === m.id ? 'border-blue-500 bg-blue-600/15 shadow-2xl' : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'}`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${newAgentData.model === m.id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-600'}`}>
                                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={m.icon} /></svg>
                                    </div>
                                    <div>
                                       <div className={`font-black text-sm uppercase tracking-tight ${newAgentData.model === m.id ? 'text-white' : 'text-slate-400'}`}>{m.name}</div>
                                       <div className="text-[10px] text-slate-600 font-black uppercase tracking-widest mt-1">{m.sub}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-6">
                             <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Creative Variance</label>
                             <span className="text-[11px] font-black text-blue-400 bg-blue-400/10 px-4 py-1 rounded-full border border-blue-500/30">{newAgentData.temperature}</span>
                        </div>
                        <input 
                            type="range" min="0" max="1" step="0.1"
                            value={newAgentData.temperature}
                            onChange={(e) => setNewAgentData({...newAgentData, temperature: parseFloat(e.target.value)})}
                            className="w-full h-3 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>
                 </div>
               )}

               {/* Step 4: Persona */}
               {wizardStep === 4 && (
                 <div className="space-y-10 animate-in slide-in-from-right duration-500">
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Logic Persona</label>
                            <button 
                              onClick={handleOptimizingPrompt}
                              disabled={isOptimizing || !newAgentData.name}
                              className={`flex items-center gap-2 px-5 py-2.5 bg-blue-600/15 text-blue-400 hover:bg-blue-600/25 rounded-full border border-blue-500/40 text-[10px] font-black uppercase tracking-widest transition-all ${isOptimizing ? 'animate-pulse opacity-50 cursor-wait' : 'active:scale-95'} disabled:opacity-30`}
                            >
                                <svg className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                {isOptimizing ? 'SYNTHESIZING...' : 'GEMINI OPTIMIZE'}
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {Object.keys(PERSONA_TEMPLATES).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setNewAgentData({...newAgentData, systemInstruction: PERSONA_TEMPLATES[p]})}
                                    className={`px-4 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                                      newAgentData.systemInstruction === PERSONA_TEMPLATES[p] 
                                      ? 'border-blue-500 bg-blue-600/20 text-blue-400 shadow-md ring-2 ring-blue-500/30' 
                                      : 'border-slate-800 bg-slate-900 text-slate-600 hover:text-white hover:border-slate-600'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                        <div className="relative group">
                          <textarea
                              value={newAgentData.systemInstruction}
                              onChange={(e) => setNewAgentData({...newAgentData, systemInstruction: e.target.value})}
                              className="w-full h-72 bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 text-xs font-mono text-slate-300 focus:border-blue-500 focus:outline-none resize-none leading-relaxed shadow-inner"
                              placeholder="Define core system constraints..."
                          />
                          <div className="absolute top-6 right-10 flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                             <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest opacity-50 group-focus-within:opacity-100 transition-opacity">PROMPT_IDE_V1</span>
                          </div>
                        </div>
                    </div>
                 </div>
               )}
             </div>

             {/* Footer Navigation */}
             <div className="bg-slate-900/60 p-12 flex justify-between items-center border-t border-slate-800 backdrop-blur-3xl">
               {wizardStep > 1 ? (
                 <button 
                  onClick={() => setWizardStep(s => s - 1)} 
                  className="px-10 py-5 text-slate-500 hover:text-white font-black text-xs uppercase tracking-[0.3em] transition-all bg-slate-800/50 rounded-2xl border border-slate-700 active:scale-95"
                 >
                   Back
                 </button>
               ) : (
                 <button 
                  onClick={() => setIsWizardOpen(false)} 
                  className="px-10 py-5 text-slate-600 hover:text-slate-300 font-black text-xs uppercase tracking-[0.3em] transition-all"
                 >
                   Cancel
                 </button>
               )}
               
               {wizardStep < 4 ? (
                 <button 
                  disabled={!newAgentData.name && wizardStep === 1}
                  onClick={() => setWizardStep(s => s + 1)} 
                  className="px-14 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_60px_rgba(37,99,235,0.4)] disabled:opacity-30 transition-all active:scale-95 flex items-center gap-4"
                 >
                   Next
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                 </button>
               ) : (
                 <button onClick={handleCreate} className="px-14 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_60px_rgba(16,185,129,0.4)] transition-all flex items-center gap-4 active:scale-95 group">
                   <svg className="w-6 h-6 group-hover:scale-125 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                   Create Agent
                 </button>
               )}
             </div>
          </div>
        </div>
      )}

      {/* Sidebar - Agent List */}
      <div className="lg:col-span-1 space-y-4">
        <div className="flex flex-col gap-5 mb-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-white tracking-tighter uppercase">Fleet Grid</h3>
            <Tooltip content="Commission Engine">
              <button onClick={() => setIsWizardOpen(true)} className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-xl shadow-blue-900/40 active:scale-90 ring-4 ring-blue-600/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M12 4v16m8-8H4" /></svg>
              </button>
            </Tooltip>
          </div>
          <div className="relative group">
            <input 
              type="text"
              placeholder="Filter by Designation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-all group-hover:border-slate-700 font-bold uppercase tracking-tight"
            />
            <svg className="w-5 h-5 absolute left-4 top-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-3">
          {filteredAgents.map((agent) => (
            <Tooltip key={agent.id} content={`ENGINE_TELEMETRY: ${agent.name}`} position="right" className="w-full">
              <button
                onClick={() => onAgentSelect(agent)}
                className={`w-full text-left p-6 rounded-[1.75rem] border transition-all duration-500 relative group overflow-hidden ${
                  selectedAgent?.id === agent.id 
                  ? 'bg-blue-600/10 border-blue-500/60 shadow-[0_15px_40px_rgba(37,99,235,0.15)] ring-1 ring-blue-500/20' 
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex justify-between items-center mb-4 relative z-10">
                  <div className="flex items-center gap-4">
                    <StatusIndicator status={agent.status} />
                    <div>
                        <span className="font-black text-sm text-white uppercase tracking-tight block">{agent.name}</span>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{agent.type}</span>
                    </div>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-800 group-hover:bg-blue-500 transition-colors"></div>
                </div>
                
                <div className="grid grid-cols-2 gap-6 mt-6 relative z-10">
                  <div className="space-y-2">
                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Efficiency</div>
                    <div className={`text-xs font-black ${agent.successRate > 90 ? 'text-emerald-400' : 'text-slate-300'}`}>{agent.successRate}%</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Inference</div>
                    <div className="text-xs font-black text-slate-300 font-mono">{agent.avgLatencyMs}ms</div>
                  </div>
                </div>
              </button>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* Main Trace Viewer */}
      <div className="lg:col-span-3 space-y-6">
        <TraceTimeline traces={traces} />

        <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[2.5rem] overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
          <div className="px-10 py-6 border-b border-[var(--border-color)] bg-slate-900/40 flex justify-between items-center">
            <div className="flex items-center gap-5">
               <h3 className="font-black text-base text-white uppercase tracking-tighter">Execution Buffer: {selectedAgent?.name}</h3>
               <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">Synchronized</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-600 uppercase text-[10px] font-black tracking-[0.3em]">
                <tr>
                  <th className="px-10 py-5">Temporal_ID</th>
                  <th className="px-10 py-5">Operational_Span</th>
                  <th className="px-10 py-5">Duration</th>
                  <th className="px-10 py-5">Logical_State</th>
                  <th className="px-10 py-5">Resources</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {traces.map((trace) => (
                  <tr key={trace.id} className="hover:bg-blue-600/5 transition-all cursor-default group border-l-4 border-l-transparent hover:border-l-blue-500">
                    <td className="px-10 py-6 font-mono text-[11px] text-slate-500 group-hover:text-slate-400">{new Date(trace.timestamp).toLocaleTimeString()}</td>
                    <td className="px-10 py-6 font-black text-xs text-white uppercase tracking-tight">{trace.spanName}</td>
                    <td className="px-10 py-6 text-xs text-slate-400 font-bold font-mono">{trace.durationMs}ms</td>
                    <td className="px-10 py-6">
                      <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${
                        trace.status === 'ok' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${trace.status === 'ok' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                        {trace.status}
                      </div>
                    </td>
                    <td className="px-10 py-6 font-mono text-[11px] text-slate-500">{trace.tokens} <span className="opacity-40 text-[9px]">TKNS</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trace Analysis Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 opacity-20 group-hover:opacity-100 transition-opacity duration-700"></div>
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-[11px] font-black uppercase text-slate-500 tracking-[0.4em]">Inference Core Analytics</h4>
            <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <div className="bg-slate-950/90 rounded-[2rem] p-10 font-mono text-[11px] text-blue-400 leading-loose border border-slate-800/50 shadow-inner group-hover:border-blue-500/20 transition-all duration-500">
            {`{
  "traceId": "tr-99283-epb",
  "reasoning_mode": "industrial_synthesis",
  "thinking_budget_consumption": 2405,
  "logical_cohesion": 0.994,
  "next_operational_intent": "reconciliation_logic_gate",
  "security_scan": "CLEARED"
}`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentObservability;
