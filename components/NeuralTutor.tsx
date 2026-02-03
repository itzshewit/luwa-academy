/*
  Luwa Academy – AI-Powered Educational Platform
  Developed by Shewit – 2026
  Purpose: Interactive, gamified, and AI-assisted learning for high school students.
  Module: Neural Tutoring Interface
  Author: Shewit – 2026
*/

import React, { useState, useRef, useEffect } from 'react';
import { GlassCard } from './GlassCard.tsx';
import { geminiService } from '../services/geminiService.ts';
import { ChatMessage, User, TutorMode, Language } from '../types.ts';
import { ICONS } from '../constants.tsx';
import { storageService } from '../services/storageService.ts';

interface NeuralTutorProps {
  user: User;
  initialMessage?: string | null;
  onClearContext?: () => void;
  onUpdateUser: (user: User) => void;
}

export const NeuralTutor: React.FC<NeuralTutorProps> = ({ user, initialMessage, onClearContext, onUpdateUser }) => {
  const [mode, setMode] = useState<TutorMode>('Teach');
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: '1', role: 'assistant', content: `Greetings, scholar. Intent: ${user.currentIntent?.type || 'General Study'}. How shall we refine your cognitive framework?`, timestamp: Date.now()
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachment, setAttachment] = useState<{data: string, mimeType: string} | null>(null);
  const [showLedger, setShowLedger] = useState(false);
  const [lang, setLang] = useState<Language>(user.preferredLanguage || 'en');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (initialMessage) {
      handleSend(undefined, initialMessage);
      if (onClearContext) onClearContext();
    }
  }, [initialMessage]);

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'am' : 'en';
    setLang(nextLang);
    onUpdateUser({ ...user, preferredLanguage: nextLang });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setAttachment({ data: base64, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (e?: React.FormEvent, directInput?: string) => {
    if (e) e.preventDefault();
    const messageContent = directInput || input;
    if (!messageContent.trim() && !attachment) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(), role: 'user', content: messageContent, image: attachment || undefined, timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachment(null);
    setLoading(true);

    try {
      const stream = await geminiService.streamTutorResponse(
        messageContent, 
        user.stream, 
        mode, 
        [...messages, userMsg].slice(-10), 
        user.currentIntent?.type,
        lang
      );
      
      let assistantMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: '', timestamp: Date.now() };
      setMessages(prev => [...prev, assistantMsg]);

      let fullAnswer = '';
      for await (const chunk of stream) {
        if (chunk.text) {
          fullAnswer += chunk.text;
          setMessages(prev => prev.map(m => m.id === assistantMsg.id ? { ...assistantMsg, content: fullAnswer } : m));
        }
      }

      const updatedUser = storageService.addToLedger(user, { question: messageContent, answer: fullAnswer });
      onUpdateUser(updatedUser);

    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "Operational failure. Neural sync interrupted.", timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 md:gap-6 animate-fade-in overflow-hidden relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <h2 className="text-xl md:text-2xl font-black flex items-center gap-3 uppercase tracking-tighter text-luwa-purple">
          <ICONS.Brain className="text-luwa-teal" />
          The Instructor
        </h2>
        
        <div className="flex items-center gap-2 md:gap-4 w-full sm:w-auto">
          <button 
            onClick={toggleLanguage}
            className="px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest hover:border-luwa-teal transition-all shadow-sm"
          >
            {lang === 'en' ? 'EN' : 'አማ'}
          </button>

          <button 
            onClick={() => setShowLedger(!showLedger)}
            className={`p-2.5 md:p-3 rounded-xl border transition-all shadow-sm ${showLedger ? 'bg-luwa-teal border-luwa-teal text-white' : 'bg-white border-slate-200 text-slate-400 hover:text-luwa-teal'}`}
            title="Question Ledger"
          >
            <ICONS.Layout className="w-4 h-4" />
          </button>
          
          <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm flex-1 sm:flex-none">
            {(['Teach', 'Practice', 'Exam'] as TutorMode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 sm:flex-none px-4 md:px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-luwa-purple text-white shadow-lg shadow-luwa-purple/20' : 'text-slate-400 hover:text-luwa-purple'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden relative">
        <GlassCard className="flex-1 overflow-hidden p-0 border-slate-100 flex flex-col bg-white shadow-xl relative z-10">
          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-6 md:space-y-10 p-6 md:p-10 custom-scrollbar">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`max-w-[90%] md:max-w-[85%] rounded-3xl p-5 md:p-8 ${m.role === 'user' ? 'bg-luwa-purple text-white font-bold' : 'bg-slate-50 text-slate-700 border border-slate-100'}`}>
                  {m.image && <div className="mb-4 md:mb-6 rounded-2xl overflow-hidden shadow-sm"><img src={`data:${m.image.mimeType};base64,${m.image.data}`} className="max-w-full" /></div>}
                  <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{m.content}</p>
                </div>
              </div>
            ))}
            {loading && <div className="flex gap-2 p-6 md:p-10 animate-pulse"><div className="w-1.5 h-1.5 bg-luwa-teal rounded-full" /><div className="w-1.5 h-1.5 bg-luwa-teal rounded-full" /><div className="w-1.5 h-1.5 bg-luwa-teal rounded-full" /></div>}
          </div>

          <div className="p-4 md:p-8 border-t border-slate-100 bg-white/50 backdrop-blur-sm">
            <form onSubmit={(e) => handleSend(e)} className="flex gap-2 md:gap-4 max-w-6xl mx-auto w-full">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 md:p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-luwa-teal transition-all group shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 md:w-6 md:h-6 text-slate-400 group-hover:text-luwa-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={lang === 'am' ? 'ጥያቄዎን እዚህ ይጻፉ...' : 'Query knowledge base...'} className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-4 md:px-8 py-3 md:py-5 text-sm font-medium focus:ring-2 focus:ring-luwa-purple/5 focus:border-luwa-purple outline-none transition-all" />
              <button disabled={loading || !input.trim()} className="bg-luwa-purple text-white px-6 md:px-12 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 disabled:opacity-20 transition-all shrink-0">SEND</button>
            </form>
          </div>
        </GlassCard>

        {/* Ledger - Mobile Friendly Drawer/Overlay */}
        {showLedger && (
          <>
            {/* Mobile Backdrop */}
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setShowLedger(false)} />
            <GlassCard className="fixed bottom-0 left-0 right-0 h-[70vh] z-50 lg:relative lg:h-auto lg:w-96 flex flex-col p-8 border-slate-200 bg-white rounded-t-[2.5rem] lg:rounded-2xl animate-fade-in shadow-2xl lg:shadow-xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-luwa-purple">Question Ledger</h3>
                <button onClick={() => setShowLedger(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                {user.questionLedger && user.questionLedger.length > 0 ? user.questionLedger.map((q) => (
                  <div key={q.id} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl group relative hover:border-luwa-teal transition-all">
                    <p className="text-xs font-bold text-slate-600 line-clamp-2 pr-6 leading-relaxed">{q.question}</p>
                    <p className="text-[8px] text-slate-400 uppercase font-black mt-3 tracking-widest">{new Date(q.timestamp).toLocaleDateString()} • {q.lang === 'am' ? 'AM' : 'EN'}</p>
                  </div>
                )) : (
                  <div className="text-center py-20">
                    <p className="text-[10px] text-slate-300 uppercase font-black tracking-widest">Ledger Empty</p>
                  </div>
                )}
              </div>
            </GlassCard>
          </>
        )}
      </div>
    </div>
  );
};