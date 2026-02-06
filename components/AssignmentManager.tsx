
/*
  Luwa Academy – AI-Powered Educational Platform
  Developed by Shewit – 2026
  Module: Institutional Assignment Manager
  V1.0 - Hybrid Teacher/Student Logic Nodes
*/

import React, { useState, useEffect, useMemo } from 'react';
import { GlassCard } from './GlassCard.tsx';
import { User, Assignment, AssignmentQuestion, AssignmentSubmission, AssignmentQuestionType } from '../types.ts';
import { ICONS } from '../constants.tsx';
import { storageService } from '../services/storageService.ts';

interface AssignmentManagerProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onNavigate: (tab: string) => void;
}

export const AssignmentManager: React.FC<AssignmentManagerProps> = ({ user, onUpdateUser, onNavigate }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [view, setView] = useState<'teacher' | 'student'>(user.role === 'admin' ? 'teacher' : 'student');
  const [activeModal, setActiveModal] = useState<'create' | 'submissions' | 'grade' | null>(null);
  
  // Create Assignment State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSubject, setNewSubject] = useState('Mathematics');
  const [newDueDate, setNewDueDate] = useState('');
  const [newStatus, setNewStatus] = useState<'draft' | 'active'>('active');
  const [newQuestions, setNewQuestions] = useState<AssignmentQuestion[]>([]);

  // Submissions/Grading State
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null);
  const [overallFeedback, setOverallFeedback] = useState('');
  const [manualGrades, setManualGrades] = useState<Record<number, number>>({});

  useEffect(() => {
    loadRegistry();
  }, []);

  const loadRegistry = async () => {
    const [a, s] = await Promise.all([
      storageService.getAssignments(),
      storageService.getAssignmentSubmissions()
    ]);
    setAssignments(a);
    setSubmissions(s);
  };

  const teacherStats = useMemo(() => {
    const pending = submissions.filter(s => s.grade === null).length;
    const graded = submissions.filter(s => s.grade !== null);
    const avg = graded.length > 0 
      ? Math.round(graded.reduce((acc, s) => acc + (s.grade || 0), 0) / graded.length)
      : 0;
    return { total: assignments.length, pending, avg, totalSub: submissions.length };
  }, [assignments, submissions]);

  const handleCreateAssignment = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    setNewTitle('');
    setNewDesc('');
    setNewDueDate(nextWeek.toISOString().split('T')[0]);
    setNewQuestions([]);
    setActiveModal('create');
  };

  const addQuestionNode = () => {
    const q: AssignmentQuestion = {
      id: Date.now(),
      type: 'multiple-choice',
      text: '',
      points: 10,
      options: ['', '', '', ''],
      correctAnswer: 0
    };
    setNewQuestions([...newQuestions, q]);
  };

  const saveAssignmentRegistry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newQuestions.length === 0) return alert("Registry Error: Node requires at least one question.");
    
    const totalPoints = newQuestions.reduce((acc, q) => acc + q.points, 0);
    const assignment: Assignment = {
      id: `asgn_${Date.now()}`,
      title: newTitle,
      description: newDesc,
      subject: newSubject,
      totalPoints,
      dueDate: newDueDate,
      status: newStatus,
      questions: newQuestions,
      createdAt: new Date().toISOString()
    };

    await storageService.saveAssignment(assignment);
    setActiveModal(null);
    loadRegistry();
    alert("Assignment Synchronized with Institutional Registry.");
  };

  const handleGradeSubmission = (sub: AssignmentSubmission) => {
    const asgn = assignments.find(a => a.id === sub.assignmentId);
    if (!asgn) return;
    setSelectedAssignment(asgn);
    setSelectedSubmission(sub);
    setOverallFeedback(sub.feedback || '');
    
    const initialManual: Record<number, number> = {};
    asgn.questions.forEach((q, idx) => {
      if (q.type === 'essay' || q.type === 'short-answer') {
        // Find existing score or default to 0
        initialManual[idx] = 0;
      }
    });
    setManualGrades(initialManual);
    setActiveModal('grade');
  };

  const submitFinalGrade = async () => {
    if (!selectedSubmission || !selectedAssignment) return;
    
    let earned = 0;
    selectedAssignment.questions.forEach((q, idx) => {
      if (q.type === 'multiple-choice' || q.type === 'true-false') {
        const studentAns = selectedSubmission.answers[idx];
        if (studentAns === q.correctAnswer) earned += q.points;
      } else {
        earned += manualGrades[idx] || 0;
      }
    });

    const percentage = Math.round((earned / selectedAssignment.totalPoints) * 100);
    const updated: AssignmentSubmission = {
      ...selectedSubmission,
      grade: percentage,
      earnedPoints: earned,
      totalPoints: selectedAssignment.totalPoints,
      feedback: overallFeedback,
      gradedAt: new Date().toISOString()
    };

    await storageService.saveAssignmentSubmission(updated);
    setActiveModal('submissions');
    loadRegistry();
    alert(`Grade Node Transmitted: ${percentage}%`);
  };

  return (
    <div className="h-full flex flex-col gap-8 animate-m3-fade overflow-y-auto pb-24 pr-2 custom-scrollbar">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h2 className="headline-medium font-serif font-black text-luwa-onSurface">Assignment Manager</h2>
           <p className="label-small text-slate-400 font-black uppercase tracking-[0.4em] mt-2">Institutional Task Protocol V1.0</p>
        </div>
        {user.role === 'admin' && (
          <div className="flex bg-slate-50 p-1 rounded-m3-xl border border-slate-100">
             <button onClick={() => setView('teacher')} className={`px-6 py-2 rounded-m3-l label-small font-black uppercase tracking-widest transition-all ${view === 'teacher' ? 'bg-white text-luwa-primary shadow-sm' : 'text-slate-400'}`}>Teacher</button>
             <button onClick={() => setView('student')} className={`px-6 py-2 rounded-m3-l label-small font-black uppercase tracking-widest transition-all ${view === 'student' ? 'bg-white text-luwa-primary shadow-sm' : 'text-slate-400'}`}>Student</button>
          </div>
        )}
      </header>

      {view === 'teacher' ? (
        <div className="space-y-12">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
             {[
               { label: 'Total Units', value: teacherStats.total, icon: '📝', color: 'blue' },
               { label: 'Pending Audit', value: teacherStats.pending, icon: '⏳', color: 'amber' },
               { label: 'Cohort Average', value: `${teacherStats.avg}%`, icon: '📊', color: 'green' },
               { label: 'Global Transmissions', value: teacherStats.totalSub, icon: '👥', color: 'purple' }
             ].map((s, i) => (
               <GlassCard key={i} className="p-8 bg-white border-slate-50 shadow-sm flex items-center gap-6">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner">{s.icon}</div>
                  <div>
                     <p className="text-3xl font-black text-luwa-onSurface">{s.value}</p>
                     <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{s.label}</p>
                  </div>
               </GlassCard>
             ))}
          </div>

          <div className="flex justify-between items-end border-b border-slate-100 pb-6">
             <h3 className="title-large font-serif font-black text-luwa-onSurface uppercase tracking-tight">Active Registries</h3>
             <button onClick={handleCreateAssignment} className="px-8 py-4 bg-luwa-primary text-white rounded-xl label-small font-black uppercase tracking-widest shadow-m3-2 m3-ripple">+ Initialize Unit</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
             {assignments.map(asgn => (
               <GlassCard key={asgn.id} onClick={() => { setSelectedAssignment(asgn); setActiveModal('submissions'); }} className="p-8 bg-white border-slate-100 hover:border-luwa-primary/20 transition-all flex flex-col justify-between h-full group">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                       <span className="bg-luwa-primaryContainer text-luwa-primary px-3 py-1 rounded-full text-[9px] font-black uppercase">{asgn.subject}</span>
                       <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${asgn.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>{asgn.status}</span>
                    </div>
                    <h4 className="text-xl font-black text-luwa-onSurface mb-2 leading-tight group-hover:text-luwa-primary transition-colors">{asgn.title}</h4>
                    <div className="flex flex-wrap gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-8">
                       <span>📅 Due: {new Date(asgn.dueDate).toLocaleDateString()}</span>
                       <span>💯 {asgn.totalPoints} PTS</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                     <div className="text-center">
                        <p className="text-xl font-black text-luwa-primary">{submissions.filter(s => s.assignmentId === asgn.id).length}</p>
                        <p className="text-[8px] font-black uppercase text-slate-400">Submissions</p>
                     </div>
                     <div className="text-center">
                        <p className="text-xl font-black text-luwa-primary">{asgn.questions.length}</p>
                        <p className="text-[8px] font-black uppercase text-slate-400">Nodes</p>
                     </div>
                  </div>
               </GlassCard>
             ))}
             {assignments.length === 0 && (
               <div className="col-span-full py-20 text-center opacity-20">
                  <ICONS.Layout className="w-20 h-20 mx-auto mb-6 text-slate-300" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No Assignment Nodes Detected</p>
               </div>
             )}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
           <header className="flex justify-between items-center">
              <h3 className="title-large font-serif font-black text-luwa-onSurface uppercase tracking-tight">Personal Academic Ledger</h3>
           </header>
           
           <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left">
                 <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                       <th className="px-10 py-5">Academic Unit</th>
                       <th className="px-10 py-5">Temporal Limit</th>
                       <th className="px-10 py-5">Status Node</th>
                       <th className="px-10 py-5 text-right">Audit Result</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {assignments.map(asgn => {
                       const sub = submissions.find(s => s.assignmentId === asgn.id && s.userId === user.id);
                       return (
                         <tr key={asgn.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-10 py-6">
                               <p className="text-sm font-black text-luwa-onSurface">{asgn.title}</p>
                               <p className="text-[9px] text-luwa-primary font-bold uppercase mt-1">{asgn.subject}</p>
                            </td>
                            <td className="px-10 py-6">
                               <p className="text-xs font-bold text-slate-500">{new Date(asgn.dueDate).toLocaleDateString()}</p>
                            </td>
                            <td className="px-10 py-6">
                               <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${sub?.grade !== null && sub ? 'bg-luwa-primaryContainer text-luwa-primary' : sub ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                                  {sub?.grade !== null && sub ? 'Graded' : sub ? 'Submitted' : 'Pending'}
                               </span>
                            </td>
                            <td className="px-10 py-6 text-right">
                               {sub?.grade !== null && sub ? (
                                 <span className={`text-xl font-black ${sub.grade >= 80 ? 'text-green-500' : 'text-luwa-primary'}`}>{sub.grade}%</span>
                               ) : (
                                 <span className="text-[10px] font-black text-slate-300 uppercase">--</span>
                               )}
                            </td>
                         </tr>
                       );
                    })}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {/* Modal Overlay System */}
      {activeModal === 'create' && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-m3-fade">
           <GlassCard className="max-w-4xl w-full p-10 bg-white overflow-y-auto max-h-[90vh] custom-scrollbar" variant="elevated">
              <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-50">
                 <h3 className="headline-small font-serif font-black text-luwa-onSurface uppercase tracking-tighter">Initialize Assignment Node</h3>
                 <button onClick={() => setActiveModal(null)} className="p-3 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-all"><ICONS.X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={saveAssignmentRegistry} className="space-y-10">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Unit Title *</label>
                          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} required placeholder="e.g. Physics - Advanced Mechanics" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-bold focus:bg-white focus:border-luwa-primary outline-none transition-all" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Temporal Limit (Due Date) *</label>
                          <input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} required className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-bold focus:bg-white outline-none" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Instructions Node</label>
                       <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Provide scholarly directives..." className="w-full h-[162px] bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-bold focus:bg-white outline-none resize-none" />
                    </div>
                 </div>

                 <div className="pt-10 border-t border-slate-50">
                    <div className="flex justify-between items-center mb-8">
                       <h4 className="title-medium font-serif font-black text-luwa-onSurface uppercase tracking-widest">Categorical Questions</h4>
                       <button type="button" onClick={addQuestionNode} className="px-6 py-3 bg-luwa-primaryContainer text-luwa-primary rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-luwa-primary hover:text-white transition-all">+ Add Logic Node</button>
                    </div>

                    <div className="space-y-6">
                       {newQuestions.map((q, idx) => (
                         <div key={q.id} className="p-8 bg-slate-50 border border-slate-100 rounded-3xl space-y-6 relative group">
                            <button type="button" onClick={() => setNewQuestions(newQuestions.filter(nq => nq.id !== q.id))} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">🗑️</button>
                            <div className="flex flex-wrap gap-4 items-center">
                               <span className="w-8 h-8 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-xs font-black text-slate-400">{idx + 1}</span>
                               <select value={q.type} onChange={e => {
                                 const updated = [...newQuestions];
                                 updated[idx].type = e.target.value as any;
                                 if (e.target.value === 'true-false') { updated[idx].correctAnswer = true; updated[idx].options = []; }
                                 else if (e.target.value === 'multiple-choice') { updated[idx].options = ['', '', '', '']; updated[idx].correctAnswer = 0; }
                                 setNewQuestions(updated);
                               }} className="bg-white border border-slate-100 rounded-xl px-4 py-2 text-[9px] font-black uppercase tracking-widest outline-none">
                                  <option value="multiple-choice">MCQ</option>
                                  <option value="true-false">T/F</option>
                                  <option value="short-answer">Short Answer</option>
                                  <option value="essay">Essay</option>
                               </select>
                               <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-black text-slate-400 uppercase">Weight:</span>
                                  <input type="number" value={q.points} onChange={e => {
                                    const updated = [...newQuestions];
                                    updated[idx].points = parseInt(e.target.value) || 0;
                                    setNewQuestions(updated);
                                  }} className="w-16 bg-white border border-slate-100 rounded-lg px-2 py-1 text-xs font-bold text-luwa-primary outline-none" />
                               </div>
                            </div>
                            <textarea value={q.text} onChange={e => {
                              const updated = [...newQuestions];
                              updated[idx].text = e.target.value;
                              setNewQuestions(updated);
                            }} required placeholder="Enunciate question text..." className="w-full p-6 bg-white border border-slate-100 rounded-2xl text-sm font-bold focus:border-luwa-primary outline-none transition-all resize-none" />
                            
                            {q.type === 'multiple-choice' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                 {q.options?.map((opt, oIdx) => (
                                   <div key={oIdx} className="flex gap-3 items-center bg-white p-3 rounded-xl border border-slate-100">
                                      <input type="radio" checked={q.correctAnswer === oIdx} onChange={() => {
                                        const updated = [...newQuestions];
                                        updated[idx].correctAnswer = oIdx;
                                        setNewQuestions(updated);
                                      }} />
                                      <input value={opt} onChange={e => {
                                        const updated = [...newQuestions];
                                        updated[idx].options![oIdx] = e.target.value;
                                        setNewQuestions(updated);
                                      }} placeholder={`Option ${String.fromCharCode(65+oIdx)}`} className="flex-1 bg-transparent border-none outline-none text-xs font-bold" />
                                   </div>
                                 ))}
                              </div>
                            )}

                            {q.type === 'true-false' && (
                              <div className="flex gap-4">
                                 {[true, false].map(val => (
                                   <button key={String(val)} type="button" onClick={() => {
                                     const updated = [...newQuestions];
                                     updated[idx].correctAnswer = val;
                                     setNewQuestions(updated);
                                   }} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${q.correctAnswer === val ? 'bg-luwa-primary text-white border-luwa-primary shadow-sm' : 'bg-white text-slate-400 border-slate-100'}`}>{val ? 'True' : 'False'}</button>
                                 ))}
                              </div>
                            )}
                         </div>
                       ))}
                    </div>
                 </div>

                 <button type="submit" className="w-full py-6 bg-luwa-primary text-white rounded-3xl label-large font-black uppercase tracking-[0.4em] shadow-m3-3 m3-ripple transition-all active:scale-[0.98]">Deploy to Academic Web</button>
              </form>
           </GlassCard>
        </div>
      )}

      {activeModal === 'submissions' && selectedAssignment && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-m3-fade">
           <GlassCard className="max-w-4xl w-full p-10 bg-white overflow-hidden max-h-[90vh] flex flex-col" variant="elevated">
              <div className="flex justify-between items-center mb-10 shrink-0">
                 <div>
                    <h3 className="headline-small font-serif font-black text-luwa-onSurface uppercase tracking-tighter">Node Submissions</h3>
                    <p className="label-small text-slate-400 font-black uppercase tracking-widest mt-1">{selectedAssignment.title}</p>
                 </div>
                 <button onClick={() => setActiveModal(null)} className="p-3 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-all"><ICONS.X className="w-5 h-5" /></button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 rounded-3xl border border-slate-100">
                 <table className="w-full text-left">
                    <thead className="bg-white sticky top-0 border-b border-slate-100 z-10">
                       <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="px-8 py-5">Scholar</th>
                          <th className="px-8 py-5">Transmission Time</th>
                          <th className="px-8 py-5 text-center">Audit Status</th>
                          <th className="px-8 py-5 text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {submissions.filter(s => s.assignmentId === selectedAssignment.id).map(sub => (
                         <tr key={sub.id} className="hover:bg-white transition-all">
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full bg-luwa-primaryContainer text-luwa-primary flex items-center justify-center font-black text-xs shadow-sm">{sub.studentName.charAt(0)}</div>
                                  <div>
                                     <p className="text-sm font-black text-luwa-onSurface">{sub.studentName}</p>
                                     <p className="text-[8px] text-slate-400 font-bold uppercase">{sub.studentId}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-8 py-6 text-xs font-bold text-slate-500">{new Date(sub.submittedAt).toLocaleString()}</td>
                            <td className="px-8 py-6 text-center">
                               {sub.grade !== null ? (
                                 <span className="text-lg font-black text-green-500">{sub.grade}%</span>
                               ) : (
                                 <span className="inline-flex px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[8px] font-black uppercase animate-pulse">Awaiting Audit</span>
                               )}
                            </td>
                            <td className="px-8 py-6 text-right">
                               <button onClick={() => handleGradeSubmission(sub)} className="px-6 py-2.5 bg-luwa-primary text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm m3-ripple">{sub.grade !== null ? 'Re-Audit' : 'Audit Node'}</button>
                            </td>
                         </tr>
                       ))}
                       {submissions.filter(s => s.assignmentId === selectedAssignment.id).length === 0 && (
                         <tr><td colSpan={4} className="py-20 text-center text-[10px] font-black uppercase text-slate-300 tracking-[0.4em]">No Scholar Transmissions</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </GlassCard>
        </div>
      )}

      {activeModal === 'grade' && selectedSubmission && selectedAssignment && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-m3-fade">
           <GlassCard className="max-w-4xl w-full p-10 bg-white overflow-y-auto max-h-[95vh] custom-scrollbar" variant="elevated">
              <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-50">
                 <div>
                    <h3 className="headline-small font-serif font-black text-luwa-onSurface uppercase tracking-tighter">Performance Audit</h3>
                    <p className="label-small text-luwa-primary font-black uppercase tracking-widest mt-1">Scholar: {selectedSubmission.studentName}</p>
                 </div>
                 <button onClick={() => setActiveModal('submissions')} className="p-3 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-all"><ICONS.X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-8">
                 {selectedAssignment.questions.map((q, idx) => {
                   const studentAns = selectedSubmission.answers[idx];
                   const isAuto = q.type === 'multiple-choice' || q.type === 'true-false';
                   const isCorrect = isAuto && studentAns === q.correctAnswer;
                   
                   return (
                     <div key={idx} className="p-8 bg-slate-50 border border-slate-100 rounded-3xl space-y-6">
                        <div className="flex justify-between items-start">
                           <p className="text-sm font-black text-luwa-onSurface"><span className="text-slate-400 mr-2">NODE {idx + 1}:</span> {q.text}</p>
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">({q.points} PTS)</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="p-6 bg-white rounded-2xl border border-slate-100">
                              <p className="text-[8px] font-black uppercase text-slate-400 mb-2">Scholar Response</p>
                              <p className="text-sm font-bold text-slate-700">{isAuto ? (q.type === 'true-false' ? String(studentAns) : q.options?.[studentAns]) : (studentAns || 'N/A')}</p>
                           </div>
                           {isAuto && (
                              <div className={`p-6 rounded-2xl border ${isCorrect ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                 <p className="text-[8px] font-black uppercase mb-2 opacity-60">System Registry Key</p>
                                 <p className="text-sm font-black">{q.type === 'true-false' ? String(q.correctAnswer) : q.options?.[q.correctAnswer]}</p>
                              </div>
                           )}
                           {!isAuto && (
                              <div className="p-6 bg-luwa-primaryContainer rounded-2xl border border-luwa-primary/10">
                                 <p className="text-[8px] font-black uppercase text-luwa-primary mb-2">Manual Grade Assignment</p>
                                 <input type="number" max={q.points} min={0} value={manualGrades[idx]} onChange={e => setManualGrades({...manualGrades, [idx]: parseFloat(e.target.value) || 0})} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-lg font-black text-luwa-primary outline-none" />
                              </div>
                           )}
                        </div>
                        {isAuto && (
                          <div className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest inline-flex ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                             {isCorrect ? `Verified: ${q.points}/${q.points}` : `Mismatch: 0/${q.points}`}
                          </div>
                        )}
                     </div>
                   );
                 })}

                 <div className="pt-10 border-t border-slate-100 space-y-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Global Feedback Synthesis</label>
                       <textarea value={overallFeedback} onChange={e => setOverallFeedback(e.target.value)} placeholder="Provide final academic critique..." className="w-full h-32 bg-slate-50 border border-slate-100 rounded-3xl p-6 text-sm font-bold focus:bg-white outline-none transition-all resize-none" />
                    </div>
                    <button onClick={submitFinalGrade} className="w-full py-6 bg-luwa-primary text-white rounded-3xl label-large font-black uppercase tracking-[0.4em] shadow-m3-3 m3-ripple transition-all active:scale-95">Synchronize Audit Result</button>
                 </div>
              </div>
           </GlassCard>
        </div>
      )}
    </div>
  );
};
