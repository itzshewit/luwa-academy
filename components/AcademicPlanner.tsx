
/*
  Luwa Academy – AI-Powered Educational Platform
  Developed by Shewit – 2026
  Module: Advanced Study Schedule Planner
  V2.0 - High-Fidelity Calendar & Task Management
*/

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GlassCard } from './GlassCard.tsx';
import { User, StudyTask, Stream } from '../types.ts';
import { ICONS } from '../constants.tsx';
import { storageService } from '../services/storageService.ts';

interface AcademicPlannerProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

export const AcademicPlanner: React.FC<AcademicPlannerProps> = ({ user, onUpdateUser }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<StudyTask | null>(null);
  const [notification, setNotification] = useState<{ title: string, message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Form States
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formTime, setFormTime] = useState('09:00');
  const [formDuration, setFormDuration] = useState(60);
  const [formSubject, setFormSubject] = useState('');
  const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [formColor, setFormColor] = useState('#2563eb');
  const [formReminder, setFormReminder] = useState(15);

  const subjects = storageService.getSubjects(user.stream);

  useEffect(() => {
    const load = async () => {
      const t = await storageService.getStudyTasks();
      setTasks(t);
      setLoading(false);
    };
    load();
  }, []);

  // Reminder Check Effect
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      tasks.forEach(task => {
        if (task.completed) return;
        const taskDateTime = new Date(`${task.date}T${task.time}`);
        const reminderTime = new Date(taskDateTime.getTime() - task.reminder * 60000);
        
        const diff = Math.abs(now.getTime() - reminderTime.getTime());
        if (diff < 60000 && now >= reminderTime && now < taskDateTime) {
          showToast('Study Reminder', `"${task.title}" starts in ${task.reminder} minutes.`);
        }
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [tasks]);

  const showToast = (title: string, message: string) => {
    setNotification({ title, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const saveTasks = async (updatedTasks: StudyTask[]) => {
    setTasks(updatedTasks);
    // Ideally bulk put, but we persist individually for now or as needed
    // In this MVP we persist the specific task being changed
  };

  const handleToggleTask = async (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(updated);
    const task = updated.find(t => t.id === id);
    if (task) await storageService.saveStudyTask(task);
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Permanent Registry Deletion: Proceed?')) return;
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    await storageService.deleteStudyTask(id);
    showToast('Registry Updated', 'Study Node removed from schedule.');
  };

  const handleOpenModal = (task?: StudyTask) => {
    if (task) {
      setEditingTask(task);
      setFormTitle(task.title);
      setFormDesc(task.description || '');
      setFormTime(task.time);
      setFormDuration(task.duration);
      setFormSubject(task.subject);
      setFormPriority(task.priority);
      setFormColor(task.color);
      setFormReminder(task.reminder);
    } else {
      setEditingTask(null);
      setFormTitle('');
      setFormDesc('');
      setFormTime('09:00');
      setFormDuration(60);
      setFormSubject(subjects[0]);
      setFormPriority('medium');
      setFormColor('#2563eb');
      setFormReminder(15);
    }
    setShowModal(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const task: StudyTask = {
      id: editingTask?.id || Math.random().toString(36).substr(2, 9),
      title: formTitle,
      description: formDesc,
      date: selectedDate.toISOString().split('T')[0],
      time: formTime,
      duration: formDuration,
      subject: formSubject,
      priority: formPriority,
      color: formColor,
      reminder: formReminder,
      completed: editingTask?.completed || false,
      createdAt: editingTask?.createdAt || Date.now()
    };

    if (editingTask) {
      const updated = tasks.map(t => t.id === task.id ? task : t);
      setTasks(updated);
    } else {
      setTasks([...tasks, task]);
    }

    await storageService.saveStudyTask(task);
    setShowModal(false);
    showToast('Success', `Task ${editingTask ? 'updated' : 'created'} in registry.`);
  };

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const todayStr = new Date().toISOString().split('T')[0];
    const today = tasks.filter(t => t.date === todayStr).length;
    const now = new Date();
    const overdue = tasks.filter(t => {
      const tDate = new Date(`${t.date}T${t.time}`);
      return tDate < now && !t.completed;
    }).length;
    return { total, completed, today, overdue };
  }, [tasks]);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const days = [];
    // Prev month days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, month: month - 1, year, other: true });
    }
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, month, year, other: false });
    }
    // Next month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, month: month + 1, year, other: true });
    }
    return days;
  }, [currentDate]);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  if (loading) return (
    <div className="flex-1 flex items-center justify-center p-20 animate-pulse">
       <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-luwa-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Syncing Planner...</p>
       </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col gap-8 animate-m3-fade overflow-y-auto pb-24 pr-2 custom-scrollbar">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-24 right-8 z-[2000] bg-white border-2 border-luwa-primary p-6 rounded-2xl shadow-m3-3 flex items-center gap-4 animate-m3-fade">
           <div className="text-2xl">🔔</div>
           <div>
              <p className="text-xs font-black text-luwa-primary uppercase tracking-widest">{notification.title}</p>
              <p className="text-sm font-bold text-slate-700">{notification.message}</p>
           </div>
        </div>
      )}

      <header className="flex justify-between items-end shrink-0">
        <div>
           <h1 className="display-small font-serif font-black text-luwa-onSurface">Study Schedule Planner</h1>
           <p className="label-medium text-slate-400 font-black uppercase tracking-widest mt-1">Sovereign Academic Roadmap</p>
        </div>
        <div className="bg-slate-50 px-6 py-3 rounded-xl border border-slate-100 hidden md:block">
           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Calendar Section */}
        <div className="lg:col-span-8 flex flex-col gap-6">
           <GlassCard className="p-8 bg-white border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                 <h2 className="title-large font-serif font-black text-luwa-onSurface uppercase tracking-tight">📅 Calendar Index</h2>
                 <div className="flex gap-2">
                    <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all">←</button>
                    <span className="px-6 py-3 bg-slate-50 rounded-xl font-bold text-sm min-w-[150px] text-center">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                    <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all">→</button>
                    <button onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }} className="px-5 py-3 bg-luwa-primaryContainer text-luwa-primary font-black text-[10px] uppercase tracking-widest rounded-xl transition-all">Today</button>
                 </div>
              </div>

              <div className="grid grid-cols-7 gap-3">
                 {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                   <div key={d} className="text-center p-2 text-[10px] font-black uppercase text-slate-300 tracking-widest">{d}</div>
                 ))}
                 {calendarDays.map((d, i) => {
                   const cellDate = new Date(d.year, d.month, d.day);
                   const isSelected = cellDate.toDateString() === selectedDate.toDateString();
                   const isToday = cellDate.toDateString() === new Date().toDateString();
                   const tasksOnDay = tasks.filter(t => t.date === cellDate.toISOString().split('T')[0]);

                   return (
                     <button 
                       key={i} 
                       onClick={() => setSelectedDate(cellDate)}
                       className={`aspect-square p-2 border-2 rounded-2xl transition-all flex flex-col items-start ${d.other ? 'opacity-20 pointer-events-none' : ''} ${isSelected ? 'border-luwa-primary bg-luwa-primaryContainer shadow-inner' : isToday ? 'border-luwa-secondary bg-luwa-secondaryContainer' : 'border-slate-50 hover:border-luwa-primary/20 bg-white'}`}
                     >
                        <span className={`text-[10px] font-black ${isSelected ? 'text-luwa-primary' : 'text-slate-400'}`}>{d.day}</span>
                        <div className="flex-1 flex flex-col gap-1 w-full mt-1 overflow-hidden">
                           {tasksOnDay.slice(0, 3).map(t => (
                             <div key={t.id} className="h-1.5 w-full rounded-full" style={{ backgroundColor: t.color }} />
                           ))}
                        </div>
                     </button>
                   );
                 })}
              </div>
           </GlassCard>

           {/* Stats Summary Grid */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Nodes', value: stats.total, color: 'text-luwa-primary', bg: 'bg-luwa-primaryContainer' },
                { label: 'Completed', value: stats.completed, color: 'text-luwa-secondary', bg: 'bg-luwa-secondaryContainer' },
                { label: 'Today Only', value: stats.today, color: 'text-luwa-tertiary', bg: 'bg-amber-50' },
                { label: 'Overdue', value: stats.overdue, color: 'text-luwa-error', bg: 'bg-red-50' }
              ].map(s => (
                <GlassCard key={s.label} className={`p-6 border-none text-center ${s.bg}`} variant="elevated">
                   <p className="text-3xl font-black mb-1">{s.value}</p>
                   <p className={`text-[8px] font-black uppercase tracking-widest ${s.color}`}>{s.label}</p>
                </GlassCard>
              ))}
           </div>
        </div>

        {/* Schedule Detail Section */}
        <div className="lg:col-span-4 flex flex-col gap-6">
           <GlassCard className="p-8 bg-white border-slate-100 shadow-sm flex flex-col h-full">
              <div className="flex justify-between items-center mb-8">
                 <div>
                    <h3 className="label-large font-black uppercase text-slate-400 tracking-widest">Active Schedule</h3>
                    <p className="text-sm font-bold text-luwa-onSurface">{selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} Directive</p>
                 </div>
                 <button onClick={() => handleOpenModal()} className="p-4 bg-luwa-primary text-white rounded-2xl shadow-m3-2 m3-ripple active:scale-95 transition-all">
                    <ICONS.Zap className="w-5 h-5" />
                 </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                 {tasks.filter(t => t.date === selectedDate.toISOString().split('T')[0]).sort((a, b) => a.time.localeCompare(b.time)).map(task => (
                   <div key={task.id} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex gap-5 group transition-all">
                      <button 
                        onClick={() => handleToggleTask(task.id)}
                        className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all ${task.completed ? 'bg-luwa-secondary border-luwa-secondary text-white' : 'bg-white border-slate-200'}`}
                      >
                         {task.completed && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path d="M5 13l4 4L19 7"/></svg>}
                      </button>
                      <div className="flex-1 min-w-0">
                         <h4 className={`text-sm font-black truncate ${task.completed ? 'line-through opacity-40 text-slate-400' : 'text-luwa-onSurface'}`} style={{ color: !task.completed ? task.color : undefined }}>{task.title}</h4>
                         <div className="flex items-center gap-3 mt-1 opacity-60">
                            <span className="text-[9px] font-bold">🕐 {task.time}</span>
                            <span className="text-[9px] font-bold">📚 {task.subject}</span>
                         </div>
                      </div>
                      <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                         <button onClick={() => handleOpenModal(task)} className="text-[10px] text-slate-300 hover:text-luwa-primary">✏️</button>
                         <button onClick={() => handleDeleteTask(task.id)} className="text-[10px] text-slate-300 hover:text-red-500">🗑️</button>
                      </div>
                   </div>
                 ))}
                 {tasks.filter(t => t.date === selectedDate.toISOString().split('T')[0]).length === 0 && (
                   <div className="py-20 text-center opacity-20">
                      <span className="text-4xl block mb-4">📚</span>
                      <p className="text-[10px] font-black uppercase tracking-widest">No Node Directive</p>
                   </div>
                 )}
              </div>
           </GlassCard>

           <GlassCard className="p-8 bg-slate-900 text-white border-none shrink-0">
              <h3 className="label-small font-black uppercase tracking-[0.3em] mb-6 opacity-60">Upcoming Priorities</h3>
              <div className="space-y-3">
                 {tasks.filter(t => !t.completed && new Date(`${t.date}T${t.time}`) > new Date()).sort((a,b) => a.date.localeCompare(b.date)).slice(0, 3).map(task => {
                    const diff = (new Date(`${task.date}T${task.time}`).getTime() - new Date().getTime()) / (1000 * 60 * 60);
                    const urgency = diff <= 24 ? 'Urgent' : diff <= 72 ? 'Soon' : 'Later';
                    return (
                      <div key={task.id} className={`p-4 rounded-xl border-l-4 ${urgency === 'Urgent' ? 'bg-red-500/10 border-red-500' : urgency === 'Soon' ? 'bg-amber-500/10 border-amber-500' : 'bg-blue-500/10 border-blue-500'}`}>
                         <p className="text-[8px] font-black uppercase mb-1 opacity-60">{new Date(task.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {task.time}</p>
                         <p className="text-xs font-bold truncate">{task.title}</p>
                      </div>
                    );
                 })}
              </div>
           </GlassCard>
        </div>
      </div>

      {/* Task Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-m3-fade">
           <GlassCard className="max-w-xl w-full p-10 bg-white overflow-y-auto max-h-[90vh] custom-scrollbar" variant="elevated">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="title-large font-serif font-black text-luwa-onSurface uppercase tracking-tighter">{editingTask ? 'Modify Study Node' : 'Initialize Study Node'}</h2>
                 <button onClick={() => setShowModal(false)} className="p-3 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-all"><ICONS.X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSaveTask} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Node Objective</label>
                    <input value={formTitle} onChange={e => setFormTitle(e.target.value)} required placeholder="e.g. Master Calculus Limits" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-bold focus:bg-white focus:border-luwa-primary outline-none transition-all" />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Temporal Start</label>
                       <input type="time" value={formTime} onChange={e => setFormTime(e.target.value)} required className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-bold focus:bg-white outline-none" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Duration (Min)</label>
                       <input type="number" step="15" min="15" value={formDuration} onChange={e => setFormDuration(parseInt(e.target.value))} required className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-bold focus:bg-white outline-none" />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Academic Cluster</label>
                       <select value={formSubject} onChange={e => setFormSubject(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-bold focus:bg-white outline-none appearance-none cursor-pointer">
                          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Prestige Weight</label>
                       <select value={formPriority} onChange={e => setFormPriority(e.target.value as any)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-bold focus:bg-white outline-none appearance-none cursor-pointer">
                          <option value="low">Low Priority</option>
                          <option value="medium">Medium Priority</option>
                          <option value="high">High Priority</option>
                       </select>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Registry Visual Encoding</label>
                    <div className="flex gap-4">
                       {['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map(c => (
                         <button 
                           key={c} 
                           type="button"
                           onClick={() => setFormColor(c)}
                           className={`w-12 h-12 rounded-xl transition-all border-4 ${formColor === c ? 'border-slate-900 scale-110 shadow-lg' : 'border-transparent'}`} 
                           style={{ backgroundColor: c }} 
                         />
                       ))}
                    </div>
                 </div>

                 <div className="pt-8 border-t border-slate-100 flex gap-4">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 bg-slate-50 rounded-2xl label-large font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 transition-all">Cancel</button>
                    <button type="submit" className="flex-[2] py-5 bg-luwa-primary text-white rounded-2xl label-large font-black uppercase tracking-[0.2em] shadow-m3-2 m3-ripple active:scale-95 transition-all">Synchronize Plan</button>
                 </div>
              </form>
           </GlassCard>
        </div>
      )}
    </div>
  );
};
