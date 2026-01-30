
/*
  Luwa Academy – AI-Powered Educational Platform
  Developed by Shewit – 2026
  Purpose: Interactive, gamified, and AI-assisted learning for high school students.
  Module: About Page
  Author: Shewit – 2026
*/

import React from 'react';
import { GlassCard } from './GlassCard';

export const About: React.FC = () => {
  return (
    <div className="h-full flex flex-col items-center justify-start animate-fade-in max-w-4xl mx-auto overflow-y-auto custom-scrollbar pb-10">
      <GlassCard className="w-full p-16 border-luwa-gold/10 text-center relative overflow-hidden mb-10">
        <h1 className="text-6xl font-black luwa-gold mb-4 tracking-tighter">Luwa Academy</h1>
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.6em] mb-12">Registry Version 2.0.26</p>
        
        <div className="space-y-12 max-w-2xl mx-auto">
          <section>
            <h3 className="text-xs font-black uppercase tracking-widest text-white mb-4">Developed by Shewit – 2026</h3>
            <p className="text-gray-500 text-sm leading-loose">
              Empowering Ethiopian high school students with interactive, gamified, and AI-driven learning.
            </p>
          </section>

          <div className="h-[1px] w-24 bg-white/5 mx-auto" />

          <section className="text-left">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-luwa-gold mb-6 text-center">Institutional Intelligence</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-2">
                  <h4 className="text-[9px] font-black text-white uppercase tracking-widest">Question Ledger</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">Every conceptual probe is indexed. Scholars can revisit previous synchronization cycles or purge local identity fragments via the Ledger toggle.</p>
               </div>
               <div className="space-y-2">
                  <h4 className="text-[9px] font-black text-white uppercase tracking-widest">National Knowledge Base</h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">The Instructor is specifically synchronized with Grade 11 and 12 Ethiopian National Textbooks, ensuring absolute alignment with EUEE standards.</p>
               </div>
            </div>
          </section>

          <section>
             <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-600 mb-6">Sovereign Community Hubs</h3>
             <div className="flex justify-center gap-6">
                <a href="https://t.me/eurekahs" target="_blank" className="px-6 py-3 bg-white/5 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-luwa-gold hover:bg-luwa-gold/10 transition-all">Telegram Channel</a>
                <a href="https://t.me/eurekahsgroup" target="_blank" className="px-6 py-3 bg-white/5 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-luwa-gold hover:bg-luwa-gold/10 transition-all">Scholar Group</a>
             </div>
          </section>
        </div>
      </GlassCard>
    </div>
  );
};
