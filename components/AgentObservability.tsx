
import React, { useState, useMemo } from 'react';
import { Agent, TraceSpan } from '../types';
import Tooltip from './Tooltip';

interface Props {
  agents: Agent[];
  selectedAgent: Agent | null;
  onAgentSelect: (agent: Agent) => void;
  traces: TraceSpan[];
}

const AgentObservability: React.FC<Props> = ({ agents, selectedAgent, onAgentSelect, traces }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAgents = useMemo(() => {
    return agents.filter(agent => 
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [agents, searchTerm]);

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'suspended': return 'bg-red-500';
      case 'draft': return 'bg-yellow-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in slide-in-from-bottom duration-500">
      {/* Sidebar - Agent List */}
      <div className="lg:col-span-1 space-y-4">
        <div className="flex flex-col gap-4 mb-4">
          <h3 className="text-lg font-bold text-slate-200">Active Agents</h3>
          <div className="relative">
            <input 
              type="text"
              placeholder="Filter by name or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-300 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <svg className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="space-y-3">
          {filteredAgents.map((agent) => (
            <Tooltip key={agent.id} content={`Inspect telemetry for ${agent.name}`} position="right" className="w-full">
              <button
                onClick={() => onAgentSelect(agent)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedAgent?.id === agent.id 
                  ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-500/5' 
                  : 'bg-slate-900 border-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Tooltip content={`Status: ${agent.status}`}>
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`}></span>
                    </Tooltip>
                    <span className="font-bold text-sm text-slate-100">{agent.name}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">{agent.type}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="text-[10px] text-slate-500">Success: <span className="text-slate-200">{agent.successRate}%</span></div>
                  <div className="text-[10px] text-slate-500">Latency: <span className="text-slate-200">{agent.avgLatencyMs}ms</span></div>
                </div>
              </button>
            </Tooltip>
          ))}
          {filteredAgents.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-xs italic">
              No agents matching your search.
            </div>
          )}
        </div>
      </div>

      {/* Main Trace Viewer */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50 flex justify-between items-center">
            <h3 className="font-bold">Real-time Traces: {selectedAgent?.name}</h3>
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
              <thead className="bg-slate-800/30 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                <tr>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Span Name</th>
                  <th className="px-6 py-3">Duration</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Tokens</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {traces.map((trace) => (
                  <tr key={trace.id} className="hover:bg-slate-800/30 transition-colors cursor-default">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{new Date(trace.timestamp).toLocaleTimeString()}</td>
                    <td className="px-6 py-4 font-medium text-slate-200">{trace.spanName}</td>
                    <td className="px-6 py-4 text-slate-300">{trace.durationMs}ms</td>
                    <td className="px-6 py-4">
                      <Tooltip content={trace.status === 'ok' ? 'Operation completed successfully' : 'Operation encountered an error'}>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          trace.status === 'ok' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {trace.status.toUpperCase()}
                        </span>
                      </Tooltip>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{trace.tokens}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trace Attributes Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold uppercase text-slate-500 tracking-widest">Span Analysis (ReAct Step 3)</h4>
            <Tooltip content="Gemini analysis of the internal thought logic">
              <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Tooltip>
          </div>
          <div className="bg-slate-950 rounded p-4 font-mono text-xs text-blue-300 leading-relaxed border border-slate-800">
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
