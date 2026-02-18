
import React, { useState, useMemo } from 'react';
import { UserRole, AuditLog } from '../types';
import Tooltip from './Tooltip';
import { generateInputSuggestion } from '../services/geminiService';

interface Props {
  userRole: UserRole;
  auditLogs: AuditLog[];
  currentCost: number;
}

const CostCompliance: React.FC<Props> = ({ userRole, auditLogs, currentCost }) => {
  const [actionFilter, setActionFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // New State for Natural Language Search
  const [searchQuery, setSearchQuery] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);

  const uniqueActions = useMemo(() => Array.from(new Set(auditLogs.map(log => log.action))), [auditLogs]);
  const uniqueActors = useMemo(() => Array.from(new Set(auditLogs.map(log => log.user))), [auditLogs]);
  const uniqueStatuses = useMemo(() => Array.from(new Set(auditLogs.map(log => log.status))), [auditLogs]);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      // Basic fuzzy search on query
      const matchQuery = !searchQuery || 
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) || 
        log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchAction = !actionFilter || log.action === actionFilter;
      const matchActor = !actorFilter || log.user === actorFilter;
      const matchStatus = !statusFilter || log.status === statusFilter;
      return matchAction && matchActor && matchStatus && matchQuery;
    });
  }, [auditLogs, actionFilter, actorFilter, statusFilter, searchQuery]);

  const handleSuggestion = async () => {
    if (isSuggesting) return;
    setIsSuggesting(true);
    try {
        const suggestion = await generateInputSuggestion('compliance_query', searchQuery, "Recent actions: " + uniqueActions.slice(0, 3).join(', '));
        if (suggestion) setSearchQuery(suggestion);
    } catch (e) {
        console.error("Suggestion failed", e);
    } finally {
        setIsSuggesting(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in zoom-in-95 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-6">Cost Controls</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Budget Usage</span>
                <span className="font-bold text-blue-400">{(currentCost / 14800 * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${Math.min(100, (currentCost / 14800 * 100))}%` }}></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">Spent</span>
                <span className="text-lg md:text-xl font-bold font-mono">${currentCost.toFixed(2)}</span>
              </div>
              <div className="p-4 bg-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">Cap</span>
                <span className="text-lg md:text-xl font-bold font-mono">$14.8k</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-6">Compliance</h3>
          <div className="space-y-3">
            {[
              { name: 'SOC 2 Type II', status: 'Compliant', color: 'text-green-500' },
              { name: 'GDPR / CCPA', status: 'Compliant', color: 'text-green-500' },
              { name: 'EU AI Act', status: 'Process', color: 'text-blue-500' },
            ].map((f) => (
              <div key={f.name} className="flex justify-between items-center p-3 bg-slate-800 rounded-lg border border-transparent hover:border-slate-700 transition-colors">
                <span className="font-medium text-xs md:text-sm">{f.name}</span>
                <span className={`text-[9px] font-black uppercase tracking-widest ${f.color}`}>{f.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1 w-full md:max-w-md relative group">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </div>
             <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Natural Language Audit Search..." 
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-10 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
             />
             <Tooltip content="Auto-complete search query">
                <button onClick={handleSuggestion} disabled={isSuggesting} className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-500 hover:text-white transition-colors disabled:opacity-50">
                    {isSuggesting ? (
                         <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    ) : (
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    )}
                </button>
             </Tooltip>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="flex-1 md:flex-none bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-[9px] md:text-[10px] text-slate-300 focus:outline-none cursor-pointer">
              <option value="">All Actions</option>
              {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={actorFilter} onChange={(e) => setActorFilter(e.target.value)} className="flex-1 md:flex-none bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-[9px] md:text-[10px] text-slate-300 focus:outline-none cursor-pointer">
              <option value="">All Actors</option>
              {uniqueActors.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <button className="w-full md:w-auto text-[9px] md:text-[10px] bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded border border-slate-700 text-blue-400 font-bold transition-colors">Export CSV</button>
          </div>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm min-w-[700px]">
            <thead className="bg-slate-800/30 text-slate-500 uppercase text-[9px] md:text-[10px] font-bold tracking-widest sticky top-0 z-10 backdrop-blur-md">
                <tr>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Resource</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Time</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium">
                {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors animate-in slide-in-from-left-2 duration-300">
                    <td className="px-6 py-4 font-mono text-[10px] md:text-xs text-blue-400">{log.action}</td>
                    <td className="px-6 py-4 text-[11px] md:text-xs text-slate-200">{log.user}</td>
                    <td className="px-6 py-4 text-[11px] md:text-xs text-slate-400">{log.resource}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[8px] md:text-[10px] font-bold uppercase ${log.status === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[10px] md:text-xs text-slate-500 font-mono">{new Date(log.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default CostCompliance;
