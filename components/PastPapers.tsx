
import React, { useState } from 'react';
import { GlassCard } from './GlassCard.tsx';
import { User, PastPaper } from '../types.ts';
import { ICONS } from '../constants.tsx';
import { storageService } from '../services/storageService.ts';

interface PastPapersProps {
  user: User;
}

export const PastPapers: React.FC<PastPapersProps> = ({ user }) => {
  const isAmharic = user.preferredLanguage === 'am';
  const papers = storageService.getPastPapers();
  const [filter, setFilter] = useState<string | null>(null);

  const filtered = filter ? papers.filter(p => p.subject === filter) : papers;

  return (
    <div className="h-full flex flex-col gap-10 animate-fade-in overflow-y-auto pr-4 custom-scrollbar pb-24 pt-4">
      <header className="text-center max-w-2xl mx-auto">
        <h2 className={`text-4xl font-serif font-bold text-luwa-dark mb-4 ${isAmharic ? 'amharic-text' : ''}`}>
          {isAmharic ? 'ያለፉ ፈተናዎች' : 'Historical Exam Sets'}
        </h2>
        <p className="text-luwa-gray text-[10px] font-black uppercase tracking-[0.4em] leading-loose">
          Coverage: 2007 - 2017 E.C. (2014 - 2024 G.C.)
        </p>
      </header>

      <div className="flex flex-wrap gap-2 justify-center">
        <button onClick={() => setFilter(null)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${!filter ? 'bg-luwa-primary text-white border-luwa-primary shadow-lg shadow-luwa-primary/20' : 'bg-white text-luwa-gray border-slate-200'}`}>All</button>
        {storageService.getSubjects(user.stream).map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${filter === s ? 'bg-luwa-primary text-white border-luwa-primary shadow-lg shadow-luwa-primary/20' : 'bg-white text-luwa-gray border-slate-200'}`}>{s}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(paper => (
          <GlassCard key={paper.id} className="p-8 border-slate-100 hover:border-luwa-primary transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:opacity-10 transition-opacity"><ICONS.Layout className="w-24 h-24 text-luwa-primary" /></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <span className="bg-slate-50 text-luwa-primary px-3 py-1 rounded-full text-[9px] font-black uppercase">{paper.subject}</span>
                <span className="text-[14px] font-black text-luwa-dark">{paper.yearEC} E.C.</span>
              </div>
              <h4 className="text-xl font-bold text-luwa-dark mb-2">{paper.yearGC} G.C. Official Set</h4>
              <div className="space-y-1 mb-8">
                <p className="text-[10px] text-luwa-gray font-bold uppercase tracking-widest">{paper.questionCount} Questions</p>
                <p className="text-[10px] text-luwa-gray font-bold uppercase tracking-widest">{paper.timeLimit} Minutes Limit</p>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 py-3 bg-luwa-primary text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-luwa-primary/20">Attempt</button>
                <button className="px-4 py-3 bg-slate-100 text-luwa-dark rounded-xl"><ICONS.Layout className="w-4 h-4" /></button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};
