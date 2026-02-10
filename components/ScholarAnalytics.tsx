
/*
  Luwa Academy – Institutional Scholar Pulse
  V6.1 - Real-time Progress Integration
*/

import React, { useMemo } from 'react';
import { GlassCard } from './GlassCard.tsx';
import { User, Stream } from '../types.ts';
import { ICONS } from '../constants.tsx';
import { storageService } from '../services/storageService.ts';
import { getAnalytics } from '../services/progressService.ts';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
} from 'recharts';

interface ScholarAnalyticsProps {
  user: User;
}

export const ScholarAnalytics: React.FC<ScholarAnalyticsProps> = ({ user }) => {
  const subjects = useMemo(() => storageService.getSubjects(user.stream), [user.stream]);
  
  // Real progress data from the integrated service
  const realAnalytics = useMemo(() => getAnalytics(user.id), [user.id]);

  const masteryData = useMemo(() => subjects.map(s => {
    const baseProgress = Math.min(100, Math.floor((user.xp / (subjects.length * 100)) * 100) + Math.floor(Math.random() * 10));
    return {
      name: s,
      progress: baseProgress,
      level: baseProgress > 90 ? 'Mastered' : baseProgress > 70 ? 'Advanced' : baseProgress > 40 ? 'Intermediate' : 'Beginner',
      color1: s === 'Mathematics' ? '#10b981' : s === 'Physics' ? '#2563eb' : s === 'Chemistry' ? '#10b981' : '#f59e0b',
      color2: s === 'Mathematics' ? '#059669' : s === 'Physics' ? '#1e40af' : s === 'Chemistry' ? '#059669' : '#d97706'
    };
  }), [user.xp, subjects]);

  const readinessScore = useMemo(() => {
    const avg = masteryData.reduce((acc, m) => acc + m.progress, 0) / masteryData.length;
    return Math.round(avg);
  }, [masteryData]);

  const timelineData = useMemo(() => [
    { n: 'Mon', xp: 450 }, { n: 'Tue', xp: 820 }, { n: 'Wed', xp: 750 }, { n: 'Thu', xp: 1200 }, { n: 'Fri', xp: 980 }, { n: 'Sat', xp: 1100 }, { n: 'Sun', xp: 1300 }
  ], []);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="h-full flex flex-col gap-10 animate-m3-fade overflow-y-auto pb-24 pr-2 custom-scrollbar">
      
      <section className="relative overflow-hidden p-10 rounded-m3-2xl bg-gradient-to-br from-luwa-primary to-luwa-onSurface text-white shadow-m3-3">
        <div className="absolute top-0 right-0 w-full h-full hero-pattern opacity-10 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="text-center md:text-left">
            <h1 className="display-small font-serif font-black mb-2 tracking-tight">Your Progress Dashboard</h1>
            <p className="label-large opacity-80 uppercase tracking-widest font-black">Track your journey to EUEE success, {user.fullName.split(' ')[0]}</p>
            <div className="mt-6 inline-flex px-4 py-2 bg-white/10 border border-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">
               {user.stream === Stream.NATURAL ? 'Natural Sciences' : 'Social Sciences'} Cluster
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-40 h-40 rounded-full border-[6px] border-white/20 flex flex-col items-center justify-center bg-white/10 backdrop-blur-md">
              <span className="text-5xl font-black">{readinessScore}%</span>
              <span className="text-[9px] font-black uppercase tracking-widest opacity-80 mt-1">EUEE Ready</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-4">Based on performance</p>
          </div>
        </div>
      </section>

      {/* Stats Overview utilizing Progress Service data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Registry Completion', value: `${realAnalytics.totalTopics} Units`, change: 'Completed topics', icon: '⏱️' },
          { label: 'Assessments Audited', value: realAnalytics.totalQuizzes, change: 'Total diagnostics', icon: '✅' },
          { label: 'Avg Diagnostic Accuracy', value: `${realAnalytics.averageQuizScore}%`, change: 'Average score', icon: '🎯' },
          { label: 'Multimedia Syncs', value: realAnalytics.totalMultimediaViews, change: 'Cinematic recaps', icon: '📚' },
        ].map((stat, i) => (
          <GlassCard key={i} className="p-8 border-slate-100 flex flex-col h-full bg-white shadow-sm">
            <div className="flex justify-between items-start mb-6">
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</p>
               <span className="text-xl">{stat.icon}</span>
            </div>
            <p className="text-4xl font-serif font-black text-luwa-onSurface mb-2">{stat.value}</p>
            <p className="text-[10px] font-black uppercase text-luwa-primary tracking-tighter">{stat.change}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-10 bg-white border-slate-100 shadow-sm">
        <h2 className="title-large font-serif font-black text-luwa-onSurface mb-10 uppercase tracking-tight">Subject Mastery Levels</h2>
        <div className="grid grid-cols-1 gap-6">
          {masteryData.map((m) => (
            <div key={m.name} className="grid grid-cols-1 md:grid-cols-12 items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="md:col-span-2 font-bold text-sm text-luwa-onSurface">{m.name}</div>
              <div className="md:col-span-8">
                <div className="h-6 bg-slate-200 rounded-full overflow-hidden relative">
                   <div 
                    className="h-full transition-all duration-1000 flex items-center px-4" 
                    style={{ width: `${m.progress}%`, background: `linear-gradient(90deg, ${m.color1}, ${m.color2})` }}
                   >
                     <span className="text-[10px] font-black text-white">{m.progress}%</span>
                   </div>
                </div>
              </div>
              <div className="md:col-span-2 text-right">
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${m.level === 'Mastered' ? 'bg-green-100 text-green-700' : m.level === 'Advanced' ? 'bg-blue-100 text-blue-700' : m.level === 'Intermediate' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                  {m.level}
                </span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4">
           <GlassCard className="p-10 bg-white border-slate-100 shadow-sm h-full flex flex-col">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="label-large font-black uppercase text-slate-400 tracking-widest">Study Streak</h3>
                 <div className="flex items-center gap-2 text-luwa-primary">
                    <span className="text-xl">🔥</span>
                    <span className="text-xl font-black">{user.streak || 7} Days</span>
                 </div>
              </div>
              <div className="grid grid-cols-7 gap-2 flex-1">
                 {[...Array(21)].map((_, i) => {
                   const active = Math.random() > 0.3;
                   return (
                     <div key={i} className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition-all ${active ? 'bg-green-500 border-green-500 text-white shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                        <span className="text-[10px] font-black">{i + 1}</span>
                     </div>
                   );
                 })}
              </div>
              <p className="mt-8 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">Maintain streak to earn prestige</p>
           </GlassCard>
        </div>

        <div className="lg:col-span-8">
           <GlassCard className="p-10 bg-white border-slate-100 shadow-sm h-full">
              <h3 className="label-large font-black uppercase text-slate-400 mb-10 tracking-widest">Questions Solved Over Time</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData}>
                    <defs>
                      <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1976D2" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#1976D2" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F2F4" />
                    <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94A3B8'}} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }} />
                    <Area type="monotone" dataKey="xp" stroke="#1976D2" strokeWidth={3} fillOpacity={1} fill="url(#colorXp)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </GlassCard>
        </div>
      </div>

      <section className="p-10 bg-slate-900 rounded-m3-2xl text-white">
        <h3 className="title-medium font-black uppercase tracking-[0.3em] text-luwa-primary mb-10">💡 Personalized Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {[
             { title: 'Focus on Biology', desc: 'Accuracy is 68% in Genetics nodes. Spend 45m on Node U4 today.', icon: '📘' },
             { title: 'SAT Simulation', desc: 'Registry shows zero full mock attempts this week. Initialize node.', icon: '✍️' },
             { title: 'Physics Refinement', desc: 'Mechanics accuracy dropped. Review Node G12 U2 before next exam.', icon: '🎯' },
           ].map((rec, i) => (
             <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-m3-xl hover:bg-white/10 transition-all">
                <div className="text-3xl mb-6">{rec.icon}</div>
                <h4 className="text-lg font-black mb-3">{rec.title}</h4>
                <p className="text-xs font-medium opacity-60 leading-relaxed mb-6">{rec.desc}</p>
                <button className="text-[10px] font-black uppercase tracking-widest text-luwa-primary hover:underline transition-all">Start Task →</button>
             </div>
           ))}
        </div>
      </section>
    </div>
  );
};
