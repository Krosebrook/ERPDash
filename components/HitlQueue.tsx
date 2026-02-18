
import React, { useState } from 'react';
import { UserRole } from '../types';
import Tooltip from './Tooltip';
import { generateInputSuggestion } from '../services/geminiService';

interface Props {
  userRole: UserRole;
  requests: any[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const HitlQueue: React.FC<Props> = ({ userRole, requests, onApprove, onReject }) => {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [suggestingId, setSuggestingId] = useState<string | null>(null);

  const handleSuggestion = async (id: string, req: any) => {
    if (suggestingId) return;
    setSuggestingId(id);
    try {
        const currentNote = notes[id] || '';
        const context = `Request Action: ${req.action}. Amount: ${req.amount}. User: ${req.user}. Agent: ${req.agent}.`;
        const suggestion = await generateInputSuggestion('hitl_note', currentNote, context);
        if (suggestion) {
            setNotes(prev => ({ ...prev, [id]: suggestion }));
        }
    } catch (e) {
        console.error("Suggestion failed", e);
    } finally {
        setSuggestingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-500">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">HITL Approval Queue</h2>
        <div className="text-sm text-slate-400">Showing <span className="text-blue-400 font-bold">{requests.length}</span> pending approvals</div>
      </div>

      <div className="space-y-4">
        {requests.map((req) => (
          <div key={req.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-6 hover:border-blue-500/50 transition-all group animate-in zoom-in-95">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
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
            </div>

            {/* Analyst Note Section */}
            <div className="relative group/note">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Analyst Resolution Note</label>
                <div className="relative">
                    <textarea 
                        value={notes[req.id] || ''}
                        onChange={(e) => setNotes({...notes, [req.id]: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-300 focus:outline-none focus:border-blue-500 resize-none h-20 placeholder:text-slate-700 transition-all"
                        placeholder="Enter justification for audit log..."
                    />
                    <Tooltip content="Auto-generate justification based on request details">
                        <button 
                            onClick={() => handleSuggestion(req.id, req)} 
                            disabled={!!suggestingId}
                            className="absolute bottom-2 right-2 text-blue-500 hover:text-white p-1 rounded hover:bg-blue-600/20 transition-all disabled:opacity-50"
                        >
                            {suggestingId === req.id ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            )}
                        </button>
                    </Tooltip>
                </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-800">
              <Tooltip content="Authorize this request and resume agent execution">
                <button 
                  onClick={() => onApprove(req.id)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs md:text-sm font-bold transition-colors shadow-lg shadow-green-600/10 uppercase tracking-wide"
                >
                  Approve
                </button>
              </Tooltip>
              <Tooltip content="Deny request and terminate current agent session">
                <button 
                  onClick={() => onReject(req.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs md:text-sm font-bold transition-colors shadow-lg shadow-red-600/10 uppercase tracking-wide"
                >
                  Reject
                </button>
              </Tooltip>
              <Tooltip content="Inspect full reasoning trace and context">
                <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs md:text-sm font-bold transition-colors border border-slate-700 uppercase tracking-wide">Details</button>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>

      {requests.length === 0 && (
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
