
/*
  Luwa Academy – Administrative Mission Control
  V6.4 Comprehensive Restoration & Registry Fix
*/

import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard.tsx';
import { storageService } from '../services/storageService.ts';
import { geminiService } from '../services/geminiService.ts';
import { User, AccessToken, Exam, StudyNote } from '../types.ts';
import { ICONS, APP_VERSION } from '../constants.tsx';

interface AdminControlProps {
  onSimulate: (user: User) => void;
}

type AdminTab = 'Overview' | 'Exams' | 'Content' | 'Users' | 'Registry' | 'Settings';

export const AdminControl: React.FC<AdminControlProps> = ({ onSimulate }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('Overview');
  const [tokens, setTokens] = useState<AccessToken[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [existingExams, setExistingExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Exam Creator States
  const [rawExamText, setRawExamText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedExam, setParsedExam] = useState<Partial<Exam> | null>(null);
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [t, u, e, n] = await Promise.all([
        storageService.getTokens(),
        storageService.getAllUsers(),
        storageService.getExams(),
        storageService.getNotes()
      ]);
      setTokens(t.sort((a,b) => b.createdAt - a.createdAt));
      setUsers(u);
      setExistingExams(e);
      setNotes(n);
      setLoading(false);
    };
    loadData();
  }, [activeTab]);

  const handleGenerateToken = async () => {
    const code = await storageService.generateToken();
    const updated = await storageService.getTokens();
    setTokens(updated.sort((a,b) => b.createdAt - a.createdAt));
    alert(`Institutional Token Generated: ${code}`);
  };

  const handleParseExam = async () => {
    if (!rawExamText.trim()) return;
    setIsParsing(true);
    try {
      const parsed = await geminiService.parseExamRawText(rawExamText);
      setParsedExam(parsed);
    } catch (err) {
      alert("AI Synthesis Engine Error during parsing.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleDeployExam = async () => {
    if (!parsedExam || !examDate || !examTime) {
      alert("Missing required fields: Parsed data and schedule.");
      return;
    }

    const startTime = new Date(`${examDate}T${examTime}`).getTime();
    const fullExam: Exam = {
      ...parsedExam as any,
      id: `exam_${Date.now()}`,
      startTime,
      status: 'Scheduled',
      isApproved: true,
      totalMarks: parsedExam.questions?.reduce((acc, q) => acc + q.marks, 0) || 100
    };

    try {
      await storageService.saveExam(fullExam);
      alert("Institutional Exam Node Deployed to Scholars.");
      setParsedExam(null);
      setRawExamText('');
      setActiveTab('Overview');
    } catch (err) {
      alert("Deployment Error: Database Write Failed.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Registry Token copied to secure clipboard.");
  };

  const selectTab = (t: AdminTab) => {
    setActiveTab(t);
    setShowMobileMenu(false);
  };

  if (loading) return <div className="p-20 text-center opacity-50">Syncing Institutional Registry...</div>;

  const tabConfigs = [
    { id: 'Overview', label: 'Overview', desc: 'System telemetry' },
    { id: 'Exams', label: 'Exam Control', desc: 'Manage assessments' },
    { id: 'Content', label: 'Content', desc: 'Curriculum management' },
    { id: 'Users', label: 'Users', desc: 'Scholar auditing' },
    { id: 'Registry', label: 'Registry Codes', desc: 'Token generation' },
    { id: 'Settings', label: 'Settings', desc: 'Configurations' }
  ];

  return (
    <div className="h-full flex flex-col gap-6 animate-m3-fade overflow-hidden">
      {showMobileMenu && (
        <div className="fixed inset-0 z-[1100] bg-white/98 backdrop-blur-2xl flex flex-col p-8 md:p-12 animate-m3-fade xl:hidden">
          <div className="flex justify-between items-center mb-12">
            <h3 className="headline-small font-serif font-black text-luwa-primary uppercase">Sector Control</h3>
            <button onClick={() => setShowMobileMenu(false)} className="p-4 bg-slate-50 rounded-full text-slate-400">
              <ICONS.X className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-4 overflow-y-auto">
            {tabConfigs.map(t => (
              <button 
                key={t.id} 
                onClick={() => selectTab(t.id as AdminTab)} 
                className={`w-full text-left p-6 rounded-m3-xl border transition-all flex items-center justify-between group ${activeTab === t.id ? 'bg-luwa-primary border-luwa-primary text-white' : 'bg-white border-slate-100'}`}
              >
                <div>
                  <p className="text-lg font-black uppercase tracking-widest">{t.label}</p>
                  <p className={`text-[9px] font-medium uppercase tracking-widest mt-1 opacity-60`}>{t.desc}</p>
                </div>
                <ICONS.Zap className={`w-5 h-5 ${activeTab === t.id ? 'text-white' : 'text-slate-200'}`} />
              </button>
            ))}
          </nav>
        </div>
      )}

      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 shrink-0 border-b border-slate-100 pb-6 relative">
        <div className="flex justify-between items-center w-full xl:w-auto">
          <div>
            <h2 className="headline-medium font-serif font-black text-luwa-primary uppercase tracking-tighter">Mission Control</h2>
            <p className="label-small text-slate-400 font-black uppercase tracking-[0.4em] mt-2">v{APP_VERSION} Secure Registry</p>
          </div>
          <button onClick={() => setShowMobileMenu(true)} className="xl:hidden p-4 bg-luwa-primary text-white rounded-m3-l shadow-sm">
            <ICONS.Menu className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="hidden xl:flex bg-slate-50 p-1 rounded-m3-xl border border-slate-100">
          {tabConfigs.map(t => (
            <button 
              key={t.id} 
              onClick={() => setActiveTab(t.id as AdminTab)} 
              className={`px-6 py-3 rounded-m3-l text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === t.id ? 'bg-white text-luwa-primary shadow-sm' : 'text-slate-400 hover:text-luwa-primary'}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar pb-24">
        {activeTab === 'Overview' && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <GlassCard className="p-8 bg-blue-50 border-none">
                <p className="label-small font-black uppercase text-blue-600 mb-2">Total Scholars</p>
                <p className="display-medium text-blue-800 font-black">{users.length}</p>
              </GlassCard>
              <GlassCard className="p-8 bg-purple-50 border-none">
                <p className="label-small font-black uppercase text-purple-600 mb-2">Active Tokens</p>
                <p className="display-medium text-purple-800 font-black">{tokens.filter(t => !t.isUsed).length}</p>
              </GlassCard>
              <GlassCard className="p-8 bg-green-50 border-none">
                <p className="label-small font-black uppercase text-green-600 mb-2">Live Exams</p>
                <p className="display-medium text-green-800 font-black">{existingExams.filter(e => e.status !== 'Closed').length}</p>
              </GlassCard>
              <GlassCard className="p-8 bg-amber-50 border-none">
                <p className="label-small font-black uppercase text-amber-600 mb-2">Study Nodes</p>
                <p className="display-medium text-amber-800 font-black">{notes.length}</p>
              </GlassCard>
            </div>
            
            <div className="p-10 bg-white border border-slate-100 rounded-m3-2xl shadow-sm">
               <h3 className="label-large font-black uppercase text-slate-400 mb-6">Recent Scholar Registrations</h3>
               <div className="space-y-4">
                  {users.slice(-5).reverse().map(u => (
                    <div key={u.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-m3-xl border border-slate-100">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-luwa-primary shadow-sm">{u.fullName.charAt(0)}</div>
                          <div>
                             <p className="text-sm font-bold text-luwa-onSurface">{u.fullName}</p>
                             <p className="text-[10px] text-slate-400 uppercase font-black">{u.stream} • Grade {u.grade}</p>
                          </div>
                       </div>
                       <button onClick={() => onSimulate(u)} className="px-4 py-2 bg-luwa-primary text-white rounded-m3-m text-[9px] font-black uppercase">Simulate Node</button>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'Exams' && (
          <div className="space-y-10 animate-m3-fade">
             {!parsedExam ? (
                <div className="space-y-8">
                  <GlassCard className="p-10 border-none bg-white">
                     <h3 className="headline-small font-serif font-black text-luwa-primary uppercase mb-6">Deploy New Examination Node</h3>
                     <div className="space-y-6">
                        <p className="label-small text-slate-400 font-black uppercase">Paste Raw Question Text (AI Parser Support)</p>
                        <textarea 
                          value={rawExamText}
                          onChange={(e) => setRawExamText(e.target.value)}
                          placeholder="Paste questions here. Example: 1. What is 2+2? A) 3 B) 4 C) 5 D) 6..."
                          className="w-full h-80 p-8 bg-slate-50 border-2 border-slate-100 rounded-m3-xl text-sm font-medium focus:bg-white focus:border-luwa-primary transition-all outline-none resize-none shadow-inner"
                        />
                        <button 
                          onClick={handleParseExam}
                          disabled={isParsing || !rawExamText.trim()}
                          className="w-full py-6 bg-luwa-primary text-white rounded-m3-xl label-large font-black uppercase tracking-[0.2em] shadow-m3-2 transition-all disabled:opacity-50"
                        >
                          {isParsing ? 'AI Engine Analyzing Schema...' : 'Synchronize and Structure'}
                        </button>
                     </div>
                  </GlassCard>
                  
                  <div className="space-y-6">
                    <h3 className="label-large text-slate-400 font-black uppercase tracking-widest">Existing Examination Nodes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {existingExams.map(e => (
                        <div key={e.id} className="p-6 bg-white border border-slate-100 rounded-m3-xl shadow-sm flex justify-between items-center">
                          <div>
                             <p className="text-sm font-black text-luwa-onSurface uppercase">{e.title}</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase">{e.subject} • {e.status}</p>
                          </div>
                          <span className="text-xs font-black text-luwa-primary">{e.questions.length} Qs</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
             ) : (
                <div className="space-y-10">
                   <GlassCard className="p-10 border-none bg-luwa-primary text-white shadow-m3-3">
                      <div className="flex justify-between items-start mb-10">
                         <div>
                            <h3 className="headline-medium font-serif font-black uppercase tracking-tight">{parsedExam.title || 'Untitled Exam'}</h3>
                            <p className="label-small font-black opacity-70 uppercase tracking-widest">{parsedExam.subject} • {parsedExam.questions?.length} Questions • {parsedExam.durationMinutes} Minutes</p>
                         </div>
                         <button onClick={() => setParsedExam(null)} className="text-[10px] font-black uppercase border border-white/20 px-6 py-2 rounded-m3-l hover:bg-white/10">Discard Node</button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                         <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase opacity-60">Session Start Date</label>
                            <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-m3-xl p-4 text-white outline-none focus:bg-white/20" />
                         </div>
                         <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase opacity-60">Session Start Time (24h)</label>
                            <input type="time" value={examTime} onChange={(e) => setExamTime(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-m3-xl p-4 text-white outline-none focus:bg-white/20" />
                         </div>
                      </div>

                      <button onClick={handleDeployExam} className="w-full py-6 bg-white text-luwa-primary rounded-m3-xl label-large font-black uppercase tracking-[0.2em] shadow-m3-3 m3-ripple">Authorize and Deploy</button>
                   </GlassCard>

                   <div className="space-y-6">
                      <h4 className="label-large text-slate-400 uppercase font-black tracking-widest">Question Registry Preview</h4>
                      <div className="grid grid-cols-1 gap-4">
                         {parsedExam.questions?.map((q: any, idx: number) => (
                            <div key={idx} className="p-8 bg-white border border-slate-100 rounded-m3-2xl shadow-sm">
                               <div className="flex justify-between mb-4">
                                  <span className="text-[9px] font-black uppercase text-luwa-primary bg-luwa-primaryContainer px-3 py-1 rounded-full">Sect: {q.section || 'General'}</span>
                                  <span className="text-[9px] font-black uppercase text-slate-400">{q.marks} Marks</span>
                               </div>
                               <p className="text-lg font-bold text-luwa-onSurface mb-6">{q.text}</p>
                               <div className="grid grid-cols-2 gap-2">
                                  {q.options?.map((opt: string, i: number) => (
                                    <div key={i} className={`text-[11px] p-2 rounded-m3-s border ${q.correctAnswer == String.fromCharCode(65+i) || q.correctAnswer == i ? 'bg-luwa-primaryContainer border-luwa-primary text-luwa-primary font-black' : 'bg-slate-50 border-slate-100'}`}>
                                      {String.fromCharCode(65+i)}) {opt}
                                    </div>
                                  ))}
                                </div>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
             )}
          </div>
        )}

        {activeTab === 'Content' && (
          <div className="space-y-6 animate-m3-fade">
            <h3 className="label-large text-slate-400 font-black uppercase tracking-widest">Master Curriculum Nodes</h3>
            <div className="grid grid-cols-1 gap-4">
              {notes.map(n => (
                <div key={n.id} className="p-6 bg-white border border-slate-100 rounded-m3-xl shadow-sm flex justify-between items-center">
                   <div>
                      <p className="text-[9px] font-black text-luwa-primary uppercase mb-1">{n.subjectId} • Grade {n.gradeLevel}</p>
                      <p className="text-sm font-bold text-luwa-onSurface">{n.topic.en}</p>
                   </div>
                   <ICONS.Copy className="w-4 h-4 text-slate-200" />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Users' && (
          <div className="space-y-6 animate-m3-fade">
            <h3 className="label-large text-slate-400 font-black uppercase tracking-widest">Scholar User Directory</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map(u => (
                <div key={u.id} className="p-6 bg-white border border-slate-100 rounded-m3-xl shadow-sm">
                   <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-luwa-primaryContainer text-luwa-primary rounded-xl flex items-center justify-center font-black text-lg">{u.fullName.charAt(0)}</div>
                      <div>
                         <p className="text-sm font-bold text-luwa-onSurface">{u.fullName}</p>
                         <p className="text-[10px] text-slate-400 uppercase font-black">{u.subscriptionTier} Tier</p>
                      </div>
                   </div>
                   <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                      <span className="text-[10px] font-black text-luwa-tertiary uppercase">{u.xp} XP</span>
                      <button onClick={() => onSimulate(u)} className="text-[8px] font-black uppercase text-luwa-primary tracking-widest hover:underline">Monitor Node</button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Registry' && (
          <div className="space-y-10 animate-m3-fade">
            <GlassCard className="p-10 border-none bg-white shadow-m3-2">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                  <div>
                    <h3 className="headline-small font-serif font-black text-luwa-primary uppercase">Institutional Token Registry</h3>
                    <p className="label-small text-slate-400 font-black uppercase tracking-widest mt-1">Enrollment Authorization Management</p>
                  </div>
                  <button 
                    onClick={handleGenerateToken} 
                    className="px-10 py-5 bg-luwa-primary text-white rounded-m3-xl label-large font-black uppercase tracking-[0.2em] shadow-m3-2 m3-ripple active:scale-95 transition-all"
                  >
                    Generate New Code
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {tokens.map(t => (
                    <div key={t.code} className="p-6 bg-slate-50 border border-slate-100 rounded-m3-2xl flex flex-col justify-between group hover:border-luwa-primary/30 transition-all">
                       <div className="flex justify-between items-start mb-6">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Access Token</p>
                            <p className="text-xl font-mono font-black text-luwa-onSurface tracking-tighter">{t.code}</p>
                          </div>
                          <button onClick={() => copyToClipboard(t.code)} className="p-3 bg-white text-slate-400 hover:text-luwa-primary rounded-full shadow-sm">
                            <ICONS.Copy className="w-4 h-4" />
                          </button>
                       </div>
                       <div className="flex justify-between items-center pt-6 border-t border-slate-200">
                          <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${t.isUsed ? 'bg-slate-200 text-slate-400' : 'bg-green-100 text-green-600'}`}>
                            {t.isUsed ? 'Consumed' : 'Valid Registry'}
                          </span>
                          <p className="text-[8px] text-slate-300 font-bold">{new Date(t.createdAt).toLocaleDateString()}</p>
                       </div>
                    </div>
                 ))}
                 {tokens.length === 0 && (
                   <div className="col-span-full py-20 text-center opacity-20">
                      <ICONS.Shield className="w-16 h-16 mx-auto mb-4" />
                      <p className="label-large uppercase font-black tracking-[0.4em]">No Authorized Codes Found</p>
                   </div>
                 )}
               </div>
            </GlassCard>
          </div>
        )}

        {activeTab === 'Settings' && (
          <div className="space-y-6 animate-m3-fade">
             <GlassCard className="p-10 border-none bg-white">
                <h3 className="label-large text-slate-400 font-black uppercase tracking-widest mb-10">Institutional Configuration</h3>
                <div className="space-y-6">
                   <div className="flex justify-between items-center p-6 bg-slate-50 rounded-m3-xl border border-slate-100">
                      <div>
                         <p className="text-sm font-black text-luwa-onSurface uppercase">Neural Persistence Mode</p>
                         <p className="text-[10px] text-slate-400 font-bold uppercase">Automated IndexDB Cloud Sync</p>
                      </div>
                      <div className="w-12 h-6 bg-luwa-primary rounded-full relative">
                         <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full" />
                      </div>
                   </div>
                </div>
             </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
};
