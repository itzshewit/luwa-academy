
/*
  Luwa Academy – Institutional Analytics
  White Theme Refresh - V5.1
*/

import React, { useMemo } from 'react';
import { User } from '../types.ts';
import { ICONS } from '../constants.tsx';
import { storageService } from '../services/storageService.ts';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area
} from 'recharts';

interface ScholarAnalyticsProps {
  user: User;
}

export const ScholarAnalytics: React.FC<ScholarAnalyticsProps> = ({ user }) => {
  const leaderboard = useMemo(() => storageService.getLeaderboard(user), [user]);
  const timelineData = useMemo(() => [
    { n: 'Mon', xp: 450 }, { n: 'Tue', xp: 820 }, { n: 'Wed', xp: 750 }, { n: 'Thu', xp: 1200 }, { n: 'Fri', xp: 980 }
  ], []);

  return (
    <div className="h-full flex flex-col gap-10 animate-m3-fade overflow-y-auto pb-24 pr-2 custom-scrollbar">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 pb-10 border-b border-slate-100">
        <div>
          <h2 className="display-small font-serif font-black text-luwa-onSurface">Scholar Pulse</h2>
          <p className="label-large text-slate-400 font-black uppercase tracking-[0.4em] mt-2">Registry Analytics • Tier: {user.prestige}</p>
        </div>
        <div className="flex gap-8 bg-slate-50 p-8 rounded-m3-2xl border border-slate-100">
           <div className="text-center">
             <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Index</p>
             <p className="text-4xl font-serif font-black text-luwa-primary">{user.readiness}%</p>
           </div>
           <div className="w-px h-12 bg-slate-200 mt-2" />
           <div className="text-center">
             <p className="text-[10px] text-slate-400 font-black uppercase mb-1">XP</p>
             <p className="text-4xl font-serif font-black text-luwa-tertiary">{user.xp}</p>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
           <div className="p-10 bg-white border border-slate-100 rounded-m3-2xl shadow-sm">
              <h3 className="label-large font-black uppercase text-slate-400 mb-10 tracking-[0.2em]">Learning Curve</h3>
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
           </div>

           <div className="p-10 bg-white border border-slate-100 rounded-m3-2xl shadow-sm">
              <h3 className="label-large font-black uppercase text-slate-400 mb-8 tracking-[0.2em]">Cohort Vanguard</h3>
              <div className="space-y-4">
                 {leaderboard.slice(0, 3).map((entry) => (
                   <div key={entry.userId} className={`flex items-center justify-between p-5 rounded-m3-xl border ${entry.isCurrentUser ? 'bg-luwa-primaryContainer border-luwa-primary/10' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex items-center gap-4">
                         <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-black text-xs shadow-sm">{entry.rank}</span>
                         <span className="font-bold text-luwa-onSurface">{entry.name}</span>
                      </div>
                      <span className="text-xs font-black text-luwa-primary">{entry.xp} XP</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="lg:col-span-4">
           <div className="p-10 bg-slate-50 border border-slate-100 rounded-m3-2xl">
              <h3 className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-10">Competency Badges</h3>
              <div className="grid grid-cols-2 gap-4">
                 {[1, 2, 3, 4].map(b => (
                   <div key={b} className="aspect-square bg-white border border-slate-100 rounded-m3-xl flex items-center justify-center opacity-30">
                      <ICONS.Star className="w-8 h-8 text-slate-300" />
                   </div>
                 ))}
              </div>
              <div className="mt-10 pt-10 border-t border-slate-200">
                 <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Badges are awarded for neural-sync milestones and diagnostic mastery.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
