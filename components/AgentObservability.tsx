
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
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8 animate-in slide-in-from-bottom duration-500 relative">
      
      {/* Multi-Step Creation Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-hidden">
          <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[2rem] md:rounded-[3rem] w-full max-w-2xl shadow-[0_0_150px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[95vh] transition-all">
             
             {/* Wizard Header & Progress Tracker */}
             <div className="bg-slate-900/40 border-b border-[var(--border-color)] p-6 md:p-12 relative overflow-hidden shrink-0">
               <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

               <div className="flex justify-between items-center mb-6 md:mb-10 relative z-10">
                 <div>
                   <h3 className="text-white font-black text-2xl md:text-4xl uppercase tracking-tighter">Forge Engine</h3>
                   <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-1 md:mt-2 italic">Neural Agent Synthesis</p>
                 </div>
                 <button onClick={() => setIsWizardOpen(false)} className="p-2 md:p-4 text-slate-400 hover:text-white transition-all bg-[var(--bg-element)] rounded-xl md:rounded-2xl hover:bg-slate-800 active:scale-90">
                   <svg className="w-5 h-5 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
               </div>

               <div className="flex items-center justify-between relative px-2 md:px-6 z-10">
                  <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-slate-800 -translate-y-1/2 z-0 mx-8 md:mx-16"></div>
                  {steps.map((s) => (
                    <div key={s.id} className="relative z-10 flex flex-col items-center gap-2 md:gap-4">
                       <div className={`w-8 h-8 md:w-14 md:h-14 rounded-lg md:rounded-2xl flex items-center justify-center font-black text-xs md:text-lg transition-all duration-700 ${
                         wizardStep === s.id ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] md:shadow-[0_0_40px_rgba(37,99,235,0.6)] ring-2 md:ring-4 ring-blue-600/20 scale-110' : 
                         wizardStep > s.id ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500 border border-slate-700'
                       }`}>
                         {wizardStep > s.id ? (
                           <svg className="w-4 h-4 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                         ) : s.id}
                       </div>
                       <span className={`text-[8px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] ${wizardStep === s.id ? 'text-blue-400' : 'text-slate-600'}`}>{s.label}</span>
                    </div>
                  ))}
               </div>
             </div>
             
             {/* Wizard Steps Content */}
             <div className="p-6 md:p-12 overflow-y-auto flex-1 custom-scrollbar bg-slate-950/40">
               {wizardStep === 1 && (
                 <div className="space-y-6 md:space-y-10 animate-in slide-in-from-right duration-500">
                   <div className="space-y-3 md:space-y-4">
                      <label className="block text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Agent Designation (Name)</label>
                      <input 
                        autoFocus
                        type="text" 
                        placeholder="ENTER CODENAME" 
                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl md:rounded-3xl p-4 md:p-7 text-lg md:text-xl text-white placeholder:text-slate-700 focus:border-blue-500 focus:outline-none transition-all font-black uppercase tracking-tight shadow-inner"
                        value={newAgentData.name}
                        onChange={(e) => setNewAgentData({...newAgentData, name: e.target.value})}
                      />
                   </div>
                   <div className="space-y-3 md:space-y-4">
                      <label className="block text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Mission Parameters (Description)</label>
                      <textarea 
                        placeholder="Define execution objectives and operational scope..."
                        className="w-full h-32 md:h-44 bg-slate-900 border border-slate-800 rounded-2xl md:rounded-3xl p-4 md:p-7 text-sm text-slate-300 placeholder:text-slate-700 focus:border-blue-600 focus:outline-none transition-all resize-none leading-relaxed font-medium shadow-inner"
                        value={newAgentData.description}
                        onChange={(e) => setNewAgentData({...newAgentData, description: e.target.value})}
                      />
                   </div>
                 </div>
               )}

               {wizardStep === 2 && (
                 <div className="grid grid-cols-1 gap-3 md:gap-5 animate-in slide-in-from-right duration-500">
                   <label className="block text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 md:mb-4">Operational Archetype</label>
                   {[
                     { type: AgentType.COPILOT, label: 'Copilot', desc: 'Hybrid intelligence support for human tasks.', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857' },
                     { type: AgentType.ANALYST, label: 'Analyst', desc: 'Strategic data synthesis and insight extraction.', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6' },
                     { type: AgentType.AUTOMATION_BOT, label: 'Bot', desc: 'Deterministic task orchestration and execution.', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
                     { type: AgentType.CUSTOM, label: 'Custom', desc: 'Highly specialized or multi-purpose engine.', icon: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z' }
                   ].map(arch => (
                      <button 
                        key={arch.type}
                        onClick={() => setNewAgentData({...newAgentData, type: arch.type})}
                        className={`p-4 md:p-7 rounded-[1.5rem] md:rounded-[2rem] border text-left transition-all flex items-center gap-4 md:gap-7 group relative overflow-hidden active:scale-95 ${newAgentData.type === arch.type ? 'border-blue-500 bg-blue-600/10 shadow-xl ring-2 ring-blue-500/20' : 'border-slate-800 bg-slate-900/60 hover:border-slate-600'}`}
                      >
                         <div className={`w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 ${newAgentData.type === arch.type ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-600'}`}>
                            <svg className="w-5 h-5 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={arch.icon} /></svg>
                         </div>
                         <div className="flex-1">
                            <h4 className={`font-black text-sm md:text-lg uppercase tracking-tight mb-1 ${newAgentData.type === arch.type ? 'text-white' : 'text-slate-400'}`}>{arch.label}</h4>
                            <p className="text-[9px] md:text-[11px] text-slate-500 font-bold leading-relaxed">{arch.desc}</p>
                         </div>
                         {newAgentData.type === arch.type && (
                             <div className="absolute top-4 right-4 text-blue-500">
                                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                             </div>
                         )}
                      </button>
                   ))}
                 </div>
               )}

               {wizardStep === 3 && (
                 <div className="space-y-8 md:space-y-12 animate-in slide-in-from-right duration-500">
                    <div>
                        <label className="block text-[10px] md:text-[11px] font-black text-slate-500 uppercase mb-4 md:mb-6 tracking-[0.3em]">Inference Engine (Model)</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
                            {[
                              { id: 'gemini-3-pro-preview', name: 'Gemini Pro', sub: 'Maximum Reasoning Depth' },
                              { id: 'gemini-3-flash-preview', name: 'Gemini Flash', sub: 'Maximum Response Latency' }
                            ].map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setNewAgentData({...newAgentData, model: m.id})}
                                    className={`p-4 md:p-7 rounded-[1.5rem] md:rounded-[2rem] border text-left transition-all flex flex-col gap-2 md:gap-5 active:scale-95 ${newAgentData.model === m.id ? 'border-blue-500 bg-blue-600/15 shadow-xl ring-2 ring-blue-500/20' : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'}`}
                                >
                                    <div>
                                       <div className={`font-black text-xs md:text-sm uppercase tracking-tight ${newAgentData.model === m.id ? 'text-white' : 'text-slate-400'}`}>{m.name}</div>
                                       <div className="text-[8px] md:text-[10px] text-slate-600 font-black uppercase tracking-widest mt-1">{m.sub}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-4 md:mb-6">
                             <label className="block text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Creative Variance (Temperature)</label>
                             <span className="text-[10px] md:text-[11px] font-black text-blue-400 bg-blue-400/10 px-3 md:px-4 py-1 rounded-full border border-blue-500/20">{newAgentData.temperature}</span>
                        </div>
                        <input type="range" min="0" max="1" step="0.1" value={newAgentData.temperature} onChange={(e) => setNewAgentData({...newAgentData, temperature: parseFloat(e.target.value)})} className="w-full h-2 md:h-3 bg-slate-800 rounded-full appearance-none accent-blue-600" />
                        <div className="flex justify-between mt-2">
                             <span className="text-[9px] font-black text-slate-600 uppercase">Deterministic</span>
                             <span className="text-[9px] font-black text-slate-600 uppercase">Creative</span>
                        </div>
                    </div>
                    
                    {newAgentData.model === 'gemini-3-pro-preview' && (
                        <div className="p-6 bg-blue-900/10 border border-blue-500/20 rounded-2xl flex items-center justify-between">
                             <div>
                                <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest">Thinking Budget Active</h4>
                                <p className="text-[10px] text-slate-500 mt-1 font-medium">Deep reasoning cycles will be prioritized for this agent.</p>
                             </div>
                             <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-500">
                                <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                             </div>
                        </div>
                    )}
                 </div>
               )}

               {wizardStep === 4 && (
                 <div className="space-y-6 md:space-y-10 animate-in slide-in-from-right duration-500">
                    <div>
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                            <div>
                                <label className="block text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">Core Persona Instruction</label>
                                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-1">Grounding logic and expert behavioral boundaries</p>
                            </div>
                            <Tooltip content="Use Gemini to optimize these instructions based on the agent's name and mission parameters.">
                                <button onClick={handleOptimizingPrompt} disabled={isOptimizing} className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600/15 text-blue-400 rounded-full border border-blue-500/40 text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 shadow-lg">
                                    <svg className={`w-3 h-3 ${isOptimizing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    {isOptimizing ? 'SYNTHESIZING PERSONA...' : 'OPTIMIZE VIA GEMINI'}
                                </button>
                            </Tooltip>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-4 animate-in fade-in slide-in-from-top-2">
                            {Object.entries(PERSONA_TEMPLATES).map(([name, text]) => (
                                <button
                                    key={name}
                                    onClick={() => setNewAgentData(prev => ({ ...prev, systemInstruction: text }))}
                                    className="px-3 py-1.5 rounded-full border border-slate-700 bg-slate-800/50 text-[9px] font-bold text-slate-400 hover:text-blue-400 hover:border-blue-500/50 hover:bg-blue-600/10 transition-all uppercase tracking-wide"
                                >
                                    {name}
                                </button>
                            ))}
                        </div>

                        <textarea
                            value={newAgentData.systemInstruction}
                            onChange={(e) => setNewAgentData({...newAgentData, systemInstruction: e.target.value})}
                            className="w-full h-48 md:h-72 bg-slate-900 border border-slate-800 rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 text-[10px] md:text-xs font-mono text-slate-300 focus:border-blue-500 focus:outline-none resize-none leading-relaxed shadow-inner"
                            placeholder="Enter system instructions or click optimize..."
                        />
                    </div>
                 </div>
               )}
             </div>

             {/* Wizard Footer Controls */}
             <div className="bg-slate-900/60 p-6 md:p-12 flex justify-between items-center border-t border-slate-800 backdrop-blur-3xl shrink-0">
               <button onClick={() => wizardStep > 1 ? setWizardStep(s => s - 1) : setIsWizardOpen(false)} className="px-6 md:px-10 py-3 md:py-5 text-slate-500 hover:text-white font-black text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] transition-all bg-slate-800/50 rounded-xl md:rounded-2xl border border-slate-700 active:scale-95">
                 {wizardStep > 1 ? 'Back' : 'Cancel'}
               </button>
               <button onClick={() => wizardStep < 4 ? setWizardStep(s => s + 1) : handleCreate()} disabled={(!newAgentData.name && wizardStep === 1) || isOptimizing} className="px-8 md:px-14 py-3 md:py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] shadow-xl disabled:opacity-30 transition-all active:scale-95 flex items-center gap-2 md:gap-4 ring-4 ring-blue-600/10">
                 {wizardStep < 4 ? 'Next' : 'Create Agent Fleet'}
                 {wizardStep < 4 && <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>}
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Sidebar - Agent List */}
      <div className="lg:col-span-1 space-y-4">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-white tracking-tighter uppercase">Fleet Grid</h3>
            <Tooltip content="Launch the Agent Forge Wizard">
              <button onClick={() => setIsWizardOpen(true)} className="p-2 md:p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-xl active:scale-90 ring-4 ring-blue-600/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              </button>
            </Tooltip>
          </div>
          <div className="relative group">
            <input type="text" placeholder="Designation Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-[11px] md:text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-all font-bold uppercase tracking-tight shadow-inner" />
            <svg className="w-4 h-4 absolute left-4 top-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>

        <div className="space-y-4 max-h-[400px] lg:max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
          {filteredAgents.map((agent) => (
            <button key={agent.id} onClick={() => onAgentSelect(agent)} className={`w-full text-left p-4 md:p-6 rounded-[1.5rem] md:rounded-[1.75rem] border transition-all duration-500 relative group overflow-hidden ${selectedAgent?.id === agent.id ? 'bg-blue-600/10 border-blue-500/60 shadow-xl ring-2 ring-blue-500/20' : 'bg-slate-900/60 border-slate-800 hover:border-slate-600'}`}>
              <div className="flex justify-between items-center mb-2 md:mb-4 relative z-10">
                <div className="flex items-center gap-3 md:gap-4">
                  <StatusIndicator status={agent.status} />
                  <div className="min-w-0">
                      <span className="font-black text-xs md:text-sm text-white uppercase tracking-tight block truncate">{agent.name}</span>
                      <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-[0.1em]">{agent.type}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 md:mt-6 relative z-10">
                <div className="space-y-1">
                  <div className="text-[8px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest">Efficiency</div>
                  <div className={`text-[10px] md:text-xs font-black ${agent.successRate > 90 ? 'text-emerald-400' : 'text-slate-300'}`}>{agent.successRate}%</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[8px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest">Latency</div>
                  <div className="text-[10px] md:text-xs font-black text-slate-300 font-mono">{agent.avgLatencyMs}ms</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area - Traces & Buffer */}
      <div className="lg:col-span-3 space-y-6 min-w-0">
        <TraceTimeline traces={traces} />

        <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="px-6 md:px-10 py-4 md:py-6 border-b border-[var(--border-color)] bg-slate-900/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h3 className="font-black text-sm md:text-base text-white uppercase tracking-tighter truncate max-w-full">Buffer: {selectedAgent?.name || 'Global Stream'}</h3>
            <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[8px] md:text-[10px] text-emerald-400 font-black uppercase tracking-widest">Sync Active</span>
            </div>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm min-w-[600px]">
              <thead className="bg-slate-950 text-slate-600 uppercase text-[9px] md:text-[10px] font-black tracking-[0.3em]">
                <tr>
                  <th className="px-6 md:px-10 py-4 md:py-5">Timestamp</th>
                  <th className="px-6 md:px-10 py-4 md:py-5">Operation Span</th>
                  <th className="px-6 md:px-10 py-4 md:py-5">Duration</th>
                  <th className="px-6 md:px-10 py-4 md:py-5">Status</th>
                  <th className="px-6 md:px-10 py-4 md:py-5">Resource (Tokens)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {traces.map((trace) => (
                  <tr key={trace.id} className="hover:bg-blue-600/5 transition-all cursor-default group border-l-4 border-l-transparent hover:border-l-blue-500">
                    <td className="px-6 md:px-10 py-4 md:py-6 font-mono text-[10px] md:text-[11px] text-slate-500">{new Date(trace.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit'})}</td>
                    <td className="px-6 md:px-10 py-4 md:py-6 font-black text-[10px] md:text-xs text-white uppercase tracking-tight">{trace.spanName}</td>
                    <td className="px-6 md:px-10 py-4 md:py-6 text-[10px] md:text-xs text-slate-400 font-bold font-mono">{trace.durationMs}ms</td>
                    <td className="px-6 md:px-10 py-4 md:py-6 text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                       <span className={trace.status === 'ok' ? 'text-emerald-500' : 'text-rose-500'}>{trace.status}</span>
                    </td>
                    <td className="px-6 md:px-10 py-4 md:py-6 font-mono text-[10px] md:text-[11px] text-slate-500 flex items-center gap-2">
                        {trace.tokens} 
                        <span className="opacity-40 text-[8px] md:text-[9px]">TKNS</span>
                        {trace.tokens > 5000 && <span className="w-2 h-2 rounded-full bg-yellow-500" title="High Token Usage"></span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative overflow-hidden group">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <h4 className="text-[10px] md:text-[11px] font-black uppercase text-slate-500 tracking-[0.3em] md:tracking-[0.4em]">Neural Reasoning Snapshot</h4>
            <div className="text-[9px] font-mono text-slate-700">TRACE_ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
          </div>
          <div className="bg-slate-950/90 rounded-xl md:rounded-[2rem] p-6 md:p-10 font-mono text-[10px] md:text-[11px] text-blue-400 leading-loose border border-slate-800/50 shadow-inner overflow-x-auto whitespace-pre">
            {`{
  "traceId": "tr-99283-epb",
  "reasoning_mode": "industrial_synthesis",
  "logical_cohesion": 0.994,
  "security_scan": "CLEARED",
  "timestamp": "${new Date().toISOString()}",
  "meta": {
    "engine": "Gemini 3 Pro",
    "context_depth": "32k"
  }
}`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentObservability;
