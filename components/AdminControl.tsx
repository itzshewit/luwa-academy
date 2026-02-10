
/*
  Luwa Academy – Institutional Mission Control
  V9.4 - Token Node Clipboard Sync & Persistence Fix
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
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

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
    handleCopyCode(code);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopyFeedback(code);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const handleDeleteToken = async (code: string) => {
    if (!confirm(`Institutional Authorization Revoke: Delete token [${code}]? This node will be purged from the registry.`)) return;
    await storageService.deleteToken(code);
    await syncRegistry();
  };

  const handleDeleteUser = async (u: User) => {
    if (u.role === 'admin') return alert("System Protocol Error: Root administrator nodes cannot be purged.");
    if (!confirm(`Institutional Registry Purge: Permanently remove scholar [${u.fullName}]? All XP, historical nodes, and assignments will be erased.`)) return;
    await storageService.deleteUser(u.id);
    await syncRegistry();
  };

  const handleParseExam = async () => {
    if (!rawExamText.trim()) return;
    setIsParsing(true);
    try {
      const parsed = await geminiService.parseExamRawText(rawExamText);
      setParsedExam(parsed);
    } catch (err) {
      alert("Neural Synthesis Error: Schema parsing failure.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleDeployExam = async () => {
    if (!parsedExam || !examDate || !examTime) {
      alert("Configuration Error: Missing schedule or payload.");
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
    alert("Institutional Exam Node Deployed.");
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
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Syncing Institutional Nodes...</p>
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
      <aside className="w-full xl:w-72 flex flex-col gap-2 bg-slate-50 p-4 rounded-m3-2xl border border-slate-100 shrink-0 overflow-y-auto">
        <div className="px-4 py-6 border-b border-slate-200 mb-4">
          <h3 className="text-lg font-serif font-black text-luwa-primary uppercase">Institutional Admin</h3>
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Protocol v{APP_VERSION}</p>
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

      <main className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-24">
        {activeTab === 'Dashboard' && (
          <div className="space-y-10 animate-m3-fade">
            <header className="flex justify-between items-end">
               <div>
                  <h1 className="display-small font-serif font-black text-luwa-onSurface">Admin Dashboard</h1>
                  <p className="label-medium text-slate-400 font-black uppercase tracking-widest mt-1">Registry Monitor Active</p>
               </div>
               <button onClick={handleGenerateToken} className="px-6 py-3 bg-luwa-primary text-white rounded-xl label-small font-black uppercase tracking-widest shadow-m3-2 m3-ripple">+ New Admission Node</button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Scholars', value: users.length, color: 'blue', icon: ICONS.Users },
                { label: 'Active Exams', value: existingExams.length, color: 'green', icon: ICONS.Zap },
                { label: 'Authorization Rate', value: `${tokenUsageStats.ratio}%`, color: 'amber', icon: ICONS.Shield },
                { label: 'Curriculum Nodes', value: notes.length, color: 'purple', icon: ICONS.Layout },
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
                    {users.slice(-5).reverse().map(u => (
                      <div key={u.id} className="flex justify-between items-center p-5 bg-slate-50 border border-slate-100 rounded-m3-xl">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-black text-luwa-primary shadow-sm">{u.fullName.charAt(0)}</div>
                          <div>
                            <p className="text-sm font-bold text-luwa-onSurface">{u.fullName}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{u.stream} • Grade {u.grade}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => onSimulate(u)} className="px-4 py-2 bg-luwa-primaryContainer text-luwa-primary rounded-lg text-[9px] font-black uppercase m3-ripple">Simulate</button>
                           {u.role !== 'admin' && (
                             <button onClick={() => handleDeleteUser(u)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
                             </button>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Tokens' && (
          <div className="space-y-10 animate-m3-fade">
             <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-m3-2xl border border-slate-100 shadow-sm">
                <div>
                   <h2 className="display-small font-serif font-black text-luwa-primary uppercase">Admission Hub</h2>
                   <p className="label-small text-slate-400 font-black uppercase tracking-widest mt-1">Institutional Handshake Registry</p>
                </div>
                <button 
                  onClick={handleGenerateToken} 
                  className="w-full md:w-auto px-10 py-5 bg-luwa-primary text-white rounded-m3-xl label-large font-black uppercase tracking-widest shadow-m3-2 m3-ripple transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <ICONS.Zap className="w-5 h-5" /> Generate & Copy New Token
                </button>
             </header>

             <div className="grid grid-cols-1 gap-4">
                {tokens.length === 0 && (
                   <div className="p-20 text-center bg-slate-50 rounded-m3-2xl border border-dashed border-slate-200">
                      <ICONS.Shield className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Admission registry node clear.</p>
                   </div>
                )}

                {tokens.map(t => {
                  const consumer = t.usedBy ? users.find(u => u.id === t.usedBy) : null;
                  const isCopied = copyFeedback === t.code;

                  return (
                    <GlassCard key={t.code} className="p-6 bg-white border-slate-100 group hover:border-luwa-primary/30 transition-all shadow-sm">
                       <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-6">
                          <div className="col-span-4">
                             <div className="flex items-center gap-3">
                                <p className="text-2xl font-mono font-black text-luwa-onSurface tracking-tighter select-all">{t.code}</p>
                                <button 
                                  onClick={() => handleCopyCode(t.code)}
                                  className={`p-2 rounded-lg transition-all ${isCopied ? 'bg-green-50 text-green-600' : 'text-slate-300 hover:text-luwa-primary'}`}
                                  title="Sync to Clipboard"
                                >
                                  {isCopied ? <span className="text-[8px] font-black uppercase">Copied!</span> : <ICONS.Copy className="w-4 h-4" />}
                                </button>
                             </div>
                          </div>
                          <div className="col-span-2 text-center">
                             <span className={`inline-flex px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${t.isUsed ? 'bg-slate-100 text-slate-400' : 'bg-green-50 text-green-600 animate-pulse'}`}>
                                {t.isUsed ? 'Consumed' : 'Ready'}
                             </span>
                          </div>
                          <div className="col-span-3">
                             <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">{new Date(t.createdAt).toLocaleString()}</p>
                          </div>
                          <div className="col-span-3 text-right flex justify-end gap-2">
                             {t.isUsed ? (
                                <div className="flex items-center gap-3 mr-4">
                                   <div className="w-8 h-8 rounded-full bg-luwa-primaryContainer flex items-center justify-center text-[10px] font-black text-luwa-primary">{consumer?.fullName?.charAt(0) || 'U'}</div>
                                   <p className="text-xs font-black text-luwa-onSurface truncate max-w-[100px]">{consumer?.fullName || 'User Record'}</p>
                                </div>
                             ) : null}
                             <button 
                               onClick={() => handleDeleteToken(t.code)} 
                               className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                               title="Purge Token Node"
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
      </main>
    </div>
  );
};
