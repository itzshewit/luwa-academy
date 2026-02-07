
/*
  Luwa Academy – Institutional Mission Control
  V9.1 - Enhanced Admission & Token Registry Oversight (Delete & Copy Actions)
*/

import React, { useState, useEffect, useMemo } from 'react';
import { GlassCard } from './GlassCard.tsx';
import { storageService } from '../services/storageService.ts';
import { geminiService } from '../services/geminiService.ts';
import { User, AccessToken, Exam, StudyNote } from '../types.ts';
import { ICONS, APP_VERSION } from '../constants.tsx';

interface AdminControlProps {
  onSimulate: (user: User) => void;
}

type AdminTab = 'Dashboard' | 'Users' | 'Assessments' | 'Curriculum' | 'Tokens' | 'Settings';

export const AdminControl: React.FC<AdminControlProps> = ({ onSimulate }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('Dashboard');
  const [tokens, setTokens] = useState<AccessToken[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [existingExams, setExistingExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  // Exam Synthesis States
  const [rawExamText, setRawExamText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedExam, setParsedExam] = useState<Partial<Exam> | null>(null);
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('');

  useEffect(() => {
    syncRegistry();
  }, [activeTab]);

  const syncRegistry = async () => {
    setLoading(true);
    try {
      const [t, u, e, n] = await Promise.all([
        storageService.getTokens(),
        storageService.getAllUsers(),
        storageService.getExams(),
        storageService.getNotes()
      ]);
      setTokens(t.sort((a, b) => b.createdAt - a.createdAt));
      setUsers(u);
      setExistingExams(e);
      setNotes(n);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateToken = async () => {
    const code = await storageService.generateToken();
    await syncRegistry();
    alert(`Institutional Code Generated: ${code}`);
  };

  const handleDeleteToken = async (code: string) => {
    if (!confirm(`Revoke authorization for token [${code}]? This registry node will be purged.`)) return;
    await storageService.deleteToken(code);
    await syncRegistry();
  };

  const handleParseExam = async () => {
    if (!rawExamText.trim()) return;
    setIsParsing(true);
    try {
      const parsed = await geminiService.parseExamRawText(rawExamText);
      setParsedExam(parsed);
    } catch (err) {
      alert("Neural Synthesis Error: Parsing failure.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleDeployExam = async () => {
    if (!parsedExam || !examDate || !examTime) {
      alert("Configuration Error: Missing schedule or data.");
      return;
    }
    const startTime = new Date(`${examDate}T${examTime}`).getTime();
    const fullExam: Exam = {
      ...parsedExam as any,
      id: `exam_${Date.now()}`,
      startTime,
      status: 'Scheduled',
      isApproved: true,
      totalMarks: parsedExam.questions?.reduce((acc, q) => acc + (q.marks || 1), 0) || 100
    };
    await storageService.saveExam(fullExam);
    alert("Institutional Exam Deployed to Scholar Nodes.");
    setParsedExam(null);
    setRawExamText('');
    setActiveTab('Dashboard');
  };

  const tokenUsageStats = useMemo(() => {
    const total = tokens.length;
    const used = tokens.filter(t => t.isUsed).length;
    const ratio = total > 0 ? Math.round((used / total) * 100) : 0;
    return { total, used, ratio };
  }, [tokens]);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center p-20 animate-pulse">
       <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-luwa-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Syncing Registry Node...</p>
       </div>
    </div>
  );

  const navItems: { id: AdminTab; icon: any; label: string }[] = [
    { id: 'Dashboard', icon: ICONS.Home, label: 'Control Center' },
    { id: 'Users', icon: ICONS.Users, label: 'Scholar Registry' },
    { id: 'Assessments', icon: ICONS.Zap, label: 'Assessment Hub' },
    { id: 'Curriculum', icon: ICONS.Layout, label: 'Curriculum Master' },
    { id: 'Tokens', icon: ICONS.Shield, label: 'Admission Hub' },
    { id: 'Settings', icon: ICONS.Layout, label: 'Platform Config' }
  ];

  return (
    <div className="h-full flex flex-col xl:flex-row gap-8 animate-m3-fade">
      {/* Admin Sidebar Navigation */}
      <aside className="w-full xl:w-72 flex flex-col gap-2 bg-slate-50 p-4 rounded-m3-2xl border border-slate-100 shrink-0 overflow-y-auto">
        <div className="px-4 py-6 border-b border-slate-200 mb-4">
          <h3 className="text-lg font-serif font-black text-luwa-primary uppercase">Institutional Admin</h3>
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Registry Protocol v{APP_VERSION}</p>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-m3-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === item.id ? 'bg-white text-luwa-primary shadow-sm border border-slate-100' : 'text-slate-400 hover:bg-slate-100'}`}
            >
              <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-luwa-primary' : 'text-slate-300'}`} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Admin Viewport */}
      <main className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-24">
        {activeTab === 'Dashboard' && (
          <div className="space-y-10 animate-m3-fade">
            <header className="flex justify-between items-end">
               <div>
                  <h1 className="display-small font-serif font-black text-luwa-onSurface">Admin Dashboard</h1>
                  <p className="label-medium text-slate-400 font-black uppercase tracking-widest mt-1">Institutional Telemetry Active</p>
               </div>
               <button onClick={handleGenerateToken} className="px-6 py-3 bg-luwa-primary text-white rounded-xl label-small font-black uppercase tracking-widest shadow-m3-2 m3-ripple">+ New Admission Code</button>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Scholars', value: users.length, color: 'blue', icon: ICONS.Users },
                { label: 'Live Exams', value: existingExams.length, color: 'green', icon: ICONS.Zap },
                { label: 'Token Utilization', value: `${tokenUsageStats.ratio}%`, color: 'amber', icon: ICONS.Shield },
                { label: 'Registry Nodes', value: notes.length, color: 'purple', icon: ICONS.Layout },
              ].map((stat, i) => (
                <GlassCard key={i} className={`p-8 border-none bg-white shadow-m3-1`}>
                  <div className="flex justify-between items-start mb-4">
                     <p className={`text-[10px] font-black uppercase text-slate-400 tracking-widest`}>{stat.label}</p>
                     <stat.icon className={`w-5 h-5 text-luwa-primary opacity-20`} />
                  </div>
                  <p className={`text-4xl font-serif font-black text-luwa-onSurface`}>{stat.value}</p>
                </GlassCard>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                <GlassCard className="p-8 bg-white border-slate-100">
                  <h3 className="label-large font-black uppercase text-slate-400 mb-8 tracking-widest">Recent Node Synchronizations</h3>
                  <div className="space-y-4">
                    {users.slice(-4).reverse().map(u => (
                      <div key={u.id} className="flex justify-between items-center p-5 bg-slate-50 border border-slate-100 rounded-m3-xl">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-black text-luwa-primary shadow-sm">{u.fullName.charAt(0)}</div>
                          <div>
                            <p className="text-sm font-bold text-luwa-onSurface">{u.fullName}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{u.stream} • Grade {u.grade}</p>
                          </div>
                        </div>
                        <button onClick={() => onSimulate(u)} className="px-4 py-2 bg-luwa-primaryContainer text-luwa-primary rounded-lg text-[9px] font-black uppercase m3-ripple">Simulate</button>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>
              <div className="lg:col-span-4">
                <GlassCard className="p-8 bg-slate-900 text-white border-none h-full">
                   <h3 className="label-small font-black uppercase tracking-[0.3em] mb-6 opacity-60">System Log</h3>
                   <div className="space-y-4 text-[11px] font-medium opacity-80">
                      <p><span className="text-luwa-primary font-black">[SYNC]</span> Registry nodes verified.</p>
                      <p><span className="text-green-400 font-black">[SEC]</span> SSL Token encryption active.</p>
                      <p><span className="text-amber-400 font-black">[SYS]</span> Neural bandwidth optimal.</p>
                      <p><span className="text-blue-400 font-black">[AUTH]</span> {tokenUsageStats.used} scholars admitted.</p>
                   </div>
                </GlassCard>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Users' && (
          <div className="space-y-8 animate-m3-fade">
             <header className="flex justify-between items-center">
                <div>
                   <h2 className="display-small font-serif font-black uppercase">Scholar Registry</h2>
                   <p className="label-small text-slate-400 font-black uppercase tracking-widest mt-1">Global User Database</p>
                </div>
                <div className="flex gap-3">
                   <button onClick={handleGenerateToken} className="px-6 py-3 bg-luwa-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest m3-ripple shadow-m3-1">+ Code</button>
                   <button className="text-[10px] font-black uppercase tracking-widest px-6 py-3 border border-slate-200 rounded-xl hover:bg-slate-50">Export CSV</button>
                </div>
             </header>
             <GlassCard className="bg-white border-slate-100 overflow-hidden shadow-m3-2">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="px-8 py-5">Full Name</th>
                          <th className="px-8 py-5">Admission Source</th>
                          <th className="px-8 py-5 text-center">Progression</th>
                          <th className="px-8 py-5 text-right">Node Protocol</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {users.map(u => (
                          <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-5">
                                <div className="flex items-center gap-4">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">{u.fullName.charAt(0)}</div>
                                  <div>
                                      <p className="text-sm font-bold text-luwa-onSurface">{u.fullName}</p>
                                      <p className="text-[9px] text-slate-400 font-bold">{u.email}</p>
                                  </div>
                                </div>
                            </td>
                            <td className="px-8 py-5">
                               <div className="flex flex-col">
                                  <span className="text-xs font-medium text-slate-500">{u.stream === 'NATURAL_SCIENCE' ? 'Natural Science' : 'Social Science'}</span>
                                  <span className="text-[9px] font-bold text-luwa-primary uppercase">Code: {tokens.find(t => t.usedBy === u.id)?.code || 'Institutional (Admin)'}</span>
                               </div>
                            </td>
                            <td className="px-8 py-5 text-center">
                                <span className="px-3 py-1 bg-luwa-primaryContainer text-luwa-primary rounded-full text-[10px] font-black">{u.xp} XP</span>
                            </td>
                            <td className="px-8 py-5 text-right">
                                <button onClick={() => onSimulate(u)} className="text-[10px] font-black text-luwa-primary hover:text-luwa-onPrimaryContainer px-4 py-2 bg-slate-50 rounded-lg uppercase tracking-tighter transition-all">Simulate Node</button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
             </GlassCard>
          </div>
        )}

        {activeTab === 'Tokens' && (
          <div className="space-y-10 animate-m3-fade">
             <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-m3-2xl border border-slate-100 shadow-sm">
                <div>
                   <h2 className="display-small font-serif font-black text-luwa-primary uppercase">Admission Hub</h2>
                   <p className="label-small text-slate-400 font-black uppercase tracking-widest mt-1">Authorized Registry Activation Codes</p>
                </div>
                <button 
                  onClick={handleGenerateToken} 
                  className="w-full md:w-auto px-10 py-5 bg-luwa-primary text-white rounded-m3-xl label-large font-black uppercase tracking-widest shadow-m3-2 m3-ripple transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <ICONS.Zap className="w-5 h-5" /> Generate New Admission Code
                </button>
             </header>

             <div className="grid grid-cols-1 gap-4">
                <div className="hidden lg:grid lg:grid-cols-12 px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                   <div className="col-span-3">Registry Token</div>
                   <div className="col-span-2 text-center">Status</div>
                   <div className="col-span-3">Authorization Date</div>
                   <div className="col-span-2">Consumed By</div>
                   <div className="col-span-2 text-right">Actions</div>
                </div>

                {tokens.length === 0 && (
                   <div className="p-20 text-center bg-slate-50 rounded-m3-2xl border border-dashed border-slate-200">
                      <ICONS.Shield className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Admission Registry Empty</p>
                   </div>
                )}

                {tokens.map(t => {
                  const consumer = t.usedBy ? users.find(u => u.id === t.usedBy) : null;
                  return (
                    <GlassCard key={t.code} className="p-6 bg-white border-slate-100 group hover:border-luwa-primary/30 transition-all shadow-sm">
                       <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-6">
                          <div className="col-span-3">
                             <p className="text-2xl font-mono font-black text-luwa-onSurface tracking-tighter">{t.code}</p>
                          </div>
                          <div className="col-span-2 text-center">
                             <span className={`inline-flex px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${t.isUsed ? 'bg-slate-100 text-slate-400' : 'bg-green-50 text-green-600 animate-pulse'}`}>
                                {t.isUsed ? 'Consumed' : 'Ready'}
                             </span>
                          </div>
                          <div className="col-span-3">
                             <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">{new Date(t.createdAt).toLocaleString()}</p>
                          </div>
                          <div className="col-span-2">
                             {t.isUsed ? (
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-luwa-primaryContainer flex items-center justify-center text-[10px] font-black text-luwa-primary">{consumer?.fullName?.charAt(0) || 'U'}</div>
                                   <div className="min-w-0">
                                      <p className="text-xs font-black text-luwa-onSurface truncate">{consumer?.fullName || 'Unknown Scholar'}</p>
                                   </div>
                                </div>
                             ) : (
                                <span className="text-[10px] text-slate-300 font-black uppercase italic tracking-widest">Awaiting Admission...</span>
                             )}
                          </div>
                          <div className="col-span-2 text-right flex justify-end gap-2">
                             <button 
                               onClick={() => { navigator.clipboard.writeText(t.code); alert("Admission Code Copied to Clipboard"); }} 
                               className="p-3 bg-slate-50 text-slate-400 hover:text-luwa-primary hover:bg-luwa-primaryContainer rounded-full transition-all"
                               title="Copy Code"
                             >
                                <ICONS.Copy className="w-4 h-4" />
                             </button>
                             <button 
                               onClick={() => handleDeleteToken(t.code)} 
                               className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                               title="Revoke Token"
                             >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
                             </button>
                          </div>
                       </div>
                    </GlassCard>
                  );
                })}
             </div>
          </div>
        )}

        {activeTab === 'Assessments' && (
          <div className="space-y-10 animate-m3-fade">
             {!parsedExam ? (
               <div className="space-y-8">
                 <GlassCard className="p-10 bg-white border-slate-100 shadow-m3-2">
                    <h3 className="headline-small font-serif font-black text-luwa-primary uppercase mb-6">Neural Exam Synthesis</h3>
                    <div className="space-y-6">
                       <p className="label-small text-slate-400 font-black uppercase tracking-widest">Paste Raw Registry Content (AI Parser Active)</p>
                       <textarea
                         value={rawExamText}
                         onChange={(e) => setRawExamText(e.target.value)}
                         placeholder="1. What is 2+2? A) 3 B) 4 C) 5 D) 6"
                         className="w-full h-80 p-8 bg-slate-50 border-2 border-slate-100 rounded-m3-2xl text-sm font-medium focus:bg-white focus:border-luwa-primary transition-all outline-none resize-none shadow-inner"
                       />
                       <button
                         onClick={handleParseExam}
                         disabled={isParsing || !rawExamText.trim()}
                         className="w-full py-6 bg-luwa-primary text-white rounded-m3-xl label-large font-black uppercase tracking-[0.2em] shadow-m3-2 transition-all disabled:opacity-50"
                       >
                         {isParsing ? 'Neural Engine Analyzing Schema...' : 'Synchronize and Structure Assessment'}
                       </button>
                    </div>
                 </GlassCard>
               </div>
             ) : (
               <div className="space-y-10">
                  <GlassCard className="p-10 bg-luwa-primary text-white border-none shadow-m3-3">
                     <div className="flex justify-between items-start mb-10">
                        <div>
                           <h3 className="headline-medium font-serif font-black uppercase tracking-tight">{parsedExam.title || 'Institutional Node'}</h3>
                           <p className="label-small font-black opacity-70 uppercase tracking-widest">{parsedExam.subject} • {parsedExam.questions?.length} Questions • {parsedExam.durationMinutes}m</p>
                        </div>
                        <button onClick={() => setParsedExam(null)} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all"><ICONS.X className="w-5 h-5" /></button>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                        <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-m3-xl p-4 text-white placeholder-white/50 outline-none" />
                        <input type="time" value={examTime} onChange={(e) => setExamTime(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-m3-xl p-4 text-white placeholder-white/50 outline-none" />
                     </div>
                     <button onClick={handleDeployExam} className="w-full py-6 bg-white text-luwa-primary rounded-m3-xl label-large font-black uppercase tracking-[0.2em] shadow-m3-3 m3-ripple">Authorize and Deploy Node</button>
                  </GlassCard>
               </div>
             )}
          </div>
        )}

        {activeTab === 'Curriculum' && (
          <div className="space-y-6 animate-m3-fade">
             <h2 className="title-large font-serif font-black uppercase">Registry Mastery</h2>
             <div className="grid grid-cols-1 gap-4">
                {notes.map(n => (
                   <div key={n.id} className="p-6 bg-white border border-slate-100 rounded-m3-xl flex justify-between items-center group hover:shadow-m3-2 transition-all">
                      <div>
                         <p className="text-[9px] font-black text-luwa-primary uppercase mb-1">{n.subjectId} • Grade {n.gradeLevel}</p>
                         <p className="text-sm font-black text-luwa-onSurface">{n.topic.en}</p>
                      </div>
                      <ICONS.Layout className="w-5 h-5 text-slate-200" />
                   </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'Settings' && (
          <div className="space-y-10 animate-m3-fade max-w-2xl">
             <GlassCard className="p-10 bg-white border-slate-100 shadow-m3-2">
                <h3 className="label-large font-black uppercase text-slate-400 mb-10 tracking-widest">Registry Synchronization</h3>
                <div className="space-y-8">
                   <div className="flex justify-between items-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                         <p className="text-sm font-black text-luwa-onSurface uppercase">Neural Persistence Mode</p>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Automated Registry Backups Active</p>
                      </div>
                      <div className="w-12 h-6 bg-luwa-primary rounded-full relative"><div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full shadow-sm" /></div>
                   </div>
                   <div className="flex justify-between items-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                         <p className="text-sm font-black text-luwa-onSurface uppercase">AI Parsing Precision</p>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">High-Fidelity Curriculum Analysis</p>
                      </div>
                      <span className="text-xs font-black text-luwa-primary uppercase">Active</span>
                   </div>
                </div>
             </GlassCard>
          </div>
        )}
      </main>
    </div>
  );
};
