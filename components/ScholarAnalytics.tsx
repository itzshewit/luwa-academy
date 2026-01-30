
/*
  Luwa Academy – AI-Powered Educational Platform
  Developed by Shewit – 2026
  Purpose: Interactive, gamified, and AI-assisted learning for high school students.
  Module: Scholar Analytics & Audit System
  Author: Shewit – 2026
*/

import React, { useState, useMemo } from 'react';
import { GlassCard } from './GlassCard';
import { User, QuizResult, ConceptMastery } from '../types';
import { ICONS, COLORS } from '../constants';
import { geminiService } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar 
} from 'recharts';

interface ScholarAnalyticsProps {
  user: User;
}

export const ScholarAnalytics: React.FC<ScholarAnalyticsProps> = ({ user }) => {
  const [audit, setAudit] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const masteryList = Object.values(user.masteryRecord || {}) as ConceptMastery[];
  const cohortStats = useMemo(() => storageService.getCohortStats(), []);

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
    if (history.length === 0) return { accuracy: 0, totalQuestions: 0, avgEffort: 0, avgRetention: 0, percentile: 0 };
    
    const totalPossible = history.length * 5;
    const totalScore = history.reduce((acc, curr) => acc + curr.score, 0);
    const accuracy = Math.round((totalScore / totalPossible) * 100);
    const avgEffort = Math.round((history.reduce((acc, curr) => acc + (curr.aggregateEffort || 0.5), 0) / history.length) * 100);
    const avgRetention = masteryList.length > 0 ? Math.round((masteryList.reduce((acc, curr) => acc + curr.retentionScore, 0) / masteryList.length) * 100) : 0;
    
    // Simulate percentile based on global cohort stats
    const avgCohortXp = cohortStats?.avgXp || 1000;
    const percentile = Math.min(99, Math.max(1, Math.round((user.xp / (avgCohortXp * 2)) * 100)));
    
    return { accuracy, totalQuestions: totalPossible, avgEffort, avgRetention, percentile };
  }, [user.quizHistory, masteryList, cohortStats, user.xp]);

  // Data for Timeline Chart
  const timelineData = useMemo(() => {
    return user.quizHistory.slice(0, 7).reverse().map((q, i) => ({
      name: `S-${i+1}`,
      xp: Math.round(q.score * 20 * (q.aggregateEffort + 0.5)),
      effort: Math.round(q.aggregateEffort * 100)
    }));
  }, [user.quizHistory]);

  // Data for Radar Chart (SAT-style breakdown)
  const radarData = useMemo(() => {
    const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Social'];
    return subjects.map(sub => {
      const relevantResults = user.quizHistory.filter(q => q.topic.toLowerCase().includes(sub.toLowerCase()));
      const score = relevantResults.length > 0 
        ? Math.round((relevantResults.reduce((a, b) => a + (b.score/b.total), 0) / relevantResults.length) * 100)
        : 10; // Baseline
      return { subject: sub, A: score, fullMark: 100 };
    });
  }, [user.quizHistory]);

  return (
    <div className="h-full flex flex-col gap-10 animate-fade-in overflow-y-auto pr-6 custom-scrollbar pb-10">
      {/* Header Section */}
      <div className="flex justify-between items-end shrink-0 border-b border-white/5 pb-10">
        <div>
          <h2 className="text-5xl font-black uppercase tracking-tighter luwa-gold">Academic Record</h2>
          <p className="text-[11px] text-gray-600 font-black uppercase tracking-[0.5em] mt-3">
            Prestige: {user.prestige} Tier • Level: {user.level} • Global Rank: Top {100 - metrics.percentile}%
          </p>
        </div>
        <div className="text-right">
           <p className="text-[9px] text-gray-700 uppercase font-black tracking-widest mb-1">EUEE Readiness Index</p>
           <p className="text-5xl font-black text-white tracking-tight">{user.readiness}<span className="text-luwa-gold text-lg">%</span></p>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 shrink-0">
        <GlassCard className="text-center p-10 border-luwa-gold/20 bg-luwa-gold/[0.02] shadow-xl shadow-luwa-gold/5">
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em] mb-4">Registry XP</p>
          <p className="text-5xl font-black luwa-gold">{user.xp.toLocaleString()}</p>
        </GlassCard>
        <GlassCard className="text-center p-10 border-white/5 bg-white/[0.01]">
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em] mb-4">Retention Factor</p>
          <p className="text-5xl font-black text-white">{metrics.avgRetention}%</p>
        </GlassCard>
        <GlassCard className="text-center p-10 border-white/5 bg-white/[0.01]">
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em] mb-4">Effort Integrity</p>
          <p className="text-5xl font-black text-white">{metrics.avgEffort}%</p>
        </GlassCard>
        <GlassCard className="text-center p-10 border-white/5 bg-white/[0.01]">
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em] mb-4">Percentile</p>
          <p className="text-5xl font-black text-white">{metrics.percentile}<span className="text-sm">th</span></p>
        </GlassCard>
      </div>

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Intensity & Mastery Radar */}
        <div className="lg:col-span-4 space-y-8">
          <GlassCard className="border-white/5 p-10 flex flex-col h-[400px]">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-600 mb-8 flex items-center gap-3">
              <ICONS.Zap className="w-4 h-4 luwa-gold" />
              Section Proficiency
            </h3>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#ffffff10" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 900 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Scholar"
                    dataKey="A"
                    stroke="#FFD700"
                    fill="#FFD700"
                    fillOpacity={0.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard className="border-white/5 p-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-600 mb-6">Mastery Heatmap</h3>
            <div className="grid grid-cols-8 gap-3">
              {masteryList.map((m, i) => (
                <div 
                  key={i} 
                  title={`${m.topic}: ${Math.round(m.retentionScore * 100)}%`}
                  className="aspect-square rounded-sm transition-all hover:scale-125 cursor-help"
                  style={{ 
                    backgroundColor: m.retentionScore > 0.8 ? '#008B8B' : m.retentionScore > 0.4 ? '#FFD700' : '#9B111E',
                    opacity: 0.2 + (m.retentionScore * 0.8)
                  }}
                />
              ))}
              {masteryList.length === 0 && [...Array(16)].map((_, i) => (
                <div key={i} className="aspect-square rounded-sm bg-white/5 border border-white/5" />
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Center Column: Momentum Timeline */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <GlassCard className="border-white/5 p-10 flex-1 min-h-[400px]">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-600 mb-10 flex items-center gap-3">
              <ICONS.Home className="w-4 h-4 luwa-gold" />
              Cognitive Momentum (Last 7 Sessions)
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFD700" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#FFD700" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 900 }} 
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0A0A0B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#FFD700', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="xp" 
                    stroke="#FFD700" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorXp)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* AI Performance Audit */}
          <GlassCard className="border-luwa-gold/10 p-12 bg-luwa-gold/[0.01] flex flex-col">
            <div className="flex justify-between items-center mb-10">
               <div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-600 flex items-center gap-4">
                    <ICONS.Brain className="w-5 h-5 luwa-gold" />
                    Institutional Performance Audit
                  </h3>
                  <p className="text-[9px] text-gray-700 uppercase font-black tracking-widest mt-2">
                    AI analysis of session history and cognitive patterns.
                  </p>
               </div>
               {!audit && !isAnalyzing && (
                 <button 
                  onClick={performBrainAudit}
                  disabled={user.quizHistory.length < 1}
                  className="bg-luwa-gold text-black px-10 py-4 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl shadow-luwa-gold/10 hover:brightness-110 disabled:opacity-20 transition-all"
                 >
                   Execute Audit
                 </button>
               )}
            </div>

            {isAnalyzing ? (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                 <div className="w-12 h-12 border-2 border-luwa-gold/10 border-t-luwa-gold rounded-full animate-spin mb-6" />
                 <p className="text-[10px] font-black uppercase tracking-[0.5em] text-luwa-gold animate-pulse">Synchronizing Neural History...</p>
              </div>
            ) : audit ? (
              <div className="animate-fade-in">
                <div className="p-8 bg-black/60 rounded-3xl border border-white/5 text-sm text-gray-300 leading-loose max-h-[400px] overflow-y-auto custom-scrollbar whitespace-pre-wrap font-medium">
                  {audit}
                </div>
                <div className="mt-8 flex justify-end">
                   <button onClick={() => setAudit(null)} className="text-[9px] font-black uppercase tracking-widest text-gray-600 hover:text-white transition-colors">Dismiss Report</button>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center">
                <p className="text-[10px] text-gray-700 uppercase font-black tracking-widest leading-loose">
                  {user.quizHistory.length < 1 
                    ? "Insufficient session history to perform institutional audit." 
                    : "Ready to synthesize academic strategic roadmap."
                  }
                </p>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
