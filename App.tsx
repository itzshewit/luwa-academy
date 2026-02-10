
/*
  Luwa Academy – Core Application Shell
  V6.9 - Multi-Linguistic & Temporal Theme Integration
*/

import React, { useState, useEffect, useCallback } from 'react';
import { Auth } from './components/Auth.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { StudentDashboard } from './components/StudentDashboard.tsx';
import { NeuralTutor } from './components/NeuralTutor.tsx';
import { AssessmentLab } from './components/AssessmentLab.tsx';
import { AdminControl } from './components/AdminControl.tsx';
import { ScholarAnalytics } from './components/ScholarAnalytics.tsx';
import { CurriculumLibrary } from './components/CurriculumLibrary.tsx';
import { MockSimulator } from './components/MockSimulator.tsx';
import { OnboardingTutorial } from './components/OnboardingTutorial.tsx';
import { LuwaLive } from './components/LuwaLive.tsx';
import { LessonViewer } from './components/LessonViewer.tsx';
import { QuizCenter } from './components/QuizCenter.tsx';
import { AssignmentManager } from './components/AssignmentManager.tsx';
import { storageService } from './services/storageService.ts';
import { initializeProgress } from './services/progressService.ts';
import { User, StudyNote, Tab } from './types.ts';
import { ICONS } from './constants.tsx';

const translations = {
  en: {
    welcome: 'Welcome to Luwa Academy',
    dashboard: 'Dashboard',
    courses: 'Courses',
    settings: 'Settings'
  },
  am: {
    welcome: 'እንኳን ወደ ሉዋ አካዳሚ በደህና መጡ',
    dashboard: 'መሳሪያ ሰሌዳ',
    courses: 'ኮርሶች',
    settings: 'ቅንብሮች'
  }
};

const themes = {
  light: {
    backgroundColor: '#ffffff',
    color: '#191C1E'
  },
  dark: {
    backgroundColor: '#0F172A',
    color: '#F1F2F4'
  }
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [targetSubject, setTargetSubject] = useState<string | null>(null);
  const [activeNote, setActiveNote] = useState<StudyNote | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  // Integrated Personalized Settings State
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const initApp = async () => {
      await storageService.seedRegistry();
      
      const session = storageService.getSession();
      if (session) {
        if (storageService.isSessionExpired(session)) {
          storageService.logout();
          setUser(null);
        } else {
          const dbUser = await storageService.getUserByEmail(session.email);
          if (dbUser) {
            setUser(dbUser);
            initializeProgress(dbUser.id);
            if (dbUser.role === 'admin') setActiveTab('admin');
          } else {
            setUser(session);
            initializeProgress(session.id);
          }
        }
      }
      
      const hasSeenTutorial = localStorage.getItem('luwa_tutorial_seen');
      if (!hasSeenTutorial && session && session.role !== 'admin') {
        setShowOnboarding(true);
      }

      setIsReady(true);
    };

    initApp();
  }, []);

  const navigateTo = (tab: Tab, subject?: string, note?: StudyNote) => {
    setActiveTab(tab);
    if (subject) setTargetSubject(subject);
    if (note) setActiveNote(note);
    setIsMobileNavOpen(false);
  };

  const handleUpdateUser = useCallback(async (updated: User) => {
    setUser(updated);
    await storageService.saveUser(updated);
    storageService.setSession(updated);
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    initializeProgress(u.id);
  };

  const logout = useCallback(() => {
    storageService.logout();
    setUser(null);
    setActiveTab('home');
    setIsMobileNavOpen(false);
  }, []);

  // Integrated Handlers
  const changeLanguage = (lang: string) => setLanguage(lang);
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  if (!isReady) return (
    <div className="h-[100dvh] w-screen flex items-center justify-center bg-white">
      <div className="w-10 h-10 border-4 border-slate-100 border-t-luwa-primary rounded-full animate-spin" />
    </div>
  );

  if (!user) return <div className="h-[100dvh] bg-white overflow-hidden"><Auth onLogin={handleLogin} /></div>;

  const isAdmin = user.role === 'admin';
  const currentTabs = isAdmin 
    ? [
        { id: 'admin', icon: ICONS.Home, label: 'Control', desc: 'System Administration' },
        { id: 'assignments', icon: ICONS.Copy, label: 'Assignments', desc: 'Registry Management' },
        { id: 'settings', icon: ICONS.Layout, label: 'Settings', desc: 'Registry Config' }
      ]
    : [
        { id: 'home', icon: ICONS.Home, label: 'Home', desc: 'Scholar Overview' },
        { id: 'portal', icon: ICONS.Layout, label: 'Portal', desc: 'Scholar Dashboard' },
        { id: 'library', icon: ICONS.Layout, label: 'Library', desc: 'Study Nodes' },
        { id: 'quizzes', icon: ICONS.Zap, label: 'Quizzes', desc: 'Unit Assessment' },
        { id: 'assignments', icon: ICONS.Copy, label: 'Assignments', desc: 'Scholar Tasks' },
        { id: 'tutor', icon: ICONS.Brain, label: 'Neural Tutor', desc: 'AI Instruction' },
        { id: 'live', icon: ICONS.Mic, label: 'Live Link', desc: 'Vocal Co-pilot' },
        { id: 'lab', icon: ICONS.Award, label: 'AI Lab', desc: 'Adaptive Practice' },
        { id: 'mock', icon: ICONS.Trophy, label: 'Mock Exam', desc: 'Simulation Node' },
        { id: 'analytics', icon: ICONS.Layout, label: 'Insights', desc: 'Scholar Pulse' }
      ];

  const activeThemeStyle = themes[theme];

  return (
    <div 
      className="flex h-[100dvh] overflow-hidden font-sans select-none animate-m3-fade transition-colors duration-500"
      style={activeThemeStyle}
      role="main"
      aria-label="Luwa Academy Institutional Terminal"
    >
      {showOnboarding && <OnboardingTutorial onComplete={() => setShowOnboarding(false)} />}

      {/* Global Mobile Hamburger Navigation Drawer */}
      {isMobileNavOpen && (
        <div className={`fixed inset-0 z-[1000] backdrop-blur-xl flex flex-col p-8 animate-m3-fade md:hidden ${theme === 'dark' ? 'bg-slate-900/95' : 'bg-white/95'}`}>
          <div className="flex justify-between items-center mb-10">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-luwa-primary rounded-m3-m flex items-center justify-center text-white font-serif font-black shadow-m3-1">L</div>
                <span className={`title-large font-bold ${theme === 'dark' ? 'text-white' : 'text-luwa-onSurface'}`}>Luwa</span>
             </div>
             <button onClick={() => setIsMobileNavOpen(false)} className={`p-4 rounded-full ${theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-400'}`}>
                <ICONS.X className="w-6 h-6" />
             </button>
          </div>
          
          <nav className="flex-1 space-y-3 overflow-y-auto custom-scrollbar-hide">
            {currentTabs.map(t => (
              <button 
                key={t.id} 
                onClick={() => navigateTo(t.id as Tab)} 
                className={`w-full text-left p-6 rounded-m3-xl border transition-all flex items-center justify-between ${activeTab === t.id ? 'bg-luwa-primary border-luwa-primary text-white shadow-m3-2' : theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-100'}`}
              >
                <div>
                  <p className="text-lg font-black uppercase tracking-widest">{t.label}</p>
                  <p className={`text-[9px] font-medium uppercase tracking-widest mt-1 ${activeTab === t.id ? 'text-white/60' : 'text-slate-400'}`}>{t.desc}</p>
                </div>
                <t.icon className={`w-5 h-5 ${activeTab === t.id ? 'text-white' : 'text-slate-500'}`} />
              </button>
            ))}
          </nav>

          <div className="mt-8 pt-8 border-t border-slate-100/10 space-y-4">
             <div className="flex gap-2">
                <button onClick={() => changeLanguage('en')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest ${language === 'en' ? 'bg-luwa-primary text-white' : 'bg-slate-800 text-slate-400'}`}>EN</button>
                <button onClick={() => changeLanguage('am')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest ${language === 'am' ? 'bg-luwa-primary text-white' : 'bg-slate-800 text-slate-400'}`}>AM</button>
                <button onClick={toggleTheme} className="p-3 bg-slate-800 text-luwa-tertiary rounded-xl"><ICONS.Zap className="w-5 h-5" /></button>
             </div>
             <button onClick={logout} className="w-full flex items-center justify-center gap-3 py-5 bg-red-500/10 text-luwa-error rounded-m3-xl font-black text-xs uppercase tracking-widest m3-ripple">
                <ICONS.LogOut className="w-4 h-4" /> Sign Out
             </button>
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className={`hidden md:flex w-72 flex-col border-r transition-colors duration-500 z-40 ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className="p-10 flex items-center gap-4">
          <div className="w-10 h-10 bg-luwa-primary rounded-m3-m flex items-center justify-center text-white font-serif font-black shadow-m3-1">L</div>
          <span className={`title-large font-bold ${theme === 'dark' ? 'text-white' : 'text-luwa-onSurface'}`}>Luwa</span>
        </div>
        <nav className="flex-1 px-6 space-y-1 overflow-y-auto custom-scrollbar">
          {currentTabs.map(t => (
            <button 
              key={t.id} 
              onClick={() => navigateTo(t.id as Tab)} 
              className={`w-full flex items-center gap-4 p-4 rounded-m3-xl transition-all duration-300 ${activeTab === t.id ? 'bg-luwa-primaryContainer text-luwa-primary font-bold shadow-sm' : 'text-slate-400 hover:text-luwa-primary hover:bg-slate-50/10'}`}
            >
              <t.icon className="w-5 h-5" />
              <span className="label-large tracking-wide">{t.label}</span>
            </button>
          ))}
        </nav>

        {/* Integrated Sidebar Controls */}
        <div className="p-6 border-t border-slate-100/10 space-y-4">
          <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl">
             <button onClick={() => changeLanguage('en')} className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all ${language === 'en' ? 'bg-luwa-primary text-white' : 'text-slate-500'}`}>English</button>
             <button onClick={() => changeLanguage('am')} className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all ${language === 'am' ? 'bg-luwa-primary text-white' : 'text-slate-500'}`}>አማርኛ</button>
             <button onClick={toggleTheme} className={`p-2 rounded-lg transition-all ${theme === 'dark' ? 'bg-luwa-tertiary text-white' : 'text-slate-500'}`}>
                <ICONS.Zap className="w-4 h-4" />
             </button>
          </div>
          <button onClick={logout} className="w-full text-left px-6 py-4 text-slate-400 hover:text-luwa-error hover:bg-red-50/10 rounded-m3-xl transition-all label-large font-bold uppercase">Logout</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {activeTab !== 'viewer' && (
          <header className={`h-20 backdrop-blur-xl px-8 flex items-center justify-between z-30 border-b transition-colors duration-500 shrink-0 ${theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-100'}`}>
            <div className="flex items-center gap-6">
              {/* Global Hamburger Icon */}
              <button 
                onClick={() => setIsMobileNavOpen(true)}
                className="md:hidden p-4 bg-luwa-primaryContainer text-luwa-primary rounded-m3-l active:scale-95 transition-all shadow-sm"
                aria-label="Toggle Global Navigation"
              >
                  <ICONS.Menu className="w-6 h-6" />
              </button>
              <span className="text-[10px] text-slate-400 uppercase tracking-[0.4em] font-black hidden sm:inline-block">
                  {isAdmin ? 'Administrative Cluster' : 'Scholar Node Active'}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                  <p className={`text-[10px] font-black uppercase ${theme === 'dark' ? 'text-white' : 'text-luwa-onSurface'}`}>{user.fullName}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Level {Math.floor(user.xp / 100) + 1} Scholar</p>
              </div>
              <div className="w-10 h-10 bg-luwa-surfaceVariant rounded-full border border-slate-100/10 flex items-center justify-center font-black text-xs text-luwa-primary">
                  {user.fullName.charAt(0)}
              </div>
            </div>
          </header>
        )}

        <div className={`flex-1 overflow-y-auto ${activeTab === 'viewer' ? 'p-0' : 'p-4 md:p-10'} custom-scrollbar`}>
          <div className={`${activeTab === 'viewer' ? 'w-full h-full' : 'max-w-6xl mx-auto h-full'} accelerated`}>
            {activeTab === 'home' && <Dashboard user={user} onNavigate={navigateTo as any} onUpdateUser={handleUpdateUser} />}
            {activeTab === 'portal' && <StudentDashboard user={user} onNavigate={navigateTo as any} />}
            {activeTab === 'tutor' && <NeuralTutor user={user} onUpdateUser={handleUpdateUser} />}
            {activeTab === 'live' && <LuwaLive />}
            {activeTab === 'quizzes' && <QuizCenter user={user} onUpdateUser={handleUpdateUser} onExit={() => setActiveTab('home')} />}
            {activeTab === 'assignments' && <AssignmentManager user={user} onUpdateUser={handleUpdateUser} onNavigate={navigateTo as any} />}
            {activeTab === 'lab' && <AssessmentLab user={user} onUpdateUser={handleUpdateUser} onConsultTutor={() => navigateTo('tutor')} targetNodeId={targetSubject || undefined} />}
            {activeTab === 'mock' && <MockSimulator user={user} onComplete={(s) => { handleUpdateUser({ ...user, xp: user.xp + (s * 10) }); navigateTo('analytics'); }} onExit={() => navigateTo('home')} />}
            {activeTab === 'library' && <CurriculumLibrary user={user} onUpdateUser={handleUpdateUser} onOpenViewer={(note) => navigateTo('viewer', undefined, note)} />}
            {activeTab === 'analytics' && <ScholarAnalytics user={user} />}
            {activeTab === 'admin' && isAdmin && <AdminControl onSimulate={(u) => { setUser(u); navigateTo('home'); }} />}
            {activeTab === 'viewer' && activeNote && <LessonViewer user={user} note={activeNote} onClose={() => navigateTo('library')} onUpdateUser={handleUpdateUser} />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
