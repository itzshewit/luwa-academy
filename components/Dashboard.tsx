
/*
  Luwa Academy – Dashboard V2.2 (Integrated Mission Center)
*/

import React, { useState, useMemo, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { User, IntentType, ConceptMastery, GlobalDirective } from '../types';
import { ICONS } from '../constants';
import { storageService } from '../services/storageService';

interface DashboardProps {
  user: User;
  onNavigate: (tab: any) => void;
  onUpdateUser: (user: User) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate, onUpdateUser }) => {
  const [showIntentSelector, setShowIntentSelector] = useState(false);

  const intents: { type: IntentType, label: string, icon: any, desc: string }[] = [
    { type: 'Exploration', label: 'Exploration', icon: ICONS.Brain, desc: 'Curiosity-led deep intuition.' },
    { type: 'Deep Study', label: 'Deep Study', icon: ICONS.Layout, desc: 'Rigorous conceptual synthesis.' },
    { type: 'Exam Prep', label: 'Exam Prep', icon: ICONS.Zap, desc: 'EUEE benchmarking & efficiency.' },
    { type: 'Rapid Revision', label: 'Rapid Revision', icon: ICONS.Mic, desc: 'High-yield memory triggers.' },
    { type: 'Recovery', label: 'Recovery', icon: ICONS.Trophy, desc: 'Foundation repair & confidence.' },
  ];

  const leverageTask = useMemo(() => storageService.getLeverageTask(user), [user]);
  const suggestions = useMemo(() => storageService.getPersonalizedSuggestions(user), [user]);
  
  const pendingGoals = (user.studyGoals || []).filter(g => !g.isCompleted);

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

      {/* Main Grid */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recommended Action */}
        <div className="lg:col-span-8">
          <GlassCard onClick={() => onNavigate('library')} className="h-full group relative cursor-pointer border-slate-100 hover:border-luwa-teal/30 hover:shadow-2xl hover:shadow-luwa-teal/5 p-12 overflow-hidden transition-all duration-500">
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity"><ICONS.Zap className="w-64 h-64 text-luwa-teal" /></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-4 mb-12">
                  <span className="bg-luwa-teal/10 text-luwa-teal text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Priority Node</span>
                  <span className="text-slate-300 text-[11px] font-bold">•</span>
                  <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">{leverageTask.node.subject}</span>
                </div>
                <h3 className="text-5xl font-serif font-bold text-luwa-purple mb-6 tracking-tight leading-tight">{leverageTask.node.topic}</h3>
                <p className="text-slate-500 max-w-lg leading-relaxed mb-12">{leverageTask.node.description}</p>
              </div>
              <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                <p className="text-[10px] font-black uppercase tracking-widest text-luwa-teal">Curriculum Aligned: Yes</p>
                <span className="bg-luwa-purple text-white px-10 py-4 rounded-xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-luwa-purple/20 transition-all group-hover:px-12">Read Notes</span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Goals & Mode Side Panel */}
        <div className="lg:col-span-4 flex flex-col gap-6">
           <GlassCard onClick={() => onNavigate('planner')} className="flex-1 p-8 border-slate-100 cursor-pointer hover:border-luwa-purple transition-all flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Daily Commitment</h4>
                {pendingGoals.length > 0 ? (
                  <div className="space-y-3">
                    {pendingGoals.slice(0, 3).map(g => (
                      <div key={g.id} className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${g.priority === 'high' ? 'bg-red-500' : 'bg-luwa-teal'}`} />
                        <p className="text-sm font-bold text-luwa-purple truncate">{g.title}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-medium text-slate-400">All goals synchronized. Define more?</p>
                )}
              </div>
              <p className="text-[10px] font-black text-luwa-purple uppercase tracking-widest mt-8">Go to Planner →</p>
           </GlassCard>
           
           <GlassCard className="flex-1 p-8 border-slate-100 flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Cognitive Mode</h4>
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

      {/* Suggested Revision Grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {suggestions.map((s) => (
          <GlassCard key={s.id} onClick={() => onNavigate('lab')} className="group hover:border-luwa-teal cursor-pointer transition-all p-8 flex flex-col h-full border-slate-50">
             <div className="flex justify-between items-start mb-6">
                <span className="text-luwa-teal text-[9px] font-black uppercase tracking-widest">{s.type}</span>
                <ICONS.Zap className="w-4 h-4 text-slate-300 group-hover:text-luwa-teal transition-colors" />
             </div>
             <h4 className="text-xl font-serif font-bold text-luwa-purple mb-3 leading-tight">{s.title}</h4>
             <p className="text-slate-500 text-sm leading-relaxed flex-1 mb-8">{s.desc}</p>
             <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                <span className="text-[11px] font-bold text-luwa-purple">{s.xp} XP</span>
                <span className="text-luwa-teal font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Practice Now →</span>
             </div>
          </GlassCard>
        ))}
      </div>

      {/* Intent Selector Overlay */}
      {showIntentSelector && (
        <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-fade-in mb-20">
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
