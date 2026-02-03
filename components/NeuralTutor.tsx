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

      // Persist to Ledger
      const updatedUser = storageService.addToLedger(user, { question: messageContent, answer: fullAnswer });
      onUpdateUser(updatedUser);

    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "Operational failure. Neural sync interrupted.", timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in overflow-hidden relative">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-black flex items-center gap-3 uppercase tracking-tighter">
          <ICONS.Brain className="luwa-gold" />
          The Instructor
        </h2>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleLanguage}
            className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest hover:border-luwa-gold transition-all"
          >
            {lang === 'en' ? 'EN' : 'አማ'}
          </button>

          <button 
            onClick={() => setShowLedger(!showLedger)}
            className={`p-3 rounded-xl border transition-all ${showLedger ? 'bg-luwa-gold border-luwa-gold text-black' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
            title="Question Ledger"
          >
            <ICONS.Layout className="w-4 h-4" />
          </button>
          
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
            {(['Teach', 'Practice', 'Exam'] as TutorMode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all ${mode === m ? 'bg-luwa-gold text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        <GlassCard className="flex-1 overflow-hidden p-0 border-white/5 flex flex-col bg-black/20">
          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-10 p-10 custom-scrollbar">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`max-w-[85%] rounded-[2rem] p-8 ${m.role === 'user' ? 'bg-luwa-gold text-black font-bold' : 'bg-white/5 text-gray-200 border border-white/5'}`}>
                  {m.image && <div className="mb-6 rounded-2xl overflow-hidden"><img src={`data:${m.image.mimeType};base64,${m.image.data}`} className="max-w-full" /></div>}
                  <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                </div>
              </div>
            ))}
            {loading && <div className="flex gap-3 p-10 animate-pulse"><div className="w-2 h-2 bg-luwa-gold rounded-full" /><div className="w-2 h-2 bg-luwa-gold rounded-full" /><div className="w-2 h-2 bg-luwa-gold rounded-full" /></div>}
          </div>

          <div className="p-8 border-t border-white/5 bg-black/40">
            <form onSubmit={(e) => handleSend(e)} className="flex gap-4 max-w-6xl mx-auto w-full">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-5 bg-white/5 rounded-2xl border border-white/10 hover:border-luwa-gold transition-all group">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-600 group-hover:text-luwa-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={lang === 'am' ? 'ጥያቄዎን እዚህ ይጻፉ...' : 'Query curriculum knowledge base...'} className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-white outline-none focus:border-luwa-gold" />
              <button disabled={loading || !input.trim()} className="bg-luwa-gold text-black px-12 rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] hover:brightness-110 disabled:opacity-20 transition-all">TRANSMIT</button>
            </form>
          </div>
        </GlassCard>

        {showLedger && (
          <GlassCard className="w-96 flex flex-col p-8 border-white/10 bg-black/40 animate-fade-in">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-luwa-gold">Question Ledger</h3>
              <button onClick={() => setShowLedger(false)} className="text-gray-600 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
              {user.questionLedger && user.questionLedger.length > 0 ? user.questionLedger.map((q) => (
                <div key={q.id} className="p-4 bg-white/5 border border-white/5 rounded-xl group relative">
                  <p className="text-[10px] font-bold text-gray-300 line-clamp-2 pr-6">{q.question}</p>
                  <p className="text-[8px] text-gray-600 uppercase mt-2">{new Date(q.timestamp).toLocaleDateString()} • {q.lang === 'am' ? 'AM' : 'EN'}</p>
                </div>
              )) : (
                <div className="text-center py-20">
                  <p className="text-[9px] text-gray-700 uppercase font-black tracking-widest">Ledger Empty</p>
                </div>
              )}
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};