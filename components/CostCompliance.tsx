
import React, { useState, useMemo } from 'react';
import { UserRole, AuditLog } from '../types';
import { MOCK_AUDIT_LOGS } from '../constants';
import Tooltip from './Tooltip';

const CostCompliance: React.FC<{ userRole: UserRole }> = ({ userRole }) => {
  const [actionFilter, setActionFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const uniqueActions = useMemo(() => Array.from(new Set(MOCK_AUDIT_LOGS.map(log => log.action))), []);
  const uniqueActors = useMemo(() => Array.from(new Set(MOCK_AUDIT_LOGS.map(log => log.user))), []);
  const uniqueStatuses = useMemo(() => Array.from(new Set(MOCK_AUDIT_LOGS.map(log => log.status))), []);

  const filteredLogs = useMemo(() => {
    return MOCK_AUDIT_LOGS.filter(log => {
      const matchAction = !actionFilter || log.action === actionFilter;
      const matchActor = !actorFilter || log.user === actorFilter;
      const matchStatus = !statusFilter || log.status === statusFilter;
      return matchAction && matchActor && matchStatus;
    });
  }, [actionFilter, actorFilter, statusFilter]);

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-6">Cost Controls</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Monthly Budget Usage</span>
                <span className="font-bold text-blue-400">84%</span>
              </div>
              <Tooltip content="Spending reaches alert threshold at 90%" position="bottom">
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden cursor-help">
                  <div className="bg-blue-600 h-full w-[84%]"></div>
                </div>
              </Tooltip>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Tooltip content="Actual recognized costs to date">
                <div className="p-4 bg-slate-800 rounded-lg cursor-help">
                  <span className="text-xs text-slate-500 uppercase block mb-1">Spent</span>
                  <span className="text-xl font-bold">$12,450</span>
                </div>
              </Tooltip>
              <Tooltip content="Estimated cost at end of billing cycle">
                <div className="p-4 bg-slate-800 rounded-lg cursor-help">
                  <span className="text-xs text-slate-500 uppercase block mb-1">Projected</span>
                  <span className="text-xl font-bold">$14,800</span>
                </div>
              </Tooltip>
            </div>

            <div className="pt-4">
              <Tooltip content="Manage consumption caps and notification rules" position="bottom" className="w-full">
                <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors border border-slate-700">
                  Adjust Budget Thresholds
                </button>
              </Tooltip>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-6">Compliance Frameworks</h3>
          <div className="space-y-4">
            {[
              { name: 'SOC 2 Type II', status: 'Compliant', color: 'text-green-500', hint: 'Annual audit completed 03/24' },
              { name: 'GDPR / CCPA', status: 'Compliant', color: 'text-green-500', hint: 'Privacy controls verified' },
              { name: 'HIPAA (PHS)', status: 'N/A', color: 'text-slate-500', hint: 'Not applicable for current workload' },
              { name: 'NIST AI RMF 2.0', status: 'In Review', color: 'text-yellow-500', hint: 'Draft assessment in progress' },
              { name: 'EU AI Act', status: 'In Progress', color: 'text-blue-500', hint: 'Article 28 mapping underway' },
            ].map((f) => (
              <Tooltip key={f.name} content={f.hint} position="left" className="w-full">
                <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg cursor-help border border-transparent hover:border-slate-700 transition-colors">
                  <span className="font-medium text-sm">{f.name}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${f.color}`}>{f.status}</span>
                </div>
              </Tooltip>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="font-bold text-lg">Immutable Audit Trail</h3>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <select 
              value={actionFilter} 
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Actions</option>
              {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select 
              value={actorFilter} 
              onChange={(e) => setActorFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Actors</option>
              {uniqueActors.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <Tooltip content="Download cryptographically signed PDF audit report">
              <button className="text-[10px] bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded border border-slate-700 text-blue-400 font-bold transition-colors">Download Report</button>
            </Tooltip>
          </div>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-800/30 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
            <tr>
              <th className="px-6 py-3">Action</th>
              <th className="px-6 py-3">Actor</th>
              <th className="px-6 py-3">Resource</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-blue-400">{log.action}</td>
                <td className="px-6 py-4 text-slate-200">{log.user}</td>
                <td className="px-6 py-4 text-slate-400">{log.resource}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    log.status === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {log.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-500 italic text-sm">
                  No audit logs match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CostCompliance;
