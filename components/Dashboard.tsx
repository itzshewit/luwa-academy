
/*
  Luwa Academy – AI-Powered Educational Platform
  Developed by Shewit – 2026
  Module: Scholar Dashboard & Console
*/

import React, { useState, useMemo, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { User, IntentType, ConceptMastery, ConceptNode, NodeStatus, LifecycleStage, GlobalDirective } from '../types';
import { ICONS } from '../constants';
import { storageService } from '../services/storageService';

interface DashboardProps {
  user: User;
  onNavigate: (tab: 'tutor' | 'lab' | 'analytics' | 'nexus') => void;
  onUpdateUser: (user: User) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate, onUpdateUser }) => {
  const [showIntentSelector, setShowIntentSelector] = useState(false);
  const [directives, setDirectives] = useState<GlobalDirective[]>([]);

  const intents: { type: IntentType, label: string, icon: any, desc: string }[] = [
    { type: 'Exploration', label: 'Exploration', icon: ICONS.Brain, desc: 'Curiosity-led deep intuition.' },
    { type: 'Deep Study', label: 'Deep Study', icon: ICONS.Layout, desc: 'Rigorous conceptual synthesis.' },
    { type: 'Exam Prep', label: 'Exam Prep', icon: ICONS.Zap, desc: 'EUEE benchmarking & efficiency.' },
    { type: 'Rapid Revision', label: 'Rapid Revision', icon: ICONS.Mic, desc: 'High-yield memory triggers.' },
    { type: 'Recovery', label: 'Recovery', icon: ICONS.Trophy, desc: 'Foundation repair & confidence.' },
  ];

  useEffect(() => {
    setDirectives(storageService.getDirectives());
  }, []);

  const leverageTask = useMemo(() => storageService.getLeverageTask(user), [user]);
  const suggestions = useMemo(() => storageService.getPersonalizedSuggestions(user), [user]);
  const masteryEntries = Object.values(user.masteryRecord || {}) as ConceptMastery[];

  const updateIntent = (type: IntentType) => {
    const newIntent = { type, confidence: 1.0, detectedAt: Date.now(), expiresAt: Date.now() + (1000 * 60 * 60 * 2) };
    onUpdateUser({ ...user, currentIntent: newIntent });
    setShowIntentSelector(false);
  };

  return (
    <div className="h-full flex flex-col items-center justify-start gap-12 animate-fade-in max-w-6xl mx-auto px-4 overflow-y-auto custom-scrollbar pb-20 pt-4">
      
      {/* Personalized Welcome */}
      <div className="w-full flex flex-col md:flex-row justify-between items-end gap-6 shrink-0">
        <div className="text-left">
          <p className="text-luwa-teal text-[10px] font-black uppercase tracking-[0.4em] mb-3">Sovereign Excellence</p>
          <h1 className="text-5xl font-serif font-bold text-luwa-purple tracking-tight">
            Welcome, {user.name.split(' ')[0]}.
          </h1>
          <p className="text-slate-400 font-medium mt-2">Your {user.stream} study path is optimized for mastery.</p>
        </div>
        <div className="flex items-center gap-6">
           <div className="text-right">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">EUEE Readiness</p>
              <p className="text-3xl font-serif font-black text-luwa-purple">{user.readiness}%</p>
           </div>
           <div className="h-10 w-px bg-slate-200" />
           <div className="text-right">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Scholar XP</p>
              <p className="text-3xl font-serif font-black text-luwa-teal">{user.xp.toLocaleString()}</p>
           </div>
        </div>
      </div>

      {/* Primary Engagement Cards */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <GlassCard onClick={() => onNavigate('lab')} className="h-full group relative cursor-pointer border-slate-100 hover:border-luwa-teal/30 hover:shadow-2xl hover:shadow-luwa-teal/5 p-12 overflow-hidden transition-all duration-500">
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity"><ICONS.Zap className="w-64 h-64 text-luwa-teal" /></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-4 mb-12">
                  <span className="bg-luwa-teal/10 text-luwa-teal text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Recommended Focus</span>
                  <span className="text-slate-300 text-[11px] font-bold">•</span>
                  <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">National Curriculum Node</span>
                </div>
                <h3 className="text-5xl font-serif font-bold text-luwa-purple mb-6 tracking-tight leading-tight">{leverageTask.node.topic}</h3>
                <p className="text-slate-500 max-w-lg leading-relaxed mb-12">{leverageTask.node.description}</p>
              </div>
              <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-luwa-teal animate-pulse" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-luwa-teal">Sync status: {leverageTask.status}</p>
                </div>
                <span className="bg-luwa-purple text-white px-10 py-4 rounded-xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-luwa-purple/20 transition-all group-hover:px-12">Enter Nexus</span>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
           <GlassCard className="flex-1 bg-luwa-purple text-white p-8 border-none flex flex-col justify-between shadow-2xl shadow-luwa-purple/20">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-6">Neural Surge</h4>
                <div className="flex items-center justify-between mb-2">
                   <span className="text-4xl font-serif font-black">{user.streak}</span>
                   <div className="text-3xl">🔥</div>
                </div>
                <p className="text-[11px] font-bold text-white/70">Continuous Learning Days</p>
              </div>
              <button 
                onClick={() => onNavigate('lab')}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-xl text-xs uppercase tracking-widest border border-white/20 transition-all mt-8"
              >
                Boost Streak
              </button>
           </GlassCard>
           
           <GlassCard className="flex-1 p-8 border-slate-100 flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Academic Mode</h4>
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-slate-50 rounded-xl">
                     <ICONS.Brain className="w-5 h-5 text-luwa-purple" />
                  </div>
                  <p className="text-lg font-bold text-luwa-purple">{user.currentIntent?.type}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowIntentSelector(!showIntentSelector)}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-4 rounded-xl text-[10px] uppercase tracking-widest border border-slate-100 transition-all"
              >
                Switch Intent
              </button>
           </GlassCard>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {suggestions.map((s) => (
          <GlassCard key={s.id} className="group hover:border-luwa-teal transition-all p-8 flex flex-col h-full border-slate-50">
             <div className="flex justify-between items-start mb-6">
                <span className="text-luwa-teal text-[9px] font-black uppercase tracking-widest">{s.type}</span>
                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-luwa-teal/5 transition-colors">
                   <ICONS.Zap className="w-4 h-4 text-slate-300 group-hover:text-luwa-teal transition-colors" />
                </div>
             </div>
             <h4 className="text-xl font-serif font-bold text-luwa-purple mb-3 leading-tight">{s.title}</h4>
             <p className="text-slate-500 text-sm leading-relaxed flex-1 mb-8">{s.desc}</p>
             <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                <span className="text-[11px] font-bold text-luwa-purple">{s.xp} XP</span>
                <span className="text-luwa-teal font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Launch →</span>
             </div>
          </GlassCard>
        ))}
      </div>

      {/* Activity Intent Selection Overlay */}
      {showIntentSelector && (
        <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-fade-in">
          {intents.map((i) => (
            <button
              key={i.type}
              onClick={() => updateIntent(i.type)}
              className={`p-8 rounded-3xl border-2 flex flex-col items-center text-center gap-4 transition-all ${user.currentIntent?.type === i.type ? 'border-luwa-purple bg-white shadow-2xl shadow-luwa-purple/10' : 'border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200'}`}
            >
              <div className={`p-4 rounded-2xl ${user.currentIntent?.type === i.type ? 'bg-luwa-purple text-white' : 'bg-white text-slate-400 shadow-sm'}`}>
                <i.icon className="w-6 h-6" />
              </div>
              <div>
                <p className={`text-[11px] font-black uppercase tracking-widest mb-1 ${user.currentIntent?.type === i.type ? 'text-luwa-purple' : 'text-slate-400'}`}>{i.label}</p>
                <p className="text-[9px] text-slate-400 font-medium leading-relaxed">{i.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
