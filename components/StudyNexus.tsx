/*
  Module: Peer Collaboration Nexus
  Purpose: Facilitates collective intelligence through peer-to-peer knowledge exchange and AI-moderated study sessions.
*/

import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from './GlassCard.tsx';
import { User, ChatMessage } from '../types.ts';
import { ICONS } from '../constants.tsx';

interface StudyNexusProps {
  user: User;
}

export const StudyNexus: React.FC<StudyNexusProps> = ({ user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [peers, setPeers] = useState<{name: string, status: string, xp: number}[]>([
    { name: 'Ababa K.', status: 'Solving Physics', xp: 4500 },
    { name: 'Sara M.', status: 'Reviewing Calculus', xp: 2300 },
    { name: 'Desta T.', status: 'Idle', xp: 890 }
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([{
      id: 'system-1',
      role: 'system',
      content: `Welcome to the Natural Science Study Nexus. Collective Intelligence Active. AI Moderator: Zenith.`,
      timestamp: Date.now()
    }]);

    const timeout = setTimeout(() => {
      setMessages(prev => [...prev, {
        id: 'peer-1',
        role: 'assistant',
        senderName: 'Ababa K.',
        content: `Hey team, just derived the centripetal acceleration for the loop problem. Anyone else getting 9.81m/s²?`,
        timestamp: Date.now()
      }]);
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
      senderName: user.name
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: 'zenith-1',
        role: 'assistant',
        senderName: 'Zenith (AI Moderator)',
        content: `Correct, ${user.name}. The centrifugal force balance ensures that at the peak of the loop, gravity acts as the minimum centripetal force. Proceed to the next vector.`,
        timestamp: Date.now()
      }]);
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in overflow-hidden">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
            <ICONS.Layout className="luwa-gold" />
            Study Nexus
          </h2>
          <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.4em] mt-1">Natural Science • Cohort Alpha-7</p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        <GlassCard className="flex-1 flex flex-col p-0 border-white/5 bg-black/40 overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${m.role === 'system' ? 'w-full text-center' : ''}`}>
                  {m.senderName && m.role !== 'system' && (
                    <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${m.role === 'user' ? 'text-right text-luwa-gold' : 'text-gray-600'}`}>
                      {m.senderName}
                    </p>
                  )}
                  <div className={`p-6 rounded-2xl ${
                    m.role === 'system' ? 'text-[9px] text-gray-600 uppercase italic' :
                    m.role === 'user' ? 'bg-luwa-gold text-black font-bold' :
                    'bg-white/5 border border-white/5 text-gray-300'
                  }`}>
                    {m.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSend} className="p-8 border-t border-white/5 bg-black/60">
             <div className="flex gap-4">
                <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Collaborate with your cohort..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-8 py-4 text-sm font-medium focus:border-luwa-gold outline-none transition-all text-white"
                />
                <button className="bg-luwa-gold text-black px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all">
                  Sync
                </button>
             </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};