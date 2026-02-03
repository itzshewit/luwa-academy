import React, { useState } from 'react';
import { GlassCard } from './GlassCard.tsx';
import { storageService } from '../services/storageService.ts';
import { User, ConceptNode } from '../types.ts';
import { ICONS } from '../constants.tsx';

interface CurriculumLibraryProps {
  user: User;
}

export const CurriculumLibrary: React.FC<CurriculumLibraryProps> = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [activeNote, setActiveNote] = useState<ConceptNode | null>(null);

  const curriculum = storageService.getFullCurriculum();
  const subjects = storageService.getSubjects(user.stream);

  const filteredNodes = curriculum.filter(n => {
    const matchesSubject = selectedSubject ? n.subject === selectedSubject : subjects.includes(n.subject);
    const matchesSearch = n.topic.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          n.subject.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in overflow-hidden">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-luwa-purple">Knowledge Library</h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-1">Syllabus-Aligned Summaries</p>
        </div>
        
        <div className="flex gap-2 bg-white p-1 rounded-xl border border-luwa-border overflow-x-auto max-w-full custom-scrollbar-hide">
          <button 
            onClick={() => setSelectedSubject(null)}
            className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${!selectedSubject ? 'bg-luwa-purple text-white' : 'text-slate-400'}`}
          >
            All
          </button>
          {subjects.map(s => (
            <button 
              key={s} 
              onClick={() => setSelectedSubject(s)}
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedSubject === s ? 'bg-luwa-purple text-white' : 'text-slate-400'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </header>

      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* Topic Navigator */}
        <div className="w-full md:w-80 flex flex-col gap-4 overflow-hidden">
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search syllabus..."
            className="w-full bg-white border border-luwa-border rounded-xl px-4 py-3 text-sm focus:border-luwa-teal outline-none"
          />
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {filteredNodes.map(node => (
              <button 
                key={node.id}
                onClick={() => setActiveNote(node)}
                className={`w-full text-left p-4 rounded-xl border transition-all group ${activeNote?.id === node.id ? 'bg-luwa-purple border-luwa-purple' : 'bg-white border-luwa-border hover:border-luwa-teal'}`}
              >
                <p className={`text-[8px] font-black uppercase mb-1 ${activeNote?.id === node.id ? 'text-white/50' : 'text-luwa-teal'}`}>{node.subject}</p>
                <p className={`text-sm font-bold leading-tight ${activeNote?.id === node.id ? 'text-white' : 'text-luwa-purple'}`}>{node.topic}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 hidden md:flex flex-col overflow-hidden">
          {activeNote ? (
            <GlassCard className="flex-1 overflow-y-auto p-12 custom-scrollbar animate-fade-in">
              <div className="max-w-3xl mx-auto space-y-12">
                <header>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="bg-luwa-teal/10 text-luwa-teal text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">{activeNote.subject}</span>
                    <span className="text-slate-300 font-bold">•</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${activeNote.difficulty === 'hard' ? 'text-red-500' : 'text-amber-500'}`}>{activeNote.difficulty} Complexity</span>
                  </div>
                  <h3 className="text-5xl font-serif font-bold text-luwa-purple leading-tight">{activeNote.topic}</h3>
                </header>

                <div className="space-y-10">
                  <section>
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6 border-b border-slate-100 pb-2">Topic Overview</h4>
                    <p className="text-lg text-slate-600 leading-relaxed font-medium">{activeNote.description}</p>
                  </section>

                  <section className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 relative">
                    <div className="absolute top-6 right-6 opacity-10"><ICONS.Brain className="w-16 h-16" /></div>
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-luwa-purple mb-6">Syllabus Summary Note</h4>
                    <p className="text-xl font-bold text-luwa-purple leading-loose italic">
                      {activeNote.summaryNote || "AI generating detailed summary..."}
                    </p>
                  </section>

                  <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-8 bg-white border border-luwa-border rounded-3xl shadow-sm">
                       <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Importance Rate</h5>
                       <div className="flex items-end gap-3">
                         <p className="text-5xl font-black text-luwa-purple">{Math.round(activeNote.importanceScore * 100)}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">/ 100 EUEE Weight</p>
                       </div>
                    </div>
                    <div className="p-8 bg-white border border-luwa-border rounded-3xl shadow-sm">
                       <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Prerequisites</h5>
                       <div className="flex flex-wrap gap-2">
                         {activeNote.prerequisites.length > 0 ? activeNote.prerequisites.map(p => (
                           <span key={p} className="bg-slate-50 border border-slate-100 px-3 py-1 rounded-lg text-[10px] font-bold text-slate-500 uppercase">{p}</span>
                         )) : <span className="text-[10px] font-bold text-slate-300 uppercase">Foundational Topic</span>}
                       </div>
                    </div>
                  </section>
                </div>
              </div>
            </GlassCard>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-20">
               <ICONS.Layout className="w-24 h-24 text-slate-400 mb-8" />
               <p className="text-[14px] font-black uppercase tracking-[0.6em]">Select a topic to view notes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};