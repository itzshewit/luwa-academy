
/*
  Luwa Academy – Scholar Home Dashboard
  Integrated Mockup Logic - V6.2 (Assignment Node Entry)
*/

import React, { useMemo } from 'react';
import { GlassCard } from './GlassCard.tsx';
import { User, Stream } from '../types.ts';
import { ICONS } from '../constants.tsx';

interface DashboardProps {
  user: User;
  onNavigate: (tab: string) => void;
  onUpdateUser: (user: User) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate, onUpdateUser }) => {
  const isAmharic = user.preferredLanguage === 'am';
  
  const dailyProgress = useMemo(() => {
    const attempted = Math.floor(user.xp / 10); 
    const percentage = Math.min(100, Math.round((attempted / (user.dailyGoal || 30)) * 100));
    return { percentage, attempted };
  }, [user]);

  const welcomeText = isAmharic ? `ሰላም፣ ${user.fullName.split(' ')[0]}` : `Welcome, ${user.fullName.split(' ')[0]}`;

  return (
    <div className="h-full flex flex-col gap-8 animate-m3-fade pb-20 overflow-y-auto custom-scrollbar pr-2">
      {/* Dynamic Streak Badge from Mockup */}
      <div className="flex">
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-orange-400 text-white px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-lg animate-float">
          <span>🔥</span>
          <span>{user.streak || 7} Day Streak Active</span>
        </div>
      </div>

      <section className="relative overflow-hidden p-10 rounded-m3-2xl bg-white border border-slate-100 shadow-m3-3">
        <div className="absolute top-0 right-0 w-full h-full hero-pattern opacity-[0.05] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
          <div className="flex items-center gap-8">
            <div className="w-16 h-16 bg-luwa-primaryContainer text-luwa-primary rounded-m3-xl flex items-center justify-center font-serif font-black text-3xl shadow-sm">
              {user.fullName.charAt(0)}
            </div>
            <div>
              <h1 className={`text-3xl md:text-4xl font-serif font-black text-luwa-onSurface mb-1 ${isAmharic ? 'amharic-text' : ''}`}>
                {welcomeText}
              </h1>
              <p className="text-slate-400 label-small uppercase tracking-[0.3em] font-black">
                {user.stream === Stream.NATURAL ? 'Natural Science' : 'Social Science'} • Grade {user.grade}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Goal Progress Panel from Mockup */}
        <div className="p-8 bg-white border border-slate-100 rounded-m3-2xl shadow-m3-2">
          <div className="flex justify-between items-center mb-6">
            <p className="label-small text-slate-400 uppercase font-black tracking-widest">Today's Goal</p>
            <p className="text-2xl font-black text-luwa-primary">{dailyProgress.attempted} / {user.dailyGoal || 30}</p>
          </div>
          <div className="h-2 bg-slate-50 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-luwa-secondary transition-all duration-1000" style={{ width: `${dailyProgress.percentage}%` }} />
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Keep up the great work, scholar!</p>
        </div>

        {/* Weekly Performance Mockup Panel */}
        <div className="p-8 bg-white border border-slate-100 rounded-m3-2xl shadow-m3-2">
          <p className="label-small text-slate-400 uppercase font-black tracking-widest mb-6">Cohort Status</p>
          <div className="space-y-4">
             {['Mathematics', 'Physics', 'English'].map((subj, i) => (
                <div key={subj}>
                   <div className="flex justify-between text-[9px] font-black uppercase mb-1">
                      <span>{subj}</span>
                      <span>{80 - (i*5)}%</span>
                   </div>
                   <div className="h-1 bg-slate-50 rounded-full overflow-hidden">
                      <div className="h-full bg-luwa-primary/30" style={{ width: `${80 - (i*5)}%` }} />
                   </div>
                </div>
             ))}
          </div>
        </div>

        {/* Weak Areas Panel from Mockup */}
        <div className="p-8 bg-white border border-slate-100 rounded-m3-2xl shadow-m3-2">
           <p className="label-small text-slate-400 uppercase font-black tracking-widest mb-6">Weak Area Focus</p>
           <div className="space-y-3">
              <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded-lg">
                 <p className="text-[10px] font-black text-red-700 uppercase">⚠️ Kinematics (Physics)</p>
                 <p className="text-[8px] text-red-400 font-bold uppercase">Accuracy: 55% • High Priority</p>
              </div>
              <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded-lg">
                 <p className="text-[10px] font-black text-red-700 uppercase">⚠️ Organic Chemistry</p>
                 <p className="text-[8px] text-red-400 font-bold uppercase">Accuracy: 58% • High Priority</p>
              </div>
           </div>
           <button onClick={() => onNavigate('lab')} className="w-full mt-4 py-3 bg-luwa-primary text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg">Refine Areas</button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <div className="xl:col-span-12 space-y-8">
          <h3 className="label-large text-luwa-onSurface uppercase font-black tracking-[0.3em]">
            Registry Terminal
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
            {[
              { id: 'library', label: 'Study Nodes', icon: ICONS.Layout, color: 'text-blue-500' },
              { id: 'quizzes', label: 'Unit Quiz', icon: ICONS.Zap, color: 'text-amber-500' },
              { id: 'assignments', label: 'Task Unit', icon: ICONS.Copy, color: 'text-pink-500' },
              { id: 'lab', label: 'AI Lab', icon: ICONS.Award, color: 'text-green-500' },
              { id: 'mock', label: 'Simulation', icon: ICONS.Brain, color: 'text-purple-500' },
              { id: 'analytics', label: 'Insights', icon: ICONS.Trophy, color: 'text-orange-500' },
            ].map(action => (
              <button 
                key={action.id} 
                onClick={() => onNavigate(action.id)}
                className="flex flex-col items-center gap-4 p-8 bg-white border border-slate-100 rounded-m3-2xl hover:shadow-m3-2 transition-all group"
              >
                <div className={`w-12 h-12 bg-slate-50 ${action.color} rounded-m3-xl flex items-center justify-center group-hover:bg-luwa-primaryContainer transition-colors`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
