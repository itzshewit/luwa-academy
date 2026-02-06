
/*
  Luwa Academy – Scholar Home Dashboard
  White Theme Refresh - V5.1
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
    const percentage = Math.min(100, Math.round((attempted / user.dailyGoal) * 100));
    return { percentage, attempted };
  }, [user]);

  const welcomeText = isAmharic ? `ሰላም፣ ${user.fullName.split(' ')[0]}` : `Welcome, ${user.fullName.split(' ')[0]}`;

  return (
    <div className="h-full flex flex-col gap-10 animate-m3-fade pb-20">
      {/* Hero Welcome Section - Minimal White Style */}
      <section className="relative overflow-hidden p-10 md:p-14 rounded-m3-2xl bg-white border border-slate-100 shadow-m3-3">
        <div className="absolute top-0 right-0 w-full h-full hero-pattern opacity-[0.05] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 bg-luwa-primaryContainer text-luwa-primary rounded-m3-xl flex items-center justify-center font-serif font-black text-4xl shadow-sm">
              {user.fullName.charAt(0)}
            </div>
            <div>
              <h1 className={`text-4xl md:text-5xl font-serif font-black text-luwa-onSurface mb-2 ${isAmharic ? 'amharic-text' : ''}`}>
                {welcomeText}
              </h1>
              <p className="text-slate-400 label-large uppercase tracking-[0.3em] font-black">
                {user.stream === Stream.NATURAL ? 'Natural Science' : 'Social Science'} • Grade {user.grade}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 px-5 py-2 rounded-full border border-slate-100">
             <div className="w-2 h-2 bg-luwa-secondary rounded-full animate-pulse" />
             <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Active Status: High Performance</span>
          </div>
        </div>
      </section>

      {/* Main Stats Grid - White & Airy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="p-8 bg-white border border-slate-100 rounded-m3-2xl shadow-m3-2 hover:shadow-m3-3 transition-shadow">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="label-small text-slate-400 uppercase font-black tracking-widest mb-1">Total XP</p>
              <p className="text-4xl font-serif font-black text-luwa-onSurface">{user.xp.toLocaleString()}</p>
            </div>
            <ICONS.Trophy className="w-8 h-8 text-luwa-primary opacity-20" />
          </div>
          <div className="h-1 bg-slate-50 rounded-full overflow-hidden">
            <div className="h-full bg-luwa-primary opacity-30" style={{ width: '60%' }} />
          </div>
        </div>

        <div className="p-8 bg-white border border-slate-100 rounded-m3-2xl shadow-m3-2 hover:shadow-m3-3 transition-shadow">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="label-small text-slate-400 uppercase font-black tracking-widest mb-1">Current Streak</p>
              <p className="text-4xl font-serif font-black text-luwa-onSurface">{user.streak} Days</p>
            </div>
            <ICONS.Zap className="w-8 h-8 text-luwa-tertiary opacity-20" />
          </div>
          <div className="flex gap-1.5">
            {[...Array(7)].map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full ${i < user.streak ? 'bg-luwa-tertiary' : 'bg-slate-100'}`} />
            ))}
          </div>
        </div>

        <div className="p-8 bg-white border border-slate-100 rounded-m3-2xl shadow-m3-2 hover:shadow-m3-3 transition-shadow">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="label-small text-slate-400 uppercase font-black tracking-widest mb-1">Daily Target</p>
              <p className="text-4xl font-serif font-black text-luwa-onSurface">{dailyProgress.percentage}%</p>
            </div>
            <ICONS.Brain className="w-8 h-8 text-luwa-secondary opacity-20" />
          </div>
          <div className="h-1 bg-slate-50 rounded-full overflow-hidden">
            <div className="h-full bg-luwa-secondary" style={{ width: `${dailyProgress.percentage}%` }} />
          </div>
        </div>
      </div>

      {/* Terminal Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <div className="xl:col-span-8 space-y-10">
          <section>
            <h3 className="label-large text-luwa-onSurface uppercase font-black tracking-[0.3em] mb-8">
              Registry Terminal
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                { id: 'library', label: 'Study Nodes', icon: ICONS.Layout, color: 'text-blue-500' },
                { id: 'lab', label: 'Assessment', icon: ICONS.Zap, color: 'text-green-500' },
                { id: 'mock', label: 'Simulation', icon: ICONS.Brain, color: 'text-purple-500' },
                { id: 'analytics', label: 'Insights', icon: ICONS.Trophy, color: 'text-orange-500' },
              ].map(action => (
                <button 
                  key={action.id} 
                  onClick={() => onNavigate(action.id)}
                  className="flex flex-col items-center gap-4 p-8 bg-white border border-slate-100 rounded-m3-2xl hover:shadow-m3-2 transition-all m3-ripple group"
                >
                  <div className={`w-14 h-14 bg-slate-50 ${action.color} rounded-m3-xl flex items-center justify-center group-hover:bg-luwa-primaryContainer group-hover:text-luwa-primary transition-colors`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{action.label}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="xl:col-span-4">
          <div className="h-full p-10 bg-slate-50 border border-slate-100 rounded-m3-2xl flex flex-col">
            <h3 className="text-[10px] text-slate-400 uppercase font-black tracking-[0.3em] mb-8">Daily Directive</h3>
            <div className="space-y-6 flex-1">
              <div className="p-6 bg-white border border-slate-100 rounded-m3-xl">
                <p className="text-[9px] font-black uppercase text-luwa-primary mb-1">Priority Focus</p>
                <p className="text-lg font-bold text-luwa-onSurface">Organic Chemistry Recap</p>
              </div>
              <div className="p-6 bg-white border border-slate-100 rounded-m3-xl">
                <p className="text-[9px] font-black uppercase text-luwa-secondary mb-1">Recommended</p>
                <p className="text-lg font-bold text-luwa-onSurface">EUEE Math 2016 Session</p>
              </div>
            </div>
            <button className="w-full mt-10 py-4 bg-luwa-primary text-white rounded-m3-xl label-small font-black uppercase tracking-widest shadow-m3-2 hover:brightness-110 transition-all">
              Initialize Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
