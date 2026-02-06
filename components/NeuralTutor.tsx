
/*
  Luwa Academy – Neural Tutor
  White Theme Refresh - V5.2 (Export Support)
*/

import React, { useState, useRef, useEffect } from 'react';
import { GlassCard } from './GlassCard.tsx';
import { geminiService } from '../services/geminiService.ts';
import { ChatMessage, User, TutorMode, Language } from '../types.ts';
import { ICONS } from '../constants.tsx';
import { storageService } from '../services/storageService.ts';

interface NeuralTutorProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

export const NeuralTutor: React.FC<NeuralTutorProps> = ({ user, onUpdateUser }) => {
  const [mode, setMode] = useState<TutorMode>('Teach');
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: '1', role: 'assistant', content: `Greetings, scholar. My focus is your academic advancement. How shall we refine your cognitive framework today?`, timestamp: Date.now()
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<Language>(user.preferredLanguage || 'en');
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const stream = await geminiService.streamTutorResponse(input, user.stream, mode, [...messages, userMsg].slice(-8), undefined, lang);
      let assistantMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: '', timestamp: Date.now() };
      setMessages(prev => [...prev, assistantMsg]);

      let fullAnswer = '';
      for await (const chunk of stream) {
        if (chunk.text) {
          fullAnswer += chunk.text;
          setMessages(prev => prev.map(m => m.id === assistantMsg.id ? { ...assistantMsg, content: fullAnswer } : m));
        }
      }
      onUpdateUser(await storageService.addToLedger(user, { question: input, answer: fullAnswer }));
    } catch (err) {
      setMessages(prev => [...prev, { id: 'err', role: 'assistant', content: 'Connection fluctuated. Please retry.', timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  const exportChat = () => {
    const transcript = messages.map(m => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
    const blob = new Blob([`LUWA ACADEMY - COGNITIVE LEDGER\nScholar: ${user.fullName}\nSubject: ${user.stream}\nDate: ${new Date().toLocaleDateString()}\n\n---\n\n${transcript}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Luwa_Tutor_Session_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-m3-fade overflow-hidden">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 rounded-m3-2xl border border-slate-100">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-luwa-primary text-white rounded-m3-xl flex items-center justify-center shadow-sm">
            <ICONS.Brain className="w-6 h-6" />
          </div>
          <div>
            <h2 className="title-large font-serif font-black text-luwa-onSurface uppercase tracking-tight">Neural Station</h2>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Curriculum Sync Active</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-50 p-1 rounded-m3-l border border-slate-100">
            {(['Teach', 'Practice', 'Exam'] as TutorMode[]).map(m => (
              <button key={m} onClick={() => setMode(m)} className={`px-5 py-2 rounded-m3-m text-[9px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-white text-luwa-primary shadow-sm' : 'text-slate-400 hover:text-luwa-primary'}`}>
                {m}
              </button>
            ))}
          </div>
          <button 
            onClick={exportChat} 
            className="p-3 bg-slate-50 text-slate-400 rounded-full hover:bg-luwa-primaryContainer hover:text-luwa-primary transition-all shadow-sm"
            title="Export Ledger"
          >
            <ICONS.Download className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col bg-white border border-slate-100 rounded-m3-2xl overflow-hidden relative shadow-sm">
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-8 p-10 custom-scrollbar">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-m3-fade`}>
              <div className={`max-w-[80%] rounded-m3-2xl p-6 ${m.role === 'user' ? 'bg-luwa-primary text-white' : 'bg-slate-50 text-luwa-onSurface border border-slate-100'}`}>
                <p className="text-sm md:text-base leading-relaxed font-medium whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))}
          {loading && <div className="flex gap-2 p-10 animate-pulse"><div className="w-2 h-2 bg-slate-200 rounded-full" /></div>}
        </div>

        <div className="p-8 border-t border-slate-100 bg-white">
          <form onSubmit={handleSend} className="flex gap-4 items-center">
            <input 
              value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="Query the curriculum base..."
              className="flex-1 bg-slate-50 border border-slate-100 rounded-m3-xl px-6 py-5 text-sm font-bold focus:bg-white focus:border-luwa-primary outline-none transition-all"
            />
            <button disabled={loading || !input.trim()} className="bg-luwa-primary text-white h-14 px-10 rounded-m3-xl font-black text-[10px] uppercase tracking-widest disabled:opacity-20 transition-all shadow-sm">
              Sync
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
