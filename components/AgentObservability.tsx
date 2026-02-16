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
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ),
      pulse: true
    },
    suspended: {
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6" />
        </svg>
      ),
      pulse: false
    },
    draft: {
      color: 'text-slate-400',
      bg: 'bg-slate-800',
      border: 'border-slate-700',
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      pulse: false
    }
  };

  const config = configs[status] || configs.draft;

  return (
    <div className={`relative flex items-center justify-center`}>
      {config.pulse && (
        <div className={`absolute inset-0 rounded-full ${config.bg} animate-ping opacity-75`}></div>
      )}
      <div className={`w-6 h-6 rounded-full ${config.bg} ${config.color} ${config.border} border flex items-center justify-center relative z-10 animate-in zoom-in fade-in duration-500`}>
        {config.icon}
      </div>
    </div>
  );
};

const AgentObservability: React.FC<Props> = ({ agents, selectedAgent, onAgentSelect, onAddAgent, traces }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Wizard State
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

  const [thinkingBudget, setThinkingBudget] = useState(4096);

  const filteredAgents = useMemo(() => {
    return agents.filter(agent => 
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [agents, searchTerm]);

  const handleOptimizingPrompt = async () => {
    setIsOptimizing(true);
    try {
      const intent = `An agent named ${newAgentData.name} of type ${newAgentData.type}. Context: ${newAgentData.description}`;
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
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in slide-in-from-bottom duration-500 relative">
      
      {/* Creation Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 overflow-hidden">
          <div className="bg-[#0f172a] border border-slate-800 rounded-[2.5rem] w-full max-w-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
             
             {/* Wizard Header */}
             <div className="bg-slate-900/50 border-b border-slate-800 p-10">
               <div className="flex justify-between items-center mb-10">
                 <div>
                   <h3 className="text-white font-black text-3xl uppercase tracking-tighter">Forge New Agent</h3>
                   <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Enterprise Intelligence Orchestrator</p>
                 </div>
                 <button onClick={() => setIsWizardOpen(false)} className="p-3 text-slate-500 hover:text-white transition-all bg-slate-800/50 rounded-2xl hover:bg-slate-800">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
               </div>

               {/* Step Indicator */}
               <div className="flex items-center justify-between relative px-4">
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-800 -translate-y-1/2 z-0 mx-12"></div>
                  {steps.map((s) => (
                    <div key={s.id} className="relative z-10 flex flex-col items-center gap-3">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-500 ${
                         wizardStep === s.id ? 'bg-blue-600 text-white shadow-[0_0_30px_rgba(37,99,235,0.4)] ring-4 ring-blue-600/20 scale-110' : 
                         wizardStep > s.id ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'
                       }`}>
                         {wizardStep > s.id ? (
                           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                         ) : s.id}
                       </div>
                       <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${wizardStep === s.id ? 'text-blue-400' : 'text-slate-600'}`}>{s.label}</span>
                    </div>
                  ))}
               </div>
             </div>
             
             {/* Wizard Body */}
             <div className="p-10 overflow-y-auto flex-1 custom-scrollbar bg-slate-950/20">
               
               {/* Step 1: Identity */}
               {wizardStep === 1 && (
                 <div className="space-y-8 animate-in slide-in-from-right duration-500">
                   <div className="space-y-4">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Agent Designation</label>
                      <input 
                        autoFocus
                        type="text" 
                        placeholder="e.g., Tactical Analyst Omega" 
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-lg text-white placeholder:text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-600/10 transition-all font-bold"
                        value={newAgentData.name}
                        onChange={(e) => setNewAgentData({...newAgentData, name: e.target.value})}
                      />
                   </div>
                   <div className="space-y-4">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Operational Intent</label>
                      <textarea 
                        placeholder="Define the primary mission parameters for this intelligence unit..."
                        className="w-full h-40 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-sm text-slate-300 placeholder:text-slate-700 focus:border-blue-600 focus:outline-none transition-all resize-none leading-relaxed"
                        value={newAgentData.description}
                        onChange={(e) => setNewAgentData({...newAgentData, description: e.target.value})}
                      />
                   </div>
                 </div>
               )}

               {/* Step 2: Archetype */}
               {wizardStep === 2 && (
                 <div className="grid grid-cols-1 gap-4 animate-in slide-in-from-right duration-500">
                   <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4">Select Agent Archetype</label>
                   {[
                     { type: AgentType.COPILOT, label: 'Copilot', desc: 'Collaborative reasoning for complex professional tasks.', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857' },
                     { type: AgentType.ANALYST, label: 'Analyst', desc: 'Autonomous data synthesis and strategic insights.', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6' },
                     { type: AgentType.AUTOMATION_BOT, label: 'Bot', desc: 'High-speed deterministic task execution.', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
                     { type: AgentType.CUSTOM, label: 'Custom', desc: 'Niche specialized logic with advanced grounding.', icon: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3' }
                   ].map(arch => (
                      <button 
                        key={arch.type}
                        onClick={() => setNewAgentData({...newAgentData, type: arch.type})}
                        className={`p-6 rounded-3xl border text-left transition-all flex items-center gap-6 group relative overflow-hidden active:scale-[0.98] ${newAgentData.type === arch.type ? 'border-blue-500 bg-blue-600/10' : 'border-slate-800 bg-slate-900/30 hover:border-slate-600'}`}
                      >
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all ${newAgentData.type === arch.type ? 'bg-blue-600 text-white shadow-xl' : 'bg-slate-800 text-slate-500'}`}>
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={arch.icon} /></svg>
                         </div>
                         <div className="flex-1">
                            <h4 className={`font-black text-sm uppercase tracking-tight mb-1 ${newAgentData.type === arch.type ? 'text-white' : 'text-slate-400'}`}>{arch.label}</h4>
                            <p className="text-[10px] text-slate-500 font-bold leading-relaxed">{arch.desc}</p>
                         </div>
                         {newAgentData.type === arch.type && (
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-xl">
                               <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </div>
                         )}
                      </button>
                   ))}
                 </div>
               )}

               {/* Step 3: Parameters */}
               {wizardStep === 3 && (
                 <div className="space-y-10 animate-in slide-in-from-right duration-500">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-5 tracking-[0.25em]">Compute Model Selection</label>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                              { id: 'gemini-3-pro-preview', name: 'Gemini Pro', sub: 'Maximum Reasoning', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
                              { id: 'gemini-3-flash-preview', name: 'Gemini Flash', sub: 'High Latency', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' }
                            ].map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setNewAgentData({...newAgentData, model: m.id})}
                                    className={`p-6 rounded-3xl border text-left transition-all flex flex-col gap-4 active:scale-95 ${newAgentData.model === m.id ? 'border-blue-500 bg-blue-600/10 shadow-lg' : 'border-slate-800 bg-slate-900/30 hover:border-slate-700'}`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${newAgentData.model === m.id ? 'bg-blue-600 text-white shadow-xl' : 'bg-slate-800 text-slate-600'}`}>
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={m.icon} /></svg>
                                    </div>
                                    <div>
                                       <div className={`font-black text-xs uppercase tracking-tight ${newAgentData.model === m.id ? 'text-white' : 'text-slate-400'}`}>{m.name}</div>
                                       <div className="text-[9px] text-slate-600 font-black uppercase tracking-widest mt-1">{m.sub}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {newAgentData.model === 'gemini-3-pro-preview' && (
                      <div className="animate-in slide-in-from-top-4">
                         <div className="flex justify-between items-center mb-5">
                             <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Reasoning Budget</label>
                             <span className="text-[10px] font-black text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full border border-blue-500/20">{thinkingBudget} tokens</span>
                        </div>
                        <input 
                            type="range" min="1024" max="16384" step="1024"
                            value={thinkingBudget}
                            onChange={(e) => setThinkingBudget(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-600"
                        />
                        <p className="text-[9px] text-slate-600 font-bold mt-3 italic text-center">Higher thinking budgets allow for more complex multi-step deductions.</p>
                      </div>
                    )}

                    <div>
                        <div className="flex justify-between items-center mb-5">
                             <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Creative Temperature</label>
                             <span className="text-[10px] font-black text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full border border-blue-500/20">{newAgentData.temperature}</span>
                        </div>
                        <input 
                            type="range" min="0" max="1" step="0.1"
                            value={newAgentData.temperature}
                            onChange={(e) => setNewAgentData({...newAgentData, temperature: parseFloat(e.target.value)})}
                            className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>
                 </div>
               )}

               {/* Step 4: Persona */}
               {wizardStep === 4 && (
                 <div className="space-y-8 animate-in slide-in-from-right duration-500">
                    <div>
                        <div className="flex justify-between items-center mb-5">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Persona Blueprint</label>
                            <button 
                              onClick={handleOptimizingPrompt}
                              disabled={isOptimizing}
                              className={`flex items-center gap-2 px-4 py-2 bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 rounded-full border border-blue-500/30 text-[9px] font-black uppercase tracking-widest transition-all ${isOptimizing ? 'animate-pulse opacity-50' : ''}`}
                            >
                                <svg className={`w-3 h-3 ${isOptimizing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                {isOptimizing ? 'Analyzing Logic...' : 'Optimize Prompt with Gemini'}
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
                                      : 'border-slate-800 bg-slate-900/40 text-slate-600 hover:text-white hover:border-slate-600'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                        <div className="relative">
                          <textarea
                              value={newAgentData.systemInstruction}
                              onChange={(e) => setNewAgentData({...newAgentData, systemInstruction: e.target.value})}
                              className="w-full h-60 bg-slate-950/50 border border-slate-800 rounded-[2rem] p-8 text-xs font-mono text-slate-300 focus:border-blue-500 focus:outline-none resize-none leading-relaxed shadow-inner"
                              placeholder="Define the core logic and persona constraints..."
                          />
                          <div className="absolute top-4 right-8 flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                             <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Live Editor</span>
                          </div>
                        </div>
                    </div>
                 </div>
               )}
             </div>

             {/* Footer Navigation */}
             <div className="bg-slate-900/80 p-10 flex justify-between items-center border-t border-slate-800/50 backdrop-blur-md">
               {wizardStep > 1 ? (
                 <button 
                  onClick={() => setWizardStep(s => s - 1)} 
                  className="px-8 py-4 text-slate-400 hover:text-white font-black text-xs uppercase tracking-[0.2em] transition-all bg-slate-800/40 rounded-[1.25rem] border border-slate-800 active:scale-95"
                 >
                   Back
                 </button>
               ) : (
                 <button 
                  onClick={() => setIsWizardOpen(false)} 
                  className="px-8 py-4 text-slate-500 hover:text-white font-black text-xs uppercase tracking-[0.2em] transition-all"
                 >
                   Cancel
                 </button>
               )}
               
               {wizardStep < 4 ? (
                 <button 
                  disabled={!newAgentData.name && wizardStep === 1}
                  onClick={() => setWizardStep(s => s + 1)} 
                  className="px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.25rem] font-black text-xs uppercase tracking-[0.2em] shadow-[0_15px_40px_rgba(37,99,235,0.4)] disabled:opacity-30 transition-all active:scale-95 flex items-center gap-4"
                 >
                   Advance
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                 </button>
               ) : (
                 <button onClick={handleCreate} className="px-12 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[1.25rem] font-black text-xs uppercase tracking-[0.2em] shadow-[0_15px_40px_rgba(16,185,129,0.4)] transition-all flex items-center gap-4 active:scale-95 group">
                   <svg className="w-5 h-5 group-hover:scale-125 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                   Deploy Engine
                 </button>
               )}
             </div>
          </div>
        </div>
      )}

      {/* Sidebar - Agent List */}
      <div className="lg:col-span-1 space-y-4">
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Intelligence Fleet</h3>
            <Tooltip content="Commission New Agent">
              <button onClick={() => setIsWizardOpen(true)} className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-900/40 active:scale-90">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              </button>
            </Tooltip>
          </div>
          <div className="relative group">
            <input 
              type="text"
              placeholder="Search fleet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0f172a] border border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-all group-hover:border-slate-700"
            />
            <svg className="w-4 h-4 absolute left-3.5 top-3 text-slate-600 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
          {filteredAgents.map((agent) => (
            <Tooltip key={agent.id} content={`Inspect Telemetry: ${agent.name}`} position="right" className="w-full">
              <button
                onClick={() => onAgentSelect(agent)}
                className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 relative group overflow-hidden ${
                  selectedAgent?.id === agent.id 
                  ? 'bg-blue-600/10 border-blue-500 shadow-[0_10px_30px_rgba(37,99,235,0.1)]' 
                  : 'bg-[#0f172a] border-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex justify-between items-start mb-3 relative z-10">
                  <div className="flex items-center gap-3">
                    <StatusIndicator status={agent.status} />
                    <span className="font-black text-xs text-white uppercase tracking-tight">{agent.name}</span>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-lg bg-slate-900 text-slate-500 font-black uppercase border border-slate-800">{agent.type}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 relative z-10">
                  <div className="space-y-1">
                    <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Fidelity</div>
                    <div className="text-xs font-black text-white">{agent.successRate}%</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Latency</div>
                    <div className="text-xs font-black text-white">{agent.avgLatencyMs}ms</div>
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

        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="px-8 py-5 border-b border-slate-800 bg-slate-900/30 flex justify-between items-center">
            <div className="flex items-center gap-4">
               <h3 className="font-black text-sm text-white uppercase tracking-widest">Inference Stream: {selectedAgent?.name}</h3>
               <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-lg font-black uppercase">Syncing</span>
            </div>
            <div className="flex gap-4">
              <button className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors font-black uppercase tracking-[0.2em]">Export Telemetry</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-600 uppercase text-[9px] font-black tracking-[0.3em]">
                <tr>
                  <th className="px-8 py-4">Temporal Index</th>
                  <th className="px-8 py-4">Operation</th>
                  <th className="px-8 py-4">Execution</th>
                  <th className="px-8 py-4">State</th>
                  <th className="px-8 py-4">Resources</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {traces.map((trace) => (
                  <tr key={trace.id} className="hover:bg-slate-900/50 transition-colors cursor-default group">
                    <td className="px-8 py-5 font-mono text-[10px] text-slate-500">{new Date(trace.timestamp).toLocaleTimeString()}</td>
                    <td className="px-8 py-5 font-black text-xs text-white uppercase tracking-tight">{trace.spanName}</td>
                    <td className="px-8 py-5 text-xs text-slate-400 font-bold">{trace.durationMs}ms</td>
                    <td className="px-8 py-5">
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        trace.status === 'ok' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                      }`}>
                        {trace.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 font-mono text-[10px] text-slate-500">{trace.tokens} <span className="opacity-40">TKNS</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trace Analysis Panel */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl group-hover:bg-blue-600/10 transition-all"></div>
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">Inference Core Analysis</h4>
            <Tooltip content="Neural Insight Generation">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Tooltip>
          </div>
          <div className="bg-slate-950/80 rounded-[2rem] p-8 font-mono text-xs text-blue-400 leading-relaxed border border-slate-800 shadow-inner">
            {`{
  "traceId": "tr-99283-epb",
  "reasoning": "Processing multi-tenant financial vectors for Q2 discrepancy analysis.",
  "engine": "gemini-3-pro-preview",
  "thinking_budget_used": 2405,
  "confidence_score": 0.994,
  "next_op": "reconciliation_logic_gate"
}`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentObservability;