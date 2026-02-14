
import React, { useState } from 'react';
import { SystemAlert } from '../types';

interface Props {
    alerts?: SystemAlert[];
}

const AlertCenter: React.FC<Props> = ({ alerts = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = alerts.filter(a => !a.read).length;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-white transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
        {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-slate-900 animate-pulse"></span>
        )}
      </button>

      {isOpen && (
          <>
            <div className="fixed inset-0 z-20 cursor-default" onClick={() => setIsOpen(false)}></div>
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 overflow-hidden animate-in slide-in-from-top-2 fade-in">
                <div className="p-3 border-b border-slate-800 bg-slate-900/95 backdrop-blur flex justify-between items-center">
                    <span className="font-bold text-sm text-white">Notifications</span>
                    <button className="text-[10px] text-blue-400 hover:text-blue-300">Mark all read</button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                    {alerts.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500 italic">No new notifications.</div>
                    ) : (
                        alerts.map(alert => (
                            <div key={alert.id} className="p-4 border-b border-slate-800 hover:bg-slate-800/50 transition-colors animate-in slide-in-from-right-2">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${alert.severity === 'critical' ? 'bg-red-500' : alert.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                                        <span className="font-bold text-xs text-slate-200">{alert.title}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-500">{alert.timestamp}</span>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed pl-4">{alert.message}</p>
                                {alert.source === 'gemini-watchdog' && (
                                    <div className="mt-2 pl-4 flex items-center gap-1 text-[10px] text-purple-400 font-bold">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                        AI Insight
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
          </>
      )}
    </div>
  );
};

export default AlertCenter;
