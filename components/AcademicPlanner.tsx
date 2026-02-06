
/*
  Module: AI Daily Study Planner (3.10, 11.2)
  Purpose: Generates dynamic, adaptive study schedules based on mastery gaps and exam deadlines.
*/

import React, { useState, useMemo } from 'react';
import { GlassCard } from './GlassCard.tsx';
import { User, StudyGoal } from '../types.ts';
import { ICONS } from '../constants.tsx';

interface AcademicPlannerProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

export const AcademicPlanner: React.FC<AcademicPlannerProps> = ({ user, onUpdateUser }) => {
  const [showGenerator, setShowGenerator] = useState(!(user.studyGoals?.length > 0));
  const [showHelp, setShowHelp] = useState(false);
  const [studyHours, setStudyHours] = useState(4);
  const [examDate, setExamDate] = useState('2026-06-15');

  const generateAIPlan = () => {
    // Simulated AI Algorithm (3.10.3)
    const weakTopics = user.weakConcepts || ['Kinematics', 'Logarithms'];
    const newGoals: StudyGoal[] = [
      { id: 'g1', title: `Deep Dive: ${weakTopics[0]}`, isCompleted: false, priority: 'high', deadline: Date.now() + 86400000 },
      { id: 'g2', title: `Practice: ${weakTopics[1] || 'Core Subject'}`, isCompleted: false, priority: 'medium', deadline: Date.now() + 172800000 },
      { id: 'g3', title: "Mock Session: General SAT", isCompleted: false, priority: 'high', deadline: Date.now() + 259200000 },
      { id: 'g4', title: "Review Study Notes: Biology", isCompleted: false, priority: 'low', deadline: Date.now() + 345600000 }
    ];
    onUpdateUser({ ...user, studyGoals: newGoals });
    setShowGenerator(false);
  };

  return (
    <div className="h-full flex flex-col gap-8 animate-fade-in max-w-5xl mx-auto py-4 overflow-y-auto custom-scrollbar pb-24">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-serif font-black text-luwa-dark tracking-tight">Daily Study Planner</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Personalized Cognitive Roadmap</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="p-3 text-luwa-primary hover:bg-luwa-primaryContainer rounded-full transition-all"
            title="Contextual Help"
          >
            <ICONS.HelpCircle className="w-6 h-6" />
          </button>
          {!showGenerator && (
            <button 
              onClick={() => setShowGenerator(true)}
              className="px-6 py-2 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              Regenerate Plan
            </button>
          )}
        </div>
      </header>

      {showHelp && (
        <GlassCard className="p-8 bg-luwa-primary text-white border-none animate-m3-fade" variant="elevated">
           <h4 className="label-large font-black uppercase mb-4 tracking-widest">How the Planner Works (11.2)</h4>
           <p className="text-xs font-medium leading-loose">
             The Luwa Neural Engine analyzes your historical practice accuracy, specific concept mastery levels, and the proximity of your target exam date to synthesize a high-impact daily directive. Complete high-priority tasks first to maximize your EUEE Readiness Index.
           </p>
        </GlassCard>
      )}

      {showGenerator ? (
        <GlassCard className="p-12 border-luwa-primary/10 bg-white">
          <div className="max-w-2xl mx-auto text-center space-y-10">
            <ICONS.Brain className="w-16 h-16 text-luwa-primary mx-auto animate-pulse" />
            <div className="space-y-4">
              <h3 className="text-2xl font-serif font-bold text-luwa-dark">Initialize AI Plan Generator</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Our neural engine will synthesize a daily schedule by analyzing your weak concepts, mastery history, and EUEE exam proximity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Available Study Hours/Day</label>
                <input 
                  type="range" min="1" max="12" value={studyHours} 
                  onChange={(e) => setStudyHours(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-luwa-primary" 
                />
                <div className="flex justify-between text-[10px] font-black text-luwa-primary uppercase">
                   <span>1 Hr</span>
                   <span className="bg-luwa-primary text-white px-2 py-0.5 rounded">{studyHours} Hours</span>
                   <span>12 Hrs</span>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Target Exam Date</label>
                <input 
                  type="date" value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-luwa-primary outline-none"
                />
              </div>
            </div>

            <button 
              onClick={generateAIPlan}
              className="w-full bg-luwa-primary text-white py-6 rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-xl shadow-luwa-primary/20 active:scale-95 transition-all"
            >
              Synthesize Study Plan
            </button>
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.3em] mb-4">Today's Directive</h3>
            {user.studyGoals?.map((goal) => (
              <div key={goal.id} className={`p-6 bg-white border rounded-2xl flex items-center justify-between group transition-all ${goal.isCompleted ? 'opacity-40 border-slate-100 grayscale' : 'border-slate-100 shadow-sm'}`}>
                <div className="flex items-center gap-6">
                   <button 
                    onClick={() => onUpdateUser({ ...user, studyGoals: user.studyGoals.map(g => g.id === goal.id ? { ...g, isCompleted: !g.isCompleted } : g) })}
                    className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all ${goal.isCompleted ? 'bg-luwa-secondary border-luwa-secondary text-white' : 'border-slate-100 hover:border-luwa-primary bg-slate-50'}`}
                   >
                     {goal.isCompleted && <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path d="M5 13l4 4L19 7"/></svg>}
                   </button>
                   <div>
                     <p className={`text-lg font-bold ${goal.isCompleted ? 'line-through text-slate-400' : 'text-luwa-dark'}`}>{goal.title}</p>
                     <div className="flex items-center gap-4 mt-1">
                       <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${goal.priority === 'high' ? 'bg-red-50 text-red-500' : goal.priority === 'medium' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'}`}>
                         {goal.priority} Priority
                       </span>
                       <span className="text-[8px] text-slate-400 font-bold uppercase">Estimated: 45 Mins</span>
                     </div>
                   </div>
                </div>
                {!goal.isCompleted && (
                  <button className="text-[9px] font-black uppercase text-luwa-primary border border-luwa-primary/20 px-4 py-2 rounded-lg hover:bg-luwa-primary hover:text-white transition-all">Start Task</button>
                )}
              </div>
            ))}
          </div>

          <div className="lg:col-span-4 space-y-8">
             <GlassCard className="border-slate-100 p-8">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6">Plan Adaptation</h4>
                <div className="space-y-4">
                   <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-[9px] font-black text-luwa-primary uppercase mb-1">Weekly Momentum</p>
                      <p className="text-xl font-black text-luwa-dark">On Track</p>
                   </div>
                   <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-[9px] font-black text-luwa-secondary uppercase mb-1">Consistency Score</p>
                      <p className="text-xl font-black text-luwa-dark">88%</p>
                   </div>
                </div>
                <div className="mt-8 pt-8 border-t border-slate-100">
                   <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                      Your study plan dynamically adjusts every 24 hours based on practice accuracy.
                   </p>
                </div>
             </GlassCard>
             
             <GlassCard className="border-luwa-secondary/10 bg-luwa-secondary/[0.02] p-8">
                <h4 className="text-[10px] font-black uppercase text-luwa-secondary tracking-widest mb-4">Milestone Countdown</h4>
                <p className="text-3xl font-serif font-black text-luwa-dark">112 Days</p>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Until National Exams</p>
             </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
};
