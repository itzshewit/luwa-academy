
import React, { useState, useEffect, useMemo } from 'react';
import { GlassCard } from './GlassCard';
import { storageService } from '../services/storageService';
import { User, AccessToken, AuditEntry, GlobalDirective } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LineChart, Line } from 'recharts';
import { ICONS } from '../constants';

interface AdminControlProps {
  onSimulate: (user: User) => void;
}

export const AdminControl: React.FC<AdminControlProps> = ({ onSimulate }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [tokens, setTokens] = useState<AccessToken[]>([]);
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'observability' | 'benchmarks' | 'broadcast'>('users');
  const [directiveInput, setDirectiveInput] = useState('');
  
  useEffect(() => {
    setUsers(storageService.getAllUsers());
    setTokens(storageService.getTokens());
    setLogs(storageService.getAuditLogs());
  }, []);

  const cohortStats = useMemo(() => storageService.getCohortStats(), [users]);

  const handleGenerateToken = () => {
    const code = storageService.generateToken();
    setNewToken(code);
    setTokens(storageService.getTokens());
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directiveInput.trim()) return;
    const directive: GlobalDirective = {
      id: Math.random().toString(36).substr(2, 9),
      content: directiveInput,
      timestamp: Date.now(),
      author: 'Institutional Registry Admin'
    };
    storageService.saveDirective(directive);
    setDirectiveInput('');
    alert("Sovereign Directive Broadcast to all nodes.");
  };

  const toggleDeactivate = (userId: string) => {
    const allUsers = storageService.getAllUsers();
    const target = allUsers.find(u => u.id === userId);
    if (target) {
      const updatedUser = { ...target, deactivated: !target.deactivated };
      storageService.saveUser(updatedUser);
      setUsers(storageService.getAllUsers());
    }
  };

  const failedConcepts = users.reduce<Record<string, number>>((acc, u) => {
    u.weakConcepts.forEach(c => { acc[c] = (acc[c] || 0) + 1; });
    return acc;
  }, {});

  const sortedConcepts = Object.entries(failedConcepts).sort((a, b) => (b[1] as number) - (a[1] as number));

  const chartData = cohortStats ? Object.entries(cohortStats.stageDistribution).map(([stage, count]) => ({
    name: stage.split(' ')[0],
    count
  })) : [];

  const pulseData = [...Array(10)].map((_, i) => ({
    time: i,
    latency: 200 + Math.random() * 800,
    volume: 10 + Math.random() * 50
  }));

  return (
    <div className="h-full flex flex-col gap-8 animate-fade-in overflow-hidden">
      <div className="flex justify-between items-end shrink-0">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter luwa-gold">Mission Control</h2>
          <div className="flex gap-6 mt-4">
             {(['users', 'observability', 'benchmarks', 'broadcast'] as const).map(t => (
               <button 
                 key={t}
                 onClick={() => setActiveTab(t)}
                 className={`text-[9px] font-black uppercase tracking-[0.4em] pb-2 border-b-2 transition-all ${activeTab === t ? 'border-luwa-gold text-white' : 'border-transparent text-gray-700 hover:text-gray-400'}`}
               >
                 {t}
               </button>
             ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-8 pb-10">
        {activeTab === 'users' && (
          <div className="space-y-8 animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <GlassCard className="border-luwa-gold/10">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-6">Token Authority</h3>
                  <button onClick={handleGenerateToken} className="w-full bg-luwa-gold text-black font-black py-4 rounded-xl text-[10px] uppercase tracking-widest mb-6 active:scale-[0.98] transition-all">Generate Neural Code</button>
                  {newToken && <div className="p-6 bg-white/5 border border-luwa-gold/20 rounded-xl text-center animate-fade-in">
                    <p className="text-[8px] text-gray-500 uppercase tracking-widest mb-2">New Entry Token</p>
                    <p className="text-2xl font-black luwa-gold tracking-widest font-mono select-all cursor-pointer">{newToken}</p>
                  </div>}
                </GlassCard>

                <GlassCard className="border-white/5">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-6">Cognitive Variance</h3>
                  <div className="space-y-3">
                    {sortedConcepts.length > 0 ? sortedConcepts.slice(0, 3).map(([c, count]) => (
                      <div key={c} className="flex justify-between items-center p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
                        <span className="text-[10px] font-bold text-white uppercase">{c}</span>
                        <span className="text-[9px] font-black text-red-500 uppercase">{count} Hits</span>
                      </div>
                    )) : <p className="text-[10px] italic text-gray-600">Stable diagnostic parameters.</p>}
                  </div>
                </GlassCard>
             </div>

             <GlassCard className="border-white/5 p-10">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-6">Scholar Registry</h3>
                <div className="space-y-3">
                  {users.filter(u => u.role === 'scholar').map(u => (
                    <div key={u.id} className={`flex flex-col md:flex-row md:items-center justify-between p-5 bg-white/5 rounded-2xl border transition-all ${u.deactivated ? 'opacity-40 grayscale border-red-500/20' : 'border-white/5 hover:border-white/10'}`}>
                      <div>
                        <p className="text-sm font-black text-white">{u.name}</p>
                        <p className="text-[9px] text-luwa-gold uppercase font-black tracking-widest mt-1">{u.stream} • Readiness: {u.readiness}% • Stage: {u.lifecycleStage}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-4 md:mt-0">
                        <button onClick={() => onSimulate(u)} className="bg-white/10 text-white text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-white/20 transition-all">Simulate</button>
                        <button onClick={() => toggleDeactivate(u.id)} className={`text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all ${u.deactivated ? 'bg-green-500 text-black' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>{u.deactivated ? 'Restore' : 'Terminate'}</button>
                      </div>
                    </div>
                  ))}
                </div>
             </GlassCard>
          </div>
        )}

        {activeTab === 'observability' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <GlassCard className="border-white/5 p-8 h-[300px] flex flex-col">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-10">AI Compute Latency (ms)</h3>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={pulseData}>
                        <Line type="monotone" dataKey="latency" stroke="#FFD700" strokeWidth={2} dot={false} />
                        <Tooltip contentStyle={{ background: '#0A0A0B', border: '1px solid rgba(255,215,0,0.1)' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
               </GlassCard>
               <GlassCard className="border-white/5 p-8 h-[300px] flex flex-col">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-10">Request Volume</h3>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={pulseData}>
                        <Bar dataKey="volume" fill="#008B8B" radius={[4, 4, 0, 0]} />
                        <Tooltip contentStyle={{ background: '#0A0A0B', border: '1px solid rgba(0,139,139,0.1)' }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
               </GlassCard>
            </div>

            <GlassCard className="border-white/5 p-10">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-8">Global Command Ledger</h3>
              <div className="space-y-4">
                {logs.map(log => (
                  <div key={log.id} className="p-5 bg-black/40 rounded-2xl border border-white/5 flex gap-6 items-start">
                    <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: log.severity === 'info' ? '#008B8B' : log.severity === 'warning' ? '#FFD700' : '#9B111E' }} />
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <p className="text-[10px] font-black text-white uppercase tracking-widest">{log.action}</p>
                        <p className="text-[9px] text-gray-600 font-black uppercase">{new Date(log.timestamp).toLocaleTimeString()}</p>
                      </div>
                      <p className="text-xs text-gray-400 font-medium leading-relaxed">{log.detail}</p>
                      <p className="text-[8px] text-gray-700 uppercase font-black tracking-widest mt-2">Source: {log.userName} ({log.userId})</p>
                    </div>
                  </div>
                ))}
                {logs.length === 0 && <p className="text-center py-20 text-[10px] text-gray-700 uppercase italic font-black">No institutional events recorded.</p>}
              </div>
            </GlassCard>
          </div>
        )}

        {activeTab === 'benchmarks' && (
          <div className="space-y-8 animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <GlassCard className="text-center p-8 border-luwa-gold/10">
                   <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-2">Cohort Avg Readiness</p>
                   <p className="text-5xl font-black luwa-gold">{cohortStats?.avgReadiness || 0}%</p>
                </GlassCard>
                <GlassCard className="text-center p-8 border-white/5">
                   <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-2">Total Accumulated XP</p>
                   <p className="text-5xl font-black text-white">{(cohortStats?.avgXp || 0) * users.length}</p>
                </GlassCard>
                <GlassCard className="text-center p-8 border-white/5">
                   <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-2">Elite Readiness (80%+)</p>
                   <p className="text-5xl font-black text-green-500">{users.filter(u => u.readiness >= 80).length}</p>
                </GlassCard>
             </div>

             <GlassCard className="h-[400px] border-white/5 p-10 flex flex-col">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-12">National Lifecycle Distribution</h3>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" stroke="#1A1A1B" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ background: '#0A0A0B', border: '1px solid rgba(255,215,0,0.1)', borderRadius: '16px' }}
                        itemStyle={{ color: '#FFD700', fontSize: '12px', fontWeight: '900' }}
                        labelStyle={{ display: 'none' }}
                      />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#FFD700' : '#008B8B'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             </GlassCard>
          </div>
        )}

        {activeTab === 'broadcast' && (
          <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
             <GlassCard className="border-luwa-gold/20 p-12">
                <div className="text-center mb-10">
                   <ICONS.Mic className="w-12 h-12 luwa-gold mx-auto mb-6" />
                   <h3 className="text-3xl font-black uppercase tracking-tighter text-white">Command Broadcast</h3>
                   <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Publish Sovereign Directives to all Scholars</p>
                </div>
                <form onSubmit={handleBroadcast} className="space-y-8">
                   <textarea 
                     value={directiveInput}
                     onChange={(e) => setDirectiveInput(e.target.value)}
                     placeholder="Enter official institutional command..."
                     className="w-full bg-black/40 border border-white/10 rounded-2xl p-8 text-sm font-bold focus:border-luwa-gold outline-none transition-all min-h-[150px] text-white"
                   />
                   <button type="submit" className="w-full bg-luwa-gold text-black font-black py-6 rounded-2xl text-xs uppercase tracking-[0.4em] shadow-xl shadow-luwa-gold/10 hover:brightness-110 active:scale-[0.98] transition-all">
                     AUTHORIZE BROADCAST
                   </button>
                </form>
             </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
};
