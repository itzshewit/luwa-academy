
/*
  Luwa Academy – Mock Simulation Node
  Stability Patch V5.3 (Export Support)
*/

import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard.tsx';
import { User, MockExam } from '../types.ts';
import { ICONS } from '../constants.tsx';
import { storageService } from '../services/storageService.ts';
import { geminiService } from '../services/geminiService.ts';

interface MockSimulatorProps {
  user: User;
  onComplete: (score: number) => void;
  onExit: () => void;
}

export const MockSimulator: React.FC<MockSimulatorProps> = ({ user, onComplete, onExit }) => {
  const isAmharic = user.preferredLanguage === 'am';
  const [activeExam, setActiveExam] = useState<MockExam | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  // Updated startMock to be async and correctly await the promise from storageService.getQuestions()
  const startMock = async (subject: string) => {
    const allQuestions = await storageService.getQuestions();
    const examQuestions = allQuestions.filter(q => q.subjectId === subject).slice(0, 10);
    
    if (examQuestions.length === 0) {
      alert("Institutional Notice: Question bank for this subject is currently empty. Use 'Study Nodes' or 'AI Personalized Diagnostic' to populate registry.");
      return;
    }

    const exam: MockExam = {
      id: Math.random().toString(36).substr(2, 9),
      title: `${subject} Standard Simulation`,
      subject,
      questions: examQuestions,
      timeLimit: 120 * 60,
      totalMarks: examQuestions.length
    };
    
    setActiveExam(exam);
    setTimeLeft(exam.timeLimit);
    setCurrentIdx(0);
    setAnswers({});
    setFinalScore(null);
  };

  const startAIPersonalizedMock = async (subject: string) => {
    setIsLoadingAI(true);
    try {
      const aiQuestions = await geminiService.generatePersonalizedMockExam(user, subject);
      if (!aiQuestions || aiQuestions.length === 0) throw new Error("Synthesis Empty");

      const exam: MockExam = {
        id: `ai-mock-${Date.now()}`,
        title: `${subject} AI Personalized Diagnostic`,
        subject,
        questions: aiQuestions,
        timeLimit: 120 * 60,
        totalMarks: aiQuestions.length
      };
      setActiveExam(exam);
      setTimeLeft(exam.timeLimit);
      setCurrentIdx(0);
      setAnswers({});
      setFinalScore(null);
    } catch (err) {
      alert("AI Synthesis engine busy. Populating from standard institutional bank.");
      startMock(subject);
    } finally {
      setIsLoadingAI(false);
    }
  };

  useEffect(() => {
    let timer: any;
    if (activeExam && timeLeft > 0 && finalScore === null) {
      timer = setInterval(() => setTimeLeft(p => p - 1), 1000);
    } else if (activeExam && timeLeft === 0 && finalScore === null) {
      handleSubmit();
    }
    return () => clearInterval(timer);
  }, [activeExam, timeLeft, finalScore]);

  const handleSubmit = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    let score = 0;
    activeExam?.questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) score++;
    });
    setFinalScore(score);
    setIsSubmitting(false);
  };

  const downloadReport = () => {
    if (!activeExam || finalScore === null) return;
    const report = `LUWA ACADEMY - PERFORMANCE REPORT\nExaminee: ${user.fullName}\nExam: ${activeExam.title}\nScore: ${finalScore}/${activeExam.totalMarks}\nPercentage: ${(finalScore/activeExam.totalMarks*100).toFixed(1)}%\n\n---\nRegistry Details:\nSubject: ${activeExam.subject}\nDate: ${new Date().toLocaleString()}`;
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Luwa_Report_${activeExam.subject}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleMark = (id: string) => {
    const next = new Set(marked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setMarked(next);
  };

  if (finalScore !== null) {
    return (
      <div className="h-full flex items-center justify-center p-8 animate-m3-fade">
        <GlassCard className="max-w-md w-full p-12 text-center space-y-8" variant="elevated">
          <ICONS.Trophy className="w-20 h-20 text-luwa-tertiary mx-auto mb-4" />
          <div>
            <h2 className="headline-medium font-serif font-black text-luwa-onSurface">Simulation Complete</h2>
            <p className="label-small text-slate-400 font-black uppercase tracking-widest mt-2">{activeExam?.title}</p>
          </div>
          <div className="text-6xl font-serif font-black text-luwa-primary">{finalScore} / {activeExam?.totalMarks}</div>
          <div className="space-y-4 pt-6">
            <button 
              onClick={downloadReport}
              className="w-full py-4 bg-slate-50 border border-slate-100 rounded-m3-xl text-luwa-primary label-small font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-luwa-primaryContainer transition-all"
            >
              <ICONS.Download className="w-4 h-4" /> Download Registry Report
            </button>
            <button 
              onClick={() => onComplete(finalScore)}
              className="w-full py-5 bg-luwa-primary text-white rounded-m3-xl label-large font-black uppercase tracking-[0.2em] shadow-m3-2 m3-ripple"
            >
              Commit to Profile
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (!activeExam) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 animate-m3-fade text-center max-w-4xl mx-auto overflow-y-auto custom-scrollbar">
        <ICONS.Brain className="w-16 h-16 text-luwa-primary mb-8 animate-pulse" />
        <h2 className={`text-3xl font-serif font-black text-luwa-onSurface mb-4 ${isAmharic ? 'amharic-text' : ''}`}>
          {isAmharic ? 'የሙከራ ፈተና ማስመሰያ' : 'Mock Exam Simulator'}
        </h2>
        <p className="text-slate-400 max-w-md mb-12 text-sm leading-relaxed font-medium">
          {isAmharic 
            ? 'ተጨባጭ የፈተና ሁኔታዎችን ይለማመዱ። AI የእርስዎን ደካማ ጎኖች መሰረት በማድረግ ልዩ ፈተናዎችን ያዘጋጃል።'
            : 'Experience realistic exam conditions. Our AI synthesizes personalized mock exams based on your historical weak concepts and performance metrics.'}
        </p>

        {isLoadingAI ? (
          <div className="flex flex-col items-center gap-6 py-10">
            <div className="w-10 h-10 border-4 border-slate-100 border-t-luwa-primary rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-luwa-primary">Synthesizing Personalized Schema...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            <div className="p-8 bg-slate-50 border border-slate-100 rounded-m3-2xl flex flex-col items-center">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-luwa-primary mb-6">AI Personalized Diagnostic</h4>
              <div className="grid grid-cols-2 gap-3 w-full">
                {storageService.getSubjects(user.stream).map(s => (
                  <button 
                    key={s} 
                    onClick={() => startAIPersonalizedMock(s)}
                    className="p-4 bg-white border border-slate-100 rounded-m3-xl shadow-sm hover:border-luwa-primary transition-all font-bold text-[9px] uppercase tracking-tighter"
                  >
                    AI: {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-8 bg-white border border-slate-100 rounded-m3-2xl flex flex-col items-center">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Standard National Mock</h4>
              <div className="grid grid-cols-2 gap-3 w-full">
                {storageService.getSubjects(user.stream).map(s => (
                  <button 
                    key={s} 
                    onClick={() => startMock(s)}
                    className="p-4 bg-white border border-slate-100 rounded-m3-xl shadow-sm hover:border-luwa-primary transition-all font-bold text-[9px] uppercase tracking-tighter"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const q = activeExam.questions[currentIdx];
  if (!q) return <div className="p-20 text-center">Neural Sync Error: Question Missing. Returning to Terminal...</div>;

  const progress = Math.round(((currentIdx + 1) / activeExam.questions.length) * 100);
  const timeDisplay = `${Math.floor(timeLeft / 3600)}:${Math.floor((timeLeft % 3600) / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`;

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden animate-m3-fade">
      <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center shrink-0">
        <button onClick={onExit} className="text-slate-400 hover:text-luwa-onSurface"><ICONS.Layout className="w-6 h-6 rotate-90" /></button>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{activeExam.title}</p>
          <p className={`text-xl font-black ${timeLeft < 600 ? 'text-luwa-error animate-pulse' : 'text-luwa-primary'}`}>{timeDisplay}</p>
        </div>
        <button 
          onClick={handleSubmit}
          className="bg-luwa-primary text-white px-8 py-2 rounded-m3-xl text-[10px] font-black uppercase tracking-widest shadow-m3-2"
        >
          Submit Final
        </button>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        <div className="flex-1 overflow-y-auto p-8 lg:p-16 custom-scrollbar bg-white">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-10">
              <span className="bg-slate-100 text-luwa-onSurface px-4 py-1.5 rounded-full text-[9px] font-black uppercase">Question {currentIdx + 1} of {activeExam.questions.length}</span>
              <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-luwa-primary transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <h3 className={`text-2xl md:text-3xl font-serif font-black text-luwa-onSurface mb-12 leading-relaxed ${isAmharic ? 'amharic-text' : ''}`}>
              {isAmharic ? (q.text.am || q.text.en) : q.text.en}
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {q.options.map((opt) => (
                <button 
                  key={opt.id}
                  onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.id }))}
                  className={`w-full text-left p-6 rounded-m3-xl border transition-all flex items-center gap-6 ${answers[q.id] === opt.id ? 'bg-luwa-primaryContainer border-luwa-primary' : 'bg-white border-slate-100 hover:border-luwa-primary/30'}`}
                >
                  <span className={`w-10 h-10 rounded-m3-m flex items-center justify-center font-black ${answers[q.id] === opt.id ? 'bg-luwa-primary text-white' : 'bg-slate-50 text-slate-400'}`}>
                    {opt.id}
                  </span>
                  <span className={`font-bold text-sm ${isAmharic ? 'amharic-text' : ''}`}>{isAmharic ? (opt.text.am || opt.text.en) : opt.text.en}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="w-full lg:w-80 bg-slate-50 p-8 border-l border-slate-100 overflow-y-auto custom-scrollbar">
          <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6">Question Palette</h4>
          <div className="grid grid-cols-5 gap-2">
            {activeExam.questions.map((quest, idx) => (
              <button 
                key={quest.id}
                onClick={() => setCurrentIdx(idx)}
                className={`aspect-square rounded-m3-s text-[10px] font-black transition-all border ${
                  currentIdx === idx ? 'ring-2 ring-luwa-primary ring-offset-2' : ''
                } ${
                  marked.has(quest.id) ? 'bg-luwa-tertiary text-white border-luwa-tertiary shadow-sm' :
                  answers[quest.id] ? 'bg-luwa-primary text-white border-luwa-primary shadow-sm' :
                  'bg-white text-slate-400 border-slate-200'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <div className="mt-12 space-y-4">
            <button 
              onClick={() => toggleMark(q.id)}
              className={`w-full py-4 rounded-m3-xl font-black text-[9px] uppercase tracking-widest transition-all ${marked.has(q.id) ? 'bg-luwa-tertiary text-white shadow-sm' : 'bg-white border border-luwa-tertiary text-luwa-tertiary'}`}
            >
              {marked.has(q.id) ? 'Unmark Node' : 'Mark for Review'}
            </button>
            <div className="flex gap-2">
              <button 
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(p => p - 1)}
                className="flex-1 py-4 bg-white border border-slate-100 rounded-m3-xl text-[9px] font-black uppercase disabled:opacity-20"
              >
                Prev
              </button>
              <button 
                disabled={currentIdx === activeExam.questions.length - 1}
                onClick={() => setCurrentIdx(p => p + 1)}
                className="flex-1 py-4 bg-white border border-slate-100 rounded-m3-xl text-[9px] font-black uppercase disabled:opacity-20"
              >
                Next
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
