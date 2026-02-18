
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
    { id: 'home', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', desc: 'Performance' },
    { id: 'observability', label: 'Observability', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', desc: 'Telemetry' },
    { id: 'cost', label: 'Compliance', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944', desc: 'Governance' },
    { id: 'hitl', label: 'Approvals', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2', desc: 'Human-in-the-loop' },
    { id: 'insights', label: 'Studio', icon: 'M13 10V3L4 14h7v7l9-11h-7z', desc: 'Neural Studio' },
  ];

  const devTools = [
      { id: 'playground', label: 'Playground', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477', desc: 'Prompt IDE' },
      { id: 'knowledge', label: 'Knowledge', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5', desc: 'RAG Corpus' },
  ];

  return (
    <aside className="w-64 h-full border-r border-[var(--border-color)] flex flex-col bg-[var(--bg-panel)] z-20 shadow-2xl lg:shadow-none">
      <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white shadow-lg">EPB</div>
                <span className="font-black text-xl tracking-tighter text-[var(--text-primary)]">INT INC</span>
            </div>
            <button onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-element)] transition-colors">
                {theme === 'dark' ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1" /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646" /></svg>}
            </button>
        </div>

        <nav className="space-y-1 mb-8">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-4 mb-3">Core Operations</div>
          {navItems.map((item) => (
            <button key={item.id} onClick={() => onViewChange(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${currentView === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-element)]'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.icon} /></svg>
              {item.label}
            </button>
          ))}
        </nav>

        <nav className="space-y-1">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-4 mb-3">Logic Foundry</div>
           {devTools.map((item) => (
            <button key={item.id} onClick={() => onViewChange(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${currentView === item.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-element)]'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.icon} /></svg>
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6 border-t border-[var(--border-color)] bg-slate-900/20 backdrop-blur-md">
        <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-4 block">Identity Context</label>
        <div className="grid grid-cols-2 gap-2">
          {[UserRole.ADMIN, UserRole.ENGINEER].map((r) => (
            <button key={r} onClick={() => onRoleChange(r as UserRole)} className={`px-2 py-2 text-[8px] font-black rounded-lg border uppercase transition-all truncate ${userRole === r ? 'bg-blue-600/10 text-blue-400 border-blue-500' : 'text-slate-500 border-[var(--border-color)] hover:border-slate-400'}`}>
              {r}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
