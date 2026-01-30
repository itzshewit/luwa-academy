
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
import { storageService } from './services/storageService';
import { User, GlobalDirective } from './types';
import { ICONS } from './constants';
import { GlassCard } from './components/GlassCard';

type Tab = 'home' | 'tutor' | 'lab' | 'analytics' | 'live' | 'video' | 'admin' | 'nexus';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 Minutes Inactivity Threshold

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

  // Check session and simulation state on mount
  useEffect(() => {
    const checkSession = () => {
      const sessionUser = storageService.getSession();
      if (sessionUser) {
        if (sessionUser.deactivated && !storageService.isSimulating()) {
          storageService.logout();
          setUser(null);
          return;
        }
        setUser(sessionUser);
        setIsSimulating(storageService.isSimulating());
      }
    };
    
    checkSession();
    setDirectives(storageService.getDirectives());
  }, []);

  // Professional Inactivity Detection System
  useEffect(() => {
    if (!user) return;

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const checkInactivity = () => {
      if (Date.now() - lastActivityRef.current > SESSION_TIMEOUT_MS) {
        performLogout(true); // Forced logout due to system security policy
      }
    };

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('touchstart', updateActivity);
    
    const interval = setInterval(checkInactivity, 30000); // Check every 30s

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('touchstart', updateActivity);
      clearInterval(interval);
    };
  }, [user]);

  const handleUpdateUser = (updatedUser: User) => {
    setSyncStatus('syncing');
    const level = storageService.calculateLevel(updatedUser.xp);
    const prestige = storageService.calculatePrestige(updatedUser.xp);
    const health = storageService.calculateHealth(updatedUser);
    const finalUser = { ...updatedUser, level, prestige, health };
    setUser(finalUser);
    storageService.saveUser(finalUser);
    if (!isSimulating) storageService.setSession(finalUser);
    setTimeout(() => setSyncStatus('idle'), 800);
  };

  const handleLogoutTrigger = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowLogoutConfirm(true);
  };

  const performLogout = useCallback((forced = false) => {
    // Comprehensive session cleanup
    storageService.logout();
    
    // UI State Reset
    setUser(null);
    setIsSimulating(false);
    setActiveTab('home');
    setTutorContext(null);
    setShowLogoutConfirm(false);
    
    // Provide institutional visual feedback
    if (forced) {
      setNotification("System: Auto-Logout triggered due to prolonged inactivity.");
    } else {
      setNotification("Institutional Registry: Session terminated successfully.");
    }

    // Clear notification after threshold
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const exitSimulation = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    storageService.exitSimulation();
    const realUser = storageService.getSession();
    setUser(realUser);
    setIsSimulating(false);
    setActiveTab('admin');
  }, []);

  const handleConsultTutor = (context: string) => {
    setTutorContext(context);
    setActiveTab('tutor');
  };

  // Centralized Toast Notification System
  const renderToast = () => notification && (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[300] animate-fade-in pointer-events-none">
      <div className="bg-[#0A0A0B]/90 backdrop-blur-xl border border-luwa-gold/30 text-luwa-gold px-10 py-4 rounded-2xl font-black text-[9px] uppercase tracking-[0.4em] shadow-[0_0_50px_rgba(255,215,0,0.15)] flex items-center gap-4">
        <div className="w-1.5 h-1.5 bg-luwa-gold rounded-full animate-pulse" />
        {notification}
      </div>
    </div>
  );

  // Custom Logout Confirmation Modal
  const renderLogoutModal = () => showLogoutConfirm && (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 backdrop-blur-md bg-black/60 animate-fade-in">
      <GlassCard className="max-w-md w-full p-12 border-luwa-gold/20 text-center shadow-2xl">
        <div className="w-20 h-20 bg-luwa-gold/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-luwa-gold/20">
          <ICONS.LogOut className="w-10 h-10 luwa-gold" />
        </div>
        <h3 className="text-2xl font-black uppercase tracking-tighter text-white mb-4">Terminate Session?</h3>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-relaxed mb-10">
          Authorize immediate disconnection from the sovereign academic registry. All local unsynced logic will be cleared.
        </p>
        <div className="flex flex-col gap-4">
          <button 
            onClick={() => performLogout(false)}
            className="w-full bg-red-500 text-white font-black py-5 rounded-2xl text-[10px] uppercase tracking-[0.3em] hover:bg-red-600 transition-all shadow-xl shadow-red-500/10"
          >
            AUTHORIZE DISCONNECT
          </button>
          <button 
            onClick={() => setShowLogoutConfirm(false)}
            className="w-full bg-white/5 text-gray-400 font-black py-5 rounded-2xl text-[10px] uppercase tracking-[0.3em] hover:bg-white/10 transition-all border border-white/5"
          >
            ABORT COMMAND
          </button>
        </div>
      </GlassCard>
    </div>
  );

  if (!user) {
    return (
      <>
        {renderToast()}
        <Auth onLogin={setUser} />
      </>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <Dashboard user={user} onNavigate={(target) => setActiveTab(target)} onUpdateUser={handleUpdateUser} />;
      case 'tutor': return <NeuralTutor user={user} initialMessage={tutorContext} onClearContext={() => setTutorContext(null)} />;
      case 'lab': return <AssessmentLab user={user} onUpdateUser={handleUpdateUser} onConsultTutor={handleConsultTutor} />;
      case 'analytics': return <ScholarAnalytics user={user} />;
      case 'live': return <LuwaLive />;
      case 'video': return <CinematicConcepts />;
      case 'nexus': return <StudyNexus user={user} />;
      case 'admin': return <AdminControl onSimulate={(u) => {
        storageService.enterSimulation(u);
        setUser(u);
        setIsSimulating(true);
        setActiveTab('home');
      }} />;
      default: return <Dashboard user={user} onNavigate={(target) => setActiveTab(target)} onUpdateUser={handleUpdateUser} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A0B] text-slate-200 selection:bg-luwa-gold/30">
      {renderToast()}
      {renderLogoutModal()}
      
      {/* Simulation Banner */}
      {isSimulating && (
        <div className="absolute top-0 left-0 w-full h-8 bg-amber-500 text-black flex items-center justify-center text-[9px] font-black uppercase tracking-[0.2em] z-[100] px-4 shadow-lg">
          <div className="flex-1 flex justify-center">
            <span className="animate-pulse">Active High-Fidelity Scholar Simulation: {user.name}</span>
          </div>
          <button 
            type="button"
            onClick={exitSimulation}
            className="bg-black text-white px-3 py-1 rounded text-[8px] font-black uppercase hover:opacity-80 transition-opacity"
          >
            Exit Simulation
          </button>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`w-20 md:w-64 border-r border-white/5 glass flex flex-col pt-${isSimulating ? '8' : '0'} transition-all duration-500`}>
        <div className="p-10 mb-6 text-center md:text-left">
          <h1 className="text-3xl font-black luwa-gold tracking-tighter">LUWA</h1>
          <p className="hidden md:block text-[7px] text-gray-700 font-black uppercase tracking-[0.5em] mt-2">Sovereign OS</p>
        </div>

        <nav className="flex-1 space-y-2 px-4 overflow-y-auto custom-scrollbar">
          {[
            { id: 'home', icon: ICONS.Home, label: 'Console', role: 'both' },
            { id: 'tutor', icon: ICONS.Brain, label: 'The Instructor', role: 'both' },
            { id: 'nexus', icon: ICONS.Layout, label: 'Study Nexus', role: 'both' },
            { id: 'lab', icon: ICONS.Zap, label: 'Assessment Lab', role: 'both' },
            { id: 'analytics', icon: ICONS.Layout, label: 'Academic Record', role: 'both' },
            { id: 'live', icon: ICONS.Mic, label: 'Direct Sync', role: 'both' },
            { id: 'video', icon: ICONS.Video, label: 'Cinema Recaps', role: 'both' },
            { id: 'admin', icon: ICONS.Trophy, label: 'Mission Control', role: 'admin' }
          ]
          .filter(item => item.role === 'both' || item.role === user.role)
          .map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id as Tab)}
              className={`w-full flex items-center justify-center md:justify-start gap-4 p-4 rounded-2xl transition-all duration-500 group ${activeTab === item.id ? 'bg-luwa-gold text-black font-black shadow-lg shadow-luwa-gold/10' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            >
              <item.icon className={`w-5 h-5 transition-transform duration-500 ${activeTab === item.id ? '' : 'group-hover:scale-110'}`} />
              <span className="hidden md:block text-[9px] font-black uppercase tracking-[0.3em]">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Sidebar Footer Component */}
        <div className="p-6 border-t border-white/5 bg-black/20">
          <div className="hidden md:block mb-6 px-2">
            <p className="text-[7px] text-gray-600 uppercase font-black tracking-widest mb-1">{user.prestige} Scholar</p>
            <p className="text-xs font-black truncate text-white uppercase tracking-tight">{user.name}</p>
          </div>
          <button 
            type="button"
            onClick={handleLogoutTrigger}
            className="w-full flex items-center justify-center md:justify-start gap-4 p-4 rounded-2xl text-gray-600 hover:text-red-500 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 transition-all group"
          >
            <ICONS.LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            <span className="hidden md:block text-[9px] font-black uppercase tracking-[0.3em]">Terminate</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col min-w-0 pt-${isSimulating ? '8' : '0'} transition-all duration-500`}>
        <header className="h-16 border-b border-white/5 glass px-10 flex items-center justify-between z-50">
           <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                 <div className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'syncing' ? 'bg-luwa-gold animate-ping' : 'bg-green-500/80 shadow-[0_0_10px_rgba(34,197,94,0.3)]'}`} />
                 <span className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-500">Registry: Online</span>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                 <div className={`w-1.5 h-1.5 rounded-full ${user.health.burnoutRisk > 0.6 ? 'bg-red-500' : 'bg-luwa-gold shadow-[0_0_10px_rgba(255,215,0,0.2)]'}`} />
                 <span className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-500">Health: {user.health.status}</span>
              </div>
           </div>

           <div className="flex items-center gap-8">
             <div className="flex items-center gap-2 bg-luwa-gold/5 border border-luwa-gold/10 px-4 py-2 rounded-xl">
                <ICONS.Zap className="w-3.5 h-3.5 luwa-gold" />
                <span className="text-[10px] font-black text-luwa-gold tracking-widest">{user.xp.toLocaleString()} XP</span>
             </div>
             
             <div className="h-6 w-px bg-white/5" />
             
             {/* Header Logout Action */}
             <button 
               type="button"
               onClick={handleLogoutTrigger}
               title="Terminate Session"
               className="group flex items-center gap-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-4 py-2 rounded-xl transition-all"
             >
               <span className="text-[9px] font-black uppercase tracking-widest text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hidden md:inline">Logout</span>
               <ICONS.LogOut className="w-4 h-4 text-red-500 group-hover:translate-x-1 transition-transform" />
             </button>
           </div>
        </header>

        <div className="flex-1 p-10 overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[radial-gradient(circle_at_50%_50%,#FFD700,transparent_70%)]" />
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
