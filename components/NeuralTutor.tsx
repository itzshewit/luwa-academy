
import React, { useState, useRef, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { geminiService } from '../services/geminiService';
import { ChatMessage, User, TutorMode } from '../types';
import { ICONS } from '../constants';
import { storageService } from '../services/storageService';

interface NeuralTutorProps {
  user: User;
  initialMessage?: string | null;
  onClearContext?: () => void;
}

export const NeuralTutor: React.FC<NeuralTutorProps> = ({ user, initialMessage, onClearContext }) => {
  const [mode, setMode] = useState<TutorMode>('Teach');
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: '1',
    role: 'assistant',
    content: `Greetings, scholar. Intent: ${user.currentIntent?.type || 'General Study'}. How shall we refine your cognitive framework?`,
    timestamp: Date.now()
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachment, setAttachment] = useState<{data: string, mimeType: string} | null>(null);
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
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      image: attachment || undefined,
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setAttachment(null);
    setLoading(true);

    try {
      const history = newMessages.slice(-10).map(m => ({ 
        role: m.role, 
        content: m.content,
        image: m.image
      }));

      const stream = await geminiService.streamTutorResponse(messageContent, user.stream, mode, history, user.currentIntent?.type);
      
      let assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, assistantMsg]);

      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          assistantMsg.content += text;
          setMessages(prev => prev.map(m => m.id === assistantMsg.id ? { ...assistantMsg } : m));
        }
      }

      // Institutional Observability: Log AI synthesis
      storageService.logAudit(user, 'AI Synthesis', `Generated scholarly response in ${mode} mode regarding: "${messageContent.slice(0, 30)}..."`, 'info');

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Operational failure. Neural sync interrupted. Please verify credentials and retry.",
        timestamp: Date.now()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in overflow-hidden">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-black flex items-center gap-3 uppercase tracking-tighter">
          <ICONS.Brain className="luwa-gold" />
          The Instructor
        </h2>
        
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
          {(['Teach', 'Practice', 'Exam'] as TutorMode[]).map(m => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  role: 'assistant',
                  content: `Mode Switched: ${m}. Intent persists as ${user.currentIntent?.type}.`,
                  timestamp: Date.now()
                }]);
              }}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all ${mode === m ? 'bg-luwa-gold text-black shadow-lg shadow-luwa-gold/10' : 'text-gray-500 hover:text-white'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <GlassCard className="flex-1 overflow-hidden p-0 border-white/5 flex flex-col bg-black/20">
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-10 p-10 custom-scrollbar">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className={`max-w-[85%] rounded-[2rem] p-8 ${m.role === 'user' ? 'bg-luwa-gold text-black ml-16 font-bold shadow-xl shadow-luwa-gold/5' : 'bg-white/5 text-gray-200 mr-16 border border-white/5 backdrop-blur-md'}`}>
                {m.image && (
                  <div className="mb-6 rounded-2xl overflow-hidden border border-black/10">
                    <img src={`data:${m.image.mimeType};base64,${m.image.data}`} alt="Reference Node" className="max-w-full h-auto" />
                  </div>
                )}
                <p className="whitespace-pre-wrap leading-relaxed text-base tracking-tight">{m.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 p-10 animate-pulse">
              <div className="w-2.5 h-2.5 bg-luwa-gold rounded-full" />
              <div className="w-2.5 h-2.5 bg-luwa-gold rounded-full shadow-[0_0_10px_#FFD700]" />
              <div className="w-2.5 h-2.5 bg-luwa-gold rounded-full" />
            </div>
          )}
        </div>

        <div className="p-8 border-t border-white/5 bg-black/40">
          {attachment && (
            <div className="mb-6 flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-luwa-gold/30 animate-fade-in">
              <img src={`data:${attachment.mimeType};base64,${attachment.data}`} className="w-14 h-14 object-cover rounded-xl border border-white/10" alt="Preview" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Reference Asset Linked</p>
              <button onClick={() => setAttachment(null)} className="ml-auto p-2 text-gray-500 hover:text-red-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          )}
          <form onSubmit={(e) => handleSend(e)} className="flex gap-4 max-w-6xl mx-auto w-full">
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-5 bg-white/5 rounded-2xl border border-white/10 hover:border-luwa-gold transition-all group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-600 group-hover:text-luwa-gold transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Communicate with Co-pilot (${mode} mode)...`}
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-base font-medium focus:outline-none focus:border-luwa-gold transition-all text-white"
            />
            <button 
              disabled={loading || (!input.trim() && !attachment)} 
              className="bg-luwa-gold text-black px-12 rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] hover:brightness-110 disabled:opacity-20 transition-all shadow-xl shadow-luwa-gold/10"
            >
              TRANSMIT
            </button>
          </form>
        </div>
      </GlassCard>
    </div>
  );
};
