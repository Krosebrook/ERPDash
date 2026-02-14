import React from 'react';
import { TraceSpan } from '../types';
import Tooltip from './Tooltip';

interface Props {
  traces: TraceSpan[];
}

const TraceTimeline: React.FC<Props> = ({ traces }) => {
  if (traces.length === 0) return null;

  // Calculate scaling
  const startTime = new Date(traces[0].timestamp).getTime();
  const endTime = new Date(traces[traces.length - 1].timestamp).getTime() + traces[traces.length - 1].durationMs;
  const totalDuration = endTime - startTime;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg mb-6">
      <h3 className="text-sm font-bold uppercase text-slate-400 tracking-widest mb-6">Execution Timeline</h3>
      <div className="space-y-3 relative">
         {/* Grid lines could go here */}
         <div className="absolute top-0 bottom-0 left-0 w-px bg-slate-800/50"></div>
         <div className="absolute top-0 bottom-0 left-1/4 w-px bg-slate-800/50"></div>
         <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-800/50"></div>
         <div className="absolute top-0 bottom-0 left-3/4 w-px bg-slate-800/50"></div>
         <div className="absolute top-0 bottom-0 right-0 w-px bg-slate-800/50"></div>

         {traces.map((trace) => {
             const start = new Date(trace.timestamp).getTime();
             const offset = ((start - startTime) / totalDuration) * 100;
             const width = (trace.durationMs / totalDuration) * 100;
             
             // Ensure minimal visibility
             const safeWidth = Math.max(width, 0.5);

             return (
                 <div key={trace.id} className="relative h-8 flex items-center group">
                     <div className="w-32 text-xs font-mono text-slate-500 truncate mr-4 text-right shrink-0">{trace.spanName}</div>
                     <div className="flex-1 h-full relative bg-slate-950/50 rounded overflow-hidden">
                        <Tooltip content={`${trace.spanName}: ${trace.durationMs}ms (${trace.status})`} position="top">
                             <div 
                                className={`absolute top-1 bottom-1 rounded-md transition-all hover:brightness-110 cursor-help ${
                                    trace.status === 'error' ? 'bg-red-500' : 'bg-blue-600'
                                }`}
                                style={{ 
                                    left: `${offset}%`, 
                                    width: `${safeWidth}%` 
                                }}
                             ></div>
                        </Tooltip>
                     </div>
                 </div>
             );
         })}
      </div>
      <div className="flex justify-between text-[10px] font-mono text-slate-600 mt-2 pl-36">
          <span>0ms</span>
          <span>{Math.round(totalDuration / 2)}ms</span>
          <span>{totalDuration}ms</span>
      </div>
    </div>
  );
};

export default TraceTimeline;
