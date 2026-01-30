
import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from './GlassCard';
import { geminiService } from '../services/geminiService';
import { Quiz, User, EffortMetrics } from '../types';
import { ICONS } from '../constants';
import { storageService } from '../services/storageService';

interface AssessmentLabProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onConsultTutor: (context: string) => void;
  targetNodeId?: string;
}

export const AssessmentLab: React.FC<AssessmentLabProps> = ({ user, onUpdateUser, onConsultTutor, targetNodeId }) => {
  const [topic, setTopic] = useState('');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isNeuralSurge, setIsNeuralSurge] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const [questionMetrics, setQuestionMetrics] = useState<EffortMetrics[]>([]);
  const questionStartTime = useRef<number>(0);
  const currentRevisions = useRef<number>(0);
  const lastSelectedIdx = useRef<number | null>(null);

  useEffect(() => {
    if (targetNodeId) {
      const node = storageService.getFullCurriculum().find(n => n.id === targetNodeId);
      if (node) startQuiz(node.topic);
    }
  }, [targetNodeId]);

  useEffect(() => {
    let timer: any;
    if (quiz && !showResult && user.currentIntent?.type === 'Exam Prep' && timeLeft !== null) {
      if (timeLeft > 0) {
        timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      } else {
        processCompletion(answers, questionMetrics);
      }
    }
    return () => clearTimeout(timer);
  }, [quiz, showResult, timeLeft, answers]);

  useEffect(() => {
    if (quiz && !showResult) {
      questionStartTime.current = Date.now();
      currentRevisions.current = 0;
      lastSelectedIdx.current = null;
    }
  }, [currentIdx, quiz, showResult]);

  const startQuiz = async (selectedTopic?: string) => {
    const finalTopic = selectedTopic || topic;
    if (!finalTopic.trim()) return;
    setLoading(true);
    try {
      const generated = await geminiService.generateQuiz(finalTopic, user.stream, user.currentIntent?.type);
      setQuiz(generated);
      setAnswers([]);
      setQuestionMetrics([]);
      setCurrentIdx(0);
      setShowResult(false);
      setIsNeuralSurge(false);
      
      if (user.currentIntent?.type === 'Exam Prep') setTimeLeft(60 * 5);
      else setTimeLeft(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateEffort = (timeSpent: number, revisions: number, isCorrect: boolean): number => {
    let score = 0.5; 
    if (timeSpent > 20) score += 0.2;
    if (timeSpent < 5) score -= 0.3;
    if (revisions > 0) score += 0.15;
    if (isCorrect && timeSpent > 10) score += 0.1;
    return Math.max(0, Math.min(1, score));
  };

  const handleSelectOption = (idx: number) => {
    if (lastSelectedIdx.current !== null && lastSelectedIdx.current !== idx) currentRevisions.current += 1;
    lastSelectedIdx.current = idx;
    
    const timeSpent = (Date.now() - questionStartTime.current) / 1000;
    const isCorrect = idx === quiz!.questions[currentIdx].correctIndex;
    const effort = calculateEffort(timeSpent, currentRevisions.current, isCorrect);
    
    const metric: EffortMetrics = { timeSpent, revisions: currentRevisions.current, effortScore: effort };
    const newAnswers = [...answers, idx];
    const newMetrics = [...questionMetrics, metric];
    
    setAnswers(newAnswers);
    setQuestionMetrics(newMetrics);

    if (currentIdx < quiz!.questions.length - 1) setCurrentIdx(currentIdx + 1);
    else processCompletion(newAnswers, newMetrics);
  };

  const processCompletion = async (finalAnswers: number[], finalMetrics: EffortMetrics[]) => {
    setLoading(true);
    const score = quiz!.questions.reduce((acc, q, i) => acc + (q.correctIndex === (finalAnswers[i] ?? -1) ? 1 : 0), 0);
    const aggregateEffort = finalMetrics.reduce((acc, m) => acc + m.effortScore, 0) / (quiz?.questions.length || 1);
    
    let xpGained = score * 20;
    if (aggregateEffort > 0.8) xpGained += 50;
    if (score === quiz!.questions.length) { xpGained += 100; setIsNeuralSurge(true); }

    const quizResults = quiz!.questions.map((q, i) => ({
      question: q.question,
      answer: finalAnswers[i] !== undefined ? q.options[finalAnswers[i]] : "No Response",
      correct: q.correctIndex === finalAnswers[i],
      explanation: q.explanation,
      conceptTag: q.conceptTag,
      originalQuestion: q,
      metrics: finalMetrics[i] || { timeSpent: 0, revisions: 0, effortScore: 0 }
    }));

    let tempUser = { ...user };
    quizResults.forEach(res => {
      tempUser = storageService.updateMastery(tempUser, res.conceptTag, res.conceptTag, res.correct ? 'correct' : 'wrong', res.metrics.effortScore);
    });

    const missedConcepts = quizResults.filter(r => !r.correct).map(r => r.conceptTag);
    let newObjective = user.currentObjective;
    if (missedConcepts.length > 0) newObjective = `Remediate: ${missedConcepts[0]}`;

    const updatedUser: User = {
      ...tempUser,
      xp: tempUser.xp + xpGained,
      weakConcepts: Array.from(new Set([...missedConcepts, ...user.weakConcepts])).slice(0, 3),
      currentObjective: newObjective,
      averageEffort: user.averageEffort ? (user.averageEffort + aggregateEffort) / 2 : aggregateEffort,
      quizHistory: [{ id: Date.now().toString(), topic: quiz!.topic, score, total: quiz!.questions.length, date: new Date().toLocaleDateString(), timestamp: Date.now(), aggregateEffort, results: quizResults }, ...user.quizHistory]
    };
    
    onUpdateUser(updatedUser);
    setShowResult(true);
    setLoading(false);
  };

  const subjects = storageService.getSubjects(user.stream);
  const latestResult = user.quizHistory[0];
  const wrongQuestions = latestResult?.results.filter(r => !r.correct) || [];

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in overflow-hidden">
      <div className="flex justify-between items-center shrink-0">
        <div className="flex flex-col">
          <h2 className="text-2xl font-black flex items-center gap-3 uppercase tracking-tighter">
            <ICONS.Zap className="luwa-gold" />
            {showResult ? 'Correction Mode' : 'Assessment Lab'}
          </h2>
          {!showResult && (
            <span className="text-[8px] font-black text-gray-700 uppercase tracking-[0.4em] ml-9">
              Curriculum Intelligent Diagnostic Active
            </span>
          )}
        </div>
        
        {quiz && !showResult && (
          <div className="flex items-center gap-4">
            {timeLeft !== null && (
              <div className="text-[10px] font-black text-white bg-red-500/20 border border-red-500/40 px-4 py-1.5 rounded-full uppercase tracking-widest">
                T-Minus: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
            )}
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
              {user.currentIntent?.type} Mode
            </div>
          </div>
        )}
      </div>

      {!quiz ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full overflow-y-auto pr-2 pb-10">
          <GlassCard className="flex flex-col p-12 border-luwa-gold/10">
            <div className="mb-12">
              <ICONS.Zap className="w-12 h-12 luwa-gold mb-8" />
              <h3 className="text-3xl font-black uppercase tracking-widest mb-3 text-white">Subject Mastery</h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
                Initialize diagnostics across core national curriculum benchmarks.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full">
               {subjects.map(s => (
                 <button key={s} onClick={() => startQuiz(s)} className="p-8 text-[10px] font-black uppercase tracking-[0.4em] border border-white/5 rounded-2xl hover:bg-luwa-gold/10 hover:border-luwa-gold/30 transition-all text-left group">
                   <span className="block opacity-40 group-hover:opacity-100 transition-opacity mb-2">Probe</span>
                   {s}
                 </button>
               ))}
            </div>
          </GlassCard>

          <GlassCard className="flex flex-col p-12 border-white/5 bg-white/[0.01]">
            <div className="mb-12">
              <ICONS.Brain className="w-12 h-12 text-gray-700 mb-8" />
              <h3 className="text-3xl font-black uppercase tracking-widest mb-3 text-white">Targeted Vector</h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
                Isolate specific nodes for localized diagnostic verification.
              </p>
            </div>
            <div className="mt-auto">
              <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Acid-Base Equilibrium" className="w-full bg-black/40 border border-white/10 rounded-2xl p-8 mb-8 text-sm font-bold focus:border-luwa-gold transition-all outline-none text-white" />
              <button onClick={() => startQuiz()} disabled={loading} className="w-full bg-luwa-gold text-black px-8 py-8 rounded-2xl font-black text-xs uppercase tracking-[0.5em] shadow-2xl hover:brightness-110 transition-all">
                {loading ? 'CALIBRATING...' : 'INITIALIZE LAB SESSION'}
              </button>
            </div>
          </GlassCard>
        </div>
      ) : loading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
           <div className="w-20 h-20 border-2 border-luwa-gold/10 border-t-luwa-gold rounded-full animate-spin mb-10" />
           <p className="text-[11px] font-black uppercase tracking-[0.6em] text-luwa-gold animate-pulse">Orchestrating Knowledge Probe</p>
        </div>
      ) : showResult ? (
        <div className="flex-1 flex flex-col gap-10 overflow-hidden pb-10">
          <div className="flex flex-col md:flex-row gap-8 shrink-0">
            <GlassCard className="flex-1 flex items-center justify-between border-white/5 py-8 px-12">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 mb-2">Accuracy Rate</h3>
                <p className="text-5xl font-black text-white leading-none">
                  {latestResult.score} <span className="text-gray-700 text-3xl">/ {latestResult.total}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 mb-2">Effort Quality</p>
                <p className="text-3xl font-black text-luwa-gold uppercase">{Math.round(latestResult.aggregateEffort * 100)}%</p>
              </div>
            </GlassCard>
            
            <GlassCard className="flex-1 border-white/5 py-8 px-12 flex flex-col justify-center">
               <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 mb-3">Integrity Ledger</h3>
               <p className="text-sm font-medium text-gray-400 italic leading-relaxed">
                 {latestResult.aggregateEffort > 0.7 
                    ? "Reasoned discipline detected. Mistakes recorded as high-value data." 
                    : "Rapid response patterns detected. Focus on deliberation is recommended."}
               </p>
            </GlassCard>
          </div>

          <div className="flex-1 overflow-y-auto space-y-10 pr-6 custom-scrollbar">
            {wrongQuestions.length > 0 && (
              <div className="space-y-10">
                <div className="text-[10px] font-black uppercase tracking-[0.6em] text-red-500 opacity-60 px-2">Remediation Targets</div>
                {wrongQuestions.map((res, i) => (
                  <GlassCard key={i} className="border-red-500/10 bg-red-500/[0.01] p-16 animate-fade-in shadow-xl">
                    <div className="flex justify-between items-start mb-12">
                       <div className="flex items-center gap-3">
                         <span className="text-[10px] font-black uppercase px-5 py-2.5 rounded bg-red-500/10 text-red-500 border border-red-500/20 tracking-[0.3em]">
                           {res.metrics.effortScore > 0.6 ? 'Reasoned Error' : 'Rapid Response Error'}
                         </span>
                       </div>
                       <span className="text-[10px] font-black uppercase text-gray-600 tracking-[0.3em]">{res.conceptTag}</span>
                    </div>
                    
                    <h4 className="text-3xl font-black mb-16 leading-relaxed text-white max-w-4xl">{res.question}</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                       <div className="p-8 rounded-3xl bg-red-500/[0.03] border border-red-500/10 shadow-inner">
                         <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] mb-3">Scholar Hypothesis</p>
                         <p className="text-lg font-bold text-gray-500">{res.answer}</p>
                       </div>
                       <div className="p-8 rounded-3xl bg-green-500/[0.03] border border-green-500/10 shadow-inner">
                         <p className="text-[10px] font-black text-green-500 uppercase tracking-[0.4em] mb-3">Sovereign Truth</p>
                         <p className="text-lg font-bold text-white">{(res as any).originalQuestion.options[(res as any).originalQuestion.correctIndex]}</p>
                       </div>
                    </div>

                    <div className="p-10 bg-black/40 rounded-[2.5rem] border border-white/5 relative group">
                      <div className="text-base leading-loose text-gray-300">
                        <span className="text-luwa-gold font-black uppercase mr-4 tracking-[0.4em] text-[10px] block mb-2">Neural Breakdown:</span>
                        {res.metrics.effortScore < 0.4 ? (
                          <span className="opacity-80 block mb-4 border-l-2 border-luwa-gold/20 pl-4 italic text-sm">
                            Instructional Note: This node requires deeper deliberation. Avoid rapid selection.
                          </span>
                        ) : null}
                        {res.explanation}
                      </div>
                      <div className="mt-12 flex justify-end">
                        <button 
                          onClick={() => onConsultTutor(`Instructor, I misunderstood this concept: "${res.question}". I incorrectly chose "${res.answer}". Why is the correct logic "${(res as any).originalQuestion.options[(res as any).originalQuestion.correctIndex]}"? Breakdown: ${res.explanation}`)}
                          className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-luwa-gold hover:text-white transition-all hover:gap-6"
                        >
                          <ICONS.Brain className="w-5 h-5" />
                          Consult The Instructor
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => setQuiz(null)} className="w-full bg-white/5 hover:bg-white/10 py-10 rounded-3xl font-black text-[11px] uppercase tracking-[0.6em] transition-all border border-white/5 shrink-0">
            Acknowledge & Finalize
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-16 animate-fade-in py-16">
          <div className="max-w-4xl mx-auto w-full space-y-10 text-center">
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-luwa-gold shadow-[0_0_20px_#FFD700] transition-all duration-1000 ease-out" style={{ width: `${((currentIdx + 1) / 5) * 100}%` }} />
            </div>
            <div className="flex justify-between items-center px-6">
              <span className="text-[11px] font-black text-gray-600 uppercase tracking-[0.4em]">{quiz.topic}</span>
              <span className="text-[11px] font-black text-luwa-gold uppercase tracking-[0.5em]">Node {currentIdx + 1}/5</span>
            </div>
          </div>

          <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col justify-center px-8">
            <h3 className="text-5xl font-black mb-24 leading-tight text-white text-center tracking-tight">{quiz.questions[currentIdx].question}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {quiz.questions[currentIdx].options.map((opt, i) => (
                <button key={i} onClick={() => handleSelectOption(i)} className="w-full text-left p-10 rounded-[2rem] border border-white/5 bg-white/[0.02] hover:border-luwa-gold/30 hover:bg-luwa-gold/5 transition-all group shadow-xl">
                  <div className="flex items-center gap-10">
                    <span className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-[12px] font-black group-hover:bg-luwa-gold group-hover:text-black transition-all border border-white/10 uppercase">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-lg font-bold text-gray-300">{opt}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
