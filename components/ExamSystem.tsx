
/*
  Luwa Academy – AI-Powered Educational Platform
  Developed by Shewit – 2026
  Module: Scholar Exam Hub
  Refinement: V7.0 (Sovereign Adaptive Timing & Neural Feedback)
*/

import React, { useState, useEffect, useMemo } from 'react';
import { GlassCard } from './GlassCard.tsx';
import { User, Exam, ExamSubmission, ExamQuestion } from '../types.ts';
import { storageService } from '../services/storageService.ts';
import { geminiService } from '../services/geminiService.ts';
import { ICONS } from '../constants.tsx';

interface ExamSystemProps {
  user: User;
}

export const ExamSystem: React.FC<ExamSystemProps> = ({ user }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [activeSubmission, setActiveSubmission] = useState<Partial<ExamSubmission> | null>(null);
  const [shuffledQuestions, setShuffledQuestions] = useState<ExamQuestion[]>([]);
  const [view, setView] = useState<'portal' | 'taking' | 'feedback'>('portal');
  const [selectedSubmission, setSelectedSubmission] = useState<ExamSubmission | null>(null);
  
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);

  useEffect(() => {
    refreshPortal();
  }, []);

  const refreshPortal = async () => {
    const [fetchedExams, fetchedSubmissions] = await Promise.all([
      storageService.getExams(),
      storageService.getSubmissions()
    ]);
    setExams(fetchedExams);
    setSubmissions(fetchedSubmissions.filter(s => s.userId === user.id));
  };

  useEffect(() => {
    let timer: any;
    if (view === 'taking' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(p => p - 1), 1000);
    } else if (view === 'taking' && timeLeft === 0) {
      handleSubmitExam();
    }
    return () => clearInterval(timer);
  }, [view, timeLeft]);

  const startExam = (exam: Exam) => {
    // 1. Randomized Question Pooling
    const shuffled = storageService.shuffleQuestions(exam.questions);
    // If the exam specifies a subset size (e.g. pick 20 from a pool of 50), slice it.
    const pool = shuffled.slice(0, exam.subsetSize || shuffled.length);
    setShuffledQuestions(pool);

    // 2. Adaptive Timing Logic
    // Adjusts duration based on user's avgCompletionRatio (e.g. slower students get a small buffer)
    const adaptiveMinutes = storageService.calculateAdaptiveTime(user, exam.durationMinutes);
    
    setActiveExam(exam);
    setActiveSubmission({
      examId: exam.id,
      userId: user.id,
      userName: user.fullName || user.name,
      answers: {},
      startTime: Date.now()
    });
    setTimeLeft(adaptiveMinutes * 60);
    setCurrentQuestionIdx(0);
    setView('taking');
  };

  const handleAnswerChange = (val: any) => {
    const q = shuffledQuestions[currentQuestionIdx];
    setActiveSubmission(prev => ({
      ...prev,
      answers: { ...prev?.answers, [q.id]: val }
    }));
  };

  const getHint = async () => {
    const q = shuffledQuestions[currentQuestionIdx];
    setHintLoading(true);
    try {
      const h = await geminiService.getExamHint(q.text, activeExam!.subject);
      setHint(h);
    } finally {
      setHintLoading(false);
    }
  };

  const handleSubmitExam = async () => {
    const score = shuffledQuestions.reduce((acc, q) => {
      const ans = activeSubmission?.answers?.[q.id];
      return acc + (ans === q.correctAnswer ? q.marks : 0);
    }, 0);

    const submission: ExamSubmission = {
      ...activeSubmission as ExamSubmission,
      id: Math.random().toString(36).substr(2, 9),
      submitTime: Date.now(),
      score,
      sectionScores: {}, 
      isGraded: true,
      status: 'Pending',
      actualDurationMinutes: Math.floor((Date.now() - (activeSubmission?.startTime || Date.now())) / 60000)
    };

    await storageService.saveSubmission(submission);
    alert("Node Synchronization Successful. Exam Transmitted.");
    setView('portal');
    setActiveExam(null);
    setActiveSubmission(null);
    refreshPortal();
  };

  const viewFeedback = async (sub: ExamSubmission) => {
    const exam = exams.find(e => e.id === sub.examId);
    if (!exam) return;

    if (!sub.aiFeedback && sub.status === 'Approved') {
      // Synthesize neural audit if approved but roadmap is missing
      const feedback = await geminiService.generateExamFeedback(sub, exam);
      sub.aiFeedback = feedback;
      await storageService.saveSubmission(sub);
    }

    setSelectedSubmission(sub);
    setView('feedback');
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-m3-fade overflow-hidden">
      <header className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-luwa-onSurface">Sovereign Exam Portal</h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-1">SES V7.0 • Multi-Cluster Randomization Pool</p>
        </div>
        {view !== 'portal' && (
          <button onClick={() => setView('portal')} className="px-6 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black uppercase m3-ripple">Portal Home</button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-20">
        {view === 'portal' && (
          <div className="space-y-12">
            <section>
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-luwa-primary mb-8">Active Sessions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exams.filter(e => !submissions.some(s => s.examId === e.id)).map(exam => {
                  const isPast = Date.now() > (exam.startTime + exam.durationMinutes * 60000);
                  const isFuture = Date.now() < exam.startTime;
                  const isLive = !isPast && !isFuture;

                  return (
                    <GlassCard key={exam.id} className="p-8 border-slate-100 flex flex-col justify-between group hover:border-luwa-primary/20 transition-all">
                      <div>
                        <div className="flex justify-between mb-4">
                          <span className="text-[9px] font-black uppercase text-luwa-primary bg-luwa-primaryContainer px-3 py-1 rounded-full">{exam.subject}</span>
                          <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full ${isLive ? 'bg-green-100 text-green-600 animate-pulse' : 'bg-slate-50 text-slate-400'}`}>
                            {isLive ? 'Live' : isPast ? 'Closed' : 'Upcoming'}
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-luwa-onSurface mb-2 leading-tight">{exam.title}</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{new Date(exam.startTime).toLocaleString()}</p>
                      </div>
                      <div className="mt-8">
                        <button 
                          onClick={() => isLive && startExam(exam)}
                          disabled={!isLive}
                          className={`w-full py-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${isLive ? 'bg-luwa-primary text-white shadow-lg m3-ripple' : 'bg-slate-50 text-slate-300 cursor-not-allowed'}`}
                        >
                          {isLive ? 'Commence Session' : isFuture ? 'Awaiting Sync' : 'Registry Locked'}
                        </button>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            </section>

            <section>
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 mb-8">Registry Record (Historical Archives)</h3>
              <div className="space-y-4">
                {submissions.map(sub => {
                  const exam = exams.find(e => e.id === sub.examId);
                  return (
                    <div key={sub.id} className="p-6 bg-white border border-slate-100 rounded-2xl flex justify-between items-center group hover:bg-slate-50 transition-all">
                      <div>
                        <p className="text-[9px] text-luwa-primary font-black uppercase tracking-widest mb-1">{exam?.subject || 'N/A'}</p>
                        <h4 className="text-lg font-black text-luwa-onSurface">{exam?.title || 'Unknown Exam'}</h4>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${sub.status === 'Approved' ? 'text-green-600' : 'text-amber-600'}`}>{sub.status}</p>
                          <p className="text-3xl font-black text-luwa-onSurface">
                            {sub.status === 'Approved' ? sub.score : '--'}
                            <span className="text-[10px] text-slate-400 font-black ml-1">/ {exam?.totalMarks || 100}</span>
                          </p>
                        </div>
                        {sub.status === 'Approved' && (
                          <button onClick={() => viewFeedback(sub)} className="p-4 bg-luwa-primaryContainer text-luwa-primary rounded-xl hover:scale-110 transition-transform shadow-sm">
                            <ICONS.Brain className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {view === 'taking' && activeExam && (
          <div className="max-w-4xl mx-auto h-full flex flex-col gap-8 pb-10 pt-4 animate-m3-fade">
            <header className="flex justify-between items-center bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-luwa-primaryContainer rounded-2xl flex items-center justify-center border border-luwa-primary/10">
                  <ICONS.Zap className="w-8 h-8 text-luwa-primary" />
                </div>
                <div>
                   <h3 className="text-xl font-black text-luwa-onSurface uppercase tracking-tight">{activeExam.title}</h3>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Adaptive Timing Node Enabled</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Time Remaining</p>
                <p className={`text-3xl font-black tabular-nums ${timeLeft < 300 ? 'text-luwa-error animate-pulse' : 'text-luwa-primary'}`}>
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </p>
              </div>
            </header>

            <div className="flex-1 flex flex-col gap-8 justify-center">
              <GlassCard className="p-10 md:p-14 border-slate-50 bg-white shadow-m3-2" variant="elevated">
                <h4 className="text-2xl md:text-3xl font-serif font-black text-luwa-onSurface mb-12 leading-relaxed text-center max-w-2xl mx-auto">
                  {shuffledQuestions[currentQuestionIdx]?.text}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {shuffledQuestions[currentQuestionIdx]?.options?.map((opt, i) => {
                    const optionId = String.fromCharCode(65 + i);
                    const isSelected = activeSubmission?.answers?.[shuffledQuestions[currentQuestionIdx].id] === optionId;
                    
                    return (
                      <button 
                        key={i} 
                        onClick={() => handleAnswerChange(optionId)}
                        className={`text-left p-6 rounded-2xl border transition-all flex items-center gap-5 ${isSelected ? 'bg-luwa-primary text-white border-luwa-primary shadow-sm' : 'bg-slate-50 border-slate-100 hover:border-luwa-primary/30'}`}
                      >
                         <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${isSelected ? 'bg-white/10' : 'bg-white border border-slate-200 text-slate-400'}`}>{optionId}</span>
                         {/* Fix: Simplified rendering since ExamQuestion.options is string[]. Removed redundant typeof check that caused Property 'text' does not exist on type 'never' error. */}
                         <span className="font-bold text-sm">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </GlassCard>

              {hint && (
                <div className="p-6 bg-luwa-primaryContainer border border-luwa-primary/10 rounded-2xl animate-m3-fade text-center">
                  <p className="text-[10px] font-black uppercase text-luwa-primary mb-2 tracking-widest">Neural Scaffold Tip</p>
                  <p className="text-luwa-onPrimaryContainer font-medium italic text-sm">{hint}</p>
                </div>
              )}
            </div>

            <footer className="flex justify-between items-center gap-6">
              <button 
                onClick={getHint}
                disabled={hintLoading}
                className="bg-slate-50 text-luwa-primary border border-luwa-primary/10 px-8 py-4 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-white transition-all m3-ripple"
              >
                {hintLoading ? 'QUERYING ENGINE...' : 'CONCEPTUAL HINT'}
              </button>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => { setCurrentQuestionIdx(p => Math.max(0, p - 1)); setHint(null); }}
                  disabled={currentQuestionIdx === 0}
                  className="bg-slate-50 text-slate-300 px-8 py-4 rounded-xl font-black text-[9px] uppercase tracking-widest disabled:opacity-20"
                >
                  Prev
                </button>
                {currentQuestionIdx < shuffledQuestions.length - 1 ? (
                  <button 
                    onClick={() => { setCurrentQuestionIdx(p => p + 1); setHint(null); }}
                    className="bg-luwa-primary text-white px-8 py-4 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-sm m3-ripple"
                  >
                    Next Question
                  </button>
                ) : (
                  <button 
                    onClick={handleSubmitExam}
                    className="bg-luwa-secondary text-white px-12 py-4 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-m3-1 m3-ripple"
                  >
                    Final Transmit
                  </button>
                )}
              </div>
            </footer>
          </div>
        )}

        {view === 'feedback' && selectedSubmission && (
          <div className="max-w-4xl mx-auto space-y-8 py-10 animate-m3-fade">
             <header className="text-center">
                <h3 className="headline-medium font-serif font-black text-luwa-onSurface">Remediation Roadmap</h3>
                <p className="label-small text-slate-400 font-black uppercase tracking-[0.4em] mt-2">Personalized Performance Audit Node</p>
             </header>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="p-8 text-center bg-white border-slate-100">
                   <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Final Score</p>
                   <p className="text-5xl font-serif font-black text-luwa-primary">{selectedSubmission.score}</p>
                </GlassCard>
                <GlassCard className="p-8 text-center bg-white border-slate-100">
                   <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Pace (Min)</p>
                   <p className="text-5xl font-serif font-black text-luwa-onSurface">{selectedSubmission.actualDurationMinutes || '--'}</p>
                </GlassCard>
                <GlassCard className="p-8 text-center bg-white border-slate-100">
                   <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Accuracy</p>
                   <p className="text-5xl font-serif font-black text-luwa-secondary">{Math.round((selectedSubmission.score / (exams.find(e => e.id === selectedSubmission.examId)?.totalMarks || 1)) * 100)}%</p>
                </GlassCard>
             </div>

             <GlassCard className="p-10 border-none bg-luwa-primary text-white shadow-m3-2">
                <div className="flex items-center gap-4 mb-6">
                   <ICONS.Brain className="w-8 h-8 opacity-80" />
                   <h4 className="label-large font-black uppercase tracking-widest">Neural Performance Roadmap</h4>
                </div>
                <div className="prose prose-invert max-w-none text-sm leading-relaxed font-medium opacity-90">
                   {selectedSubmission.aiFeedback?.split('\n').map((p, i) => <p key={i} className="mb-4">{p}</p>)}
                   {!selectedSubmission.aiFeedback && <p className="animate-pulse">Synthesizing remediation data...</p>}
                </div>
             </GlassCard>

             <button onClick={() => setView('portal')} className="w-full py-5 bg-slate-50 border border-slate-100 rounded-2xl text-luwa-onSurface font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-sm">
                Return to Sovereign Portal
             </button>
          </div>
        )}
      </div>
    </div>
  );
};
