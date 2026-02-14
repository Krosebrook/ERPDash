import React from 'react';
import { 
    BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';
import { ChartConfig } from '../services/geminiService';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-2xl">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
             <div key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                <p className="text-sm font-bold text-white">
                  {entry.value} <span className="text-slate-400 font-normal">{entry.name}</span>
                </p>
             </div>
          ))}
        </div>
      );
    }
    return null;
};

const DynamicChart: React.FC<{ config: ChartConfig }> = ({ config }) => {
  const { type, data, xAxisKey, dataKeys, colors, title, description } = config;

  const renderChart = () => {
    switch (type) {
        case 'line':
            return (
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey={xAxisKey} stroke="#475569" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {dataKeys.map((key, i) => (
                        <Line 
                            key={key} 
                            type="monotone" 
                            dataKey={key} 
                            stroke={colors[i % colors.length]} 
                            strokeWidth={3}
                            dot={{ r: 4, fill: colors[i % colors.length], strokeWidth: 2, stroke: '#020617' }}
                        />
                    ))}
                </LineChart>
            );
        case 'area':
            return (
                <AreaChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey={xAxisKey} stroke="#475569" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {dataKeys.map((key, i) => (
                        <Area 
                            key={key} 
                            type="monotone" 
                            dataKey={key} 
                            stroke={colors[i % colors.length]} 
                            fill={colors[i % colors.length]} 
                            fillOpacity={0.3}
                        />
                    ))}
                </AreaChart>
            );
        case 'pie':
             // Pie charts require a different data structure typically, simpler handling here
             return (
                <PieChart>
                    <Pie
                        data={data}
                        dataKey={dataKeys[0]}
                        nameKey={xAxisKey}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="#020617" strokeWidth={2} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                </PieChart>
             );
        case 'bar':
        default:
            return (
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey={xAxisKey} stroke="#475569" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {dataKeys.map((key, i) => (
                        <Bar 
                            key={key} 
                            dataKey={key} 
                            fill={colors[i % colors.length]} 
                            radius={[4, 4, 0, 0]} 
                        />
                    ))}
                </BarChart>
            );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl w-full h-full flex flex-col">
        <div className="mb-4">
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-xs text-slate-400 mt-1">{description}</p>
        </div>
        <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                {renderChart()}
            </ResponsiveContainer>
        </div>
    </div>
  );
};

export default DynamicChart;
