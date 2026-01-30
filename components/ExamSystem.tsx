
/*
  Luwa Academy – AI-Powered Educational Platform
  Developed by Shewit – 2026
  Module: Scholar Exam Hub
  Purpose: Scheduled exams, timed sessions, and SAT-style post-approval breakdowns.
*/

import React, { useState, useEffect, useMemo } from 'react';
import { GlassCard } from './GlassCard';
import { User, Exam, ExamSubmission } from '../types';
import { storageService } from '../services/storageService';
import { geminiService } from '../services/geminiService';
import { ICONS } from '../constants';

interface ExamSystemProps {
  user: User;
}

export const ExamSystem: React.FC<ExamSystemProps> = ({ user }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [activeSubmission, setActiveSubmission] = useState<Partial<ExamSubmission> | null>(null);
  const [view, setView] = useState<'portal' | 'taking'>('portal');
  
  // Exam Taking States
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);

  useEffect(() => {
    refreshPortal();
  }, []);

  const refreshPortal = () => {
    setExams(storageService.getExams());
    setSubmissions(storageService.getSubmissions().filter(s => s.userId === user.id));
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
    setActiveExam(exam);
    setActiveSubmission({
      examId: exam.id,
      userId: user.id,
      userName: user.name,
      answers: {},
      startTime: Date.now()
    });
    setTimeLeft(exam.durationMinutes * 60);
    setCurrentQuestionIdx(0);
    setView('taking');
  };

  const handleAnswerChange = (val: string | number) => {
    const q = activeExam!.questions[currentQuestionIdx];
    setActiveSubmission(prev => ({
      ...prev,
      answers: { ...prev?.answers, [q.id]: val }
    }));
  };

  const getHint = async () => {
    const q = activeExam!.questions[currentQuestionIdx];
    setHintLoading(true);
    try {
      const h = await geminiService.getExamHint(q.text, activeExam!.subject);
      setHint(h);
    } finally {
      setHintLoading(false);
    }
  };

  const handleSubmitExam = () => {
    const score = activeExam!.questions.reduce((acc, q) => {
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
      status: 'Pending'
    };

    storageService.saveSubmission(submission);
    alert("Exam Transmitted. Awaiting Institutional Approval.");
    setView('portal');
    setActiveExam(null);
    setActiveSubmission(null);
    refreshPortal();
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in overflow-hidden">
      <header className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Sovereign Exam Portal</h2>
          <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.4em] mt-1">Integrity Mode: Active • Identity Verified</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-20">
        {view === 'portal' && (
          <div className="space-y-12">
            {/* Live/Upcoming Exams */}
            <section>
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-luwa-gold mb-8">Scheduled Sessions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exams.filter(e => !submissions.some(s => s.examId === e.id)).map(exam => {
                  const isPast = Date.now() > (exam.startTime + exam.durationMinutes * 60000);
                  const isFuture = Date.now() < exam.startTime;
                  const isLive = !isPast && !isFuture;

                  return (
                    <GlassCard key={exam.id} className="border-white/5 flex flex-col justify-between group hover:border-luwa-gold/20 transition-all">
                      <div>
                        <div className="flex justify-between mb-4">
                          <span className="text-[9px] font-black uppercase text-luwa-gold bg-luwa-gold/10 px-3 py-1 rounded-full">{exam.subject}</span>
                          <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full ${isLive ? 'bg-green-500/20 text-green-500 animate-pulse' : 'bg-white/5 text-gray-500'}`}>
                            {isLive ? 'Live' : isPast ? 'Closed' : 'Upcoming'}
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-white mb-2 leading-tight">{exam.title}</h3>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{new Date(exam.startTime).toLocaleString()}</p>
                      </div>
                      <div className="mt-8">
                        <button 
                          onClick={() => isLive && startExam(exam)}
                          disabled={!isLive}
                          className={`w-full py-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${isLive ? 'bg-luwa-gold text-black shadow-lg shadow-luwa-gold/20' : 'bg-white/5 text-gray-700 cursor-not-allowed'}`}
                        >
                          {isLive ? 'Commence Session' : isFuture ? 'Awaiting Sync' : 'Registry Locked'}
                        </button>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            </section>

            {/* Past Results */}
            <section>
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-600 mb-8">Registry Record (Past Exams)</h3>
              <div className="space-y-4">
                {submissions.map(sub => {
                  const exam = exams.find(e => e.id === sub.examId);
                  return (
                    <div key={sub.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center group hover:bg-white/[0.04] transition-all">
                      <div>
                        <p className="text-[9px] text-luwa-gold font-black uppercase tracking-widest mb-1">{exam?.subject || 'N/A'}</p>
                        <h4 className="text-lg font-black text-white">{exam?.title || 'Unknown Exam'}</h4>
                      </div>
                      <div className="text-right">
                        <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${sub.status === 'Approved' ? 'text-green-500' : 'text-amber-500'}`}>{sub.status}</p>
                        <p className="text-3xl font-black text-white">
                          {sub.status === 'Approved' ? sub.score : '--'}
                          <span className="text-[10px] text-gray-700 font-black ml-1">/ {exam?.totalMarks || 100}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
                {submissions.length === 0 && (
                  <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                    <p className="text-[10px] text-gray-700 uppercase font-black tracking-widest">No examination history in current ledger.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {view === 'taking' && activeExam && (
          <div className="max-w-5xl mx-auto h-full flex flex-col gap-8 pb-10 pt-10">
            <header className="flex justify-between items-center bg-black/40 p-8 rounded-3xl border border-white/5">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-luwa-gold/10 rounded-2xl flex items-center justify-center border border-luwa-gold/20">
                  <ICONS.Zap className="w-8 h-8 luwa-gold" />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-white">{activeExam.title}</h3>
                   <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Section: {activeExam.questions[currentQuestionIdx].section}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Neural Clock</p>
                <p className={`text-4xl font-black ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </p>
              </div>
            </header>

            <div className="flex-1 flex flex-col gap-10 justify-center">
              <GlassCard className="p-16 border-white/10 bg-white/[0.01]">
                <h4 className="text-4xl font-black text-white mb-20 leading-tight text-center max-w-4xl mx-auto">
                  {activeExam.questions[currentQuestionIdx].text}
                </h4>
                
                {activeExam.questions[currentQuestionIdx].type === 'MCQ' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeExam.questions[currentQuestionIdx].options?.map((opt, i) => (
                      <button 
                        key={i} 
                        onClick={() => handleAnswerChange(i)}
                        className={`text-left p-8 rounded-2xl border transition-all flex items-center gap-6 ${activeSubmission?.answers?.[activeExam.questions[currentQuestionIdx].id] === i ? 'bg-luwa-gold text-black border-luwa-gold' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                      >
                         <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${activeSubmission?.answers?.[activeExam.questions[currentQuestionIdx].id] === i ? 'bg-black/10' : 'bg-white/5 border border-white/10'}`}>{String.fromCharCode(65+i)}</span>
                         <span className="font-bold text-lg">{opt}</span>
                      </button>
                    ))}
                  </div>
                )}

                {activeExam.questions[currentQuestionIdx].type === 'TF' && (
                  <div className="flex gap-8 justify-center">
                    {['True', 'False'].map(val => (
                      <button 
                        key={val}
                        onClick={() => handleAnswerChange(val)}
                        className={`px-20 py-10 rounded-3xl border text-xl font-black transition-all ${activeSubmission?.answers?.[activeExam.questions[currentQuestionIdx].id] === val ? 'bg-luwa-gold text-black border-luwa-gold' : 'bg-white/5 border-white/5'}`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                )}

                {activeExam.questions[currentQuestionIdx].type === 'Short' && (
                  <input 
                    type="text"
                    value={activeSubmission?.answers?.[activeExam.questions[currentQuestionIdx].id] || ''}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    placeholder="Enter short answer response..."
                    className="w-full bg-black/40 border border-white/10 rounded-3xl p-10 text-xl font-black focus:border-luwa-gold outline-none text-center"
                  />
                )}
              </GlassCard>

              {hint && (
                <div className="p-8 bg-luwa-gold/10 border border-luwa-gold/20 rounded-3xl animate-fade-in text-center">
                  <p className="text-[10px] font-black uppercase text-luwa-gold mb-2 tracking-widest">AI Proctor Scaffold</p>
                  <p className="text-gray-300 font-medium italic">{hint}</p>
                </div>
              )}
            </div>

            <footer className="flex justify-between items-center gap-10">
              <button 
                onClick={getHint}
                disabled={hintLoading}
                className="bg-white/5 text-luwa-gold border border-luwa-gold/20 px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-luwa-gold/10 transition-all"
              >
                {hintLoading ? 'QUERYING ENGINE...' : 'REQUEST CONCEPTUAL HINT'}
              </button>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => { setCurrentQuestionIdx(p => Math.max(0, p - 1)); setHint(null); }}
                  disabled={currentQuestionIdx === 0}
                  className="bg-white/5 text-gray-500 px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest disabled:opacity-20"
                >
                  Previous Node
                </button>
                {currentQuestionIdx < activeExam.questions.length - 1 ? (
                  <button 
                    onClick={() => { setCurrentQuestionIdx(p => p + 1); setHint(null); }}
                    className="bg-white/5 text-white px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all"
                  >
                    Next Node
                  </button>
                ) : (
                  <button 
                    onClick={handleSubmitExam}
                    className="bg-luwa-gold text-black px-16 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-luwa-gold/20"
                  >
                    Transmit Final Registry
                  </button>
                )}
              </div>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
};
