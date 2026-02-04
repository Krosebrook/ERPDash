
import React, { useState, useEffect } from 'react';
import { UserRole, Agent, TraceSpan, AuditLog } from './types';
import { MOCK_AGENTS, MOCK_TRACES, MOCK_AUDIT_LOGS } from './constants';
import Sidebar from './components/Sidebar';
import DashboardHome from './components/DashboardHome';
import AgentObservability from './components/AgentObservability';
import CostCompliance from './components/CostCompliance';
import HitlQueue from './components/HitlQueue';
import AiInsights from './components/AiInsights';
import Tooltip from './components/Tooltip';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.ADMIN);
  const [view, setView] = useState<'home' | 'observability' | 'cost' | 'hitl' | 'insights'>('home');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(MOCK_AGENTS[0]);

  return (
    <div className="flex h-screen w-full bg-slate-950 overflow-hidden text-slate-50">
      {/* Sidebar Navigation */}
      <Sidebar 
        currentView={view} 
        onViewChange={setView} 
        userRole={role} 
        onRoleChange={setRole} 
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight">EPB PRO DASHBOARD <span className="text-blue-500 font-normal">/ {view.toUpperCase()}</span></h1>
          </div>
          <div className="flex items-center gap-6">
            <Tooltip content="Documentation Available: README.md & TECHNICAL_GUIDE.md" position="bottom">
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full text-[10px] font-bold text-blue-400 border border-blue-500/20 cursor-help uppercase tracking-widest">
                DOCS V1.1
              </div>
            </Tooltip>
            <Tooltip content="Health check: Connected to EPB Global Orchestrator" position="bottom">
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full text-xs font-medium border border-slate-700 cursor-help">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                LIVE DATA: ORG_ID: int-inc-main
              </div>
            </Tooltip>
            <Tooltip content={`Active Session: ${role.toUpperCase()}`} position="bottom">
              <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                <span className="text-sm font-medium">{role.toUpperCase()}</span>
                <img src={`https://picsum.photos/seed/${role}/32/32`} className="w-8 h-8 rounded-full border border-slate-700" alt="Profile" />
              </div>
            </Tooltip>
          </div>
        </header>

        {/* Dynamic Viewport */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {view === 'home' && <DashboardHome userRole={role} />}
          {view === 'observability' && (
            <AgentObservability 
              agents={MOCK_AGENTS} 
              selectedAgent={selectedAgent} 
              onAgentSelect={setSelectedAgent}
              traces={MOCK_TRACES} 
            />
          )}
          {view === 'cost' && <CostCompliance userRole={role} />}
          {view === 'hitl' && <HitlQueue userRole={role} />}
          {view === 'insights' && <AiInsights agents={MOCK_AGENTS} />}
        </div>
      </main>
    </div>
  );
};

export default App;
