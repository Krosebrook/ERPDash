
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChatMessage, Agent } from '../types';
import { chatWithSystemCopilot } from '../services/geminiService';
import Tooltip from './Tooltip';

interface Props {
  onNavigate: (view: string) => void;
  onLaunchLive: () => void;
  agents?: Agent[];
  metrics?: any;
}

const GlobalCopilot: React.FC<Props> = ({ onNavigate, onLaunchLive, agents, metrics }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'system', text: 'Hello, I am the EPB OS Copilot. I can help you navigate the system, analyze agents, or query documentation.', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Generate a live context summary
  const systemContext = useMemo(() => {
    if (!agents || !metrics) return '';
    return `
    ACTIVE AGENTS (${agents.length}):
    ${agents.map(a => `- ${a.name} (${a.type}): ${a.status}, Latency: ${a.avgLatencyMs}ms`).join('\n')}

    LIVE METRICS:
    - Monthly Cost: $${metrics.cost?.toFixed(2)}
    - Total Tokens: ${metrics.tokens}
    - Avg Latency: ${metrics.latency}ms
    `;
  }, [agents, metrics]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    try {
        const history = messages.map(m => ({
            role: m.role === 'system' ? 'user' : m.role, // Simple mapping
            parts: [{ text: m.text }]
        }));
        
        const responseText = await chatWithSystemCopilot(
            userMsg.text, 
            history, 
            (view) => {
                setIsOpen(false); 
                onNavigate(view);
            },
            systemContext
        );

        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: responseText, timestamp: Date.now() }]);
    } catch (e) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "I encountered an error processing that request.", isError: true, timestamp: Date.now() }]);
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Floating Action Button Group */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-4 items-center">
        
        {/* Live Voice Trigger */}
        <Tooltip content="Start Live Voice Session" position="left">
           <button 
             onClick={onLaunchLive}
             className="w-12 h-12 rounded-full shadow-xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95"
           >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
           </button>
        </Tooltip>

        {/* Text Chat Trigger */}
        <Tooltip content="Open AI Command Copilot" position="left">
            <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
                isOpen ? 'bg-slate-700 rotate-90' : 'bg-blue-600 hover:bg-blue-500'
            }`}
            >
            {isOpen ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            )}
            </button>
        </Tooltip>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-32 right-8 z-40 w-96 h-[500px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex justify-between items-center">
             <h3 className="font-bold text-white flex items-center gap-2">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                 EPB Copilot
             </h3>
             <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400">GEMINI-3-FLASH</span>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50">
             {messages.map((m) => (
                 <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                         m.role === 'user' 
                         ? 'bg-blue-600 text-white rounded-br-none' 
                         : m.isError 
                            ? 'bg-red-900/20 text-red-300 border border-red-900/50' 
                            : 'bg-slate-800 text-slate-200 rounded-bl-none'
                     }`}>
                         {m.text}
                     </div>
                 </div>
             ))}
             {isProcessing && (
                 <div className="flex justify-start">
                     <div className="bg-slate-800 p-3 rounded-2xl rounded-bl-none flex gap-1">
                         <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                         <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-75"></div>
                         <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-150"></div>
                     </div>
                 </div>
             )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-800 bg-slate-900">
             <div className="relative">
                 <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask system to navigate or query..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-4 pr-10 text-sm focus:outline-none focus:border-blue-500 text-white"
                 />
                 <button 
                    onClick={handleSend}
                    disabled={isProcessing}
                    className="absolute right-2 top-2 p-1.5 bg-blue-600 rounded-lg text-white hover:bg-blue-500 disabled:opacity-50"
                 >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
                 </button>
             </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GlobalCopilot;
