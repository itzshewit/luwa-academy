
/*
  Module: Cinematic Visual Synthesis
  Purpose: Generates high-fidelity academic animations to visualize complex curriculum concepts.
*/

import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard.tsx';
import { geminiService } from '../services/geminiService.ts';
import { ICONS } from '../constants.tsx';
import { storageService } from '../services/storageService.ts';

export const CinematicConcepts: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);

  const activeSession = storageService.getSession();
  const subjects = activeSession ? storageService.getSubjects(activeSession.stream) : [];

  useEffect(() => {
    if (subjects.length > 0 && !selectedSubject) setSelectedSubject(subjects[0]);
  }, []);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setVideoUrl(null);
    try {
      // Fixed: activeSession?.grade cast to string
      const url = await geminiService.generateVideo(
        topic, 
        selectedSubject, 
        String(activeSession?.grade || 'Grade 12')
      );
      setVideoUrl(url);
    } catch (err: any) {
      console.error(err);
      alert("Synthesis engine busy. Re-initializing buffers...");
    } finally {
      setLoading(false);
    }
  };

  const loadingMessages = [
    "Rendering cinematic frames...",
    "Orchestrating physics engines...",
    "Applying high-fidelity shaders...",
    "Synthesizing motion graphics...",
    "FinalizingRecap..."
  ];

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setMsgIdx(p => (p + 1) % loadingMessages.length);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-luwa-purple">Cinematic Synthesis</h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-1">Multimedia Recaps Active</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border border-slate-100">
           <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest">Render Target</p>
           <p className="text-[10px] text-luwa-teal font-black tracking-widest uppercase">720P • 16:9</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <GlassCard className="flex flex-col gap-6 p-8 border-slate-100 bg-white">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <label className="block text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mb-3">Topic Focus</label>
              <input 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. 'Atomic Orbitals'"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-luwa-teal transition-all"
              />
            </div>
            <div className="w-full md:w-64">
              <label className="block text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mb-3">Academic Subject</label>
              <select 
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-luwa-teal transition-all appearance-none cursor-pointer"
              >
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          
          <button 
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className="w-full bg-luwa-purple text-white font-black py-6 rounded-2xl text-xs uppercase tracking-[0.3em] shadow-xl shadow-luwa-purple/10 hover:brightness-110 disabled:opacity-20 transition-all"
          >
            {loading ? 'SYNTHESIZING...' : 'INITIALIZE VISUAL RECAP'}
          </button>
        </GlassCard>

        <div className="flex-1 rounded-3xl relative overflow-hidden flex items-center justify-center min-h-[400px] border border-slate-100 bg-slate-50 shadow-inner">
          {loading ? (
            <div className="text-center p-10 animate-fade-in">
              <div className="w-12 h-12 border-2 border-slate-100 border-t-luwa-teal rounded-full animate-spin mx-auto mb-6" />
              <p className="text-luwa-teal font-black uppercase tracking-[0.2em] text-sm mb-3">{loadingMessages[msgIdx]}</p>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic">
                Render cycle in progress.
              </p>
            </div>
          ) : videoUrl ? (
            <video src={videoUrl} controls autoPlay className="w-full h-full object-contain" />
          ) : (
            <div className="text-center">
              <ICONS.Video className="w-12 h-12 text-slate-200 mx-auto mb-6" />
              <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.4em]">Engine Standby</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
