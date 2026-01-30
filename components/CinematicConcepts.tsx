
/*
  Module: Cinematic Visual Synthesis
  Purpose: Generates high-fidelity academic animations to visualize complex curriculum concepts using advanced video synthesis models.
*/

import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { geminiService } from '../services/geminiService';
import { ICONS } from '../constants';
import { storageService } from '../services/storageService';

export const CinematicConcepts: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);

  const activeSession = storageService.getSession();
  const subjects = activeSession ? storageService.getSubjects(activeSession.stream) : [];

  useEffect(() => {
    const checkKey = async () => {
      const selected = await (window as any).aistudio?.hasSelectedApiKey();
      setHasKey(selected);
    };
    checkKey();
    if (subjects.length > 0 && !selectedSubject) setSelectedSubject(subjects[0]);
  }, []);

  const handleSelectKey = async () => {
    await (window as any).aistudio?.openSelectKey();
    setHasKey(true);
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setVideoUrl(null);
    try {
      const url = await geminiService.generateVideo(
        topic, 
        selectedSubject, 
        activeSession?.grade || 'Grade 12'
      );
      setVideoUrl(url);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
        setHasKey(false);
        alert("API Key Authorization Mismatch. Please re-select a paid project key.");
      } else {
        alert("Synthesis Interrupted. Our neural servers are currently over-capacity. Please retry.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadingMessages = [
    "Rendering 1080p cinematic frames...",
    "Orchestrating pixels and physics engines...",
    "Applying high-fidelity lighting and shaders...",
    "Synthesizing curriculum-aware motion graphics...",
    "Finalizing cinematic synthesis. Almost ready..."
  ];

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setMsgIdx(p => (p + 1) % loadingMessages.length);
      }, 12000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  if (!hasKey) {
    return (
      <div className="h-full flex items-center justify-center animate-fade-in">
        <GlassCard className="max-w-md text-center p-12 border-luwa-gold/20 shadow-2xl shadow-luwa-gold/5">
          <div className="w-20 h-20 bg-luwa-gold/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-luwa-gold/20">
            <ICONS.Video className="w-10 h-10 luwa-gold" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">Paid Compute Required</h2>
          <p className="text-gray-500 text-xs font-bold leading-relaxed mb-8 uppercase tracking-widest">
            Veo 3.1 Cinematic Rendering is a high-compute process requiring an authorized Paid Project API key.
          </p>
          <div className="bg-white/5 border border-white/5 p-4 rounded-xl mb-8 text-left">
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-1">Authorization Guide</p>
            <p className="text-[10px] text-gray-400">Ensure your selected GCP project has billing enabled at ai.google.dev/gemini-api/docs/billing.</p>
          </div>
          <button 
            onClick={handleSelectKey}
            className="w-full bg-luwa-gold text-black font-black py-5 rounded-2xl shadow-xl shadow-luwa-gold/20 text-xs uppercase tracking-[0.2em] hover:brightness-110 active:scale-[0.98] transition-all"
          >
            SELECT AUTHORIZED KEY
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter luwa-gold">Cinematic Synthesis</h2>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mt-1">Multimedia Knowledge Engine Active</p>
        </div>
        <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
           <p className="text-[8px] text-gray-600 uppercase font-black tracking-widest">Render Target</p>
           <p className="text-[10px] text-luwa-gold font-black tracking-widest uppercase">1080P • 16:9 • VEO 3.1</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <GlassCard className="flex flex-col gap-6 p-10 border-white/10 bg-white/[0.02]">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <label className="block text-[9px] text-gray-600 font-black uppercase tracking-[0.2em] mb-3">Topic Focus</label>
              <input 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. 'Atomic Orbitals and Probability Clouds'"
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-luwa-gold transition-all"
              />
            </div>
            <div className="w-full md:w-64">
              <label className="block text-[9px] text-gray-600 font-black uppercase tracking-[0.2em] mb-3">Academic Subject</label>
              <select 
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-luwa-gold transition-all appearance-none cursor-pointer"
              >
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          
          <button 
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className="w-full bg-luwa-gold text-black font-black py-6 rounded-2xl text-xs uppercase tracking-[0.3em] shadow-2xl shadow-luwa-gold/10 hover:brightness-110 disabled:opacity-20 transition-all active:scale-[0.99]"
          >
            {loading ? 'SYNTHESIZING CURRICULUM...' : 'INITIALIZE VISUAL RECAP'}
          </button>
        </GlassCard>

        <div className="flex-1 glass rounded-3xl relative overflow-hidden flex items-center justify-center min-h-[400px] border border-white/5 bg-black/60 shadow-inner">
          {loading ? (
            <div className="text-center p-10 animate-fade-in">
              <div className="relative w-24 h-24 mx-auto mb-10">
                 <div className="absolute inset-0 border-4 border-luwa-gold/10 rounded-full" />
                 <div className="absolute inset-0 border-4 border-t-luwa-gold rounded-full animate-spin" />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-luwa-gold rounded-full animate-ping" />
                 </div>
              </div>
              <p className="text-luwa-gold font-black uppercase tracking-[0.2em] text-sm mb-3">{loadingMessages[msgIdx]}</p>
              <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest italic">
                Sovereign compute cycle in progress. Estimated duration: 60s.
              </p>
            </div>
          ) : videoUrl ? (
            <div className="w-full h-full relative group">
              <video 
                src={videoUrl} 
                controls 
                autoPlay 
                className="w-full h-full object-contain"
              />
              <div className="absolute top-6 left-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-black/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-luwa-gold">
                  Cinema Recaps: {topic}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center group">
              <div className="w-20 h-20 bg-white/5 border border-white/5 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:border-luwa-gold/30 transition-all">
                <ICONS.Video className="w-10 h-10 text-gray-700 group-hover:text-luwa-gold transition-all" />
              </div>
              <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.4em]">Visual Synthesis Engine Standby</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
