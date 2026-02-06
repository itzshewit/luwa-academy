
/*
  Luwa Academy – Curriculum Library & Voice Synthesis
  V6.5 - Interactive Lesson Viewer Integration
*/

import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard.tsx';
import { storageService } from '../services/storageService.ts';
import { geminiService } from '../services/geminiService.ts';
import { User, StudyNote } from '../types.ts';
import { ICONS } from '../constants.tsx';
import { Modality } from '@google/genai';
import { decodeBase64, decodeAudioData } from '../services/audioService.ts';

interface CurriculumLibraryProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onOpenViewer: (note: StudyNote) => void;
}

export const CurriculumLibrary: React.FC<CurriculumLibraryProps> = ({ user, onUpdateUser, onOpenViewer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [activeNote, setActiveNote] = useState<StudyNote | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [curriculum, setCurriculum] = useState<StudyNote[]>([]);
  const [showNodeListMobile, setShowNodeListMobile] = useState(false);

  const subjects = storageService.getSubjects(user.stream);

  useEffect(() => {
    const fetchNotes = async () => {
      const notes = await storageService.getNotes();
      setCurriculum(notes);
      
      // Default to the first visible note for the user's stream
      const firstVisible = notes.find(n => (!n.stream || n.stream === user.stream) && subjects.includes(n.subjectId));
      if (firstVisible && !activeNote) setActiveNote(firstVisible);
    };
    fetchNotes();
  }, [user.stream]);

  const filteredNodes = curriculum.filter(n => {
    const matchesSubject = selectedSubject ? n.subjectId === selectedSubject : subjects.includes(n.subjectId);
    const matchesStream = !n.stream || n.stream === user.stream;
    const matchesSearch = n.topic.en.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSubject && matchesStream && matchesSearch;
  });

  const handleSelectNode = (node: StudyNote) => {
    setActiveNote(node);
    setShowNodeListMobile(false);
  };

  const synthesizeVoiceBrief = async () => {
    if (!activeNote || isSynthesizing) return;
    setIsSynthesizing(true);
    try {
      const ai = geminiService.getAI();
      const prompt = `Summary: ${activeNote.topic.en}. Content: ${activeNote.contentHtml.en}`;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
      });
      const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (audioData) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        const buffer = await decodeAudioData(decodeBase64(audioData), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start();
      }
    } catch (e) {
      alert("Voice brief unavailable.");
    } finally { setIsSynthesizing(false); }
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-m3-fade overflow-hidden">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 px-2 md:px-0">
        <div className="flex items-center gap-4">
           {/* Library Hamburger Toggle */}
           <button 
             onClick={() => setShowNodeListMobile(!showNodeListMobile)}
             className="md:hidden p-3 bg-luwa-primaryContainer text-luwa-primary rounded-m3-m shadow-sm"
             aria-label="Toggle Node Registry"
           >
              <ICONS.Menu className="w-5 h-5" />
           </button>
           <div>
              <h2 className="headline-small font-serif font-black text-luwa-onSurface">Library Registry</h2>
              <p className="label-small text-luwa-onSurfaceVariant font-black uppercase tracking-widest mt-1">Foundation Nodes</p>
           </div>
        </div>
        
        <div className="hidden md:flex gap-4">
           <div className="flex bg-white p-1 rounded-m3-m border border-luwa-surfaceVariant overflow-x-auto custom-scrollbar-hide">
              <button onClick={() => setSelectedSubject(null)} className={`px-4 py-2 rounded-m3-s text-[10px] font-black uppercase tracking-widest ${!selectedSubject ? 'bg-luwa-primary text-white' : 'text-slate-400'}`}>All</button>
              {subjects.map(s => (
                <button key={s} onClick={() => setSelectedSubject(s)} className={`px-4 py-2 rounded-m3-s text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${selectedSubject === s ? 'bg-luwa-primary text-white' : 'text-slate-400'}`}>{s}</button>
              ))}
           </div>
        </div>
      </header>

      <div className="flex gap-6 flex-1 overflow-hidden relative">
        {/* Node Selection Overlay */}
        <div className={`absolute md:relative inset-0 z-[100] md:z-auto w-full md:w-80 flex flex-col gap-4 overflow-hidden bg-white/98 backdrop-blur-2xl transition-all duration-300 md:translate-x-0 ${showNodeListMobile ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 md:opacity-100'}`}>
          <div className="p-6 md:p-0 space-y-4 flex-1 flex flex-col overflow-hidden">
             <div className="flex justify-between items-center md:hidden">
                <span className="text-[10px] font-black uppercase tracking-widest text-luwa-primary">Registry Selector</span>
                <button onClick={() => setShowNodeListMobile(false)} className="p-2 bg-slate-50 rounded-full text-slate-400"><ICONS.X className="w-5 h-5" /></button>
             </div>
             <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search node registry..." className="w-full bg-slate-50 border border-slate-100 rounded-m3-xl p-4 text-sm font-medium focus:border-luwa-primary outline-none" />
             <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
               {filteredNodes.map(node => (
                 <button key={node.id} onClick={() => handleSelectNode(node)} className={`w-full text-left p-6 rounded-m3-xl border transition-all ${activeNote?.id === node.id ? 'bg-luwa-primary border-luwa-primary shadow-m3-1' : 'bg-white border-luwa-surfaceVariant hover:bg-luwa-surfaceVariant'}`}>
                   <p className={`text-[8px] font-black uppercase mb-1 ${activeNote?.id === node.id ? 'text-white/60' : 'text-luwa-primary'}`}>{node.subjectId}</p>
                   <p className={`text-sm font-bold ${activeNote?.id === node.id ? 'text-white' : 'text-luwa-onSurface'}`}>{node.topic.en}</p>
                 </button>
               ))}
               {filteredNodes.length === 0 && (
                 <p className="text-[10px] text-center text-slate-400 mt-10 uppercase font-black tracking-widest">No nodes found in registry.</p>
               )}
             </div>
          </div>
        </div>

        {/* Note Content Display */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {activeNote ? (
            <div className="flex-1 flex flex-col gap-6 overflow-hidden animate-m3-fade">
              <GlassCard className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar bg-white" variant="elevated">
                <div className="max-w-3xl mx-auto space-y-10">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div>
                      <h3 className="headline-medium font-serif font-black text-luwa-onSurface leading-tight">{activeNote.topic.en}</h3>
                      <div className="flex items-center gap-4 mt-4 label-small font-black uppercase tracking-widest">
                        <span className="bg-luwa-primaryContainer text-luwa-onPrimaryContainer px-3 py-1 rounded-full">{activeNote.subjectId}</span>
                        <span className="text-luwa-onSurfaceVariant">Grade {activeNote.gradeLevel}</span>
                        {activeNote.stream && <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-[8px]">Natural Science Only</span>}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => onOpenViewer(activeNote)}
                        className="px-6 py-3 bg-luwa-primary text-white rounded-xl label-small font-black uppercase tracking-widest shadow-m3-1 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                      >
                         <ICONS.Layout className="w-4 h-4" /> Interactive Viewer
                      </button>
                      <button onClick={synthesizeVoiceBrief} disabled={isSynthesizing} className={`p-4 rounded-full border border-luwa-primary transition-all shadow-sm ${isSynthesizing ? 'animate-pulse bg-luwa-primary text-white' : 'text-luwa-primary hover:bg-luwa-primaryContainer'}`} title="Voice Brief">
                        <ICONS.Mic className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-base text-luwa-onSurfaceVariant leading-relaxed font-medium space-y-6 prose max-w-none">
                    {activeNote.contentHtml.en.split('\n\n').map((p, i) => <p key={i} className="whitespace-pre-wrap">{p}</p>)}
                  </div>
                </div>
              </GlassCard>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-20 text-center p-10">
               <ICONS.Layout className="w-20 h-20 text-slate-300 mb-6 mx-auto" />
               <p className="text-xs font-black uppercase tracking-widest text-slate-400">Registry node standby</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
