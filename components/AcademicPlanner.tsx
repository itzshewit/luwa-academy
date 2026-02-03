import React, { useState } from 'react';
import { GlassCard } from './GlassCard.tsx';
import { User, StudyGoal } from '../types.ts';
import { ICONS } from '../constants.tsx';

interface AcademicPlannerProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

export const AcademicPlanner: React.FC<AcademicPlannerProps> = ({ user, onUpdateUser }) => {
  const [newGoal, setNewGoal] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const addGoal = () => {
    if (!newGoal.trim()) return;
    const goal: StudyGoal = {
      id: Math.random().toString(36).substr(2, 9),
      title: newGoal,
      deadline: Date.now() + 86400000,
      isCompleted: false,
      priority
    };
    onUpdateUser({ ...user, studyGoals: [...(user.studyGoals || []), goal] });
    setNewGoal('');
  };

  const toggleGoal = (id: string) => {
    const goals = (user.studyGoals || []).map(g => g.id === id ? { ...g, isCompleted: !g.isCompleted } : g);
    onUpdateUser({ ...user, studyGoals: goals });
  };

  const removeGoal = (id: string) => {
    const goals = (user.studyGoals || []).filter(g => g.id !== id);
    onUpdateUser({ ...user, studyGoals: goals });
  };

  return (
    <div className="h-full flex flex-col gap-10 animate-fade-in max-w-4xl mx-auto py-4">
      <header className="text-center">
        <h2 className="text-5xl font-serif font-bold text-luwa-purple tracking-tight">Daily Study Planner</h2>
        <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.4em] mt-3">Commit to Excellence</p>
      </header>

      <GlassCard className="p-10 border-luwa-purple/5">
        <div className="flex flex-col md:flex-row gap-4">
          <input 
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            placeholder="Define next cognitive goal..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium focus:border-luwa-purple outline-none"
          />
          <div className="flex gap-2">
            {(['low', 'medium', 'high'] as const).map(p => (
              <button 
                key={p} 
                onClick={() => setPriority(p)}
                className={`px-6 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border ${priority === p ? 'bg-luwa-purple text-white border-luwa-purple' : 'bg-white text-slate-400 border-slate-200'}`}
              >
                {p}
              </button>
            ))}
          </div>
          <button 
            onClick={addGoal}
            className="bg-luwa-teal text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-luwa-teal/20"
          >
            Add Goal
          </button>
        </div>
      </GlassCard>

      <div className="space-y-4">
        {user.studyGoals?.length === 0 && (
          <div className="py-20 text-center opacity-20">
             <ICONS.Zap className="w-16 h-16 mx-auto mb-6" />
             <p className="text-[12px] font-black uppercase tracking-[0.5em]">No active goals defined</p>
          </div>
        )}
        
        {user.studyGoals?.sort((a,b) => a.isCompleted ? 1 : -1).map(goal => (
          <div key={goal.id} className={`p-6 bg-white border rounded-2xl flex items-center justify-between group transition-all ${goal.isCompleted ? 'opacity-40 border-slate-100 grayscale' : 'border-slate-200 shadow-sm'}`}>
            <div className="flex items-center gap-6">
               <button 
                onClick={() => toggleGoal(goal.id)}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${goal.isCompleted ? 'bg-luwa-teal border-luwa-teal text-white' : 'border-slate-200 hover:border-luwa-teal'}`}
               >
                 {goal.isCompleted && <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path d="M5 13l4 4L19 7"/></svg>}
               </button>
               <div>
                 <p className={`text-lg font-bold ${goal.isCompleted ? 'line-through text-slate-400' : 'text-luwa-purple'}`}>{goal.title}</p>
                 <div className="flex items-center gap-4 mt-1">
                   <span className={`text-[8px] font-black uppercase tracking-widest ${goal.priority === 'high' ? 'text-red-500' : goal.priority === 'medium' ? 'text-amber-500' : 'text-blue-500'}`}>
                     {goal.priority} Priority
                   </span>
                 </div>
               </div>
            </div>
            <button 
              onClick={() => removeGoal(goal.id)}
              className="text-slate-300 hover:text-red-500 transition-colors p-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};