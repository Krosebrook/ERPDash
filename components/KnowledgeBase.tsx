
import React, { useState, useRef } from 'react';
import { KnowledgeDoc } from '../types';
import { simulateKnowledgeRetrieval } from '../services/geminiService';
import Tooltip from './Tooltip';

const MOCK_DOCS: KnowledgeDoc[] = [
    { id: '1', name: 'EPB_Architecture_v2.pdf', type: 'pdf', size: '2.4MB', status: 'indexed', lastUpdated: '2024-05-20', vectorCount: 1204, content: "EPB Dashboard Core Architecture: Uses React 19 and ESM modules. Integrates Gemini 3 for reasoning. Global state managed via hooks." },
    { id: '2', name: 'Compliance_Guidelines_2025.txt', type: 'txt', size: '45KB', status: 'indexed', lastUpdated: '2024-05-18', vectorCount: 89, content: "All agents must comply with SOC2 Type II. Multi-tenant isolation is mandatory for all PII data streams." },
    { id: '3', name: 'internal_wiki_agents', type: 'web', size: 'N/A', status: 'indexed', lastUpdated: '2024-05-21', vectorCount: 450, content: "Internal wiki covering agent deployment, suspended states, and human-in-the-loop triggers." },
];

const KnowledgeBase: React.FC = () => {
  const [docs, setDocs] = useState<KnowledgeDoc[]>(MOCK_DOCS);
  const [testQuery, setTestQuery] = useState('');
  const [retrievalResult, setRetrievalResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setIsUploading(true);
        const file = e.target.files[0];
        
        try {
            // Read file content
            const text = await file.text();
            
            // Create a temporary "Indexing" document
            const tempId = `doc-${Date.now()}`;
            const newDoc: KnowledgeDoc = {
                id: tempId,
                name: file.name,
                type: file.name.endsWith('.pdf') ? 'pdf' : file.name.endsWith('.md') ? 'md' : 'txt',
                size: `${(file.size / 1024).toFixed(1)} KB`,
                status: 'indexing',
                lastUpdated: new Date().toISOString().split('T')[0],
                vectorCount: 0,
                content: text
            };
            
            setDocs(prev => [newDoc, ...prev]);

            // Simulate Vectorization delay for UX fidelity
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Mark as indexed
            setDocs(prev => prev.map(d => d.id === tempId ? {
                ...d,
                status: 'indexed',
                vectorCount: Math.ceil(text.length / 4)
            } : d));

        } catch (err) {
            console.error("Ingestion failed", err);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }
  };

  const handleTest = async () => {
      setLoading(true);
      setRetrievalResult(null);
      try {
          const res = await simulateKnowledgeRetrieval(testQuery, docs);
          setRetrievalResult(res);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 md:gap-8 animate-in fade-in w-full overflow-hidden">
        {/* Doc List */}
        <div className="flex-1 space-y-4 md:space-y-6 min-w-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-[var(--text-primary)]">Knowledge Corpus</h2>
                    <p className="text-[10px] md:text-xs text-[var(--text-secondary)] font-medium mt-1">Memory-resident vector store for RAG grounding.</p>
                </div>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".txt,.md,.pdf,.json" 
                    onChange={handleFileChange}
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs md:text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    {isUploading ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    )}
                    {isUploading ? 'INGESTING...' : 'UPLOAD DOCUMENT'}
                </button>
            </div>

            <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[2rem] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-xs md:text-sm min-w-[600px]">
                        <thead className="bg-slate-950/50 text-slate-500 uppercase text-[9px] md:text-[10px] font-black tracking-[0.3em]">
                            <tr>
                                <th className="px-6 md:px-10 py-5">Source Designation</th>
                                <th className="px-6 md:px-10 py-5">Format</th>
                                <th className="px-6 md:px-10 py-5">Neural Status</th>
                                <th className="px-6 md:px-10 py-5">Vector Count</th>
                                <th className="px-6 md:px-10 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {docs.map(doc => (
                                <tr key={doc.id} className="hover:bg-blue-600/5 transition-all group">
                                    <td className="px-6 md:px-10 py-5 font-black text-white">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${doc.type === 'pdf' ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="truncate max-w-[150px] md:max-w-xs uppercase tracking-tight">{doc.name}</span>
                                                <span className="text-[9px] text-slate-500 font-bold">{doc.size} • Updated {doc.lastUpdated}</span>
                                            </div>
                                            {doc.content && <span className="shrink-0 text-[8px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded font-black uppercase tracking-widest border border-blue-500/20">Memory Resident</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 md:px-10 py-5"><span className="uppercase text-[9px] md:text-[10px] font-black bg-slate-800 px-3 py-1 rounded-lg text-slate-400 border border-slate-700">{doc.type}</span></td>
                                    <td className="px-6 md:px-10 py-5">
                                        <div className="flex items-center gap-2">
                                            {doc.status === 'indexing' && <div className="w-3 h-3 border-2 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin"></div>}
                                            <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${
                                                doc.status === 'indexed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                                                doc.status === 'indexing' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                                                'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                            }`}>
                                                {doc.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 md:px-10 py-5 font-mono text-[10px] md:text-xs text-slate-400 font-bold">{doc.vectorCount.toLocaleString()}</td>
                                    <td className="px-6 md:px-10 py-5 text-right">
                                        <button className="text-blue-400 hover:text-white transition-colors font-black text-[10px] uppercase tracking-widest p-2 hover:bg-blue-600/20 rounded-lg">Inspect</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* Retrieval Tester */}
        <div className="w-full xl:w-[450px] shrink-0 space-y-6">
            <div className="bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-[2.5rem] p-6 md:p-10 flex flex-col shadow-2xl relative overflow-hidden group">
                <div className="absolute -right-20 -top-20 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl group-hover:bg-blue-600/20 transition-all duration-1000"></div>
                
                <h3 className="font-black text-xl md:text-2xl mb-2 uppercase tracking-tighter text-white">Retrieval Lab</h3>
                <p className="text-[10px] md:text-xs text-[var(--text-secondary)] mb-8 leading-relaxed font-medium">Challenge the memory store with complex semantic queries via Gemini 3.</p>
                
                <div className="space-y-6">
                    <div className="relative">
                        <input 
                            type="text" 
                            value={testQuery}
                            onChange={(e) => setTestQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleTest()}
                            placeholder="QUERY NEURAL CORPUS..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-xs md:text-sm text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-700 font-bold uppercase tracking-tight shadow-inner"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                    </div>

                    <button 
                        onClick={handleTest}
                        disabled={loading || !testQuery}
                        className="w-full py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl text-xs md:text-sm font-black text-white transition-all disabled:opacity-50 active:scale-95 shadow-xl shadow-blue-900/20 uppercase tracking-[0.2em] flex items-center justify-center gap-3"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        )}
                        {loading ? 'CALCULATING RELEVANCE...' : 'TEST NEURAL GROUNDING'}
                    </button>

                    {retrievalResult && (
                        <div className="bg-slate-950/80 border border-slate-800 rounded-[1.5rem] p-6 max-h-[500px] overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-4 shadow-inner">
                            <div className="flex justify-between items-center mb-6">
                                 <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">Retrieved Context</span>
                                 <div className="flex gap-1">
                                     <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                                     <div className="w-1 h-1 rounded-full bg-blue-500 opacity-50"></div>
                                     <div className="w-1 h-1 rounded-full bg-blue-500 opacity-20"></div>
                                 </div>
                            </div>
                            <div className="space-y-5">
                                {Array.isArray(retrievalResult) && retrievalResult.map((item: any, i: number) => (
                                    <div key={i} className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 group hover:border-blue-500/40 transition-all">
                                        <div className="flex justify-between items-center text-[9px] font-black text-blue-400 mb-3 uppercase tracking-widest">
                                            <span className="truncate max-w-[150px]">{item.documentName}</span>
                                            <span className="bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">{(item.relevanceScore * 100).toFixed(0)}% MATCH</span>
                                        </div>
                                        <p className="text-[10px] md:text-xs text-slate-300 leading-relaxed font-medium italic">
                                            "{item.snippet}"
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!loading && !retrievalResult && (
                        <div className="h-[200px] border-2 border-dashed border-slate-800 rounded-[1.5rem] flex flex-col items-center justify-center text-center p-6 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
                             <svg className="w-10 h-10 text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                             <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Awaiting Signal</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default KnowledgeBase;
