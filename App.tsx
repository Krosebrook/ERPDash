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
import ErrorBoundary from './components/ErrorBoundary';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.ADMIN);
  const [view, setView] = useState<'home' | 'observability' | 'cost' | 'hitl' | 'insights'>('home');
  const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(MOCK_AGENTS[0]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Inject CSS variables for theming based on state
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.style.setProperty('--bg-main', '#020617'); // slate-950
      root.style.setProperty('--bg-panel', '#0f172a'); // slate-900
      root.style.setProperty('--bg-element', '#1e293b'); // slate-800
      root.style.setProperty('--text-primary', '#f8fafc'); // slate-50
      root.style.setProperty('--text-secondary', '#94a3b8'); // slate-400
      root.style.setProperty('--border-color', '#1e293b'); // slate-800
    } else {
      root.style.setProperty('--bg-main', '#f8fafc'); // slate-50
      root.style.setProperty('--bg-panel', '#ffffff'); // white
      root.style.setProperty('--bg-element', '#e2e8f0'); // slate-200
      root.style.setProperty('--text-primary', '#0f172a'); // slate-950
      root.style.setProperty('--text-secondary', '#64748b'); // slate-500
      root.style.setProperty('--border-color', '#cbd5e1'); // slate-300
    }
  }, [theme]);

  const handleAddAgent = (newAgent: Agent) => {
    setAgents(prev => [...prev, newAgent]);
    setSelectedAgent(newAgent);
  };

  return (
    <div className="flex h-screen w-full bg-[var(--bg-main)] text-[var(--text-primary)] overflow-hidden transition-colors duration-300">
      {/* Sidebar Navigation */}
      <Sidebar 
        currentView={view} 
        onViewChange={setView} 
        userRole={role} 
        onRoleChange={setRole}
        theme={theme}
        onThemeChange={setTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-[var(--border-color)] flex items-center justify-between px-8 bg-[var(--bg-panel)] backdrop-blur-md sticky top-0 z-10 transition-colors duration-300">
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
              <div className="flex items-center gap-2 px-3 py-1 bg-[var(--bg-element)] rounded-full text-xs font-medium border border-[var(--border-color)] cursor-help">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                LIVE DATA
              </div>
            </Tooltip>
            <Tooltip content={`Active Session: ${role.toUpperCase()}`} position="bottom">
              <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                <span className="text-sm font-medium">{role.toUpperCase()}</span>
                <img src={`https://picsum.photos/seed/${role}/32/32`} className="w-8 h-8 rounded-full border border-[var(--border-color)]" alt="Profile" />
              </div>
            </Tooltip>
          </div>
        </header>

        {/* Dynamic Viewport with Error Boundary */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <ErrorBoundary>
            {view === 'home' && <DashboardHome userRole={role} />}
            {view === 'observability' && (
              <AgentObservability 
                agents={agents} 
                selectedAgent={selectedAgent} 
                onAgentSelect={setSelectedAgent}
                onAddAgent={handleAddAgent}
                traces={MOCK_TRACES} 
              />
            )}
            {view === 'cost' && <CostCompliance userRole={role} />}
            {view === 'hitl' && <HitlQueue userRole={role} />}
            {view === 'insights' && <AiInsights agents={agents} />}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
};

export default App;