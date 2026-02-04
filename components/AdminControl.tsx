
/*
  Luwa Academy – AI-Powered Educational Platform
  Developed by Shewit – 2026
  Module: Administrative Mission Control
  Purpose: Role-based oversight, management, and institutional Exam Hub.
*/

import React, { useState, useEffect, useMemo } from 'react';
import { GlassCard } from './GlassCard.tsx';
import { storageService } from '../services/storageService.ts';
import { User, AccessToken, GlobalDirective, Exam, ExamSubmission, AuditEntry } from '../types.ts';
import { geminiService } from '../services/geminiService.ts';
import { ICONS } from '../constants.tsx';

interface AdminControlProps {
  onSimulate: (user: User) => void;
}

type AdminTab = 'User Management' | 'Exam Control' | 'Broadcast Messages' | 'Observability Logs';

interface ConfirmationState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  confirmText: string;
  isDestructive?: boolean;
}

export const AdminControl: React.FC<AdminControlProps> = ({ onSimulate }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [tokens, setTokens] = useState<AccessToken[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [activeTab, setActiveTab] = useState<AdminTab>('User Management');
  const [copied, setCopied] = useState(false);
  
  const [confirm, setConfirm] = useState<ConfirmationState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm'
  });

  const [rawText, setRawText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [tempExam, setTempExam] = useState<Partial<Exam> | null>(null);
  const [startTime, setStartTime] = useState('');
  const [newToken, setNewToken] = useState<string | null>(null);
  const [directiveInput, setDirectiveInput] = useState('');

  // Pagination for logs
  const [logPage, setLogPage] = useState(0);
  const logsPerPage = 10;

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setUsers(storageService.getAllUsers());
    setTokens(storageService.getTokens().sort((a, b) => b.createdAt - a.createdAt));
    setExams(storageService.getExams());
    setSubmissions(storageService.getSubmissions());
    setLogs(storageService.getAuditLogs().sort((a, b) => b.timestamp - a.timestamp));
  };

  const closeConfirm = () => setConfirm(p => ({ ...p, isOpen: false }));
  const triggerConfirm = (params: Omit<ConfirmationState, 'isOpen'>) => setConfirm({ ...params, isOpen: true });

  const handleAIParse = async () => {
    if (!rawText.trim()) return;
    setParsing(true);
    try {
      const parsed = await geminiService.parseExamRawText(rawText);
      setTempExam(parsed);
    } catch (e) {
      alert("AI Neural Parse failed.");
    } finally {
      setParsing(false);
    }
  };

  const finalizeExam = () => {
    if (!tempExam || !startTime) return;
    triggerConfirm({
      title: "Confirm Deployment",
      message: `Authorize deployment of "${tempExam.title}" to the institutional registry?`,
      confirmText: "Authorize",
      onConfirm: () => {
        const newExam: Exam = {
          ...tempExam as Exam,
          id: Math.random().toString(36).substr(2, 9),
          startTime: new Date(startTime).getTime(),
          status: 'Scheduled',
          isApproved: false,
          totalMarks: tempExam.questions?.reduce((acc, q) => acc + (q.marks || 0), 0) || 0
        };
        storageService.saveExam(newExam);
        refreshData();
        setTempExam(null);
        setRawText('');
        closeConfirm();
      }
    });
  };

  const handleApproveSubmission = (sub: ExamSubmission) => {
    triggerConfirm({
      title: "Release Grades",
      message: `Authorize grade release for "${sub.userName}"? This will also update their scholar XP.`,
      confirmText: "Release",
      onConfirm: () => {
        const updatedSub = { ...sub, status: 'Approved' as const };
        storageService.saveSubmission(updatedSub);
        const user = users.find(u => u.id === sub.userId);
        if (user) {
          storageService.saveUser({ ...user, xp: user.xp + (sub.score * 5) });
        }
        refreshData();
        closeConfirm();
      }
    });
  };

  const handleGenerateToken = () => {
    triggerConfirm({
      title: "Generate Key",
      message: "Confirm generation of new admission access key for the institutional registry.",
      confirmText: "Generate",
      onConfirm: () => {
        const code = storageService.generateToken();
        setNewToken(code);
        setCopied(false);
        refreshData();
        closeConfirm();
      }
    });
  };

  const handleCopyToken = () => {
    if (newToken) {
      navigator.clipboard.writeText(newToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBroadcast = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!directiveInput.trim()) return;
    triggerConfirm({
      title: "Execute Broadcast",
      message: "Instantly transmit this directive to all active scholar terminals?",
      confirmText: "Transmit",
      onConfirm: () => {
        storageService.saveDirective({ 
          id: Math.random().toString(36).substr(2, 9), 
          content: directiveInput, 
          timestamp: Date.now(), 
          author: 'Registry Admin' 
        });
        setDirectiveInput('');
        refreshData();
        closeConfirm();
      }
    });
  };

  const toggleDeactivate = (userId: string, isDeactivating: boolean) => {
    triggerConfirm({
      title: isDeactivating ? "Terminate Access?" : "Restore Access?",
      message: isDeactivating ? "Strictly disconnect this node from the registry?" : "Restore node to active registry status?",
      confirmText: isDeactivating ? "Terminate" : "Restore",
      isDestructive: isDeactivating,
      onConfirm: () => {
        const target = users.find(u => u.id === userId);
        if (target) {
          storageService.saveUser({ ...target, deactivated: !target.deactivated });
          refreshData();
        }
        closeConfirm();
      }
    });
  };

  const renderModal = () => confirm.isOpen && (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-900/60 animate-fade-in">
      <div className="max-w-md w-full p-12 bg-white rounded-3xl border border-luwa-border shadow-2xl">
        <h3 className="text-2xl font-serif font-bold text-luwa-purple mb-6">{confirm.title}</h3>
        <p className="text-slate-500 text-sm mb-12 leading-relaxed">{confirm.message}</p>
        <div className="flex flex-col gap-4">
          <button onClick={confirm.onConfirm} className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-widest ${confirm.isDestructive ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-luwa-purple text-white shadow-luwa-purple/20 shadow-lg'}`}>{confirm.confirmText}</button>
          <button onClick={closeConfirm} className="w-full bg-slate-100 text-slate-500 py-4 rounded-xl font-bold text-xs uppercase tracking-widest">Abort</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col gap-10 animate-fade-in overflow-hidden relative p-4">
      {renderModal()}
      
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 shrink-0 border-b border-luwa-border pb-8">
        <div>
          <h2 className="text-4xl font-serif font-bold text-luwa-purple">Mission Control</h2>
          <div className="flex items-center gap-4 mt-3">
             <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em]">Sovereign Node: PROD-ALPHA-01</span>
             <div className="w-2 h-2 bg-luwa-teal rounded-full animate-pulse shadow-[0_0_8px_#268E91]" />
          </div>
        </div>
        
        <nav className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-x-auto custom-scrollbar-hide">
          {(['User Management', 'Exam Control', 'Broadcast Messages', 'Observability Logs'] as AdminTab[]).map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === t ? 'bg-white text-luwa-purple shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-12 pb-20">
        {activeTab === 'User Management' && (
          <div className="space-y-10 animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <GlassCard className="border-luwa-purple/10 flex flex-col justify-between">
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-luwa-purple mb-3">Token Synthesis</h3>
                    <p className="text-[11px] text-slate-500 font-bold uppercase mb-8 leading-loose">Generate unique admission codes for scholarship recipients.</p>
                  </div>
                  <div className="space-y-6">
                    <button onClick={handleGenerateToken} className="w-full bg-luwa-purple text-white font-bold py-5 rounded-xl text-[10px] uppercase tracking-widest shadow-xl shadow-luwa-purple/10 transition-all">Generate Access Key</button>
                    {newToken && (
                      <div className="p-8 bg-slate-50 border border-luwa-purple/20 rounded-2xl text-center relative animate-fade-in group cursor-pointer overflow-hidden" onClick={handleCopyToken}>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ICONS.Copy className={`w-4 h-4 ${copied ? 'text-luwa-teal' : 'text-slate-400'}`} />
                        </div>
                        <p className="text-2xl font-serif font-black text-luwa-purple tracking-widest">{newToken}</p>
                        {copied && <p className="text-[8px] font-black uppercase text-luwa-teal absolute bottom-2 left-0 right-0 animate-bounce">Key Copied</p>}
                      </div>
                    )}
                  </div>
                </GlassCard>

                <GlassCard className="border-slate-100 flex flex-col lg:col-span-2">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Token Registry</h3>
                    <span className="text-[9px] text-slate-300 uppercase font-black">{tokens.length} Total Keys</span>
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-48 custom-scrollbar space-y-2">
                    {tokens.map(tk => (
                      <div key={tk.code} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <span className="font-mono text-xs font-bold text-luwa-purple">{tk.code}</span>
                        <div className="flex items-center gap-3">
                          {tk.isUsed ? (
                            <span className="text-[8px] font-black text-slate-300 uppercase">Used By: {tk.usedBy || 'Unknown'}</span>
                          ) : (
                            <span className="text-[8px] font-black text-luwa-teal uppercase">Available</span>
                          )}
                          <div className={`w-1.5 h-1.5 rounded-full ${tk.isUsed ? 'bg-slate-300' : 'bg-luwa-teal'}`} />
                        </div>
                      </div>
                    ))}
                    {tokens.length === 0 && <p className="text-[10px] text-slate-300 text-center py-10 uppercase italic">No tokens in registry.</p>}
                  </div>
                </GlassCard>
             </div>

             <section>
                <div className="flex justify-between items-end mb-8 border-l-4 border-luwa-purple pl-8">
                   <h3 className="text-[14px] font-black uppercase tracking-[0.4em] text-luwa-purple">Active Registry Control</h3>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{users.filter(u => u.role === 'scholar').length} Scholar records indexed</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {users.filter(u => u.role === 'scholar').map(u => (
                    <GlassCard key={u.id} className={`p-8 border-2 transition-all duration-500 ${u.deactivated ? 'opacity-40 grayscale border-red-50 border-dashed bg-slate-50' : 'border-slate-50 hover:border-luwa-purple/20'}`}>
                      <div className="mb-10">
                        <div className="flex justify-between items-start mb-6">
                           <div className={`w-3 h-3 rounded-full ${u.deactivated ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-luwa-teal shadow-[0_0_8px_#268E91] animate-pulse'}`} />
                           <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">ID: {u.id}</span>
                        </div>
                        <p className="text-2xl font-serif font-bold text-luwa-purple mb-1 truncate">{u.name}</p>
                        <p className="text-[10px] text-luwa-teal uppercase font-black tracking-widest mb-6">{u.stream}</p>
                        
                        <div className="grid grid-cols-2 gap-4">
                           <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                              <p className="text-[8px] text-slate-400 font-black uppercase mb-1">XP Power</p>
                              <p className="text-sm font-bold text-luwa-purple">{u.xp.toLocaleString()}</p>
                           </div>
                           <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                              <p className="text-[8px] text-slate-400 font-black uppercase mb-1">Readiness</p>
                              <p className="text-sm font-bold text-luwa-purple">{u.readiness}%</p>
                           </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-4">
                        <button onClick={() => onSimulate(u)} className="flex-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest py-3 rounded-xl transition-all hover:bg-slate-200">Simulate</button>
                        <button onClick={() => toggleDeactivate(u.id, !u.deactivated)} className={`flex-1 text-[10px] font-bold uppercase tracking-widest py-3 rounded-xl transition-all ${u.deactivated ? 'bg-luwa-teal text-white' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}>{u.deactivated ? 'Restore' : 'Terminate'}</button>
                      </div>
                    </GlassCard>
                  ))}
                </div>
             </section>
          </div>
        )}

        {activeTab === 'Exam Control' && (
           <div className="space-y-12 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                 <div className="lg:col-span-7">
                    <GlassCard className="border-luwa-purple/10 p-10 bg-slate-50/50">
                       <h3 className="text-[18px] font-serif font-bold text-luwa-purple mb-8 flex items-center gap-3">
                          <ICONS.Brain className="w-5 h-5 text-luwa-teal" />
                          AI Exam Orchestrator
                       </h3>
                       <textarea 
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        placeholder="Paste raw curriculum content (e.g., from a PDF or textbook) for AI structural synthesis..."
                        className="w-full bg-white border border-slate-200 rounded-3xl p-8 text-sm font-medium min-h-[400px] mb-8 focus:border-luwa-teal outline-none transition-all shadow-inner"
                      />
                      <div className="flex gap-6">
                        <button onClick={handleAIParse} disabled={parsing || !rawText.trim()} className={`flex-1 py-6 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all ${parsing ? 'bg-slate-200 text-slate-400 animate-pulse' : 'bg-luwa-purple text-white shadow-xl shadow-luwa-purple/10 active:scale-95'}`}>
                          {parsing ? 'Synthesizing Neural Map...' : 'Execute AI Parser'}
                        </button>
                      </div>

                      {tempExam && (
                        <div className="mt-12 pt-12 border-t border-slate-200 animate-fade-in space-y-8">
                           <div className="p-6 bg-white border border-slate-100 rounded-2xl">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-luwa-teal mb-3">Preview Synthesized Schema</h4>
                              <p className="text-xl font-serif font-bold text-luwa-purple">{tempExam.title}</p>
                              <p className="text-xs text-slate-400 mt-2">{tempExam.questions?.length} Questions • {tempExam.subject}</p>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Registry Sync Schedule</label>
                                <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:border-luwa-teal outline-none" />
                             </div>
                             <div className="flex items-end">
                                <button onClick={finalizeExam} className="w-full bg-luwa-teal text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-luwa-teal/10 active:scale-95">Authorize Deployment</button>
                             </div>
                           </div>
                        </div>
                      )}
                    </GlassCard>
                 </div>
                 
                 <div className="lg:col-span-5 flex flex-col gap-8">
                    <GlassCard className="border-slate-100 p-10 flex flex-col max-h-[400px]">
                       <h3 className="text-[18px] font-serif font-bold text-luwa-purple mb-8 border-b border-slate-50 pb-6 flex items-center justify-between">
                         Approval Pipeline
                         <span className="text-[10px] text-slate-400 font-black tracking-widest">{submissions.filter(s => s.status === 'Pending').length} Pending</span>
                       </h3>
                       <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                         {submissions.filter(s => s.status === 'Pending').map(sub => (
                           <div key={sub.id} className="p-6 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center group transition-all">
                               <div className="flex-1 min-w-0 pr-4">
                                 <p className="text-lg font-serif font-bold text-luwa-purple truncate">{sub.userName}</p>
                                 <p className="text-2xl font-black text-luwa-teal mt-1">{sub.score} <span className="text-[10px] text-slate-400 uppercase font-black">Pts</span></p>
                               </div>
                               <button onClick={() => handleApproveSubmission(sub)} className="bg-luwa-purple text-white px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg active:scale-95">Release</button>
                           </div>
                         ))}
                         {submissions.filter(s => s.status === 'Pending').length === 0 && (
                            <div className="flex-1 flex items-center justify-center py-20 opacity-20 text-center">
                               <p className="text-[10px] font-black uppercase tracking-widest">Pipeline Clear</p>
                            </div>
                         )}
                       </div>
                    </GlassCard>

                    <GlassCard className="border-slate-100 p-10 flex-1">
                       <h3 className="text-[18px] font-serif font-bold text-luwa-purple mb-8 flex items-center justify-between">
                         Deployed Exams
                         <span className="text-[10px] text-slate-400 font-black tracking-widest">{exams.length} Total</span>
                       </h3>
                       <div className="space-y-4">
                         {exams.map(e => (
                           <div key={e.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center">
                              <div>
                                <p className="text-xs font-bold text-luwa-purple">{e.title}</p>
                                <p className="text-[8px] font-black uppercase text-slate-400 mt-1">{e.status} • {new Date(e.startTime).toLocaleDateString()}</p>
                              </div>
                              <span className={`px-2 py-1 rounded text-[7px] font-black uppercase ${e.status === 'Scheduled' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>{e.status}</span>
                           </div>
                         ))}
                         {exams.length === 0 && <p className="text-[10px] text-slate-300 text-center py-10 italic uppercase">No exams deployed.</p>}
                       </div>
                    </GlassCard>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'Broadcast Messages' && (
          <div className="max-w-4xl animate-fade-in">
             <GlassCard className="p-12 border-luwa-purple/5">
                <h3 className="text-[18px] font-serif font-bold text-luwa-purple mb-8 flex items-center gap-3">
                   <ICONS.Info className="w-5 h-5 text-luwa-teal" />
                   Institutional Directive Broadcast
                </h3>
                <form onSubmit={handleBroadcast} className="space-y-8">
                  <textarea 
                    value={directiveInput}
                    onChange={(e) => setDirectiveInput(e.target.value)}
                    placeholder="Enter institutional directive to be transmitted to all scholar terminals..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-8 text-sm font-medium min-h-[200px] focus:border-luwa-purple outline-none transition-all"
                  />
                  <button type="submit" className="w-full bg-luwa-purple text-white py-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-luwa-purple/20 active:scale-95 transition-all">
                    Execute Collective Broadcast
                  </button>
                </form>
             </GlassCard>
          </div>
        )}

        {activeTab === 'Observability Logs' && (
          <div className="animate-fade-in">
             <GlassCard className="border-slate-100 p-0 overflow-hidden">
                <div className="p-10 border-b border-slate-50 flex justify-between items-end">
                   <div>
                      <h3 className="text-[18px] font-serif font-bold text-luwa-purple">Observability Ledger</h3>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2">Historical Audit Trail</p>
                   </div>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => setLogPage(p => Math.max(0, p - 1))}
                        disabled={logPage === 0}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-400 hover:text-luwa-purple disabled:opacity-20"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M15 19l-7-7 7-7"/></svg>
                      </button>
                      <button 
                        onClick={() => setLogPage(p => p + 1)}
                        disabled={(logPage + 1) * logsPerPage >= logs.length}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-400 hover:text-luwa-purple disabled:opacity-20"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M9 5l7 7-7 7"/></svg>
                      </button>
                   </div>
                </div>

                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50/50">
                         <tr>
                            <th className="px-10 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Timestamp</th>
                            <th className="px-10 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Identity</th>
                            <th className="px-10 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Operation</th>
                            <th className="px-10 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Severity</th>
                         </tr>
                      </thead>
                      <tbody>
                         {logs.slice(logPage * logsPerPage, (logPage + 1) * logsPerPage).map(log => (
                           <tr key={log.id} className="hover:bg-slate-50/30 transition-colors border-b border-slate-50">
                              <td className="px-10 py-6 text-[10px] font-mono font-bold text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                              <td className="px-10 py-6">
                                 <p className="text-xs font-bold text-luwa-purple">{log.userName}</p>
                                 <p className="text-[8px] text-slate-300 font-black uppercase tracking-tighter">{log.userId}</p>
                              </td>
                              <td className="px-10 py-6">
                                 <p className="text-xs font-medium text-slate-600">{log.action}</p>
                                 <p className="text-[9px] text-slate-400 mt-1 italic">{log.detail}</p>
                              </td>
                              <td className="px-10 py-6">
                                 <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                   log.severity === 'critical' ? 'bg-red-50 text-red-500' :
                                   log.severity === 'warning' ? 'bg-amber-50 text-amber-500' :
                                   'bg-slate-100 text-slate-400'
                                 }`}>
                                    {log.severity}
                                 </span>
                              </td>
                           </tr>
                         ))}
                         {logs.length === 0 && (
                           <tr>
                              <td colSpan={4} className="py-20 text-center opacity-20 text-[12px] font-black uppercase tracking-widest">No entries found in ledger</td>
                           </tr>
                         )}
                      </tbody>
                   </table>
                </div>
             </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
};
