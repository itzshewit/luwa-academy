
import React, { useState, useEffect } from 'react';
import { Auth } from './components/Auth.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { NeuralTutor } from './components/NeuralTutor.tsx';
import { AssessmentLab } from './components/AssessmentLab.tsx';
import { AdminControl } from './components/AdminControl.tsx';
import { ScholarAnalytics } from './components/ScholarAnalytics.tsx';
import { CurriculumLibrary } from './components/CurriculumLibrary.tsx';
import { AcademicPlanner } from './components/AcademicPlanner.tsx';
import { ExamSystem } from './components/ExamSystem.tsx';
import { About } from './components/About.tsx';
import { storageService } from './services/storageService.ts';
import { User } from './types.ts';
import { ICONS } from './constants.tsx';

type Tab = 'home' | 'tutor' | 'lab' | 'analytics' | 'admin' | 'library' | 'planner' | 'exams' | 'about';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing'>('idle');
  const [showMobileProfile, setShowMobileProfile] = useState(false);
  const [aiOnline, setAiOnline] = useState(false);

  useEffect(() => {
    const session = storageService.getSession();
    if (session) {
      setUser(session);
      if (session.role === 'admin') setActiveTab('admin');
    }

    // Check AI status regularly for real-time feedback in the UI
    const checkAI = async () => {
      const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
      // System is "online" if there is an environment key OR a user-selected key
      setAiOnline(!!process.env.API_KEY || hasKey);
    };
    checkAI();
    const interval = setInterval(checkAI, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateUser = (updated: User) => {
    setSyncStatus('syncing');
    const final = {
      ...updated,
      level: storageService.calculateLevel(updated.xp),
      prestige: storageService.calculatePrestige(updated.xp),
      health: storageService.calculateHealth(updated)
    };
    setUser(final);
    storageService.saveUser(final);
    storageService.setSession(final);
    setTimeout(() => setSyncStatus('idle'), 800);
  };

  const handleAuthorizeAI = async () => {
    try {
      if ((window as any).aistudio) {
        await (window as any).aistudio.openSelectKey();
        setAiOnline(true);
      }
    } catch (e) {
      console.error("Authorization dialog failed to open", e);
    }
  };

  const logout = () => {
    storageService.logout();
    setUser(null);
    setActiveTab('home');
    setShowMobileProfile(false);
  };

  if (!user) return <div className="min-h-screen bg-luwa-gray"><Auth onLogin={setUser} /></div>;

  const tabs = [
    { id: 'home', icon: ICONS.Home, label: 'Home', role: 'scholar' },
    { id: 'library', icon: ICONS.Layout, label: 'Library', role: 'scholar' },
    { id: 'tutor', icon: ICONS.Brain, label: 'AI Tutor', role: 'scholar' },
    { id: 'exams', icon: ICONS.Zap, label: 'Mocks', role: 'scholar' },
    { id: 'lab', icon: ICONS.Trophy, label: 'Practice', role: 'scholar' },
    { id: 'planner', icon: ICONS.Layout, label: 'Planner', role: 'scholar' },
    { id: 'analytics', icon: ICONS.Info, label: 'Analytics', role: 'scholar' },
    { id: 'admin', icon: ICONS.Layout, label: 'Admin', role: 'admin' },
    { id: 'about', icon: ICONS.Info, label: 'About', role: 'scholar' }
  ].filter(t => t.role === 'both' || t.role === user.role);

  return (
    <div className="flex h-screen overflow-hidden bg-luwa-gray font-sans select-none">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-72 flex-col bg-white border-r border-luwa-border shadow-sm">
        <div className="p-8 flex items-center gap-4">
          <div className="w-10 h-10 bg-luwa-purple rounded-xl flex items-center justify-center text-white font-serif font-black shadow-lg">L</div>
          <span className="text-xl font-serif font-bold text-luwa-purple">Luwa Academy</span>
        </div>
        <nav className="flex-1 px-6 space-y-1 overflow-y-auto custom-scrollbar">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as Tab)} className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${activeTab === t.id ? 'bg-luwa-purple text-white shadow-xl shadow-luwa-purple/20' : 'text-slate-400 hover:text-luwa-purple hover:bg-slate-50'}`}>
              <t.icon className="w-5 h-5" />
              <span className="text-[11px] font-black uppercase tracking-widest">{t.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-8 border-t border-luwa-border">
          <button onClick={logout} className="w-full flex items-center gap-4 p-4 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
            <ICONS.LogOut className="w-5 h-5" />
            <span className="text-[11px] font-black uppercase tracking-widest">Logout Session</span>
          </button>
        </div>
      </aside>

      {/* Bottom Nav - Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-luwa-border z-50 flex justify-around items-center px-4 shadow-lg">
        {tabs.slice(0, 5).map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as Tab)} className={`flex flex-col items-center gap-1 ${activeTab === t.id ? 'text-luwa-purple' : 'text-slate-400'}`}>
            <t.icon className="w-6 h-6" />
            <span className="text-[8px] font-black uppercase tracking-tighter">{t.label}</span>
          </button>
        ))}
      </div>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 md:h-20 border-b border-luwa-border bg-white/80 backdrop-blur-md px-6 md:px-10 flex items-center justify-between z-30 shrink-0">
          <div className="flex items-center gap-4">
            <div className={`w-2 h-2 rounded-full ${syncStatus === 'syncing' ? 'bg-luwa-teal animate-pulse' : 'bg-luwa-teal/40'}`} />
            <button onClick={handleAuthorizeAI} className="flex items-center gap-2 group">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Neural Link:</span>
              <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${aiOnline ? 'text-luwa-teal' : 'text-red-400 animate-pulse group-hover:text-luwa-purple'}`}>
                {aiOnline ? 'Synchronized' : 'Offline (Click to Sync)'}
              </span>
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowMobileProfile(true)}
              className="w-9 h-9 rounded-full bg-slate-100 border border-luwa-border flex items-center justify-center text-luwa-purple font-black text-xs hover:bg-slate-200"
            >
              {user.name.charAt(0)}
            </button>
          </div>
        </header>

        {/* Mobile Profile Overlay */}
        {showMobileProfile && (
          <div className="fixed inset-0 z-[60] md:hidden">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowMobileProfile(false)} />
            <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] p-10 animate-fade-in shadow-2xl">
               <div className="text-center mb-8">
                 <p className="text-2xl font-serif font-bold text-luwa-purple mb-1">{user.name}</p>
                 <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{user.email}</p>
               </div>
               <button onClick={handleAuthorizeAI} className="w-full bg-luwa-teal/10 text-luwa-teal py-4 rounded-xl mb-4 font-black text-[10px] uppercase tracking-widest border border-luwa-teal/20">Sync Neural Link</button>
               <button onClick={logout} className="w-full bg-red-50 text-red-500 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest">Logout Session</button>
            </div>
          </div>
        )}

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 pb-20 md:pb-10 custom-scrollbar">
          {activeTab === 'home' && <Dashboard user={user} onNavigate={setActiveTab} onUpdateUser={handleUpdateUser} />}
          {activeTab === 'library' && <CurriculumLibrary user={user} />}
          {activeTab === 'tutor' && <NeuralTutor user={user} onUpdateUser={handleUpdateUser} />}
          {activeTab === 'exams' && <ExamSystem user={user} />}
          {activeTab === 'lab' && <AssessmentLab user={user} onUpdateUser={handleUpdateUser} onConsultTutor={() => setActiveTab('tutor')} />}
          {activeTab === 'planner' && <AcademicPlanner user={user} onUpdateUser={handleUpdateUser} />}
          {activeTab === 'analytics' && <ScholarAnalytics user={user} />}
          {activeTab === 'admin' && <AdminControl onSimulate={(u) => { storageService.enterSimulation(u); setUser(u); setActiveTab('home'); }} />}
          {activeTab === 'about' && <About />}
        </div>
      </main>
    </div>
  );
};

export default App;
