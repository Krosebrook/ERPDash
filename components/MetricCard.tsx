
import React from 'react';
import Tooltip from './Tooltip';

interface MetricCardProps {
  label: string;
  value: string;
  unit: string;
  trend?: 'up' | 'down' | 'flat';
  changePercent?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, unit, trend, changePercent }) => {
  return (
    <Tooltip content={`Aggregated ${label} data for current period`} position="top" className="w-full">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-600 transition-all group cursor-help">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
          {trend && (
            <Tooltip content={`${changePercent}% change compared to previous interval`} position="left">
              <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                trend === 'up' ? 'bg-green-500/10 text-green-500' : 
                trend === 'down' ? 'bg-red-500/10 text-red-500' : 'bg-slate-500/10 text-slate-500'
              }`}>
                {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                {changePercent}%
              </div>
            </Tooltip>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold group-hover:text-blue-400 transition-colors">{value}</span>
          <span className="text-xs text-slate-500">{unit}</span>
        </div>
      </div>
    </Tooltip>
  );
};

export default MetricCard;
