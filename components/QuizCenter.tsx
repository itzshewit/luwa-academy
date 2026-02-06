
/*
  Luwa Academy – Standard Quiz Assessment Engine
  V1.0 - Integrated Study Quiz Center
*/

import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from './GlassCard.tsx';
import { User, StaticQuiz, StaticQuestion } from '../types.ts';
import { ICONS } from '../constants.tsx';
import { storageService } from '../services/storageService.ts';

interface QuizCenterProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onExit: () => void;
}

export const QuizCenter: React.FC<QuizCenterProps> = ({ user, onUpdateUser, onExit }) => {
  const [quizzes, setQuizzes] = useState<StaticQuiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<StaticQuiz | null>(null);
  const [view, setView] = useState<'selection' | 'start' | 'taking' | 'results'>('selection');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [loading, setLoading] = useState(true);
  const timerInterval = useRef<any>(null);

  useEffect(() => {
    const load = async () => {
      const q = await storageService.getStaticQuizzes();
      setQuizzes(q);
      setLoading(false);
    };
    load();
  }, []);

  const startTimer = (seconds: number) => {
    setTimeLeft(seconds);
    timerInterval.current = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) {
          clearInterval(timerInterval.current);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
  };

  const handleStartQuiz = (quiz: StaticQuiz) => {
    setActiveQuiz(quiz);
    setView('start');
  };

  const commenceQuiz = () => {
    if (!activeQuiz) return;
    setView('taking');
    setCurrentIdx(0);
    setUserAnswers([]);
    setScore(0);
    setAnswered(false);
    // Parse duration string "15 min" to seconds
    const mins = parseInt(activeQuiz.duration) || 15;
    startTimer(mins * 60);
  };

  const handleSelectAnswer = (ans: any) => {
    if (answered) return;
    const currentAnswers = [...userAnswers];
    currentAnswers[currentIdx] = ans;
    setUserAnswers(currentAnswers);
  };

  const toggleMultiSelect = (idx: number) => {
    if (answered) return;
    const currentAnswers = [...userAnswers];
    const selected = (currentAnswers[currentIdx] || []) as number[];
    const next = selected.includes(idx) ? selected.filter(i => i !== idx) : [...selected, idx];
    currentAnswers[currentIdx] = next;
    setUserAnswers(currentAnswers);
  };

  const checkAnswer = () => {
    const q = activeQuiz!.questions[currentIdx];
    let isCorrect = false;
    const ans = userAnswers[currentIdx];

    if (q.type === 'multiple-choice' || q.type === 'true-false') {
      isCorrect = ans === q.correctAnswer;
    } else if (q.type === 'multiple-select') {
      const selected = (ans || []).sort();
      const correct = (q.correctAnswers || []).sort();
      isCorrect = JSON.stringify(selected) === JSON.stringify(correct);
    } else if (q.type === 'fill-blank') {
      isCorrect = (ans || '').toString().trim().toLowerCase() === (q.correctAnswer || '').toString().trim().toLowerCase();
    }

    if (isCorrect) setScore(s => s + 1);
    setAnswered(true);
  };

  const nextQuestion = () => {
    if (currentIdx < activeQuiz!.questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setAnswered(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    clearInterval(timerInterval.current);
    setView('results');
    // Save XP
    const xpGain = score * 5;
    onUpdateUser({ ...user, xp: user.xp + xpGain });
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center p-20 animate-pulse">
       <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-luwa-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Syncing Registry...</p>
       </div>
    </div>
  );

  if (view === 'selection') {
    return (
      <div className="h-full flex flex-col gap-10 animate-m3-fade overflow-y-auto pb-24 pr-2 custom-scrollbar">
        <header>
          <h1 className="display-small font-serif font-black text-luwa-onSurface">Standard Assessment Registry</h1>
          <p className="label-medium text-slate-400 font-black uppercase tracking-widest mt-1">Curriculum Aligned Diagnostic Units</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map(q => (
            <GlassCard key={q.id} className="p-8 border-slate-100 hover:border-luwa-primary/30 transition-all flex flex-col justify-between h-full group">
               <div>
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-4xl">{q.icon}</span>
                    <span className="bg-slate-50 text-slate-400 text-[9px] font-black uppercase px-3 py-1 rounded-full">{q.duration}</span>
                  </div>
                  <h3 className="text-xl font-black text-luwa-onSurface mb-2 group-hover:text-luwa-primary transition-colors">{q.title}</h3>
                  <p className="text-xs text-slate-500 font-medium mb-4 line-clamp-2">{q.description}</p>
               </div>
               <button 
                onClick={() => handleStartQuiz(q)}
                className="w-full py-4 bg-luwa-primaryContainer text-luwa-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-luwa-primary hover:text-white transition-all shadow-sm"
               >
                 Launch Unit
               </button>
            </GlassCard>
          ))}
        </div>
      </div>
    );
  }

  if (view === 'start' && activeQuiz) {
    return (
      <div className="h-full flex items-center justify-center p-6 animate-m3-fade">
        <GlassCard className="max-w-2xl w-full p-12 text-center" variant="elevated">
          <span className="text-6xl block mb-6">{activeQuiz.icon}</span>
          <h2 className="headline-medium font-serif font-black text-luwa-onSurface mb-4">{activeQuiz.title}</h2>
          <p className="body-medium text-slate-500 mb-10 max-w-md mx-auto">{activeQuiz.description}</p>
          
          <div className="grid grid-cols-2 gap-4 mb-10 text-left">
             <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Total Registry Nodes</p>
                <p className="text-xl font-black text-luwa-onSurface">{activeQuiz.totalQuestions} Questions</p>
             </div>
             <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Timing Limit</p>
                <p className="text-xl font-black text-luwa-onSurface">{activeQuiz.duration}</p>
             </div>
          </div>

          <div className="flex gap-4">
            <button onClick={() => setView('selection')} className="flex-1 py-5 border border-slate-200 rounded-2xl label-large font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50">Back</button>
            <button onClick={commenceQuiz} className="flex-[2] py-5 bg-luwa-primary text-white rounded-2xl label-large font-black uppercase tracking-[0.2em] shadow-m3-2 m3-ripple">Commence Unit</button>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (view === 'taking' && activeQuiz) {
    const q = activeQuiz.questions[currentIdx];
    const progress = ((currentIdx + 1) / activeQuiz.questions.length) * 100;
    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    return (
      <div className="h-full flex flex-col gap-8 max-w-4xl mx-auto w-full py-6 animate-m3-fade overflow-hidden">
        <header className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm shrink-0">
           <div className="flex items-center gap-4">
              <span className="w-10 h-10 bg-luwa-primaryContainer text-luwa-primary rounded-xl flex items-center justify-center font-black">{currentIdx + 1}</span>
              <div>
                 <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Question Index</p>
                 <p className="text-sm font-bold text-luwa-onSurface">Node {currentIdx + 1} of {activeQuiz.questions.length}</p>
              </div>
           </div>
           <div className="text-center">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Session Timer</p>
              <p className={`text-2xl font-black tabular-nums ${timeLeft < 60 ? 'text-luwa-error animate-pulse' : 'text-luwa-primary'}`}>{formatTime(timeLeft)}</p>
           </div>
           <button onClick={() => setView('results')} className="text-[10px] font-black uppercase tracking-widest text-luwa-error hover:underline">Early Submit</button>
        </header>

        <div className="flex-1 flex flex-col gap-8 overflow-y-auto custom-scrollbar pr-2">
           <div className="h-2 bg-slate-100 rounded-full overflow-hidden shrink-0">
              <div className="h-full bg-luwa-primary transition-all duration-500" style={{ width: `${progress}%` }} />
           </div>

           <GlassCard className="p-10 md:p-14 bg-white border-slate-50 shadow-m3-2 shrink-0">
              <span className="px-3 py-1 bg-luwa-primaryContainer text-luwa-primary rounded-full text-[8px] font-black uppercase mb-6 inline-block">Registry Type: {q.type}</span>
              <h3 className="text-2xl font-serif font-black text-luwa-onSurface leading-relaxed">{q.question}</h3>
           </GlassCard>

           <div className="grid grid-cols-1 gap-4">
              {q.type === 'multiple-choice' && q.options?.map((opt, i) => (
                <button 
                  key={i} 
                  onClick={() => handleSelectAnswer(i)}
                  disabled={answered}
                  className={`w-full text-left p-6 rounded-2xl border-2 transition-all flex items-center gap-6 
                    ${userAnswers[currentIdx] === i ? 'border-luwa-primary bg-luwa-primaryContainer shadow-sm' : 'border-slate-100 bg-white hover:border-luwa-primary/30'}
                    ${answered && i === q.correctAnswer ? '!border-luwa-secondary bg-luwa-secondaryContainer' : ''}
                    ${answered && userAnswers[currentIdx] === i && i !== q.correctAnswer ? '!border-luwa-error bg-red-50' : ''}
                  `}
                >
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${userAnswers[currentIdx] === i ? 'bg-luwa-primary text-white' : 'bg-slate-50 text-slate-400'}`}>{String.fromCharCode(65+i)}</span>
                  <span className="font-bold text-slate-700">{opt}</span>
                </button>
              ))}

              {q.type === 'true-false' && [true, false].map((val, i) => (
                <button 
                  key={i} 
                  onClick={() => handleSelectAnswer(val)}
                  disabled={answered}
                  className={`w-full text-left p-6 rounded-2xl border-2 transition-all flex items-center gap-6
                    ${userAnswers[currentIdx] === val ? 'border-luwa-primary bg-luwa-primaryContainer shadow-sm' : 'border-slate-100 bg-white hover:border-luwa-primary/30'}
                    ${answered && val === q.correctAnswer ? '!border-luwa-secondary bg-luwa-secondaryContainer' : ''}
                    ${answered && userAnswers[currentIdx] === val && val !== q.correctAnswer ? '!border-luwa-error bg-red-50' : ''}
                  `}
                >
                   <span className="font-black text-sm uppercase tracking-widest">{val ? 'True' : 'False'}</span>
                </button>
              ))}

              {q.type === 'multiple-select' && q.options?.map((opt, i) => {
                const isSelected = (userAnswers[currentIdx] || []).includes(i);
                const isCorrect = (q.correctAnswers || []).includes(i);
                return (
                  <button 
                    key={i} 
                    onClick={() => toggleMultiSelect(i)}
                    disabled={answered}
                    className={`w-full text-left p-6 rounded-2xl border-2 transition-all flex items-center gap-6
                      ${isSelected ? 'border-luwa-primary bg-luwa-primaryContainer shadow-sm' : 'border-slate-100 bg-white hover:border-luwa-primary/30'}
                      ${answered && isCorrect ? '!border-luwa-secondary bg-luwa-secondaryContainer' : ''}
                      ${answered && isSelected && !isCorrect ? '!border-luwa-error bg-red-50' : ''}
                    `}
                  >
                     <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-luwa-primary border-luwa-primary text-white' : 'border-slate-200'}`}>
                        {isSelected && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path d="M5 13l4 4L19 7"/></svg>}
                     </div>
                     <span className="font-bold text-slate-700">{opt}</span>
                  </button>
                );
              })}

              {q.type === 'fill-blank' && (
                <div className="space-y-4">
                   <input 
                    value={userAnswers[currentIdx] || ''}
                    onChange={(e) => handleSelectAnswer(e.target.value)}
                    disabled={answered}
                    placeholder="Enter categorical answer..."
                    className={`w-full p-6 bg-white border-2 rounded-2xl text-lg font-bold outline-none transition-all 
                      ${answered ? (userAnswers[currentIdx]?.toString().toLowerCase() === q.correctAnswer?.toString().toLowerCase() ? 'border-luwa-secondary bg-luwa-secondaryContainer' : 'border-luwa-error bg-red-50') : 'border-slate-100 focus:border-luwa-primary shadow-inner'}
                    `}
                   />
                   {answered && (
                     <div className="p-6 bg-luwa-secondaryContainer rounded-2xl border border-luwa-secondary/20">
                        <p className="text-[9px] font-black uppercase text-luwa-secondary mb-1">Registry Record Answer</p>
                        <p className="text-sm font-black text-luwa-secondary">{q.correctAnswer}</p>
                     </div>
                   )}
                </div>
              )}
           </div>

           {answered && q.explanation && (
             <div className="p-8 bg-blue-50 border-l-4 border-luwa-primary rounded-xl animate-m3-fade shrink-0">
                <h4 className="text-[10px] font-black uppercase text-luwa-primary mb-2 tracking-widest">Neural Logic Node</h4>
                <p className="text-sm font-medium text-slate-700 leading-relaxed">{q.explanation}</p>
             </div>
           )}
        </div>

        <footer className="shrink-0 pt-4 flex justify-between items-center gap-6">
           <button 
            disabled={currentIdx === 0}
            onClick={() => { setCurrentIdx(p => p - 1); setAnswered(true); }}
            className="px-10 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all disabled:opacity-30"
           >
             Previous
           </button>
           {!answered ? (
             <button 
              onClick={checkAnswer}
              disabled={userAnswers[currentIdx] === undefined}
              className="flex-1 py-5 bg-luwa-secondary text-white rounded-2xl label-large font-black uppercase tracking-[0.2em] shadow-m3-2 m3-ripple transition-all active:scale-95 disabled:opacity-50"
             >
               Sync Answer
             </button>
           ) : (
             <button 
              onClick={nextQuestion}
              className="flex-1 py-5 bg-luwa-primary text-white rounded-2xl label-large font-black uppercase tracking-[0.2em] shadow-m3-2 m3-ripple transition-all active:scale-95 animate-m3-fade"
             >
               {currentIdx < activeQuiz.questions.length - 1 ? 'Next Node' : 'Audit Unit'}
             </button>
           )}
        </footer>
      </div>
    );
  }

  if (view === 'results' && activeQuiz) {
    const percentage = Math.round((score / activeQuiz.questions.length) * 100);
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 animate-m3-fade overflow-y-auto custom-scrollbar">
         <GlassCard className="max-w-3xl w-full p-12 text-center" variant="elevated">
            <header className="mb-12">
               <div className="inline-flex p-6 bg-luwa-primaryContainer text-luwa-primary rounded-full mb-6">
                  <ICONS.Trophy className="w-12 h-12" />
               </div>
               <h2 className="display-small font-serif font-black text-luwa-onSurface">Audit Summary Complete</h2>
               <p className="label-large text-slate-400 uppercase tracking-[0.3em] font-black mt-2">{activeQuiz.title}</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
               <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Final Score</p>
                  <p className="text-3xl font-black text-luwa-primary">{percentage}%</p>
               </div>
               <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Correct</p>
                  <p className="text-3xl font-black text-luwa-secondary">{score}</p>
               </div>
               <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Inaccurate</p>
                  <p className="text-3xl font-black text-luwa-error">{activeQuiz.questions.length - score}</p>
               </div>
               <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">XP Synced</p>
                  <p className="text-3xl font-black text-luwa-tertiary">+{score * 5}</p>
               </div>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto mb-12 pr-4 custom-scrollbar text-left border-t border-slate-100 pt-8">
               <h4 className="label-medium font-black uppercase text-slate-400 tracking-widest mb-6">Categorical Registry Audit</h4>
               {activeQuiz.questions.map((q, idx) => {
                  let isCorrect = false;
                  const ans = userAnswers[idx];
                  if (q.type === 'multiple-choice' || q.type === 'true-false') isCorrect = ans === q.correctAnswer;
                  else if (q.type === 'multiple-select') isCorrect = JSON.stringify((ans || []).sort()) === JSON.stringify((q.correctAnswers || []).sort());
                  else if (q.type === 'fill-blank') isCorrect = (ans || '').toString().trim().toLowerCase() === (q.correctAnswer || '').toString().trim().toLowerCase();

                  return (
                    <div key={idx} className={`p-5 rounded-2xl border flex justify-between items-center transition-all ${isCorrect ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
                       <div className="flex gap-4 items-center">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${isCorrect ? 'bg-luwa-secondary text-white' : 'bg-luwa-error text-white'}`}>{idx + 1}</span>
                          <p className="text-sm font-bold text-slate-700 max-w-[400px] truncate">{q.question}</p>
                       </div>
                       <span className={`text-[10px] font-black uppercase ${isCorrect ? 'text-luwa-secondary' : 'text-luwa-error'}`}>{isCorrect ? 'Accurate' : 'Mismatch'}</span>
                    </div>
                  );
               })}
            </div>

            <div className="flex gap-4">
               <button onClick={onExit} className="flex-1 py-5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-50 transition-all shadow-sm">Terminate Station</button>
               <button onClick={commenceQuiz} className="flex-1 py-5 bg-luwa-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-m3-2 m3-ripple transition-all active:scale-95">Re-Synchronize</button>
            </div>
         </GlassCard>
      </div>
    );
  }

  return null;
};
