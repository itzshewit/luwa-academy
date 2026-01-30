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
        currentObjective: 'Establish baseline proficiency via Diagnostics.',
        quizHistory: [],
        streak: 1,
        masteryRecord: {},
        lifecycleStage: 'Admission',
        readiness: 0,
        health: { burnoutRisk: 0, engagementScore: 1, consistencyLevel: 1, status: 'Vibrant' }
      };
      storageService.saveUser(newUser);
      storageService.setSession(newUser);
      onLogin(newUser);
    } else {
      setError('Access Token Denied. Verify code integrity.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black relative overflow-hidden">
      <div className="absolute top-10 left-10 opacity-10 hidden lg:block">
        <h2 className="text-[8px] font-black uppercase tracking-[0.5em] luwa-gold">Sovereign Excellence</h2>
      </div>

      <GlassCard className="max-w-md w-full animate-fade-in border-luwa-gold/10 p-12 relative z-10 shadow-2xl">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black luwa-gold mb-2 tracking-tighter">LUWA</h1>
          <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.4em]">
            {isLogin ? 'Identity Authentication' : 'Admission Registry'}
          </p>
        </div>

        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-4">
              <div className="group">
                <label className="block text-[8px] font-black uppercase text-gray-600 mb-2 tracking-widest group-focus-within:text-luwa-gold transition-colors">Credential Email</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-sm font-bold focus:border-luwa-gold outline-none transition-all"
                  required
                />
              </div>
              <div className="group">
                <label className="block text-[8px] font-black uppercase text-gray-600 mb-2 tracking-widest group-focus-within:text-luwa-gold transition-colors">Neural Passcode</label>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-sm font-bold focus:border-luwa-gold outline-none transition-all"
                  required
                />
              </div>
            </div>
            
            {error && <p className="text-red-500 text-[9px] font-black text-center uppercase tracking-widest">{error}</p>}

            <button type="submit" className="w-full bg-luwa-gold text-black font-black py-6 rounded-2xl text-xs uppercase tracking-[0.3em] hover:brightness-110 active:scale-[0.98] transition-all">
              Initialize Registry Session
            </button>
            
            <div className="text-center pt-6">
              <button 
                type="button"
                onClick={() => { setIsLogin(false); setStep(1); }}
                className="text-[9px] text-gray-600 hover:text-luwa-gold font-black uppercase tracking-widest transition-colors"
              >
                Apply for Admission
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-8">
            <div className="flex justify-between items-center px-12 mb-10">
              {[1, 2, 3].map(s => (
                <div key={s} className={`w-1.5 h-1.5 rounded-full transition-all duration-700 ${step >= s ? 'bg-luwa-gold shadow-[0_0_8px_#FFD700]' : 'bg-gray-800'}`} />
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="space-y-4">
                  <div className="group">
                    <label className="block text-[8px] font-black uppercase text-gray-600 mb-2 tracking-widest group-focus-within:text-luwa-gold transition-colors">Full Academic Name</label>
                    <input 
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-sm font-bold focus:border-luwa-gold outline-none transition-all"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[8px] font-black uppercase text-gray-600 mb-2 tracking-widest group-focus-within:text-luwa-gold transition-colors">Cognitive Email</label>
                    <input 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-sm font-bold focus:border-luwa-gold outline-none transition-all"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[8px] font-black uppercase text-gray-600 mb-2 tracking-widest group-focus-within:text-luwa-gold transition-colors">Secure Passcode</label>
                    <input 
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-sm font-bold focus:border-luwa-gold outline-none transition-all"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleSignupNext}
                  className="w-full bg-white/5 text-white font-black py-5 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5"
                >
                  Confirm Profile Markers
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-10 animate-fade-in">
                <div>
                  <label className="block text-[8px] font-black uppercase text-gray-600 tracking-widest mb-6 text-center">Select Academic Stream</label>
                  <div className="grid grid-cols-2 gap-4">
                     {[Stream.NATURAL, Stream.SOCIAL].map(s => (
                       <button
                        key={s}
                        onClick={() => setStream(s)}
                        className={`p-6 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${stream === s ? 'bg-luwa-gold text-black border-luwa-gold' : 'border-white/5 text-gray-600 bg-white/[0.02]'}`}
                       >
                         {s.split(' ')[0]}
                       </button>
                     ))}
                  </div>
                </div>
                <button 
                  onClick={handleSignupNext}
                  className="w-full bg-white/5 text-white font-black py-5 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5"
                >
                  Proceed to Authorization
                </button>
              </div>
            )}

            {step === 3 && (
              <form onSubmit={handleSignupFinal} className="space-y-10 animate-fade-in text-center">
                <label className="block text-[9px] font-black uppercase text-gray-600 mb-6 tracking-[0.4em]">Academy Access Token</label>
                <input 
                  type="text"
                  placeholder="LUWA-XXXX-XXXX"
                  value={token}
                  onChange={(e) => setToken(e.target.value.toUpperCase())}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl p-8 text-center tracking-[0.5em] text-2xl font-black focus:border-luwa-gold transition-all text-luwa-gold"
                  required
                />
                {error && <p className="text-red-500 text-[9px] font-black uppercase">{error}</p>}
                <button type="submit" className="w-full bg-luwa-gold text-black font-black py-6 rounded-2xl text-xs uppercase tracking-[0.3em] shadow-xl hover:brightness-110 active:scale-[0.98] transition-all">
                  Finalize Admission
                </button>
              </form>
            )}

            <div className="text-center">
              <button 
                onClick={() => setIsLogin(true)}
                className="text-[9px] text-gray-600 hover:text-white font-black uppercase tracking-widest transition-colors"
              >
                Already Indexed? Return to Console
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};