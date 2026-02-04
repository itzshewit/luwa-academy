
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
  const [lang, setLang] = useState<Language>(user.preferredLanguage || 'en');
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const toggleLanguage = () => {
    setLang(prev => prev === 'en' ? 'am' : 'en');
  };

  const handleAuthorize = async () => {
    try {
      await (window as any).aistudio?.openSelectKey();
      setErrorInfo(null);
    } catch (e) {
      console.error("Auth window blocked or failed", e);
    }
  };

  const handleSend = async (e?: React.FormEvent, directInput?: string) => {
    if (e) e.preventDefault();
    const messageContent = directInput || input;
    if (!messageContent.trim() && !attachment) return;

    setErrorInfo(null);
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
        [...messages, userMsg].slice(-8), 
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

    } catch (err: any) {
      console.error("Luwa AI Engine Error:", err);
      const msg = err.message || "";
      let userFriendlyError = "Operational failure. Neural sync interrupted.";
      
      if (msg.includes("KEY_NOT_FOUND") || msg.includes("403") || msg.includes("401")) {
        userFriendlyError = "Access Key Missing or Unauthorized. Please re-synchronize your Neural Link.";
        setErrorInfo("AUTH");
      } else if (msg.includes("429")) {
        userFriendlyError = "Cognitive Overload. Registry servers are rate-limited. Please wait a moment.";
      }

      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'assistant', 
        content: userFriendlyError, 
        timestamp: Date.now() 
      }]);
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
          {errorInfo === 'AUTH' && (
            <button 
              onClick={handleAuthorize}
              className="px-4 py-2 bg-luwa-teal text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg animate-pulse"
            >
              Sync Neural Link
            </button>
          )}
          <button onClick={toggleLanguage} className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest hover:border-luwa-teal">
            {lang === 'en' ? 'EN' : 'አማ'}
          </button>
          <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm flex-1 sm:flex-none">
            {(['Teach', 'Practice', 'Exam'] as TutorMode[]).map(m => (
              <button key={m} onClick={() => setMode(m)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${mode === m ? 'bg-luwa-purple text-white' : 'text-slate-400'}`}>
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
                <div className={`max-w-[90%] md:max-w-[85%] rounded-3xl p-5 md:p-8 ${m.role === 'user' ? 'bg-luwa-purple text-white font-bold shadow-lg shadow-luwa-purple/10' : 'bg-slate-50 text-slate-700 border border-slate-100'}`}>
                  {m.image && <div className="mb-4 rounded-2xl overflow-hidden shadow-sm"><img src={`data:${m.image.mimeType};base64,${m.image.data}`} className="max-w-full" alt="attachment" /></div>}
                  <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{m.content}</p>
                </div>
              </div>
            ))}
            {loading && <div className="flex gap-2 p-10 animate-pulse"><div className="w-1.5 h-1.5 bg-luwa-teal rounded-full" /><div className="w-1.5 h-1.5 bg-luwa-teal rounded-full" /><div className="w-1.5 h-1.5 bg-luwa-teal rounded-full" /></div>}
          </div>

          <div className="p-4 md:p-8 border-t border-slate-100 bg-white/50 backdrop-blur-sm">
            <form onSubmit={(e) => handleSend(e)} className="flex gap-2 md:gap-4 max-w-6xl mx-auto w-full">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-luwa-teal transition-all shrink-0">
                <ICONS.Copy className="w-5 h-5 text-slate-400" />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setAttachment({ data: (reader.result as string).split(',')[1], mimeType: file.type });
                  reader.readAsDataURL(file);
                }
              }} />
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Query curriculum base..." className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium focus:border-luwa-purple outline-none" />
              <button disabled={loading || !input.trim()} className="bg-luwa-purple text-white px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 disabled:opacity-20 transition-all">SEND</button>
            </form>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
