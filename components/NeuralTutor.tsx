
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
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  
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
      if ((window as any).aistudio) {
        await (window as any).aistudio.openSelectKey();
        setErrorStatus(null);
      }
    } catch (e) {
      console.error("Auth window failed", e);
    }
  };

  const handleSend = async (e?: React.FormEvent, directInput?: string) => {
    if (e) e.preventDefault();