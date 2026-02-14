import React, { useState } from 'react';
import { KnowledgeDoc } from '../types';
import { simulateKnowledgeRetrieval } from '../services/geminiService';
import Tooltip from './Tooltip';

const MOCK_DOCS: KnowledgeDoc[] = [
    { id: '1', name: 'EPB_Architecture_v2.pdf', type: 'pdf', size: '2.4MB', status: 'indexed', lastUpdated: '2024-05-20', vectorCount: 1204 },
    { id: '2', name: 'Compliance_Guidelines_2025.txt', type: 'txt', size: '45KB', status: 'indexed', lastUpdated: '2024-05-18', vectorCount: 89 },
    { id: '3', name: 'internal_wiki_agents', type: 'web', size: 'N/A', status: 'indexing', lastUpdated: '2024-05-21', vectorCount: 0 },
];

const KnowledgeBase: React.FC = () => {
  const [docs, setDocs] = useState<KnowledgeDoc[]>(MOCK_DOCS);
  const [testQuery, setTestQuery] = useState('');
  const [retrievalResult, setRetrievalResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
      setLoading(true);
      try {
          const res = await simulateKnowledgeRetrieval(testQuery);
          setRetrievalResult(res);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in">
        {/* Doc List */}
        <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Knowledge Graph</h2>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm shadow-lg">Upload Document</button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                        <tr>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Vectors</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {docs.map(doc => (
                            <tr key={doc.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-200">{doc.name}</td>
                                <td className="px-6 py-4"><span className="uppercase text-xs font-mono bg-slate-800 px-2 py-1 rounded text-slate-400">{doc.type}</span></td>
                                <td className="px-6 py-4">
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${doc.status === 'indexed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                        {doc.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-mono text-slate-400">{doc.vectorCount}</td>
                                <td className="px-6 py-4 text-blue-400 hover:text-blue-300 cursor-pointer text-xs font-bold">Manage</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Retrieval Tester */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col h-full">
            <h3 className="font-bold text-lg mb-4">Retrieval Simulator</h3>
            <p className="text-xs text-slate-400 mb-4">Test semantic relevance using Gemini hybrid search.</p>
            
            <div className="space-y-4 flex-1 flex flex-col">
                <input 
                    type="text" 
                    value={testQuery}
                    onChange={(e) => setTestQuery(e.target.value)}
                    placeholder="Enter query..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                />
                <button 
                    onClick={handleTest}
                    disabled={loading || !testQuery}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm font-bold text-white transition-all disabled:opacity-50"
                >
                    {loading ? 'Retrieving...' : 'Test Grounding'}
                </button>

                {retrievalResult && (
                    <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-4 overflow-y-auto">
                        <div className="flex justify-between mb-2">
                             <span className="text-[10px] font-bold uppercase text-slate-500">Result</span>
                             <span className="text-[10px] font-bold text-green-500">Score: {(Math.random() * 0.5 + 0.4).toFixed(2)}</span>
                        </div>
                        <pre className="text-[10px] font-mono text-slate-300 whitespace-pre-wrap">
                            {JSON.stringify(retrievalResult, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default KnowledgeBase;
