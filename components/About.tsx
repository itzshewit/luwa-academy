/*
  Module: About Page
  Purpose: Provides institutional information and creator attribution.
*/

import React from 'react';
import { GlassCard } from './GlassCard';

export const About: React.FC = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center animate-fade-in max-w-4xl mx-auto">
      <GlassCard className="p-16 border-luwa-gold/10 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <h2 className="text-8xl font-black text-white">?</h2>
        </div>
        
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

          <section>
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-600 mb-6">Core Capabilities</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                "Neural Tutoring",
                "Bi-vocal Sync",
                "Cinematic Recaps",
                "Spaced Retrieval",
                "Cohort Nexus",
                "Real-time Audit"
              ].map(cap => (
                <div key={cap} className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-400">
                  {cap}
                </div>
              ))}
            </div>
          </section>

          <section className="pt-8">
             <p className="text-[8px] font-black uppercase tracking-[0.8em] text-gray-700 italic">Sovereign Excellence Verified</p>
          </section>
        </div>
      </GlassCard>
    </div>
  );
};