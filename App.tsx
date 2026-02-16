
import React, { useState, useEffect } from 'react';
import { UserRole, Agent } from './types';
import Sidebar from './components/Sidebar';
import DashboardHome from './components/DashboardHome';
import AgentObservability from './components/AgentObservability';
import CostCompliance from './components/CostCompliance';
import HitlQueue from './components/HitlQueue';
import AiInsights from './components/AiInsights';
import AgentPlayground from './components/AgentPlayground';
import KnowledgeBase from './components/KnowledgeBase';
import GlobalCopilot from './components/GlobalCopilot';
import AlertCenter from './components/AlertCenter';
import Tooltip from './components/Tooltip';
import ErrorBoundary from './components/ErrorBoundary';
import LiveSessionOverlay from './components/LiveSessionOverlay';
import { useSimulation } from './hooks/useSimulation';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.ADMIN);
  const [view, setView] = useState<'home' | 'observability' | 'cost' | 'hitl' | 'insights' | 'playground' | 'knowledge'>('home');
  
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('epb-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  const [isLiveSessionOpen, setIsLiveSessionOpen] = useState(false);

  const { 
    agents, 
    setAgents, 
    traces, 
    auditLogs, 
    alerts, 
    hitlRequests, 
    metrics, 
    chartData,
    approveHitl,
    rejectHitl,
    addTrace // Now exposed for the playground loop
  } = useSimulation();

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(agents[0]);

  useEffect(() => {
    const root = document.documentElement;
    localStorage.setItem('epb-theme', theme);
    
    root.classList.add('transition-theme');
    
    if (theme === 'dark') {
      root.style.setProperty('--bg-main', '#020617');
      root.style.setProperty('--bg-panel', '#0f172a');
      root.style.setProperty('--bg-element', '#1e293b');
      root.style.setProperty('--text-primary', '#f8fafc');
      root.style.setProperty('--text-secondary', '#94a3b8');
      root.style.setProperty('--border-color', '#1e293b');
    } else {
      root.style.setProperty('--bg-main', '#f8fafc');
      root.style.setProperty('--bg-panel', '#ffffff');
      root.style.setProperty('--bg-element', '#f1f5f9');
      root.style.setProperty('--text-primary', '#0f172a');
      root.style.setProperty('--text-secondary', '#475569');
      root.style.setProperty('--border-color', '#e2e8f0');
    }
  }, [theme]);

  const handleAddAgent = (newAgent: Agent) => {
    setAgents(prev => [...prev, newAgent]);
    setSelectedAgent(newAgent);
  };

  return (
    <div className="flex h-screen w-full bg-[var(--bg-main)] text-[var(--text-primary)] overflow-hidden transition-colors duration-500 ease-in-out">
      <Sidebar 
        currentView={view} 
        onViewChange={setView} 
        userRole={role} 
        onRoleChange={setRole}
        theme={theme}
        onThemeChange={setTheme}
      />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-[var(--border-color)] flex items-center justify-between px-8 bg-[var(--bg-panel)]/80 backdrop-blur-md sticky top-0 z-10 transition-all duration-500">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight uppercase">EPB OS <span className="text-blue-500 font-normal">/ {view}</span></h1>
          </div>
          <div className="flex items-center gap-6">
            <AlertCenter alerts={alerts} />
            
            <Tooltip content="System Health: Optimal" position="bottom">
              <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full text-[10px] font-bold text-green-500 border border-green-500/20 cursor-help uppercase tracking-widest">
                v1.2 Stable
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

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <ErrorBoundary>
            {view === 'home' && (
              <DashboardHome 
                userRole={role} 
                metrics={metrics} 
                chartData={chartData} 
              />
            )}
            {view === 'observability' && (
              <AgentObservability 
                agents={agents} 
                selectedAgent={selectedAgent} 
                onAgentSelect={setSelectedAgent}
                onAddAgent={handleAddAgent}
                traces={traces} 
              />
            )}
            {view === 'cost' && (
              <CostCompliance 
                userRole={role} 
                auditLogs={auditLogs}
                currentCost={metrics.cost}
              />
            )}
            {view === 'hitl' && (
              <HitlQueue 
                userRole={role} 
                requests={hitlRequests}
                onApprove={approveHitl}
                onReject={rejectHitl}
              />
            )}
            {view === 'insights' && <AiInsights agents={agents} />}
            {view === 'playground' && <AgentPlayground onAddTrace={addTrace} />}
            {view === 'knowledge' && <KnowledgeBase />}
          </ErrorBoundary>
        </div>

        <GlobalCopilot 
            onNavigate={(v) => setView(v as any)} 
            onLaunchLive={() => setIsLiveSessionOpen(true)}
            agents={agents}
            metrics={metrics}
        />
        
        <LiveSessionOverlay 
            isOpen={isLiveSessionOpen}
            onClose={() => setIsLiveSessionOpen(false)}
            navigate={(v) => setView(v as any)}
            metrics={metrics}
            agents={agents}
        />
      </main>
    </div>
  );
};

export default App;
