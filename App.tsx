
/*
  Luwa Academy – AI-Powered Educational Platform
  Developed by Shewit – 2026
  Module: App Core
*/

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { NeuralTutor } from './components/NeuralTutor';
import { AssessmentLab } from './components/AssessmentLab';
import { AdminControl } from './components/AdminControl';
import { ScholarAnalytics } from './components/ScholarAnalytics';
import { LuwaLive } from './components/LuwaLive';
import { CinematicConcepts } from './components/CinematicConcepts';
import { StudyNexus } from './components/StudyNexus';
import { ExamSystem } from './components/ExamSystem';
import { About } from './components/About';
import { storageService } from './services/storageService';
import { User, GlobalDirective } from './types';
import { ICONS } from './constants';
import { GlassCard } from './components/GlassCard';

type Tab = 'home' | 'tutor' | 'lab' | 'analytics' | 'live' | 'video' | 'admin' | 'nexus' | 'about' | 'exams';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [directives, setDirectives] = useState<GlobalDirective[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [tutorContext, setTutorContext] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [notification, setNotification] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    const checkSession = () => {
      try {
        const sessionUser = storageService.getSession();
        if (sessionUser) {
          if (sessionUser.deactivated && !storageService.isSimulating()) {
            storageService.logout();
            setUser(null);
            return;
          }
          setUser(sessionUser);
          setIsSimulating(storageService.isSimulating());
          // Default start tab for admin
          if (sessionUser.role === 'admin' && activeTab === 'home') {
             setActiveTab('admin');
          }
        }
      } catch (e) {
        storageService.logout();
        setUser(null);
      }
    };
    checkSession();
    setDirectives(storageService.getDirectives());
  }, []);

  const handleUpdateUser = (updatedUser: User) => {
    setSyncStatus('syncing');
    const finalUser = { 
      ...updatedUser, 
      level: storageService.calculateLevel(updatedUser.xp),
      prestige: storageService.calculatePrestige(updatedUser.xp),
      health: storageService.calculateHealth(updatedUser)
    };
    setUser(finalUser);
    storageService.saveUser(finalUser);
    if (!isSimulating) storageService.setSession(finalUser);
    setTimeout(() => setSyncStatus('idle'), 800);
  };

  const handleLogoutTrigger = (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setShowLogoutConfirm(true);
  };

  const performLogout = useCallback((forced = false) => {
    storageService.logout();
    setUser(null);
    setIsSimulating(false);
    setActiveTab('home');
    setTutorContext(null);
    setShowLogoutConfirm(false);
    setNotification(forced ? "System: Auto-Logout triggered." : "Registry: Session terminated.");
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const exitSimulation = useCallback(() => {
    storageService.exitSimulation();
    const realUser = storageService.getSession();
    setUser(realUser);
    setIsSimulating(false);
    setActiveTab('admin');
  }, []);

  const renderToast = () => notification && (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[999] animate-fade-in pointer-events-none">
      <div className="bg-luwa-purple text-white px-12 py-4 rounded-2xl font-bold text-[11px] uppercase tracking-[0.2em] shadow-2xl flex items-center gap-4">
        <div className="w-1.5 h-1.5 bg-luwa-teal rounded-full animate-pulse shadow-[0_0_8px_#268E91]" />
        {notification}
      </div>
    </div>
  );

  const renderLogoutModal = () => showLogoutConfirm && (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/60 animate-fade-in transition-all duration-500">
      <div className="max-w-md w-full p-12 bg-white rounded-[2rem] text-center shadow-2xl border border-luwa-border">
        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-10 border border-slate-100">
          <ICONS.LogOut className="w-8 h-8 text-luwa-purple" />
        </div>
        <h3 className="text-3xl font-serif font-bold text-luwa-purple mb-6">Authorize Termination?</h3>
        <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest leading-loose mb-12">
          Confirm session disconnect from the sovereign academy registry.
        </p>
        <div className="flex flex-col gap-4">
          <button onClick={() => performLogout(false)} className="w-full bg-red-500 text-white font-black py-5 rounded-2xl text-[10px] uppercase tracking-[0.3em] hover:bg-red-600 transition-all shadow-lg shadow-red-500/20">AUTHORIZE DISCONNECT</button>
          <button onClick={() => setShowLogoutConfirm(false)} className="w-full bg-slate-100 text-slate-500 font-black py-5 rounded-2xl text-[10px] uppercase tracking-[0.3em] hover:bg-slate-200 transition-all">ABORT COMMAND</button>
        </div>
      </div>
    </div>
  );

  if (!user) return <div className="min-h-screen bg-luwa-gray">{renderToast()}<Auth onLogin={setUser} /></div>;

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <Dashboard user={user} onNavigate={(target) => setActiveTab(target)} onUpdateUser={handleUpdateUser} />;
      case 'tutor': return <NeuralTutor user={user} initialMessage={tutorContext} onClearContext={() => setTutorContext(null)} onUpdateUser={handleUpdateUser} />;
      case 'lab': return <AssessmentLab user={user} onUpdateUser={handleUpdateUser} onConsultTutor={(ctx) => { setTutorContext(ctx); setActiveTab('tutor'); }} />;
      case 'exams': return <ExamSystem user={user} />;
      case 'analytics': return <ScholarAnalytics user={user} />;
      case 'live': return <LuwaLive />;
      case 'video': return <CinematicConcepts />;
      case 'nexus': return <StudyNexus user={user} />;
      case 'about': return <About />;
      case 'admin': return <AdminControl onSimulate={(u) => { storageService.enterSimulation(u); setUser(u); setIsSimulating(true); setActiveTab('home'); }} />;
      default: return <Dashboard user={user} onNavigate={(target) => setActiveTab(target)} onUpdateUser={handleUpdateUser} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-luwa-gray text-luwa-dark font-sans">
      {renderToast()}
      {renderLogoutModal()}
      
      {isSimulating && (
        <div className="absolute top-0 left-0 w-full h-10 bg-luwa-teal text-white flex items-center justify-between z-[100] px-10 shadow-lg">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 bg-white rounded-full animate-ping" />
             <span className="text-[10px] font-black uppercase tracking-widest">Active Scholar Simulation: {user.name}</span>
          </div>
          <button onClick={exitSimulation} className="bg-white text-luwa-teal px-4 py-1 rounded-lg text-[10px] font-black uppercase hover:opacity-90 transition-opacity">Exit Control</button>
        </div>
      )}

      <aside className={`w-20 md:w-72 border-r border-luwa-border bg-white flex flex-col pt-${isSimulating ? '10' : '0'} transition-all duration-500 z-40 relative shadow-sm`}>
        <div className="p-10 mb-4 flex flex-col items-center md:items-start">
          <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 bg-luwa-purple rounded-xl flex items-center justify-center text-white shadow-lg">
                <span className="text-xl font-serif font-black">L</span>
             </div>
             <h1 className="hidden md:block text-2xl font-serif font-bold text-luwa-purple tracking-tight">Luwa</h1>
          </div>
          <p className="hidden md:block text-[8px] text-slate-400 font-black uppercase tracking-[0.4em] ml-1">Academy System</p>
        </div>

        <nav className="flex-1 space-y-2 px-6 overflow-y-auto custom-scrollbar">
          {[
            { id: 'home', icon: ICONS.Home, label: 'Dashboard', role: 'scholar' },
            { id: 'tutor', icon: ICONS.Brain, label: 'AI Instructor', role: 'scholar' },
            { id: 'exams', icon: ICONS.Zap, label: 'Sessions', role: 'scholar' },
            { id: 'lab', icon: ICONS.Trophy, label: 'Assessment Lab', role: 'scholar' },
            { id: 'nexus', icon: ICONS.Layout, label: 'Study Nexus', role: 'scholar' },
            { id: 'analytics', icon: ICONS.Info, label: 'Academic Record', role: 'scholar' },
            { id: 'live', icon: ICONS.Mic, label: 'Vocal Sync', role: 'scholar' },
            { id: 'video', icon: ICONS.Video, label: 'Cinema Recaps', role: 'scholar' },
            { id: 'admin', icon: ICONS.Home, label: 'Admin Terminal', role: 'admin' },
            { id: 'about', icon: ICONS.Info, label: 'Institutional Info', role: 'both' }
          ]
          .filter(item => item.role === 'both' || item.role === user.role)
          .map((item) => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id as Tab)} 
              className={`w-full flex items-center justify-center md:justify-start gap-4 p-4 rounded-xl transition-all duration-300 group ${activeTab === item.id ? 'bg-luwa-purple text-white shadow-xl shadow-luwa-purple/20' : 'text-slate-400 hover:text-luwa-purple hover:bg-slate-50'}`}
            >
              <item.icon className={`w-5 h-5 transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="hidden md:block text-[11px] font-bold uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-luwa-border bg-slate-50/50">
          <div className="hidden md:block mb-8 px-2">
            <p className="text-[8px] text-slate-400 uppercase font-black tracking-widest mb-1">{user.role} Registry</p>
            <p className="text-sm font-serif font-bold truncate text-luwa-purple tracking-tight">{user.name}</p>
          </div>
          <button onClick={handleLogoutTrigger} className="w-full flex items-center justify-center md:justify-start gap-4 p-4 rounded-xl text-red-500/60 hover:text-red-500 hover:bg-red-50 border border-transparent transition-all group">
            <ICONS.LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            <span className="hidden md:block text-[11px] font-bold uppercase tracking-widest">Terminate Session</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 pt-${isSimulating ? '10' : '0'} transition-all duration-500 relative">
        <header className="h-20 border-b border-luwa-border bg-white/80 backdrop-blur-md px-10 flex items-center justify-between z-30">
           <div className="flex items-center gap-8">
              <div className="flex items-center gap-4">
                 <div className={`w-2 h-2 rounded-full ${syncStatus === 'syncing' ? 'bg-luwa-teal animate-ping' : 'bg-luwa-teal/50'}`} />
                 <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Institutional Registry: Linked</span>
              </div>
           </div>
           <div className="flex items-center gap-6">
             {user.role === 'scholar' && (
               <div className="flex items-center gap-3 bg-luwa-purple/5 border border-luwa-purple/10 px-5 py-2.5 rounded-2xl">
                  <ICONS.Zap className="w-4 h-4 text-luwa-purple" />
                  <span className="text-[11px] font-black text-luwa-purple tracking-widest">{user.xp.toLocaleString()} XP</span>
               </div>
             )}
             <div className="h-8 w-px bg-luwa-border" />
             <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden md:block">{user.role === 'admin' ? 'Root Access' : user.grade}</span>
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-luwa-purple border border-luwa-border">
                   <span className="text-xs font-black uppercase">{user.name.charAt(0)}</span>
                </div>
             </div>
           </div>
        </header>

        <div className="flex-1 p-10 pb-20 overflow-hidden relative">
          {renderContent()}
        </div>

        <footer className="absolute bottom-0 w-full h-12 flex items-center justify-center px-10 border-t border-luwa-border bg-white/50 backdrop-blur-md z-30">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">© 2026 Luwa Academy • Crafted Learning</p>
        </footer>
      </main>
    </div>
  );
};

export default App;
