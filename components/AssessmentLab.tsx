
/*
  Luwa Academy – Assessment Lab
  Stability Patch V5.2 (Uncaught Error Fix)
*/

import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from './GlassCard.tsx';
import { geminiService } from '../services/geminiService.ts';
import { Quiz, User } from '../types.ts';
import { ICONS } from '../constants.tsx';
import { storageService } from '../services/storageService.ts';

interface AssessmentLabProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onConsultTutor: (context: string) => void;
  targetNodeId?: string;
}

export const AssessmentLab: React.FC<AssessmentLabProps> = ({ user, onUpdateUser, onConsultTutor, targetNodeId }) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    subject: targetNodeId || storageService.getSubjects(user.stream)[0],
    difficulty: 3,
    count: 5,
    isTimed: true
  });
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (targetNodeId) setConfig(prev => ({ ...prev, subject: targetNodeId }));
  }, [targetNodeId]);

  useEffect(() => {
    if (quiz && quiz.questions && quiz.questions.length > 0 && !showResult && !showExplanation && config.isTimed) {
      setTimeLeft(60); 
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [currentIdx, quiz, showResult, showExplanation]);

  const handleAutoSubmit = () => {
    if (selectedIdx === null) {
      handleAnswer(99); 
    } else {
      handleAnswer(selectedIdx);
    }
  };

  const startQuiz = async () => {
    setLoading(true);
    try {
      const generated = await geminiService.generateQuiz(config.subject, user.stream, 'General Mastery', config.difficulty);
      if (!generated || !generated.questions || generated.questions.length === 0) {
        throw new Error("Neural Engine returned empty dataset.");
      }
      setQuiz(generated);
      setAnswers([]);
      setCurrentIdx(0);
      setShowResult(false);
      setShowExplanation(false);
    } catch (err: any) {
      alert("Neural sync error: " + (err.message || "Institutional connectivity issues. Please retry."));
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (idx: number) => {
    clearInterval(timerRef.current);
    setSelectedIdx(idx);
    setShowExplanation(true);
  };

  const proceedToNext = () => {
    const finalAnswers = [...answers, selectedIdx || 0];
    setAnswers(finalAnswers);
    setShowExplanation(false);
    setSelectedIdx(null);
    
    if (quiz && currentIdx < quiz.questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setShowResult(true);
      const score = finalAnswers.reduce((acc, a, i) => acc + (quiz && a === quiz.questions[i].correctIndex ? 1 : 0), 0);
      onUpdateUser({ ...user, xp: user.xp + (score * 10) });
    }
  };

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center animate-pulse py-20">
       <div className="w-12 h-12 border-4 border-slate-100 border-t-luwa-primary rounded-full animate-spin mb-10" />
       <p className="label-large text-luwa-primary font-black uppercase tracking-[0.4em]">Calibrating Node...</p>
    </div>
  );

  if (showResult && quiz) {
    const score = answers.reduce((acc, a, i) => acc + (a === quiz.questions[i].correctIndex ? 1 : 0), 0);
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 animate-m3-fade">
        <GlassCard className="p-12 text-center max-w-md w-full border-slate-100" variant="elevated">
          <ICONS.Trophy className="w-16 h-16 text-luwa-tertiary mx-auto mb-6" />
          <h2 className="headline-medium font-serif font-black text-luwa-onSurface mb-2">Diagnostic Complete</h2>
          <p className="label-small text-slate-400 font-black uppercase mb-8">Subject: {config.subject}</p>
          <div className="text-6xl font-serif font-black text-luwa-primary mb-10">{score} / {quiz.questions.length}</div>
          <button onClick={() => setQuiz(null)} className="w-full py-5 bg-luwa-primary text-white rounded-m3-xl font-black text-xs uppercase tracking-widest shadow-m3-2 m3-ripple">Return to Lab</button>
        </GlassCard>
      </div>
    );
  }

  if (quiz && quiz.questions && quiz.questions[currentIdx]) {
    const q = quiz.questions[currentIdx];
    const timerColor = timeLeft <= 10 ? 'text-luwa-error' : timeLeft <= 30 ? 'text-luwa-tertiary' : 'text-luwa-primary';

    return (
      <div className="h-full flex flex-col max-w-4xl mx-auto w-full py-10 gap-8 animate-m3-fade">
        <div className="flex justify-between items-center px-4">
          <span className="label-small font-black text-slate-400 uppercase tracking-widest">Question {currentIdx + 1} of {quiz.questions.length}</span>
          {config.isTimed && (
            <div className={`text-2xl font-black tabular-nums transition-colors duration-300 ${timerColor}`}>
              00:{timeLeft.toString().padStart(2, '0')}
            </div>
          )}
        </div>

        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-luwa-primary transition-all duration-500" style={{ width: `${((currentIdx + 1)/quiz.questions.length)*100}%` }} />
        </div>

        <GlassCard className="p-10 md:p-14 min-h-[300px] flex flex-col justify-center border-slate-50 bg-white" variant="elevated">
          <h3 className="headline-medium font-serif font-black text-luwa-onSurface text-center leading-tight">
            {q.question}
          </h3>
        </GlassCard>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {q.options.map((opt, i) => (
            <button 
              key={i} 
              disabled={showExplanation}
              onClick={() => handleAnswer(i)}
              className={`text-left p-6 rounded-m3-xl border transition-all flex items-center gap-5 
                ${selectedIdx === i ? 'bg-luwa-primaryContainer border-luwa-primary' : 'bg-white border-slate-100 hover:border-luwa-primary/20'}
                ${showExplanation && i === q.correctIndex ? 'border-luwa-secondary bg-luwa-secondaryContainer' : ''}
                ${showExplanation && selectedIdx === i && i !== q.correctIndex ? 'border-luwa-error' : ''}`}
            >
              <span className="w-10 h-10 rounded-m3-m bg-slate-50 flex items-center justify-center text-xs font-black text-slate-400">{String.fromCharCode(65+i)}</span>
              <span className="font-bold text-sm text-luwa-onSurface">{opt}</span>
            </button>
          ))}
        </div>

        {showExplanation && (
          <div className="p-8 bg-slate-50 border border-slate-100 rounded-m3-2xl animate-m3-fade">
            <p className="text-[10px] font-black uppercase text-luwa-primary mb-2 tracking-widest">Neural Explanation</p>
            <p className="text-sm leading-relaxed text-luwa-onSurfaceVariant font-medium">{q.explanation}</p>
            <div className="mt-8 flex justify-end">
              <button onClick={proceedToNext} className="px-12 py-4 bg-luwa-primary text-white rounded-m3-xl label-small font-black uppercase tracking-widest shadow-m3-1 m3-ripple">
                {currentIdx < quiz.questions.length - 1 ? 'Next Node' : 'View Ledger'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-8 animate-m3-fade overflow-y-auto pb-20 pt-6 custom-scrollbar pr-2">
      <header>
        <h2 className="headline-medium font-serif font-black text-luwa-onSurface">Assessment Lab</h2>
        <p className="label-small text-slate-400 uppercase font-black tracking-widest mt-1">Configure Diagnostic Sync</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 p-10 bg-white border border-slate-100 rounded-m3-2xl shadow-sm space-y-10">
          <div className="space-y-6">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Select Academic Subject</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {storageService.getSubjects(user.stream).map(s => (
                <button 
                  key={s} 
                  onClick={() => setConfig({...config, subject: s})}
                  className={`p-4 rounded-m3-xl border text-[9px] font-black uppercase tracking-widest transition-all ${config.subject === s ? 'bg-luwa-primary text-white border-luwa-primary shadow-sm' : 'bg-white text-slate-400 border-slate-100 hover:border-luwa-primary'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Difficulty Index: {config.difficulty}/5</label>
              <input type="range" min="1" max="5" value={config.difficulty} onChange={(e) => setConfig({...config, difficulty: parseInt(e.target.value)})} className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-luwa-primary" />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Node Count: {config.count}</label>
              <input type="range" min="5" max="30" step="5" value={config.count} onChange={(e) => setConfig({...config, count: parseInt(e.target.value)})} className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-luwa-primary" />
            </div>
          </div>

          <div className="flex items-center justify-between p-8 bg-slate-50 rounded-m3-2xl border border-slate-100">
            <div>
              <p className="text-sm font-black text-luwa-onSurface uppercase tracking-tighter">Timed Session Mode</p>
              <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">60 Seconds per cognitive node</p>
            </div>
            <button 
              onClick={() => setConfig({...config, isTimed: !config.isTimed})}
              className={`w-14 h-8 rounded-full transition-all relative ${config.isTimed ? 'bg-luwa-primary' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all shadow-sm ${config.isTimed ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <button onClick={startQuiz} className="w-full py-6 bg-luwa-primary text-white rounded-m3-2xl font-black text-[10px] uppercase tracking-[0.4em] shadow-m3-2 m3-ripple hover:brightness-110 active:scale-[0.98] transition-all">
            Initialize Diagnostic
          </button>
        </div>

        <aside className="lg:col-span-4 space-y-6">
          <div className="p-8 border border-luwa-tertiary/10 bg-luwa-tertiary/[0.02] rounded-m3-2xl">
             <h4 className="text-[10px] font-black uppercase text-luwa-tertiary tracking-widest mb-4">Proctor Telemetry</h4>
             <p className="text-[11px] leading-relaxed text-slate-500 font-medium italic">
               The Assessment Lab utilizes neural telemetry to analyze your cognitive response latencies and revision patterns.
             </p>
          </div>
        </aside>
      </div>
    </div>
  );
};
