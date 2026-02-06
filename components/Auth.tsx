
/*
  Luwa Academy – Authentication & Registration Module
  V6.0 - Secure Token-Based Enrollment
*/

import React, { useState } from 'react';
import { storageService } from '../services/storageService.ts';
import { User, Stream } from '../types.ts';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [token, setToken] = useState('');
  const [stream, setStream] = useState<Stream>(Stream.NATURAL);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Admin Hard-coded Bypass
      if (email === "admin@luwa.academy" && password === "admin123") {
        let adminUser = await storageService.getUserByEmail(email);
        if (!adminUser) {
          adminUser = {
             id: 'admin-root',
             email: 'admin@luwa.academy',
             fullName: 'System Administrator',
             role: 'admin',
             stream: Stream.NATURAL,
             grade: 12,
             xp: 99999,
             prestige: 'Root',
             streak: 0,
             readiness: 100,
             preferredLanguage: 'en',
             dailyGoal: 0,
             studyGoals: [],
             bookmarks: [],
             masteryRecord: {},
             quizHistory: [],
             weakConcepts: [],
             currentObjective: 'Platform Governance',
             subscriptionTier: 'PRO',
             badges: [],
             privacySettings: { analyticsEnabled: true, cloudBackupEnabled: true, marketingConsent: false }
          };
          await storageService.saveUser(adminUser);
        }
        storageService.setSession(storageService.updateSessionActivity(adminUser));
        onLogin(adminUser);
        return;
      }

      const user = await storageService.getUserByEmail(email);
      const hash = storageService.hashPassword(password);

      if (user && user.passwordHash === hash) {
        storageService.setSession(storageService.updateSessionActivity(user));
        onLogin(user);
      } else {
        setError('Credentials not recognized in registry.');
      }
    } catch (err) {
      setError('Institutional Registry Sync Error. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Validate Token First
      const tempId = `scholar_${Date.now()}`;
      const isValidToken = await storageService.validateAndUseToken(token, tempId);
      
      if (!isValidToken) {
        setError('Invalid or Expired Institutional Token.');
        setLoading(false);
        return;
      }

      // 2. Check for duplicate email
      const existing = await storageService.getUserByEmail(email);
      if (existing) {
        setError('Email already exists in registry.');
        setLoading(false);
        return;
      }

      // 3. Create User
      const newUser: User = {
        id: tempId,
        email: email,
        passwordHash: storageService.hashPassword(password),
        fullName: fullName,
        role: 'scholar',
        stream: stream,
        grade: 12,
        xp: 0,
        prestige: 'Novice',
        streak: 0,
        readiness: 0,
        preferredLanguage: 'en',
        dailyGoal: 100,
        studyGoals: [],
        bookmarks: [],
        masteryRecord: {},
        quizHistory: [],
        weakConcepts: [],
        currentObjective: 'Core Foundation',
        subscriptionTier: 'BASIC',
        badges: [],
        privacySettings: { analyticsEnabled: true, cloudBackupEnabled: true, marketingConsent: false }
      };

      await storageService.saveUser(newUser);
      storageService.setSession(storageService.updateSessionActivity(newUser));
      onLogin(newUser);
    } catch (err) {
      setError('Registration Error: Neural Registry link failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-white relative overflow-y-auto">
      <div className="max-w-md w-full py-10">
        <div className="text-center mb-10">
           <div className="w-16 h-16 bg-luwa-primary text-white rounded-m3-xl flex items-center justify-center font-serif font-black text-3xl mx-auto mb-6 shadow-m3-2 animate-float">L</div>
           <h1 className="text-3xl font-serif font-black text-luwa-onSurface mb-2 tracking-tight uppercase">Luwa Academy</h1>
           <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em]">Institutional Scholar Node</p>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-m3-2xl border border-slate-100 shadow-m3-3 animate-m3-fade">
          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-6">
            <h2 className="label-large font-black uppercase tracking-widest text-luwa-primary border-b border-slate-50 pb-4">
              {isRegistering ? 'Scholar Registration' : 'Scholar Authorization'}
            </h2>

            <div className="space-y-3">
              {isRegistering && (
                <>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={token} 
                      onChange={(e) => setToken(e.target.value.toUpperCase())} 
                      className="w-full bg-slate-50 border-b-2 border-slate-100 px-5 py-4 text-sm font-bold focus:bg-white focus:border-luwa-tertiary outline-none transition-all" 
                      placeholder="Institutional Access Token" 
                      required 
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-luwa-tertiary animate-pulse" />
                  </div>
                  <input 
                    type="text" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                    className="w-full bg-slate-50 border-b-2 border-slate-100 px-5 py-4 text-sm font-bold focus:bg-white focus:border-luwa-primary outline-none transition-all" 
                    placeholder="Full Scholar Name" 
                    required 
                  />
                  <div className="py-2">
                    <p className="text-[9px] font-black uppercase text-slate-400 mb-2 tracking-widest">Select Academic Stream</p>
                    <div className="flex gap-2">
                      <button 
                        type="button" 
                        onClick={() => setStream(Stream.NATURAL)}
                        className={`flex-1 py-3 rounded-m3-m text-[10px] font-black uppercase tracking-widest transition-all ${stream === Stream.NATURAL ? 'bg-luwa-primary text-white shadow-sm' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                      >
                        Natural Science
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setStream(Stream.SOCIAL)}
                        className={`flex-1 py-3 rounded-m3-m text-[10px] font-black uppercase tracking-widest transition-all ${stream === Stream.SOCIAL ? 'bg-luwa-primary text-white shadow-sm' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                      >
                        Social Science
                      </button>
                    </div>
                  </div>
                </>
              )}
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full bg-slate-50 border-b-2 border-slate-100 px-5 py-4 text-sm font-bold focus:bg-white focus:border-luwa-primary outline-none transition-all" 
                placeholder="Institutional Email" 
                required 
              />
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full bg-slate-50 border-b-2 border-slate-100 px-5 py-4 text-sm font-bold focus:bg-white focus:border-luwa-primary outline-none transition-all" 
                placeholder="Registry Password" 
                required 
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-m3-m text-red-500 text-[10px] font-black uppercase text-center animate-pulse">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full py-5 bg-luwa-primary text-white rounded-m3-xl label-large font-black uppercase tracking-[0.2em] shadow-m3-2 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Authorizing Node...' : isRegistering ? 'Finalize Enrollment' : 'Authorize Access'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <button 
              onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-luwa-primary transition-colors"
            >
              {isRegistering ? 'Already Enrolled? Authorize Access' : 'New Scholar? Register with Token'}
            </button>
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-[9px] text-slate-300 font-medium uppercase tracking-[0.2em]">
            This registry is for exclusive use by authorized Luwa scholars.
          </p>
        </div>
      </div>
    </div>
  );
};
