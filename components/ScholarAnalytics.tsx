/*
  Module: Scholar Analytics & Audit System
  Purpose: Aggregates academic performance metrics and executes complex performance audits to provide scholars with actionable insights.
*/

import React, { useState, useMemo } from 'react';
import { GlassCard } from './GlassCard';
import { User, QuizResult, ConceptMastery, LifecycleStage } from '../types';
import { ICONS } from '../constants';
import { geminiService } from '../services/geminiService';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

interface ScholarAnalyticsProps {
  user: User;
}

export const ScholarAnalytics: React.FC<ScholarAnalyticsProps> = ({ user }) => {
  const [audit, setAudit] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const masteryList = Object.values(user.masteryRecord || {}) as ConceptMastery[];

  const performBrainAudit = async () => {
    if (user.quizHistory.length === 0) return;
    setIsAnalyzing(true);
    try {
      const result = await geminiService.auditPerformance(user.quizHistory);
      setAudit(result);
    } catch (err) {
      console.error(err);
      setAudit("Synchronous audit failed. Registry servers busy.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const metrics = useMemo(() => {
    const history = user.quizHistory;
    if (history.length === 0) return { accuracy: 0, totalQuestions: 0, trend: 'neutral', avgEffort: 0, avgRetention: 0 };
    const totalPossible = history.length * 5;
    const totalScore = history.reduce((acc, curr) => acc + curr.score, 0);
    const accuracy = Math.round((totalScore / totalPossible) * 100);
    const avgEffort = Math.round((history.reduce((acc, curr) => acc + (curr.aggregateEffort || 0.5), 0) / history.length) * 100);
    const avgRetention = masteryList.length > 0 ? Math.round((masteryList.reduce((acc, curr) => acc + curr.retentionScore, 0) / masteryList.length) * 100) : 0;
    return { accuracy, totalQuestions: totalPossible, avgEffort, avgRetention };
  }, [user.quizHistory, masteryList]);

  const healthData = [
    { name: 'Engagement', value: user.health.engagementScore * 100 },
    { name: 'Consistency', value: user.health.consistencyLevel * 100 },
    { name: 'Burnout Risk', value: user.health.burnoutRisk * 100 },
  ];

  return (
    <div className="h-full flex flex-col gap-10 animate-fade-in overflow-y-auto pr-6 custom-scrollbar pb-10">
      <div className="flex justify-between items-end shrink-0 border-b border-white/5 pb-10">
        <div>
          <h2 className="text-5xl font-black uppercase tracking-tighter luwa-gold">Academic Record</h2>
          <p className="text-[11px] text-gray-600 font-black uppercase tracking-[0.5em] mt-3">Prestige: {user.prestige} Tier • Status: {user.health.status}</p>
        </div>
        <div className="text-right">
           <p className="text-[9px] text-gray-700 uppercase font-black tracking-widest mb-1">Readiness Index</p>
           <p className="text-4xl font-black text-white tracking-tight">{user.readiness}<span className="text-luwa-gold text-lg">%</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 shrink-0">
        <GlassCard className="text-center p-10 border-luwa-gold/10 bg-luwa-gold/[0.01]">
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em] mb-4">Neural XP</p>
          <p className="text-5xl font-black luwa-gold">{user.xp}</p>
        </GlassCard>
        <GlassCard className="text-center p-10 border-white/5 bg-white/[0.01]">
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em] mb-4">Retention</p>
          <p className="text-5xl font-black text-white">{metrics.avgRetention}%</p>
        </GlassCard>
        <GlassCard className="text-center p-10 border-white/5 bg-white/[0.01]">
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em] mb-4">Effort Integrity</p>
          <p className="text-5xl font-black text-white">{metrics.avgEffort}%</p>
        </GlassCard>
        <GlassCard className="text-center p-10 border-white/5 bg-white/[0.01]">
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em] mb-4">Health</p>
          <p className={`text-2xl font-black uppercase ${user.health.burnoutRisk > 0.6 ? 'text-red-500' : 'text-green-500'}`}>{user.health.status}</p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-10">
           <GlassCard className="border-white/5 p-10 flex flex-col h-[400px]">
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-600 mb-8">Academic Health Pulse</h3>
              <div className="flex-1 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={healthData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      <Cell fill="#008B8B" />
                      <Cell fill="#FFD700" />
                      <Cell fill="#9B111E" />
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0A0A0B', border: 'none', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
           </GlassCard>
        </div>

        <div className="lg:col-span-2 space-y-10">
          <GlassCard className="border-white/5 p-16 h-full flex flex-col">
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-600 flex items-center gap-4 mb-12">
              <ICONS.Brain className="w-5 h-5 luwa-gold" />
              Institutional Audit & Performance Analysis
            </h3>
            {isAnalyzing ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                 <div className="w-16 h-16 border-2 border-luwa-gold/10 border-t-luwa-gold rounded-full animate-spin mb-10" />
                 <p className="text-[11px] font-black uppercase tracking-[0.5em] text-luwa-gold animate-pulse text-center">Executing Audit Cycle...</p>
              </div>
            ) : audit ? (
              <div className="flex-1 flex flex-col animate-fade-in">
                <div className="text-sm text-gray-400 leading-loose whitespace-pre-wrap p-10 bg-black/60 rounded-[2.5rem] border border-white/5 flex-1 max-h-[550px] overflow-y-auto custom-scrollbar shadow-inner font-medium">
                  {audit}
                </div>
                <button onClick={performBrainAudit} className="mt-10 text-[10px] font-black uppercase tracking-[0.4em] text-gray-700 hover:text-luwa-gold transition-all">Generate New Report</button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <ICONS.Trophy className="w-24 h-24 text-white/[0.01] mb-12" />
                <p className="text-[11px] text-gray-700 uppercase font-black tracking-[0.5em] mb-12 leading-loose max-w-sm">
                  Strategic Audit Ready.<br/>Input: {user.quizHistory.length} Sessions detected.
                </p>
                <button onClick={performBrainAudit} disabled={user.quizHistory.length < 2} className="w-full bg-luwa-gold text-black font-black py-6 rounded-2xl text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:brightness-110 transition-all">
                  AUTHORIZE PERFORMANCE AUDIT
                </button>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
};