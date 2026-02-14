
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

/**
 * Custom Tooltip component for Recharts to match the high-fidelity Pro UI.
 */
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label} Usage</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <p className="text-sm font-bold text-white">
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

  const formatCost = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatTokens = (val: number) => `${(val / 1000000).toFixed(1)}M`;
  const formatLatency = (val: number) => `${(val / 1000).toFixed(2)}s`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Monthly Cost" value={formatCost(metrics.cost)} unit="USD" trend="up" changePercent={1.2} />
        <MetricCard label="Active Agents" value={metrics.activeAgents.toString()} unit="agents" trend="flat" changePercent={0} />
        <MetricCard label="Total Tokens" value={formatTokens(metrics.tokens)} unit="tokens" trend="up" changePercent={0.5} />
        <MetricCard label="Avg Latency" value={formatLatency(metrics.latency)} unit="seconds" trend="down" changePercent={0.1} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Bar Chart for Token Usage */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-100">Live Token Throughput</h3>
            <Tooltip content="Live telemetry of aggregated token consumption across all multi-tenant agents.">
              <div className="flex items-center gap-2">
                 <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Live</span>
              </div>
            </Tooltip>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                onMouseMove={(state) => {
                  if (state.activeTooltipIndex !== undefined) {
                    setHoveredBar(state.activeTooltipIndex);
                  }
                }}
                onMouseLeave={() => setHoveredBar(null)}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <RechartsTooltip 
                  content={<CustomChartTooltip />} 
                  cursor={{ fill: 'rgba(51, 65, 85, 0.2)' }}
                />
                <Bar dataKey="usage" radius={[4, 4, 0, 0]} animationDuration={500} isAnimationActive={true}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={hoveredBar === index ? '#3b82f6' : '#1d4ed8'} 
                      className="transition-all duration-300 cursor-pointer"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Interactive Line Chart for Cost Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-100">Live Cost Velocity</h3>
            <Tooltip content="Normalized real-time expenditure velocity.">
               <svg className="w-4 h-4 text-slate-600 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Tooltip>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `$${value}`}
                />
                <RechartsTooltip 
                   contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                   itemStyle={{ color: '#ef4444', fontWeight: 'bold' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="cost" 
                  stroke="#ef4444" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#020617' }} 
                  activeDot={{ r: 6, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
                  isAnimationActive={false} // Disable animation for smooth sliding
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {userRole === UserRole.ADMIN && (
        <div className="bg-blue-900/10 border border-blue-500/30 rounded-xl p-6 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-blue-400">SOC2 Compliance Review Required</h4>
            <p className="text-sm text-slate-400 mt-1">Audit logs for Q2 2024 are ready for signing. 45 days remaining.</p>
          </div>
          <Tooltip content="Sign and compile the official Q2 Compliance Report" position="left">
            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20">
              Generate Report
            </button>
          </Tooltip>
        </div>
      )}
    </div>
  );
};

export default DashboardHome;
