/*
  Luwa Academy – AI-Powered Educational Platform
  Developed by Shewit – 2026
  Purpose: Interactive, gamified, and AI-assisted learning for high school students.
  Module: Academic Assessment Interface
  Author: Shewit – 2026
*/

import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from './GlassCard.tsx';
import { geminiService } from '../services/geminiService.ts';
import { Quiz, User, EffortMetrics, ConceptMastery } from '../types.ts';
import { ICONS } from '../constants.tsx';
import { storageService } from '../services/storageService.ts';

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
    
    const masteryList = Object.values(user.masteryRecord) as ConceptMastery[];
    const relevantMastery = masteryList.find(m => m.topic.toLowerCase().includes(finalTopic.toLowerCase()));
    const difficultyLevel = relevantMastery ? relevantMastery.adaptiveLevel : 3;

    try {
      const generated = await geminiService.generateQuiz(finalTopic, user.stream, user.currentIntent?.type, difficultyLevel);
      setQuiz(generated);
      setAnswers([]);
      setQuestionMetrics([]);
      setCurrentIdx(0);
      setShowResult(false);
      
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
    if (score === quiz!.questions.length) xpGained += 100;

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
      quizHistory: [{ 
        id: Date.now().toString(), 
        topic: quiz!.topic, 
        score, 
        total: quiz!.questions.length, 
        date: new Date().toLocaleDateString(), 
        timestamp: Date.now(), 
        aggregateEffort, 
        results: quizResults 
      }, ...user.quizHistory]
    };
    
    const finalizedUser = storageService.checkAchievements(updatedUser);
    onUpdateUser(finalizedUser);
    setShowResult(true);
    setLoading(false);
  };

  const subjects = storageService.getSubjects(user.stream);
  const latestResult = user.quizHistory[0];
  const wrongQuestions = latestResult?.results.filter(r => !r.correct) || [];

  return (
    <div className="h-full flex flex-col gap-4 md:gap-6 animate-fade-in overflow-hidden">
      <div className="flex justify-between items-center shrink-0">
        <div className="flex flex-col">
          <h2 className="text-xl md:text-2xl font-black flex items-center gap-3 uppercase tracking-tighter text-luwa-purple">
            <ICONS.Zap className="text-luwa-teal" />
            {showResult ? 'Correction' : 'Practice Lab'}
          </h2>
          {!showResult && (
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-9">
              Adaptive Scaling Active
            </span>
          )}
        </div>
        
        {quiz && !showResult && (
          <div className="flex items-center gap-2 md:gap-4">
            {timeLeft !== null && (
              <div className="text-[9px] font-black text-white bg-red-500/80 px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-red-500/10">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
            )}
            <div className="hidden xs:block text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1.5 rounded-full border border-slate-100">
              {user.currentIntent?.type}
            </div>
          </div>
        )}
      </div>

      {!quiz ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 h-full overflow-y-auto pr-2 pb-10 custom-scrollbar">
          <GlassCard className="flex flex-col p-8 md:p-12 border-luwa-teal/10 bg-white">
            <div className="mb-8 md:mb-12">
              <ICONS.Zap className="w-10 h-10 md:w-12 md:h-12 text-luwa-teal mb-6 md:mb-8" />
              <h3 className="text-2xl md:text-3xl font-serif font-bold uppercase tracking-tight mb-3 text-luwa-purple">Subject Mastery</h3>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed max-w-sm">
                Initialize diagnostics across core national curriculum benchmarks.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:gap-4 w-full">
               {subjects.map(s => (
                 <button key={s} onClick={() => startQuiz(s)} className="p-4 md:p-8 text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-slate-100 rounded-2xl hover:bg-luwa-teal/5 hover:border-luwa-teal/30 transition-all text-left group">
                   <span className="block opacity-40 group-hover:opacity-100 transition-opacity mb-2">Probe</span>
                   {s}
                 </button>
               ))}
            </div>
          </GlassCard>

          <GlassCard className="flex flex-col p-8 md:p-12 border-luwa-purple/5 bg-slate-50">
            <div className="mb-8 md:mb-12">
              <ICONS.Brain className="w-10 h-10 md:w-12 md:h-12 text-luwa-purple/30 mb-6 md:mb-8" />
              <h3 className="text-2xl md:text-3xl font-serif font-bold uppercase tracking-tight mb-3 text-luwa-purple">Weekly Revision</h3>
              <p className="text-slate-500 text-xs md:text-sm leading-relaxed max-w-sm">
                AI-powered mini-tests targeting your specific weak areas.
              </p>
            </div>
            <div className="mt-auto">
              <button 
                onClick={() => startQuiz(user.weakConcepts[0] || 'General Revision')} 
                disabled={loading} 
                className="w-full bg-luwa-purple text-white px-8 py-5 md:py-8 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-[0.4em] shadow-xl shadow-luwa-purple/20 hover:brightness-110 transition-all"
              >
                {loading ? 'CALIBRATING...' : 'INITIALIZE REVISION'}
              </button>
            </div>
          </GlassCard>
        </div>
      ) : loading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
           <div className="w-16 h-16 md:w-20 md:h-20 border-2 border-luwa-teal/10 border-t-luwa-teal rounded-full animate-spin mb-10" />
           <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.5em] text-luwa-teal animate-pulse">Syncing Knowledge Probe</p>
        </div>
      ) : showResult ? (
        <div className="flex-1 flex flex-col gap-6 md:gap-10 overflow-hidden pb-10">
          <div className="flex flex-col sm:flex-row gap-4 md:gap-8 shrink-0">
            <GlassCard className="flex-1 flex items-center justify-between border-slate-100 py-6 md:py-8 px-8 md:px-12 bg-white">
              <div>
                <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Accuracy</h3>
                <p className="text-4xl md:text-5xl font-black text-luwa-purple leading-none">
                  {latestResult.score} <span className="text-slate-300 text-2xl md:text-3xl">/ {latestResult.total}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Quality</p>
                <p className="text-2xl md:text-3xl font-black text-luwa-teal uppercase">{Math.round(latestResult.aggregateEffort * 100)}%</p>
              </div>
            </GlassCard>
          </div>

          <div className="flex-1 overflow-y-auto space-y-6 md:space-y-10 pr-2 custom-scrollbar">
            {wrongQuestions.map((res, i) => (
              <GlassCard key={i} className="border-red-100 bg-white p-6 md:p-16 animate-fade-in shadow-xl">
                <h4 className="text-lg md:text-3xl font-serif font-bold mb-8 md:mb-16 leading-relaxed text-luwa-purple max-w-4xl">{res.question}</h4>
                <div className="p-6 md:p-10 bg-slate-50 rounded-[2rem] border border-slate-100 relative group">
                  <div className="text-sm md:text-base leading-loose text-slate-600">
                    <span className="text-luwa-teal font-black uppercase mr-4 tracking-widest text-[9px] block mb-3">Neural Breakdown:</span>
                    {res.explanation}
                  </div>
                </div>
              </GlassCard>
            ))}
            {wrongQuestions.length === 0 && (
              <div className="text-center py-20 animate-fade-in">
                 <div className="w-20 h-20 bg-luwa-teal/10 rounded-full flex items-center justify-center mx-auto mb-8">
                    <ICONS.Trophy className="w-10 h-10 text-luwa-teal" />
                 </div>
                 <h4 className="text-3xl font-serif font-bold text-luwa-purple mb-4">Neural Harmony</h4>
                 <p className="text-slate-500 font-medium">Full accuracy detected across all curriculum probes.</p>
              </div>
            )}
          </div>

          <button onClick={() => setQuiz(null)} className="w-full bg-luwa-purple text-white py-6 md:py-10 rounded-3xl font-black text-[10px] md:text-[11px] uppercase tracking-[0.4em] transition-all shadow-xl shadow-luwa-purple/20 shrink-0">
            Return to Lab
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-10 md:gap-16 animate-fade-in py-8 md:py-16">
          <div className="max-w-4xl mx-auto w-full space-y-6 md:space-y-10 text-center">
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-luwa-teal transition-all duration-700 ease-out shadow-[0_0_10px_rgba(38,142,145,0.3)]" style={{ width: `${((currentIdx + 1) / 5) * 100}%` }} />
            </div>
          </div>

          <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col justify-center px-4 md:px-8">
            <h3 className="text-2xl md:text-5xl font-serif font-bold mb-12 md:mb-24 leading-tight text-luwa-purple text-center tracking-tight">{quiz.questions[currentIdx].question}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              {quiz.questions[currentIdx].options.map((opt, i) => (
                <button key={i} onClick={() => handleSelectOption(i)} className="w-full text-left p-6 md:p-10 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 bg-white hover:border-luwa-teal hover:shadow-xl transition-all group">
                  <div className="flex items-center gap-6 md:gap-10">
                    <span className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-slate-50 flex items-center justify-center text-[10px] md:text-[12px] font-black group-hover:bg-luwa-teal group-hover:text-white transition-all border border-slate-100 uppercase">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-base md:text-lg font-bold text-slate-600 group-hover:text-luwa-purple">{opt}</span>
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