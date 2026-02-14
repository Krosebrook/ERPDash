import React from 'react';
import { UserRole } from '../types';
import Tooltip from './Tooltip';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: any) => void;
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  theme: 'dark' | 'light';
  onThemeChange: (theme: 'dark' | 'light') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, userRole, onRoleChange, theme, onThemeChange }) => {
  const navItems = [
    { id: 'home', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', desc: 'Main performance dashboard' },
    { id: 'observability', label: 'Agent Tracing', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', desc: 'Deep-dive telemetry logs' },
    { id: 'cost', label: 'Compliance & Cost', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', desc: 'Financial and regulatory oversight' },
    { id: 'hitl', label: 'HITL Queue', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', desc: 'Human-in-the-loop approvals' },
    { id: 'insights', label: 'AI Insights', icon: 'M13 10V3L4 14h7v7l9-11h-7z', desc: 'Gemini-powered deep analysis' },
  ];

  const devTools = [
      { id: 'playground', label: 'Agent Playground', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', desc: 'Prompt engineering studio' },
      { id: 'knowledge', label: 'Knowledge Base', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', desc: 'RAG and Document management' },
  ];

  return (
    <aside className="w-64 border-r border-[var(--border-color)] flex flex-col bg-[var(--bg-panel)] z-20 transition-colors duration-300">
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">EPB</div>
                <span className="font-bold text-xl tracking-tight text-[var(--text-primary)]">INT INC</span>
            </div>
            <button 
                onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-element)] transition-colors"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
                {theme === 'dark' ? (
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                ) : (
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                )}
            </button>
        </div>

        <nav className="space-y-1 mb-6">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 mb-2">Operations</div>
          {navItems.map((item) => (
            <Tooltip key={item.id} content={item.desc} position="right" className="w-full">
              <button
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  currentView === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-element)]'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.label}
              </button>
            </Tooltip>
          ))}
        </nav>

        <nav className="space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 mb-2">Developer Studio</div>
           {devTools.map((item) => (
            <Tooltip key={item.id} content={item.desc} position="right" className="w-full">
              <button
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  currentView === item.id 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-element)]'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.label}
              </button>
            </Tooltip>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-[var(--border-color)]">
        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-3 block">Switch Role</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.values(UserRole).map((r) => (
            <Tooltip key={r} content={`View dashboard as ${r.replace('-', ' ')}`} position="top">
              <button
                onClick={() => onRoleChange(r as UserRole)}
                className={`w-full px-2 py-1 text-[10px] font-bold rounded border uppercase transition-all ${
                  userRole === r 
                  ? 'bg-[var(--bg-element)] text-[var(--text-primary)] border-blue-500' 
                  : 'text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--text-secondary)]'
                }`}
              >
                {r.replace('-', '')}
              </button>
            </Tooltip>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
