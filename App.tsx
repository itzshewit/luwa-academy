/*
  Luwa Academy – Core Application Shell
  V6.6 - Assignment Manager Integration
*/

import React, { useState, useEffect, useCallback } from 'react';
import { Auth } from './components/Auth.tsx';
import { Dashboard } from './components/Dashboard.tsx';
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
import { User, StudyNote } from './types.ts';
import { ICONS } from './constants.tsx';

type Tab = 'home' | 'tutor' | 'lab' | 'analytics' | 'admin' | 'library' | 'planner' | 'mock' | 'papers' | 'cinematic' | 'about' | 'settings' | 'live' | 'viewer' | 'quizzes' | 'assignments';

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
    color: '#000000'
  },
  dark: {
    backgroundColor: '#000000',
    color: '#ffffff'
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
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState('light');

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
            if (dbUser.role === 'admin') setActiveTab('admin');
          } else {
            setUser(session);
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

  const logout = useCallback(() => {
    storageService.logout();
    setUser(null);
    setActiveTab('home');
    setIsMobileNavOpen(false);
  }, []);

  const changeLanguage = (lang) => {
    setLanguage(lang);
  };

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  if (!isReady) return (
    <div className="h-[100dvh] w-screen flex items-center justify-center bg-white">
      <div className="w-10 h-10 border-4 border-slate-100 border-t-luwa-primary rounded-full animate-spin" />
    </div>
  );

  if (!user) return <div className="h-[100dvh] bg-white overflow-hidden"><Auth onLogin={setUser} /></div>;

  const isAdmin = user.role === 'admin';
  const currentTabs = isAdmin 
    ? [
        { id: 'admin', icon: ICONS.Home, label: 'Control', desc: 'System Administration' },
        { id: 'assignments', icon: ICONS.Copy, label: 'Assignments', desc: 'Registry Management' },
        { id: 'settings', icon: ICONS.Layout, label: 'Settings', desc: 'Registry Config' }
      ]
    : [
        { id: 'home', icon: ICONS.Home, label: 'Home', desc: 'Scholar Overview' },
        { id: 'library', icon: ICONS.Layout, label: 'Library', desc: 'Study Nodes' },
        { id: 'quizzes', icon: ICONS.Zap, label: 'Quizzes', desc: 'Unit Assessment' },
        { id: 'assignments', icon: ICONS.Copy, label: 'Assignments', desc: 'Scholar Tasks' },
        { id: 'tutor', icon: ICONS.Brain, label: 'Neural Tutor', desc: 'AI Instruction' },
        { id: 'live', icon: ICONS.Mic, label: 'Live Link', desc: 'Vocal Co-pilot' },
        { id: 'lab', icon: ICONS.Award, label: 'AI Lab', desc: 'Adaptive Practice' },
        { id: 'mock', icon: ICONS.Trophy, label: 'Mock Exam', desc: 'Simulation Node' },
        { id: 'analytics', icon: ICONS.Layout, label: 'Insights', desc: 'Scholar Pulse' }
      ];

  return (
    <div style={themes[theme]} role="main" aria-label="Luwa Academy Main Content">
      <header role="banner">
        <h1 tabIndex={0}>Luwa Academy</h1>
        <nav role="navigation" aria-label="Main Navigation">
          <ul>
            <li><a href="#dashboard" tabIndex={0}>Dashboard</a></li>
            <li><a href="#courses" tabIndex={0}>Courses</a></li>
            <li><a href="#settings" tabIndex={0}>Settings</a></li>
          </ul>
        </nav>
        <div>
          <button onClick={() => changeLanguage('en')}>English</button>
          <button onClick={() => changeLanguage('am')}>አማርኛ</button>
        </div>
        <button onClick={toggleTheme} aria-label="Toggle Theme">
          Switch to {theme === 'light' ? 'Dark' : 'Light'} Theme
        </button>
      </header>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {showOnboarding && <OnboardingTutorial onComplete={() => setShowOnboarding(false)} />}

        {/* Global Mobile Hamburger Navigation Drawer */}
        {isMobileNavOpen && (
          <div className="fixed inset-0 z-[1000] bg-white/95 backdrop-blur-xl flex flex-col p-8 animate-m3-fade md:hidden">
            <div className="flex justify-between items-center mb-10">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-luwa-primary rounded-m3-m flex items-center justify-center text-white font-serif font-black shadow-m3-1">L</div>
                  <span className="title-large font-bold text-luwa-onSurface">Luwa</span>
               </div>
               <button onClick={() => setIsMobileNavOpen(false)} className="p-4 bg-slate-50 rounded-full text-slate-400">
                  <ICONS.X className="w-6 h-6" />
               </button>
            </div>
            
            <nav className="flex-1 space-y-3 overflow-y-auto custom-scrollbar-hide">
              {currentTabs.map(t => (
                <button 
                  key={t.id} 
                  onClick={() => navigateTo(t.id as Tab)} 
                  className={`w-full text-left p-6 rounded-m3-xl border transition-all flex items-center justify-between ${activeTab === t.id ? 'bg-luwa-primary border-luwa-primary text-white shadow-m3-2' : 'bg-white border-slate-100'}`}
                >
                  <div>
                    <p className="text-lg font-black uppercase tracking-widest">{t.label}</p>
                    <p className={`text-[9px] font-medium uppercase tracking-widest mt-1 ${activeTab === t.id ? 'text-white/60' : 'text-slate-400'}`}>{t.desc}</p>
                  </div>
                  <t.icon className={`w-5 h-5 ${activeTab === t.id ? 'text-white' : 'text-slate-200'}`} />
                </button>
              ))}
            </nav>

            <div className="mt-8 pt-8 border-t border-slate-100">
               <button onClick={logout} className="w-full flex items-center justify-center gap-3 py-5 bg-red-50 text-luwa-error rounded-m3-xl font-black text-xs uppercase tracking-widest m3-ripple">
                  <ICONS.LogOut className="w-4 h-4" /> Sign Out
               </button>
            </div>
          </div>
        )}

        {/* Desktop Persistent Sidebar */}
        <aside className="hidden md:flex w-72 flex-col bg-white border-r border-slate-100 z-40">
          <div className="p-10 flex items-center gap-4">
            <div className="w-10 h-10 bg-luwa-primary rounded-m3-m flex items-center justify-center text-white font-serif font-black shadow-m3-1">L</div>
            <span className="title-large font-bold text-luwa-onSurface">Luwa</span>
          </div>
          <nav className="flex-1 px-6 space-y-1 overflow-y-auto custom-scrollbar">
            {currentTabs.map(t => (
              <button 
                key={t.id} 
                onClick={() => navigateTo(t.id as Tab)} 
                className={`w-full flex items-center gap-4 p-4 rounded-m3-xl transition-all duration-300 ${activeTab === t.id ? 'bg-luwa-primaryContainer text-luwa-primary font-bold shadow-sm' : 'text-slate-400 hover:text-luwa-primary hover:bg-slate-50'}`}
              >
                <t.icon className="w-5 h-5" />
                <span className="label-large tracking-wide">{t.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-6 border-t border-slate-100 space-y-2">
            <button onClick={logout} className="w-full text-left px-6 py-4 text-slate-400 hover:text-luwa-error hover:bg-red-50 rounded-m3-xl transition-all label-large font-bold uppercase">Logout</button>
          </div>
        </aside>

        <div className={`flex-1 overflow-y-auto ${activeTab === 'viewer' ? 'p-0' : 'p-4 md:p-10'} custom-scrollbar bg-white`}>
          <div className={`${activeTab === 'viewer' ? 'w-full h-full' : 'max-w-6xl mx-auto h-full'} accelerated`}>
            {activeTab === 'home' && <Dashboard user={user} onNavigate={navigateTo as any} onUpdateUser={handleUpdateUser} />}
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

      <footer role="contentinfo">
        <p>&copy; 2026 Luwa Academy. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;
