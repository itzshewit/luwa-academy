
/*
  Luwa Academy – AI-Powered Educational Platform
  Developed by Shewit – 2026
  Module: Administrative Mission Control
  Purpose: Role-based oversight, management, and institutional Exam Hub.
*/

import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { storageService } from '../services/storageService';
import { User, AccessToken, GlobalDirective, Exam, ExamSubmission } from '../types';
import { geminiService } from '../services/geminiService';
import { ICONS } from '../constants';

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
  const [activeTab, setActiveTab] = useState<AdminTab>('User Management');
  
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

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setUsers(storageService.getAllUsers());
    setTokens(storageService.getTokens());
    setExams(storageService.getExams());
    setSubmissions(storageService.getSubmissions());
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
          isApproved: false
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
      message: `Authorize grade release for "${sub.userName}"?`,
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
      message: "Confirm generation of new admission access key.",
      confirmText: "Generate",
      onConfirm: () => {
        const code = storageService.generateToken();
        setNewToken(code);
        setTokens(storageService.getTokens());
        closeConfirm();
      }
    });
  };

  const handleBroadcast = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!directiveInput.trim()) return;
    triggerConfirm({
      title: "Execute Broadcast",
      message: "Instantly transmit directive to all active terminals?",
      confirmText: "Transmit",
      onConfirm: () => {
        storageService.saveDirective({ id: Math.random().toString(36).substr(2, 9), content: directiveInput, timestamp: Date.now(), author: 'Registry Admin' });
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
        <p className="text-slate-500 text-sm mb-12">{confirm.message}</p>
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
        
        <nav className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          {(['User Management', 'Exam Control', 'Broadcast Messages', 'Observability Logs'] as AdminTab[]).map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white text-luwa-purple shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-12 pb-20">
        {activeTab === 'User Management' && (
          <div className="space-y-10 animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <GlassCard className="border-luwa-purple/10 flex flex-col justify-between">
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-luwa-purple mb-3">Registry Expansion</h3>
                    <p className="text-[11px] text-slate-500 font-bold uppercase mb-8 leading-loose">Authorize admissions via token synthesis.</p>
                  </div>
                  <div className="space-y-6">
                    <button onClick={handleGenerateToken} className="w-full bg-luwa-purple text-white font-bold py-5 rounded-xl text-[10px] uppercase tracking-widest shadow-xl shadow-luwa-purple/10 transition-all">Generate Access Key</button>
                    {newToken && (
                      <div className="p-8 bg-slate-50 border border-luwa-purple/20 rounded-2xl text-center relative animate-fade-in">
                        <p className="text-2xl font-serif font-black text-luwa-purple tracking-widest">{newToken}</p>
                      </div>
                    )}
                  </div>
                </GlassCard>

                <GlassCard className="border-slate-100 flex flex-col justify-between">
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Institutional Status</h3>
                    <p className="text-[11px] text-slate-500 font-bold uppercase mb-8">Mean engagement across cohort.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-8 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                        <p className="text-[9px] text-slate-400 uppercase mb-2 font-black tracking-widest">Active Nodes</p>
                        <p className="text-4xl font-serif font-black text-luwa-purple">{users.filter(u => u.role === 'scholar' && !u.deactivated).length}</p>
                     </div>
                     <div className="p-8 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                        <p className="text-[9px] text-slate-400 uppercase mb-2 font-black tracking-widest">Terminated</p>
                        <p className="text-4xl font-serif font-black text-red-500">{users.filter(u => u.deactivated).length}</p>
                     </div>
                  </div>
                </GlassCard>
             </div>

             <section>
                <div className="flex justify-between items-end mb-8 border-l-4 border-luwa-purple pl-8">
                   <h3 className="text-[14px] font-black uppercase tracking-[0.4em] text-luwa-purple">Registry Control</h3>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{users.filter(u => u.role === 'scholar').length} Scholar Records</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {users.filter(u => u.role === 'scholar').map(u => (
                    <GlassCard key={u.id} className={`p-8 border-2 transition-all duration-500 ${u.deactivated ? 'opacity-40 grayscale border-red-50 border-dashed bg-slate-50' : 'border-slate-50 hover:border-luwa-purple/20'}`}>
                      <div className="mb-10">
                        <div className="flex justify-between items-start mb-6">
                           <div className={`w-3 h-3 rounded-full ${u.deactivated ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-luwa-teal shadow-[0_0_8px_#268E91] animate-pulse'}`} />
                           <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">NODE: {u.id}</span>
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
                        <button onClick={() => onSimulate(u)} className="flex-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest py-3 rounded-xl transition-all">Simulate</button>
                        <button onClick={() => toggleDeactivate(u.id, !u.deactivated)} className={`flex-1 text-[10px] font-bold uppercase tracking-widest py-3 rounded-xl transition-all ${u.deactivated ? 'bg-luwa-teal text-white' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}>{u.deactivated ? 'Restore' : 'Terminate'}</button>
                      </div>
                    </GlassCard>
                  ))}
                </div>
             </section>
          </div>
        )}

        {/* ... Other tabs adapted similarly ... */}
        {activeTab === 'Exam Control' && (
           <div className="space-y-12 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                 <div className="lg:col-span-7">
                    <GlassCard className="border-luwa-purple/10 p-12 bg-slate-50/50">
                       <h3 className="text-[18px] font-serif font-bold text-luwa-purple mb-8">AI Orchestrator</h3>
                       <textarea 
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        placeholder="Paste raw curriculum content for AI structural synthesis..."
                        className="w-full bg-white border border-slate-200 rounded-[2rem] p-10 text-sm font-medium min-h-[400px] mb-10 focus:border-luwa-teal outline-none transition-all shadow-inner"
                      />
                      <div className="flex gap-6">
                        <button onClick={handleAIParse} disabled={parsing || !rawText.trim()} className={`flex-1 py-6 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all ${parsing ? 'bg-slate-200 text-slate-400 animate-pulse' : 'bg-luwa-purple text-white shadow-xl shadow-luwa-purple/10'}`}>
                          {parsing ? 'Synthesizing...' : 'Execute AI Parser'}
                        </button>
                      </div>

                      {tempExam && (
                        <div className="mt-16 pt-16 border-t border-slate-200 animate-fade-in space-y-10">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Registry Sync Schedule</label>
                                <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl px-8 py-5 text-sm focus:border-luwa-teal outline-none" />
                             </div>
                             <div className="flex items-end">
                                <button onClick={finalizeExam} className="w-full bg-luwa-teal text-white py-5 rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-luwa-teal/10">Authorize Deployment</button>
                             </div>
                           </div>
                        </div>
                      )}
                    </GlassCard>
                 </div>
                 <div className="lg:col-span-5">
                    <GlassCard className="border-slate-100 p-12 flex flex-col h-full min-h-[600px]">
                       <h3 className="text-[18px] font-serif font-bold text-luwa-purple mb-10 border-b border-slate-50 pb-8">Approval Pipeline</h3>
                       <div className="space-y-6 overflow-y-auto custom-scrollbar pr-6">
                         {submissions.filter(s => s.status === 'Pending').map(sub => (
                           <div key={sub.id} className="p-8 bg-slate-50 border border-slate-100 rounded-[2rem] group transition-all relative overflow-hidden">
                             <div className="flex justify-between items-center relative z-10">
                               <div className="flex-1 pr-10">
                                 <p className="text-xl font-serif font-bold text-luwa-purple truncate">{sub.userName}</p>
                                 <div className="mt-6 flex items-baseline gap-3">
                                   <p className="text-5xl font-black text-luwa-purple">{sub.score}</p>
                                   <p className="text-[11px] text-slate-400 font-black uppercase">Points</p>
                                 </div>
                               </div>
                               <button onClick={() => handleApproveSubmission(sub)} className="bg-luwa-purple text-white px-8 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg">Authorize</button>
                             </div>
                           </div>
                         ))}
                       </div>
                    </GlassCard>
                 </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};
