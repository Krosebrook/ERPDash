
import React from 'react';

const ReasoningLog: React.FC<{ text: string }> = ({ text }) => {
  const steps = text.split('\n').filter(t => t.trim().length > 0);
  
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 font-mono text-xs leading-relaxed overflow-hidden">
      <div className="flex items-center gap-2 mb-4 text-purple-400">
        <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="font-bold uppercase tracking-widest">Inference Reasoning Stream</span>
      </div>
      <div className="space-y-2 opacity-80 max-h-[400px] overflow-y-auto custom-scrollbar">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-3 group">
            <span className="text-slate-600 select-none">[{i.toString().padStart(2, '0')}]</span>
            <span className="text-slate-300 group-hover:text-white transition-colors">
              {step.startsWith('THOUGHT:') ? <span className="text-purple-300 font-bold">{step}</span> : step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReasoningLog;
