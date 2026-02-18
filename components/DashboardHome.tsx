
import React from 'react';
import { UserRole } from '../types';
import MetricCard from './MetricCard';
import Tooltip from './Tooltip';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  Cell 
} from 'recharts';

interface DashboardHomeProps {
  userRole: UserRole;
  metrics: {
    cost: number;
    activeAgents: number;
    tokens: number;
    latency: number;
  };
  chartData: any[];
}

const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <p className="text-xs md:text-sm font-bold text-white">
            {payload[0].value.toLocaleString()} <span className="text-slate-400 font-normal">Tokens</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const DashboardHome: React.FC<DashboardHomeProps> = ({ userRole, metrics, chartData }) => {
  const [hoveredBar, setHoveredBar] = React.useState<number | null>(null);

  const formatCost = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  const formatTokens = (val: number) => `${(val / 1000000).toFixed(1)}M`;
  const formatLatency = (val: number) => `${(val / 1000).toFixed(2)}s`;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 w-full overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <MetricCard label="Monthly Cost" value={formatCost(metrics.cost)} unit="USD" trend="up" changePercent={1.2} />
        <MetricCard label="Active Agents" value={metrics.activeAgents.toString()} unit="agents" trend="flat" changePercent={0} />
        <MetricCard label="Total Tokens" value={formatTokens(metrics.tokens)} unit="tokens" trend="up" changePercent={0.5} />
        <MetricCard label="Avg Latency" value={formatLatency(metrics.latency)} unit="seconds" trend="down" changePercent={0.1} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h3 className="text-sm md:text-lg font-bold text-slate-100 uppercase tracking-tight">Token Throughput</h3>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Live</span>
            </div>
          </div>
          <div className="h-48 md:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} onMouseMove={(s) => s.activeTooltipIndex !== undefined && setHoveredBar(s.activeTooltipIndex)} onMouseLeave={() => setHoveredBar(null)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={8} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#475569" fontSize={8} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <RechartsTooltip content={<CustomChartTooltip />} cursor={{ fill: 'rgba(51, 65, 85, 0.2)' }} />
                <Bar dataKey="usage" radius={[2, 2, 0, 0]}>
                  {chartData.map((e, i) => (
                    <Cell key={`cell-${i}`} fill={hoveredBar === i ? '#3b82f6' : '#1d4ed8'} className="transition-all duration-300" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h3 className="text-sm md:text-lg font-bold text-slate-100 uppercase tracking-tight">Cost Velocity</h3>
          </div>
          <div className="h-48 md:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={8} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#475569" fontSize={8} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', fontSize: '10px' }} />
                <Line type="monotone" dataKey="cost" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {userRole === UserRole.ADMIN && (
        <div className="bg-blue-900/10 border border-blue-500/30 rounded-xl p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h4 className="font-bold text-blue-400 text-sm md:text-base">Compliance Review Required</h4>
            <p className="text-xs md:text-sm text-slate-400 mt-1 truncate">Audit logs for Q2 are ready for signing. 45 days remaining.</p>
          </div>
          <button className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs md:text-sm font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95">
            Generate Report
          </button>
        </div>
      )}
    </div>
  );
};

export default DashboardHome;
