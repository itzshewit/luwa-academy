
/*
  Luwa Academy – Institutional Settings & System Preferences
  Developed by Shewit – 2026
  Module: Global Configuration Hub
  V2.0 - Multi-Sectional Logic Nodes
*/

import React, { useState, useMemo } from 'react';
import { GlassCard } from './GlassCard.tsx';
import { User, SubscriptionTier, Language } from '../types.ts';
import { ICONS, APP_FULL_VERSION, APP_VERSION } from '../constants.tsx';

interface SettingsProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
}

type SettingsSection = 'profile' | 'account' | 'notifications' | 'appearance' | 'privacy' | 'data';

export const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser, onLogout }) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Local Form States
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || '');
  const [dob, setDob] = useState(user.dob || '');
  const [bio, setBio] = useState(''); // Added bio support
  const [grade, setGrade] = useState(user.grade.toString());
  const [stream, setStream] = useState(user.stream);

  const showSuccess = () => {
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 3000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...user,
      fullName,
      email,
      phone,
      dob,
      grade: grade as any,
      stream: stream as any
    });
    showSuccess();
  };

  const handleToggleSetting = (key: string, value: boolean) => {
    // Logic for deep settings update
    showSuccess();
  };

  const handleUpdateAccent = (color: string) => {
    document.documentElement.style.setProperty('--luwa-primary', color);
    showSuccess();
  };

  const navItems: { id: SettingsSection; icon: string; label: string }[] = [
    { id: 'profile', icon: '👤', label: 'Profile' },
    { id: 'account', icon: '🔐', label: 'Account' },
    { id: 'notifications', icon: '🔔', label: 'Notifications' },
    { id: 'appearance', icon: '🎨', label: 'Appearance' },
    { id: 'privacy', icon: '🔒', label: 'Privacy' },
    { id: 'data', icon: '💾', label: 'Data & Storage' }
  ];

  return (
    <div className="h-full flex flex-col gap-8 animate-m3-fade overflow-hidden">
      <header className="shrink-0 flex justify-between items-end">
        <div>
          <h2 className="headline-medium font-serif font-black text-luwa-onSurface">System Preferences</h2>
          <p className="label-small text-slate-400 font-black uppercase tracking-[0.4em] mt-2">{APP_FULL_VERSION}</p>
        </div>
        {isSuccess && (
          <div className="px-6 py-2 bg-green-50 text-green-600 border border-green-100 rounded-full text-[10px] font-black uppercase animate-m3-fade">
            ✓ Registry Synchronized
          </div>
        )}
      </header>

      <div className="flex-1 flex flex-col md:flex-row gap-8 overflow-hidden">
        {/* Settings Sidebar */}
        <aside className="w-full md:w-72 shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto pb-2 md:pb-0 custom-scrollbar-hide">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex items-center gap-4 px-6 py-4 rounded-m3-xl font-bold text-xs uppercase tracking-widest transition-all whitespace-nowrap border-2 ${activeSection === item.id ? 'bg-luwa-primary text-white border-luwa-primary shadow-m3-1' : 'text-slate-400 hover:bg-slate-50 border-transparent'}`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
          <div className="hidden md:block mt-auto pt-6 border-t border-slate-100">
             <button onClick={onLogout} className="w-full text-left px-6 py-4 text-luwa-error font-black text-[10px] uppercase tracking-widest hover:bg-red-50 rounded-xl transition-all">Terminate Session</button>
          </div>
        </aside>

        {/* Settings Content Area */}
        <main className="flex-1 overflow-y-auto pr-4 custom-scrollbar pb-20">
          <GlassCard className="p-8 md:p-12 bg-white border-slate-100 shadow-sm min-h-full">
            
            {activeSection === 'profile' && (
              <div className="space-y-10 animate-m3-fade">
                <div className="pb-6 border-b border-slate-50">
                   <h3 className="title-large font-serif font-black text-luwa-onSurface uppercase tracking-tight">Scholar Profile</h3>
                   <p className="text-xs text-slate-400 font-medium">Manage your institutional identity</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-8 p-8 bg-slate-50 rounded-3xl border border-slate-100">
                   <div className="w-24 h-24 bg-luwa-primary text-white rounded-full flex items-center justify-center text-4xl font-black shadow-m3-1">
                      {fullName.charAt(0)}
                   </div>
                   <div className="flex-1 text-center sm:text-left">
                      <h4 className="text-lg font-black text-luwa-onSurface">Profile Registry</h4>
                      <p className="text-xs text-slate-500 mb-4">Upload a high-fidelity image or use system initials</p>
                      <div className="flex gap-3 justify-center sm:justify-start">
                         <button className="px-6 py-2 bg-luwa-primary text-white rounded-lg text-[9px] font-black uppercase tracking-widest">Update Photo</button>
                         <button className="px-6 py-2 bg-white border border-slate-200 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest">Remove</button>
                      </div>
                   </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Full Scholar Name</label>
                         <input value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold focus:bg-white outline-none" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Institutional Email</label>
                         <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold focus:bg-white outline-none" />
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Temporal DOB</label>
                         <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold focus:bg-white outline-none" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Phone Link</label>
                         <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold focus:bg-white outline-none" />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Scholar Bio</label>
                      <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Personal academic mission statement..." className="w-full h-32 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold focus:bg-white outline-none resize-none" />
                   </div>

                   <div className="pt-6 border-t border-slate-50">
                      <button type="submit" className="px-10 py-4 bg-luwa-primary text-white rounded-xl label-large font-black uppercase tracking-[0.2em] shadow-m3-2 m3-ripple transition-all active:scale-95">Save Registry Update</button>
                   </div>
                </form>
              </div>
            )}

            {activeSection === 'account' && (
              <div className="space-y-10 animate-m3-fade">
                <div className="pb-6 border-b border-slate-50">
                   <h3 className="title-large font-serif font-black text-luwa-onSurface uppercase tracking-tight">Account & Security</h3>
                   <p className="text-xs text-slate-400 font-medium">Registry protection protocols</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {[
                     { label: 'Days Active', value: '142', icon: '📅' },
                     { label: 'Units Audited', value: user.xp > 0 ? Math.floor(user.xp / 100) : 0, icon: '📝' },
                     { label: 'Readiness Index', value: `${user.readiness}%`, icon: '🎯' }
                   ].map(stat => (
                     <div key={stat.label} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl text-center">
                        <span className="text-2xl block mb-2">{stat.icon}</span>
                        <p className="text-3xl font-black text-luwa-primary">{stat.value}</p>
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</p>
                     </div>
                   ))}
                </div>

                <div className="space-y-4">
                   <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Security Nodes</h4>
                   <div className="p-6 border-2 border-slate-100 rounded-2xl flex justify-between items-center">
                      <div>
                         <p className="text-sm font-black text-luwa-onSurface">Two-Factor Authentication</p>
                         <p className="text-[10px] text-slate-400">Add an extra layer of protocol to your registry access</p>
                      </div>
                      <button onClick={() => handleToggleSetting('2fa', true)} className="px-6 py-2 bg-slate-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500">Enable 2FA</button>
                   </div>
                </div>

                <div className="pt-10 border-t border-slate-100">
                   <h4 className="text-[10px] font-black uppercase text-luwa-error tracking-widest mb-6">Danger Registry</h4>
                   <div className="p-6 border-2 border-red-100 bg-red-50/30 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div>
                         <p className="text-sm font-black text-luwa-error">Delete Scholar Node</p>
                         <p className="text-[10px] text-red-400">Permanently erase all historical XP and mastery data. This cannot be undone.</p>
                      </div>
                      <button className="px-8 py-3 bg-luwa-error text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm">Purge Data</button>
                   </div>
                </div>
              </div>
            )}

            {activeSection === 'appearance' && (
              <div className="space-y-10 animate-m3-fade">
                <div className="pb-6 border-b border-slate-50">
                   <h3 className="title-large font-serif font-black text-luwa-onSurface uppercase tracking-tight">Aesthetics & UI</h3>
                   <p className="text-xs text-slate-400 font-medium">Personalize your institutional terminal</p>
                </div>

                <div className="space-y-6">
                   <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Neural Accent Color</label>
                   <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
                      {['#1976D2', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'].map(c => (
                        <button 
                          key={c} 
                          onClick={() => handleUpdateAccent(c)}
                          className="w-12 h-12 rounded-xl transition-all border-4 border-white shadow-sm active:scale-90"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                   </div>
                </div>

                <div className="space-y-4">
                   <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Temporal Mode</label>
                   <div className="p-6 border-2 border-slate-100 rounded-2xl flex justify-between items-center">
                      <div>
                         <p className="text-sm font-black text-luwa-onSurface">Dark Protocol</p>
                         <p className="text-[10px] text-slate-400">Optimized for low-light research sessions</p>
                      </div>
                      <span className="text-[8px] font-black uppercase text-luwa-primary bg-luwa-primaryContainer px-3 py-1 rounded-full">Coming Soon</span>
                   </div>
                </div>

                <div className="space-y-4">
                   <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Linguistic Node</label>
                   <select value={user.preferredLanguage} onChange={(e) => onUpdateUser({...user, preferredLanguage: e.target.value as Language})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold focus:bg-white outline-none appearance-none cursor-pointer">
                      <option value="en">English (Global Academic)</option>
                      <option value="am">አማርኛ (Amharic)</option>
                      <option value="or">Afaan Oromoo</option>
                      <option value="ti">ትግርኛ (Tigrinya)</option>
                   </select>
                </div>
              </div>
            )}

            {activeSection === 'data' && (
              <div className="space-y-10 animate-m3-fade">
                <div className="pb-6 border-b border-slate-50">
                   <h3 className="title-large font-serif font-black text-luwa-onSurface uppercase tracking-tight">Data & Synchronization</h3>
                   <p className="text-xs text-slate-400 font-medium">Manage registry storage and backups</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {[
                     { label: 'Assignments', val: '12 MB', icon: '📝' },
                     { label: 'Materials', val: '45 MB', icon: '📚' },
                     { label: 'Cached Logic', val: '2 MB', icon: '💾' },
                     { label: 'Total Used', val: '59 MB', icon: '📊' }
                   ].map(s => (
                     <div key={s.label} className="p-5 bg-slate-50 rounded-2xl text-center">
                        <p className="text-lg font-black text-luwa-onSurface">{s.val}</p>
                        <p className="text-[8px] font-black uppercase text-slate-400 mt-1">{s.label}</p>
                     </div>
                   ))}
                </div>

                <div className="space-y-4">
                   <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Backup Protocol</h4>
                   <div className="p-8 border-2 border-slate-100 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-6">
                      <div className="text-center sm:text-left">
                         <p className="text-sm font-black text-luwa-onSurface">Institutional Cloud Backup</p>
                         <p className="text-[10px] text-slate-400">Last synchronized: {new Date().toLocaleDateString()}</p>
                      </div>
                      <button className="px-10 py-3 bg-luwa-secondary text-white rounded-xl label-small font-black uppercase shadow-m3-1 m3-ripple">Backup Now</button>
                   </div>
                </div>

                <div className="flex gap-4">
                   <button className="flex-1 py-4 border-2 border-slate-100 rounded-xl label-small font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50">Export Registry</button>
                   <button className="flex-1 py-4 border-2 border-slate-100 rounded-xl label-small font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50">Clear Cache</button>
                </div>
              </div>
            )}

            {(activeSection === 'notifications' || activeSection === 'privacy') && (
              <div className="h-64 flex flex-col items-center justify-center opacity-30 text-center animate-pulse">
                 <div className="text-4xl mb-4">⚙️</div>
                 <p className="text-[10px] font-black uppercase tracking-[0.4em]">Protocol Expansion in Progress</p>
                 <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Check next system revision (v{APP_VERSION}.1)</p>
              </div>
            )}

          </GlassCard>
        </main>
      </div>
    </div>
  );
};
