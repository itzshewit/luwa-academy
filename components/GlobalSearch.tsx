
/*
  Module: Global Search Nexus (3.11)
  Purpose: Instant full-text search across all curriculum components and institutional records.
*/

import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard.tsx';
import { ICONS } from '../constants.tsx';
import { storageService } from '../services/storageService.ts';

interface GlobalSearchProps {
  onClose: () => void;
  onNavigate: (tab: any, id?: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ type: 'note' | 'paper' | 'question', title: string, id: string, subject: string }[]>([]);

  useEffect(() => {
    // Perform asynchronous search to handle storageService's getNotes() promise
    const runSearch = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      const allNotes = await storageService.getNotes();
      const notes = allNotes.filter(n => n.topic.en.toLowerCase().includes(query.toLowerCase()))
        .map(n => ({ type: 'note' as const, title: n.topic.en, id: n.id, subject: n.subjectId }));

      const papers = storageService.getPastPapers().filter(p => p.subject.toLowerCase().includes(query.toLowerCase()))
        .map(p => ({ type: 'paper' as const, title: `${p.yearEC} E.C. ${p.subject} Official Set`, id: p.id, subject: p.subject }));

      setResults([...notes, ...papers].slice(0, 10));
    };
    
    runSearch();
  }, [query]);

  return (
    <div className="fixed inset-0 z-[6000] flex items-start justify-center p-4 md:p-20 bg-slate-900/60 backdrop-blur-xl animate-fade-in">
      <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-slate-100">
        <header className="p-8 border-b border-slate-50 flex items-center gap-6">
          <ICONS.Layout className="w-6 h-6 text-luwa-primary" />
          <input 
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search curriculum, past papers, or personal notes..."
            className="flex-1 bg-transparent text-xl font-serif font-bold text-luwa-dark outline-none"
          />
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {results.length > 0 ? (
            <div className="space-y-4">
              {results.map((res, i) => (
                <button 
                  key={i}
                  onClick={() => {
                    if (res.type === 'note') onNavigate('library', res.id);
                    else onNavigate('papers', res.id);
                    onClose();
                  }}
                  className="w-full text-left p-6 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all group flex justify-between items-center"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[8px] font-black uppercase text-luwa-primary bg-blue-50 px-2 py-0.5 rounded">{res.type}</span>
                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">{res.subject}</span>
                    </div>
                    <p className="text-lg font-bold text-luwa-dark group-hover:text-luwa-primary transition-colors">{res.title}</p>
                  </div>
                  <ICONS.Zap className="w-5 h-5 text-slate-200 group-hover:text-luwa-primary opacity-0 group-hover:opacity-100 transition-all" />
                </button>
              ))}
            </div>
          ) : query.length > 0 ? (
            <div className="py-20 text-center text-slate-400">
              <p className="text-sm font-bold">No institutional records match "{query}"</p>
            </div>
          ) : (
            <div className="py-12 px-8">
               <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-6">Recent Enquiries</h4>
               <div className="flex flex-wrap gap-3">
                  {['Physics G12', 'Calculus', '2017 EC Math', 'Biology Diagrams'].map(t => (
                    <button key={t} onClick={() => setQuery(t)} className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-500 hover:border-luwa-primary transition-all">
                      {t}
                    </button>
                  ))}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
