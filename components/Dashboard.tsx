
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
  const masteryEntries = Object.values(user.masteryRecord || {}) as ConceptMastery[];

  const lifecycleStages: { stage: LifecycleStage, icon: any, instruction: string }[] = [
    { stage: 'Admission', icon: ICONS.Home, instruction: 'Establish conceptual baselines via core Diagnostics.' },
    { stage: 'Exploration', icon: ICONS.Brain, instruction: 'Synthesize first principles and build intuition nodes.' },
    { stage: 'Skill Acquisition', icon: ICONS.Zap, instruction: 'Execute high-repetition practice and spaced recall.' },
    { stage: 'Mastery', icon: ICONS.Layout, instruction: 'Refine efficiency and tackle high-difficulty simulations.' },
    { stage: 'Ready', icon: ICONS.Trophy, instruction: 'Finalize cognitive readiness and review memory stability.' },
  ];

  const currentStageIdx = lifecycleStages.findIndex(s => s.stage === user.lifecycleStage);

  const updateIntent = (type: IntentType) => {
    const newIntent = { type, confidence: 1.0, detectedAt: Date.now(), expiresAt: Date.now() + (1000 * 60 * 60 * 2) };
    onUpdateUser({ ...user, currentIntent: newIntent });
    setShowIntentSelector(false);
  };

  const getObjectiveText = () => {
    if (leverageTask.status === 'Review') return `Memory Restoration: ${leverageTask.node.topic}`;
    if (leverageTask.status === 'Ready') return `Advancement: ${leverageTask.node.topic}`;
    return user.currentObjective;
  };

  return (
    <div className="h-full flex flex-col items-center justify-start gap-12 animate-fade-in max-w-5xl mx-auto px-4 overflow-y-auto custom-scrollbar pb-10">
      
      {/* Institutional Directive Banner */}
      {directives.length > 0 && (
        <div className="w-full animate-fade-in">
           <div className="bg-luwa-gold/10 border border-luwa-gold/30 rounded-3xl p-6 flex items-center gap-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <ICONS.Zap className="w-20 h-20 luwa-gold" />
              </div>
              <div className="w-10 h-10 rounded-full bg-luwa-gold flex items-center justify-center shrink-0">
                <ICONS.Zap className="w-5 h-5 text-black" />
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-luwa-gold mb-1">Sovereign Registry Directive</p>
                <p className="text-sm font-bold text-white tracking-tight">{directives[0].content}</p>
              </div>
              <span className="text-[8px] font-black text-luwa-gold/40 uppercase tracking-widest">{new Date(directives[0].timestamp).toLocaleDateString()}</span>
           </div>
        </div>
      )}

      <div className="text-center space-y-4 max-w-2xl mt-4">
        <div className="flex items-center justify-center gap-4 mb-2">
          <button 
            onClick={() => setShowIntentSelector(!showIntentSelector)}
            className="text-[10px] font-black text-luwa-gold border border-luwa-gold/20 px-4 py-1.5 rounded-full uppercase tracking-[0.4em] hover:bg-luwa-gold/10 transition-all flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 bg-luwa-gold rounded-full animate-pulse" />
            Intel: {user.currentIntent?.type || 'Initializing...'}
          </button>
          <div className="text-[10px] font-black text-white/40 border border-white/5 px-4 py-1.5 rounded-full uppercase tracking-[0.4em]">
            Stage: {user.lifecycleStage}
          </div>
          <div className="text-[10px] font-black text-luwa-gold border border-luwa-gold/20 px-4 py-1.5 rounded-full uppercase tracking-[0.4em]">
            {user.prestige} Tier
          </div>
        </div>
        <h1 className="text-5xl font-black text-white tracking-tighter leading-tight">
          What is the highest leverage task you should execute today?
        </h1>
      </div>

      {showIntentSelector && (
        <div className="w-full max-w-4xl grid grid-cols-2 md:grid-cols-5 gap-4 animate-fade-in">
          {intents.map((i) => (
            <button
              key={i.type}
              onClick={() => updateIntent(i.type)}
              className={`p-6 rounded-2xl border flex flex-col items-center text-center gap-3 transition-all ${user.currentIntent?.type === i.type ? 'border-luwa-gold bg-luwa-gold/10' : 'border-white/5 bg-white/5 hover:border-white/20'}`}
            >
              <i.icon className={`w-5 h-5 ${user.currentIntent?.type === i.type ? 'text-luwa-gold' : 'text-gray-500'}`} />
              <span className="text-[9px] font-black uppercase tracking-widest text-white">{i.label}</span>
              <span className="text-[8px] text-gray-600 leading-tight">{i.desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* Lifecycle Progress & Directive */}
      <div className="w-full px-10">
        <div className="flex justify-between items-center mb-10 px-2">
           {lifecycleStages.map((s, i) => (
             <div key={s.stage} className="flex flex-col items-center gap-3 relative group">
                <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all ${i <= currentStageIdx ? 'bg-luwa-gold border-luwa-gold text-black shadow-lg shadow-luwa-gold/20' : 'bg-white/5 border-white/5 text-gray-700'}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                {i < lifecycleStages.length - 1 && (
                  <div className={`absolute left-full w-full h-[1px] top-5 -translate-x-1/2 -z-10 ${i < currentStageIdx ? 'bg-luwa-gold' : 'bg-white/5'}`} style={{ width: 'calc(100% * 5.2)' }} />
                )}
             </div>
           ))}
        </div>
        <div className="text-center">
           <p className="text-[9px] text-gray-600 uppercase font-black tracking-[0.5em] mb-2">Academic Mentorship Note</p>
           <p className="text-sm font-bold text-gray-300 italic">"{lifecycleStages[currentStageIdx].instruction}"</p>
        </div>
      </div>

      {/* Microlearning & Collaboration Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
         <GlassCard onClick={() => onNavigate('nexus')} className="lg:col-span-2 cursor-pointer border-luwa-gold/10 bg-luwa-gold/[0.01] flex items-center gap-8 group">
            <div className="w-20 h-20 bg-luwa-gold rounded-3xl flex items-center justify-center shrink-0 shadow-2xl shadow-luwa-gold/20 transition-transform group-hover:scale-110">
               <ICONS.Layout className="w-10 h-10 text-black" />
            </div>
            <div>
               <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-luwa-gold mb-1">Study Nexus</h4>
               <p className="text-xl font-black text-white tracking-tight">Sync with your cohort in the Nexus.</p>
               <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mt-2">3 Peers Active • AI Moderator: Zenith</p>
            </div>
         </GlassCard>
         <GlassCard className="lg:col-span-1 border-white/5 p-8 flex flex-col justify-center">
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-4">Consistency Pulse</p>
            <div className="flex gap-1">
               {[...Array(21)].map((_, i) => (
                 <div key={i} className={`h-6 w-1 rounded-sm ${i < user.streak ? 'bg-luwa-gold' : 'bg-white/5'}`} />
               ))}
            </div>
            <p className="text-[10px] font-black text-white uppercase tracking-widest mt-4">{user.streak} Day Neural Streak</p>
         </GlassCard>
      </div>

      <div className="w-full">
        <GlassCard onClick={() => onNavigate('lab')} className="group relative cursor-pointer border-luwa-gold/20 hover:bg-luwa-gold/5 p-16 overflow-hidden transition-all duration-700 hover:scale-[1.01] shadow-2xl">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity"><ICONS.Zap className="w-48 h-48 luwa-gold" /></div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-10">
              <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-luwa-gold">Strategic Vector</h3>
              <span className={`px-4 py-1 rounded text-[8px] font-black uppercase tracking-widest ${leverageTask.status === 'Review' ? 'bg-red-500/20 text-red-500' : 'bg-luwa-gold/20 text-luwa-gold'}`}>{leverageTask.status} Required</span>
            </div>
            <div className="space-y-6 mb-16">
              <p className="text-5xl font-black text-white leading-tight tracking-tight">{getObjectiveText()}</p>
              <p className="text-gray-500 text-sm font-medium tracking-wide">Targeting: {leverageTask.node.subject} • Priority: {Math.round(leverageTask.node.importanceScore * 100)}%</p>
            </div>
            <div className="flex items-center justify-between pt-10 border-t border-white/5">
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] max-w-sm leading-loose">{leverageTask.node.description}</p>
              <span className="bg-luwa-gold text-black px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] group-hover:px-16 transition-all shadow-xl shadow-luwa-gold/10">Execute Synthesis</span>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
        <GlassCard className="flex flex-col justify-between border-white/5 p-8 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-500 mb-1">EUEE Readiness</h4>
              <p className="text-lg font-black text-white">Sovereign Preparedness</p>
            </div>
            <div className="text-3xl font-black luwa-gold">{user.readiness}%</div>
          </div>
          <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-gradient-to-r from-luwa-gold to-nile-blue transition-all duration-1000 ease-out" style={{ width: `${user.readiness}%` }} />
          </div>
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mt-6">Composite Index: Mastery • Retention • Effort</p>
        </GlassCard>

        <GlassCard onClick={() => onNavigate('analytics')} className="cursor-pointer border-white/5 hover:bg-white/5 p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-500 mb-1">Cognitive Record</h4>
              <p className="text-lg font-black text-white">Mastery Heatmap</p>
            </div>
            <ICONS.Layout className="w-5 h-5 text-gray-700" />
          </div>
          <div className="flex flex-wrap gap-2">
            {masteryEntries.length > 0 ? masteryEntries.slice(0, 32).map((m, i) => (
              <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: m.retentionScore > 0.8 ? '#008B8B' : m.retentionScore > 0.4 ? '#FFD700' : '#9B111E', opacity: 0.3 + (m.retentionScore * 0.7) }} />
            )) : <p className="text-[9px] text-gray-600 uppercase font-black italic">Registry nodes initializing...</p>}
          </div>
        </GlassCard>
      </div>
      
      <div className="pt-8 w-full border-t border-white/5 text-center opacity-30 hover:opacity-100 transition-opacity">
         <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.5em] italic">Enterprise Robustness Verified • Academic Health: {user.health.status} • Luwa OS v2.0-Elite</p>
      </div>
    </div>
  );
};
