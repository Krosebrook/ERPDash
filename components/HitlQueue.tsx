
import React from 'react';
import { UserRole } from '../types';
import Tooltip from './Tooltip';

const HitlQueue: React.FC<{ userRole: UserRole }> = ({ userRole }) => {
  const pendingRequests = [
    { id: 'h-1', agent: 'Finance Copilot', action: 'Transfer Funds', amount: '$45,000', user: 'j.doe@int.inc', time: '2 mins ago' },
    { id: 'h-2', agent: 'Finance Copilot', action: 'Update Credit Limit', amount: 'N/A', user: 'k.smith@int.inc', time: '14 mins ago' },
  ];

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">HITL Approval Queue</h2>
        <div className="text-sm text-slate-400">Showing <span className="text-blue-400 font-bold">{pendingRequests.length}</span> pending approvals</div>
      </div>

      <div className="space-y-4">
        {pendingRequests.map((req) => (
          <div key={req.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-500/50 transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center text-blue-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-lg text-slate-100">{req.action}</h4>
                <p className="text-sm text-slate-400">Requested by <span className="text-slate-200">{req.user}</span> via {req.agent}</p>
              </div>
            </div>

            <div className="flex flex-col md:items-end">
              <span className="text-xl font-mono font-bold text-slate-100 mb-1">{req.amount}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest">{req.time}</span>
            </div>

            <div className="flex gap-2">
              <Tooltip content="Authorize this request and resume agent execution">
                <button className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-green-600/10">Approve</button>
              </Tooltip>
              <Tooltip content="Deny request and terminate current agent session">
                <button className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-red-600/10">Reject</button>
              </Tooltip>
              <Tooltip content="Inspect full reasoning trace and context">
                <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-bold transition-colors border border-slate-700">Details</button>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>

      {pendingRequests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>Queue is empty. Good job!</p>
        </div>
      )}
    </div>
  );
};

export default HitlQueue;
