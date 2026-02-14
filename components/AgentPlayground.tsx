
import React, { useState } from 'react';
import { generateStudioDeliverable, generateAgentConfiguration } from '../services/geminiService';
import Tooltip from './Tooltip';

const AgentPlayground: React.FC = () => {
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant.');
  const [userPrompt, setUserPrompt] = useState('');
  const [model, setModel] = useState('gemini-3-flash-preview');
  const [temperature, setTemperature] = useState(0.7);
  const [output, setOutput] = useState('');
  
  // State for AI Generation features
  const [loading, setLoading] = useState(false);
  const [generatingConfig, setGeneratingConfig] = useState(false);
  const [agentName, setAgentName] = useState('New Agent');

  const handleRun = async () => {
    setLoading(true);
    try {
       const result = await generateStudioDeliverable('report', userPrompt + `\n[SYSTEM CONTEXT: ${systemPrompt}]`);
       setOutput(result.content);
    } catch (e) {
       setOutput("Error executing playground prompt.");
    } finally {
       setLoading(false);
    }
  };

  const handleAutoGenerate = async (type: 'surprise' | 'optimize') => {
      setGeneratingConfig(true);
      try {
          // If optimizing, pass current input as context. If surprise, pass nothing.
          const intent = type === 'optimize' 
            ? `Optimize an agent that deals with: ${systemPrompt.slice(0, 100)}...`
            : undefined;

          const config = await generateAgentConfiguration(intent);
          
          setSystemPrompt(config.systemInstruction);
          setUserPrompt(config.userPrompt);
          setModel(config.model);
          setTemperature(config.temperature);
          setAgentName(config.name);
      } catch (e) {
          console.error("Failed to auto-generate agent", e);
      } finally {
          setGeneratingConfig(false);
      }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-140px)] animate-in fade-in">
        {/* Configuration Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-6 overflow-y-auto relative">
            
            {/* AI Generator Overlay */}
            {generatingConfig && (
                <div className="absolute inset-0 z-10 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-blue-400">
                    <svg className="w-10 h-10 animate-spin mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span className="text-sm font-bold animate-pulse">Synthesizing Expert Persona & Edge Cases...</span>
                </div>
            )}

            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    {agentName}
                </h3>
                <div className="flex gap-2">
                    <Tooltip content="Auto-fill with a random high-value enterprise persona">
                        <button 
                            onClick={() => handleAutoGenerate('surprise')}
                            disabled={loading || generatingConfig}
                            className="flex items-center gap-1 px-3 py-1.5 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-xs font-bold transition-all"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            Surprise Me
                        </button>
                    </Tooltip>
                    <Tooltip content="Refine and complete your current draft">
                        <button 
                            onClick={() => handleAutoGenerate('optimize')}
                            disabled={loading || generatingConfig}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-xs font-bold transition-all"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            Auto-Draft
                        </button>
                    </Tooltip>
                </div>
            </div>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Model</label>
                    <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:border-blue-500 outline-none">
                        <option value="gemini-3-pro-preview">gemini-3-pro-preview (Reasoning)</option>
                        <option value="gemini-3-flash-preview">gemini-3-flash-preview (High Speed)</option>
                        <option value="gemini-2.5-flash-preview">gemini-2.5-flash-preview (Legacy)</option>
                    </select>
                </div>

                <div>
                     <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex justify-between">
                         <span>Temperature</span>
                         <span>{temperature}</span>
                     </label>
                     <input 
                        type="range" min="0" max="2" step="0.1" 
                        value={temperature} 
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                     />
                </div>

                <div className="flex-1 flex flex-col">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">System Instruction</label>
                    <textarea 
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        className="w-full h-48 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm font-mono text-slate-300 focus:border-blue-500 outline-none resize-none"
                    />
                </div>
                
                 <div className="flex-1 flex flex-col">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Test User Prompt</label>
                    <textarea 
                        value={userPrompt}
                        onChange={(e) => setUserPrompt(e.target.value)}
                        className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-300 focus:border-blue-500 outline-none resize-none"
                        placeholder="Enter test prompt here..."
                    />
                </div>
            </div>

            <button 
                onClick={handleRun}
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                       <span>Running Simulation...</span>
                    </>
                ) : 'Execute Run'}
            </button>
        </div>

        {/* Output Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Output Stream</h3>
            <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-sm text-slate-300 overflow-y-auto whitespace-pre-wrap">
                {output || <span className="text-slate-600 italic">Waiting for execution...</span>}
            </div>
             <div className="mt-4 flex justify-between items-center text-xs text-slate-500">
                <span>Tokens: ~{output.length / 4}</span>
                <span>Latency: {loading ? '...' : '1420ms'}</span>
            </div>
        </div>
    </div>
  );
};

export default AgentPlayground;
