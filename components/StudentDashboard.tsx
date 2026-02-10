
/*
  Luwa Academy – Scholar Portal (Integrated Dashboard)
  Purpose: Consolidated view for scholar activities, progress, and quick actions.
*/

import React from 'react';
import { GlassCard } from './GlassCard.tsx';
import { User } from '../types.ts';
import { ICONS } from '../constants.tsx';

interface StudentDashboardProps {
  user: User;
  onNavigate: (tab: any) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, onNavigate }) => {
  const overviewCards = [
    { label: 'Courses Enrolled', value: 5, icon: '📚' },
    { label: 'Pending Tasks', value: 3, icon: '⏳' },
    { label: 'Prestige Level', value: user.prestige || 'Novice', icon: '💎' },
    { label: 'Readiness Index', value: `${user.readiness}%`, icon: '🎯' },
    { label: 'Study Streak', value: `${user.streak || 0} days`, icon: '🔥' },
  ];

  const activityStream = [
    'New announcement: EUEE Diagnostic next week.',
    'Assignment graded: Physics Mechanics Node.',
    'New study material: Biology Genetics Chapter 4.',
    'Upcoming event: University Prep Seminar on April 15.',
  ];

  const todaysSchedule = [
    { time: '9:00 AM', event: 'Math Class (Live Link)', tab: 'live' },
    { time: '11:00 AM', event: 'Physics Lab Session', tab: 'lab' },
    { time: '2:00 PM', event: 'Task Due: History Essay', tab: 'assignments' },
  ];

  const progressOverview = [
    { course: 'Mathematics', progress: 80, color: 'bg-luwa-primary' },
    { course: 'Physics', progress: 60, color: 'bg-luwa-secondary' },
    { course: 'English', progress: 90, color: 'bg-luwa-tertiary' },
  ];

  const quickActions = [
    { label: 'Submit Task', tab: 'assignments', icon: <ICONS.Copy className="w-4 h-4" /> },
    { label: 'Join Live Link', tab: 'live', icon: <ICONS.Mic className="w-4 h-4" /> },
    { label: 'View Insights', tab: 'analytics', icon: <ICONS.Layout className="w-4 h-4" /> },
    { label: 'Message Tutor', tab: 'tutor', icon: <ICONS.Brain className="w-4 h-4" /> },
    { label: 'Access Library', tab: 'library', icon: <ICONS.Layout className="w-4 h-4" /> },
  ];

  const badges = [
    { id: 1, name: 'Assignment Master', description: 'Completed 10 tasks on time' },
    { id: 2, name: 'Perfect Attendance', description: '100% activity this month' },
    { id: 3, name: 'Top Scorer', description: 'Achieved mastery in Unit Quiz' },
  ];

  const greeting = `Welcome back, Scholar! Keep up the great work!`;

  return (
    <div className="h-full space-y-8 animate-m3-fade pb-20 overflow-y-auto custom-scrollbar pr-2">
      {/* Personalized Greeting */}
      <GlassCard className="p-8 bg-luwa-primaryContainer border-none shadow-m3-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full hero-pattern opacity-5 pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-2xl font-serif font-black text-luwa-onPrimaryContainer">{greeting}</h2>
          <p className="text-luwa-primary font-black text-[10px] uppercase tracking-widest mt-2">Institutional Protocol Active</p>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Stats & Progress */}
        <div className="lg:col-span-8 space-y-8">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {overviewCards.map((card, index) => (
              <GlassCard key={index} className="p-6 bg-white border-slate-100 flex flex-col items-center text-center">
                <span className="text-2xl mb-3">{card.icon}</span>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
                <p className="text-lg font-black text-luwa-onSurface">{card.value}</p>
              </GlassCard>
            ))}
          </div>

          {/* Progress Overview */}
          <GlassCard className="p-8 bg-white border-slate-100">
            <h3 className="label-large font-black uppercase text-slate-400 mb-8 tracking-widest flex items-center gap-2">
              <ICONS.Layout className="w-4 h-4" /> Mastery Progress
            </h3>
            <div className="space-y-6">
              {progressOverview.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between text-[10px] font-black uppercase text-slate-600 mb-2">
                    <span>{item.course}</span>
                    <span>{item.progress}% Mastered</span>
                  </div>
                  <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Activity Stream */}
          <GlassCard className="p-8 bg-white border-slate-100">
            <h3 className="label-large font-black uppercase text-slate-400 mb-6 tracking-widest">Registry Activity</h3>
            <ul className="space-y-4">
              {activityStream.map((activity, index) => (
                <li key={index} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 transition-colors hover:bg-slate-100">
                  <div className="w-2 h-2 rounded-full bg-luwa-primary mt-1.5 shrink-0" />
                  <p className="text-sm font-medium text-slate-700">{activity}</p>
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>

        {/* Right Column: Schedule & Quick Actions */}
        <div className="lg:col-span-4 space-y-8">
          {/* Today's Schedule */}
          <GlassCard className="p-8 bg-white border-slate-100">
            <h3 className="label-large font-black uppercase text-slate-400 mb-6 tracking-widest">Temporal Roadmap</h3>
            <ul className="space-y-3">
              {todaysSchedule.map((item, index) => (
                <li key={index} onClick={() => onNavigate(item.tab)} className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 cursor-pointer hover:bg-luwa-primaryContainer hover:border-luwa-primary/30 transition-all group">
                  <span className="text-[10px] font-black text-slate-400 group-hover:text-luwa-primary">{item.time}</span>
                  <span className="text-xs font-bold text-luwa-onSurface">{item.event}</span>
                </li>
              ))}
            </ul>
          </GlassCard>

          {/* Achievements */}
          <GlassCard className="p-8 bg-slate-900 text-white border-none shadow-m3-3">
            <h3 className="label-small font-black uppercase text-luwa-primary mb-6 tracking-[0.3em]">Scholar Achievements</h3>
            <ul className="space-y-4">
              {badges.map((badge) => (
                <li key={badge.id} className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
                  <p className="text-xs font-black text-amber-400 uppercase tracking-widest mb-1">🏆 {badge.name}</p>
                  <p className="text-[10px] text-white/60 font-medium">{badge.description}</p>
                </li>
              ))}
            </ul>
          </GlassCard>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h3 className="label-large font-black uppercase text-slate-400 px-2 tracking-widest">Quick Directives</h3>
            <div className="grid grid-cols-1 gap-3">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => onNavigate(action.tab)}
                  className="flex items-center gap-4 p-5 bg-luwa-primary text-white rounded-2xl shadow-m3-2 hover:brightness-110 active:scale-95 transition-all text-left group"
                >
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white group-hover:text-luwa-primary transition-colors">
                    {action.icon}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
