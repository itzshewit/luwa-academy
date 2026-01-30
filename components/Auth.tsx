
/*
  Module: Authentication Module
  Purpose: Manages scholar admission registry, identity verification, and initial session orchestration.
*/

import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { storageService } from '../services/storageService';
import { User, Stream } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [stream, setStream] = useState<Stream>(Stream.NATURAL);
  const [grade, setGrade] = useState('Grade 12');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (email === "admin@luwa.academy" && password === "admin123") {
      const adminUser = storageService.getAllUsers().find(u => u.role === 'admin');
      if (adminUser) {
        storageService.setSession(adminUser);
        onLogin(adminUser);
        return;
      }
    }

    const user = storageService.getUserByEmail(email);
    const hash = storageService.hashPassword(password);

    if (user && user.passwordHash === hash) {
      if (user.deactivated) {
        setError('Registry Terminated. Contact Institutional Registry.');
        return;
      }
      storageService.setSession(user);
      onLogin(user);
    } else {
      setError('Identity Mismatch. Verification Denied.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleSignupNext = () => {
    if (step === 1) {
      if (!name || !email || !password) {
        setError('Profile markers incomplete.');
        return;
      }
      if (storageService.getUserByEmail(email)) {
        setError('Identity Conflict. Email already indexed.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
    setError('');
  };

  const handleSignupFinal = (e: React.FormEvent) => {
    e.preventDefault();
    const userId = Math.random().toString(36).substr(2, 9);
    
    if (storageService.validateAndUseToken(token, userId)) {
      const newUser: User = {
        id: userId,
        email,
        passwordHash: storageService.hashPassword(password),
        token,
        name,
        role: 'scholar',
        stream,
        grade,
        targetYear: '2025',
        xp: 0,
        level: 'Initiate',
        prestige: 'Bronze',
        weakConcepts: [],
        currentObjective: 'Establish baseline proficiency.',
        quizHistory: [],
        questionLedger: [],
        achievements: [],
        streak: 1,
        masteryRecord: {},
        lifecycleStage: 'Admission',
        readiness: 0,
        health: { burnoutRisk: 0, engagementScore: 1, consistencyLevel: 1, status: 'Vibrant' },
        preferredLanguage: 'en'
      };
      storageService.saveUser(newUser);
      storageService.setSession(newUser);
      onLogin(newUser);
    } else {
      setError('Access Token Denied. Verify code integrity.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-luwa-gray relative overflow-hidden">
      <div className="absolute top-0 right-0 p-24 opacity-[0.03] pointer-events-none">
        <h1 className="text-[240px] font-black font-serif text-luwa-purple select-none">Luwa</h1>
      </div>

      <GlassCard className="max-w-md w-full animate-fade-in border-luwa-border p-12 relative z-10 shadow-2xl bg-white/90 backdrop-blur-md">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
             <div className="w-16 h-16 bg-luwa-purple rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3">
                <span className="text-2xl font-serif font-black">L</span>
             </div>
          </div>
          <h1 className="text-3xl font-serif font-bold text-luwa-purple mb-1">Luwa Academy</h1>
          <p className="text-luwa-teal text-[10px] font-black uppercase tracking-[0.3em]">
            {isLogin ? 'Identity Authentication' : 'Admission Registry'}
          </p>
        </div>

        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Credential Email</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-luwa-purple/10 focus:border-luwa-purple outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Neural Passcode</label>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-luwa-purple/10 focus:border-luwa-purple outline-none transition-all"
                  required
                />
              </div>
            </div>
            
            {error && <p className="text-red-500 text-[10px] font-bold text-center uppercase tracking-widest">{error}</p>}

            <button type="submit" className="w-full bg-luwa-purple text-white font-bold py-4 rounded-xl text-sm uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-luwa-purple/20">
              Initialize Session
            </button>
            
            <div className="text-center pt-4">
              <button 
                type="button"
                onClick={() => { setIsLogin(false); setStep(1); }}
                className="text-[10px] text-slate-400 hover:text-luwa-purple font-bold uppercase tracking-widest transition-colors"
              >
                Apply for Admission
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3].map(s => (
                <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${step === s ? 'w-8 bg-luwa-teal' : 'w-2 bg-slate-200'}`} />
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Full Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:border-luwa-purple outline-none transition-all" />
                </div>
                <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:border-luwa-purple outline-none transition-all" />
                </div>
                <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Passcode</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:border-luwa-purple outline-none transition-all" />
                </div>
                <button onClick={handleSignupNext} className="w-full bg-luwa-purple text-white font-bold py-4 rounded-xl text-sm uppercase tracking-widest hover:brightness-110 transition-all shadow-lg">Next Step</button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-4 text-center">Academic Stream</label>
                  <div className="grid grid-cols-2 gap-4">
                     {[Stream.NATURAL, Stream.SOCIAL].map(s => (
                       <button
                        key={s}
                        onClick={() => setStream(s)}
                        className={`p-6 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${stream === s ? 'bg-white border-luwa-teal text-luwa-teal shadow-xl' : 'border-slate-100 text-slate-400 bg-slate-50'}`}
                       >
                         {s.split(' ')[0]}
                       </button>
                     ))}
                  </div>
                </div>
                <button onClick={handleSignupNext} className="w-full bg-luwa-purple text-white font-bold py-4 rounded-xl text-sm uppercase tracking-widest hover:brightness-110 transition-all shadow-lg">Confirm Stream</button>
              </div>
            )}

            {step === 3 && (
              <form onSubmit={handleSignupFinal} className="space-y-8 animate-fade-in text-center">
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest">Access Token</label>
                <input 
                  type="text"
                  placeholder="LUWA-XXXX-XXXX"
                  value={token}
                  onChange={(e) => setToken(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-6 text-center tracking-[0.3em] text-xl font-black text-luwa-purple focus:border-luwa-teal outline-none transition-all"
                  required
                />
                {error && <p className="text-red-500 text-[10px] font-bold uppercase">{error}</p>}
                <button type="submit" className="w-full bg-luwa-purple text-white font-bold py-4 rounded-xl text-sm uppercase tracking-widest shadow-lg shadow-luwa-purple/20">Finalize Admission</button>
              </form>
            )}

            <div className="text-center pt-4">
              <button onClick={() => setIsLogin(true)} className="text-[10px] text-slate-400 hover:text-luwa-purple font-bold uppercase tracking-widest transition-colors">Back to Login</button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
