
import React, { useState, useMemo } from 'react';
import { Agent, TraceSpan, AgentType } from '../types';
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
  'Data Analyst': 'You are a Senior Data Analyst. Your goal is to interpret complex datasets, generate SQL queries for the data warehouse, and identify statistical anomalies. Output should be structured and data-dense.',
  'Security Guardian': 'You are a Cybersecurity Operations Expert. Continuously monitor access logs, flag suspicious patterns, and strictly adhere to NIST-800-53 compliance protocols. Prioritize system integrity above all.',
  'Creative Strategist': 'You are a Chief Strategy Officer. When presented with a problem, propose multiple divergent strategic approaches (e.g., Aggressive Growth, Risk Averse, Efficiency Focused). Use high-level business terminology.'
};

const AgentObservability: React.FC<Props> = ({ agents, selectedAgent, onAgentSelect, onAddAgent, traces }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [newAgentData, setNewAgentData] = useState<Partial<Agent>>({
    name: '',
    description: '',
    type: AgentType.COPILOT,
    status: 'draft',
    successRate: 0,
    avgLatencyMs: 0,
    totalTokens: 0,
    costUSD: 0,
    hitlPending: 0,
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

  const getStatusIcon = (status: Agent['status']) => {
    switch (status) {
      case 'active': 
        return (
          <div key="active" className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center animate-in zoom-in duration-300 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          </div>
        );
      case 'suspended': 
        return (
          <div key="suspended" className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center animate-in zoom-in duration-300 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]">
             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 9v6m4-6v6" /></svg>
          </div>
        );
      case 'draft': 
        return (
          <div key="draft" className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center animate-in zoom-in duration-300 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </div>
        );
      default: return null;
    }
  };

  const handleCreate = () => {
    const id = `agent-${Date.now()}`;
    onAddAgent({ ...newAgentData, id } as Agent);
    setIsWizardOpen(false);
    setWizardStep(1);
    // Reset
    setNewAgentData({ 
        name: '', 
        description: '',
        type: AgentType.COPILOT, 
        status: 'draft', 
        successRate: 0, 
        avgLatencyMs: 0, 
        totalTokens: 0, 
        costUSD: 0, 
        hitlPending: 0,
        model: 'gemini-3-flash-preview',
        temperature: 0.7,
        systemInstruction: PERSONA_TEMPLATES['General Assistant']
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in slide-in-from-bottom duration-500 relative">
      
      {/* Creation Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
             {/* Wizard Header */}
             <div className="bg-blue-600 px-6 py-4 flex justify-between items-center shrink-0">
               <div>
                 <h3 className="text-white font-bold text-lg">Deploy New Agent</h3>
                 <p className="text-blue-100 text-xs mt-0.5">Gemini-powered autonomous worker</p>
               </div>
               <div className="flex flex-col items-end">
                  <span className="text-white/80 text-xs font-mono font-bold">Step {wizardStep}/3</span>
                  <div className="flex gap-1 mt-1">
                     {[1, 2, 3].map(step => (
                        <div key={step} className={`w-2 h-2 rounded-full ${step <= wizardStep ? 'bg-white' : 'bg-blue-500/50'}`} />
                     ))}
                  </div>
               </div>
             </div>
             
             {/* Wizard Body - Scrollable */}
             <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
               {/* STEP 1: IDENTITY */}
               {wizardStep === 1 && (
                 <div className="space-y-6 animate-in slide-in-from-right duration-300">
                   <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Agent Name</label>
                      <input 
                        autoFocus
                        type="text" 
                        placeholder="e.g., Supply Chain Optimizer" 
                        className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-4 text-[var(--text-primary)] focus:border-blue-500 focus:outline-none transition-colors shadow-inner"
                        value={newAgentData.name}
                        onChange={(e) => setNewAgentData({...newAgentData, name: e.target.value})}
                      />
                   </div>
                   
                   <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">Description</label>
                      <textarea 
                        placeholder="Describe the agent's purpose and scope..."
                        className="w-full h-24 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-4 text-sm text-[var(--text-primary)] focus:border-blue-500 focus:outline-none transition-colors resize-none shadow-inner"
                        value={newAgentData.description}
                        onChange={(e) => setNewAgentData({...newAgentData, description: e.target.value})}
                      />
                   </div>
                 </div>
               )}

               {/* STEP 2: ARCHETYPE */}
               {wizardStep === 2 && (
                 <div className="space-y-4 animate-in slide-in-from-right duration-300">
                   <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase">Agent Archetype</label>
                   <div className="grid grid-cols-1 gap-3">
                     {Object.values(AgentType).map(t => (
                       <button 
                        key={t}
                        onClick={() => setNewAgentData({...newAgentData, type: t})}
                        className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between group ${newAgentData.type === t ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'border-[var(--border-color)] bg-[var(--bg-main)] hover:border-[var(--text-secondary)]'}`}
                       >
                         <div>
                            <div className="font-bold text-[var(--text-primary)] capitalize mb-1">{t.replace('_', ' ')}</div>
                            <div className="text-[10px] text-[var(--text-secondary)] leading-tight">
                                {t === AgentType.COPILOT ? 'Assists users with tasks via chat interface.' :
                                t === AgentType.ANALYST ? 'Processes data and generates reports.' :
                                t === AgentType.AUTOMATION_BOT ? 'Runs background jobs autonomously.' : 'Custom configuration.'}
                            </div>
                         </div>
                         <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${newAgentData.type === t ? 'border-blue-500' : 'border-slate-600'}`}>
                             {newAgentData.type === t && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                         </div>
                       </button>
                     ))}
                   </div>
                 </div>
               )}

               {/* STEP 3: CONFIGURATION & PERSONA */}
               {wizardStep === 3 && (
                 <div className="space-y-6 animate-in slide-in-from-right duration-300">
                    {/* Model Selection */}
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-3">Reasoning Engine</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['gemini-3-pro-preview', 'gemini-3-flash-preview'].map(m => (
                                <button
                                    key={m}
                                    onClick={() => setNewAgentData({...newAgentData, model: m})}
                                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                                        newAgentData.model === m 
                                        ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-inner' 
                                        : 'border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:border-slate-500'
                                    }`}
                                >
                                    <div className="font-bold mb-1">{m === 'gemini-3-pro-preview' ? 'Gemini 3 Pro' : 'Gemini 3 Flash'}</div>
                                    <div className="opacity-70 scale-90 origin-left">{m === 'gemini-3-pro-preview' ? 'Deep reasoning & complexity' : 'Low latency & high throughput'}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Temperature Slider */}
                    <div>
                        <div className="flex justify-between mb-2">
                             <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase">Creativity (Temperature)</label>
                             <span className="text-xs font-mono font-bold text-blue-400">{newAgentData.temperature}</span>
                        </div>
                        <input 
                            type="range" min="0" max="1" step="0.1"
                            value={newAgentData.temperature}
                            onChange={(e) => setNewAgentData({...newAgentData, temperature: parseFloat(e.target.value)})}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    {/* Persona Linking */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase">System Persona</label>
                            <span className="text-[10px] text-blue-400 font-mono flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                LINKED_TO_GEMINI
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {Object.keys(PERSONA_TEMPLATES).map(p => (
                                <button
                                    key={p}
                                    onClick={() => setNewAgentData({...newAgentData, systemInstruction: PERSONA_TEMPLATES[p]})}
                                    className="px-2 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-element)] text-[10px] font-bold text-[var(--text-secondary)] hover:text-white hover:border-blue-500 transition-colors"
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                        <textarea
                            value={newAgentData.systemInstruction}
                            onChange={(e) => setNewAgentData({...newAgentData, systemInstruction: e.target.value})}
                            className="w-full h-24 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-3 text-xs font-mono text-[var(--text-primary)] focus:border-blue-500 focus:outline-none resize-none placeholder:text-slate-600 leading-relaxed"
                            placeholder="Define the agent's core directive and behavioral constraints..."
                        />
                    </div>
                 </div>
               )}
             </div>

             {/* Footer Navigation */}
             <div className="bg-[var(--bg-element)] p-4 flex justify-between items-center border-t border-[var(--border-color)] shrink-0">
               {wizardStep > 1 ? (
                 <button onClick={() => setWizardStep(s => s - 1)} className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-sm transition-colors">Back</button>
               ) : (
                 <button onClick={() => setIsWizardOpen(false)} className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-sm transition-colors">Cancel</button>
               )}
               
               {wizardStep < 3 ? (
                 <button 
                  disabled={!newAgentData.name}
                  onClick={() => setWizardStep(s => s + 1)} 
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                 >
                   Next Step
                 </button>
               ) : (
                 <button onClick={handleCreate} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                   Deploy Agent
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
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Active Agents</h3>
            <Tooltip content="Launch creation wizard">
              <button onClick={() => setIsWizardOpen(true)} className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              </button>
            </Tooltip>
          </div>
          <div className="relative">
            <input 
              type="text"
              placeholder="Filter by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg py-2 pl-9 pr-4 text-xs text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-colors"
            />
            <svg className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
          {filteredAgents.map((agent) => (
            <Tooltip key={agent.id} content={`Inspect telemetry for ${agent.name}`} position="right" className="w-full">
              <button
                onClick={() => onAgentSelect(agent)}
                className={`w-full text-left p-4 rounded-xl border transition-all group ${
                  selectedAgent?.id === agent.id 
                  ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-500/5' 
                  : 'bg-[var(--bg-panel)] border-[var(--border-color)] hover:border-[var(--text-secondary)]'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Tooltip content={`Status: ${agent.status}`}>
                       {getStatusIcon(agent.status)}
                    </Tooltip>
                    <span className="font-bold text-sm text-[var(--text-primary)] group-hover:text-blue-400 transition-colors">{agent.name}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-element)] text-[var(--text-secondary)] font-mono uppercase">{agent.type}</span>
                </div>
                {agent.description && (
                     <div className="text-[10px] text-[var(--text-secondary)] line-clamp-1 mb-2 italic opacity-80">{agent.description}</div>
                )}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="text-[10px] text-[var(--text-secondary)]">Success: <span className="text-[var(--text-primary)]">{agent.successRate}%</span></div>
                  <div className="text-[10px] text-[var(--text-secondary)]">Latency: <span className="text-[var(--text-primary)]">{agent.avgLatencyMs}ms</span></div>
                </div>
              </button>
            </Tooltip>
          ))}
          {filteredAgents.length === 0 && (
            <div className="text-center py-8 text-[var(--text-secondary)] text-xs italic">
              No agents matching your search.
            </div>
          )}
        </div>
      </div>

      {/* Main Trace Viewer */}
      <div className="lg:col-span-3 space-y-6">
        {/* NEW VISUALIZATION */}
        <TraceTimeline traces={traces} />

        <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-lg">
          <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-element)] flex justify-between items-center">
            <div className="flex items-center gap-3">
                 <h3 className="font-bold text-[var(--text-primary)]">Real-time Traces: {selectedAgent?.name}</h3>
                 {selectedAgent?.model && (
                     <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full font-mono uppercase">
                         {selectedAgent.model.replace('-preview', '')}
                     </span>
                 )}
            </div>
            <div className="flex gap-4">
              <Tooltip content="Download raw telemetry log as JSON">
                <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-bold uppercase tracking-wider">Export Traces</button>
              </Tooltip>
              <Tooltip content="Watch agent thoughts stream in real-time">
                <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-bold uppercase tracking-wider">Live View</button>
              </Tooltip>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--bg-main)] text-[var(--text-secondary)] uppercase text-[10px] font-bold tracking-widest">
                <tr>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Span Name</th>
                  <th className="px-6 py-3">Duration</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Tokens</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {traces.map((trace) => (
                  <tr key={trace.id} className="hover:bg-[var(--bg-element)] transition-colors cursor-default">
                    <td className="px-6 py-4 font-mono text-xs text-[var(--text-secondary)]">{new Date(trace.timestamp).toLocaleTimeString()}</td>
                    <td className="px-6 py-4 font-medium text-[var(--text-primary)]">{trace.spanName}</td>
                    <td className="px-6 py-4 text-[var(--text-primary)]">{trace.durationMs}ms</td>
                    <td className="px-6 py-4">
                      <Tooltip content={trace.status === 'ok' ? 'Operation completed successfully' : 'Operation encountered an error'}>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          trace.status === 'ok' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {trace.status.toUpperCase()}
                        </span>
                      </Tooltip>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-[var(--text-secondary)]">{trace.tokens}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trace Attributes Panel */}
        <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold uppercase text-[var(--text-secondary)] tracking-widest">Span Analysis (ReAct Step 3)</h4>
            <Tooltip content="Gemini analysis of the internal thought logic">
              <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Tooltip>
          </div>
          <div className="bg-[var(--bg-main)] rounded p-4 font-mono text-xs text-blue-400 leading-relaxed border border-[var(--border-color)]">
            {`{
  "traceId": "tr-99283-epb",
  "thought": "The user is asking for financial reconciliation between Q1 and Q2.",
  "action": "sql_query",
  "action_input": "SELECT sum(amount) FROM transactions WHERE quarter = 'Q1'",
  "observation": "Sum: 45,200.00",
  "next_thought": "I need to fetch Q2 data to compare."
}`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentObservability;
