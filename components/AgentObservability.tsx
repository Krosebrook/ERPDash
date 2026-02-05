import React, { useState, useMemo } from 'react';
import { Agent, TraceSpan, AgentType } from '../types';
import Tooltip from './Tooltip';

interface Props {
  agents: Agent[];
  selectedAgent: Agent | null;
  onAgentSelect: (agent: Agent) => void;
  onAddAgent: (agent: Agent) => void;
  traces: TraceSpan[];
}

const AgentObservability: React.FC<Props> = ({ agents, selectedAgent, onAgentSelect, onAddAgent, traces }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [newAgentData, setNewAgentData] = useState<Partial<Agent>>({
    name: '',
    type: AgentType.COPILOT,
    status: 'draft',
    successRate: 0,
    avgLatencyMs: 0,
    totalTokens: 0,
    costUSD: 0,
    hitlPending: 0
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
          <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center animate-in zoom-in duration-300">
             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
        );
      case 'suspended': 
        return (
          <div className="w-5 h-5 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center animate-in zoom-in duration-300">
             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 9v6m4-6v6" /></svg>
          </div>
        );
      case 'draft': 
        return (
          <div className="w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center animate-in zoom-in duration-300">
             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
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
    setNewAgentData({ name: '', type: AgentType.COPILOT, status: 'draft', successRate: 0, avgLatencyMs: 0, totalTokens: 0, costUSD: 0, hitlPending: 0 });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in slide-in-from-bottom duration-500 relative">
      
      {/* Creation Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
             <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
               <h3 className="text-white font-bold text-lg">Deploy New Agent</h3>
               <span className="text-white/60 text-sm font-mono">Step {wizardStep}/3</span>
             </div>
             <div className="p-8">
               {wizardStep === 1 && (
                 <div className="space-y-4">
                   <label className="block text-sm font-bold text-[var(--text-secondary)] uppercase">Agent Identity</label>
                   <input 
                     autoFocus
                     type="text" 
                     placeholder="e.g., Supply Chain Optimizer" 
                     className="w-full bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-4 text-[var(--text-primary)] focus:border-blue-500 focus:outline-none transition-colors"
                     value={newAgentData.name}
                     onChange={(e) => setNewAgentData({...newAgentData, name: e.target.value})}
                   />
                 </div>
               )}
               {wizardStep === 2 && (
                 <div className="space-y-4">
                   <label className="block text-sm font-bold text-[var(--text-secondary)] uppercase">Agent Archetype</label>
                   <div className="grid grid-cols-2 gap-3">
                     {Object.values(AgentType).map(t => (
                       <button 
                        key={t}
                        onClick={() => setNewAgentData({...newAgentData, type: t})}
                        className={`p-4 rounded-xl border text-left transition-all ${newAgentData.type === t ? 'border-blue-500 bg-blue-500/10' : 'border-[var(--border-color)] bg-[var(--bg-main)] hover:border-[var(--text-secondary)]'}`}
                       >
                         <div className="font-bold text-[var(--text-primary)] capitalize">{t.replace('_', ' ')}</div>
                       </button>
                     ))}
                   </div>
                 </div>
               )}
               {wizardStep === 3 && (
                 <div className="space-y-6">
                   <div className="bg-[var(--bg-main)] p-4 rounded-xl border border-[var(--border-color)]">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                          {newAgentData.name?.[0] || 'A'}
                        </div>
                        <div>
                          <div className="font-bold text-[var(--text-primary)]">{newAgentData.name}</div>
                          <div className="text-xs text-[var(--text-secondary)] capitalize">{newAgentData.type}</div>
                        </div>
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] mt-4 pt-4 border-t border-[var(--border-color)]">
                        Initialize with Gemini 3 Pro reasoning capabilities?
                      </div>
                   </div>
                 </div>
               )}
             </div>
             <div className="bg-[var(--bg-element)] p-4 flex justify-between">
               {wizardStep > 1 ? (
                 <button onClick={() => setWizardStep(s => s - 1)} className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold">Back</button>
               ) : (
                 <button onClick={() => setIsWizardOpen(false)} className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold">Cancel</button>
               )}
               
               {wizardStep < 3 ? (
                 <button 
                  disabled={!newAgentData.name}
                  onClick={() => setWizardStep(s => s + 1)} 
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   Next Step
                 </button>
               ) : (
                 <button onClick={handleCreate} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold shadow-lg shadow-green-500/20">
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
              <button onClick={() => setIsWizardOpen(true)} className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
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
                className={`w-full text-left p-4 rounded-xl border transition-all ${
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
                    <span className="font-bold text-sm text-[var(--text-primary)]">{agent.name}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-element)] text-[var(--text-secondary)] font-mono uppercase">{agent.type}</span>
                </div>
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
        <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-lg">
          <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-element)] flex justify-between items-center">
            <h3 className="font-bold text-[var(--text-primary)]">Real-time Traces: {selectedAgent?.name}</h3>
            <div className="flex gap-4">
              <Tooltip content="Download raw telemetry log as JSON">
                <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Export Traces</button>
              </Tooltip>
              <Tooltip content="Watch agent thoughts stream in real-time">
                <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Live View</button>
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