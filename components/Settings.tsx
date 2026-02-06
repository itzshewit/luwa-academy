
/*
  Luwa Academy – Settings & Support Hub (12.2 Monetization)
  Purpose: Global preferences and Premium Subscription Management.
*/

import React, { useState, useMemo } from 'react';
import { GlassCard } from './GlassCard.tsx';
import { User, BugReport, FeatureRequest, SubscriptionTier } from '../types.ts';
import { ICONS, APP_FULL_VERSION, SOCIAL_LINKS, APP_VERSION } from '../constants.tsx';
import { storageService } from '../services/storageService.ts';

interface SettingsProps {
  user: User;
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'Profile' | 'App' | 'Security' | 'Premium' | 'Health' | 'Support' | 'Legal'>('Profile');
  const [faqQuery, setFaqQuery] = useState('');
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const handleUpgrade = (tier: SubscriptionTier) => {
    onUpdateUser({ ...user, subscriptionTier: tier });
    alert(`Institutional Upgrade: Node synchronized to ${tier} status.`);
  };

  return (
    <div className="h-full flex flex-col gap-10 animate-m3-fade max-w-5xl mx-auto py-4 overflow-hidden">
      <header className="shrink-0 px-4 md:px-0">
        <h2 className="headline-medium font-serif font-black text-luwa-onSurface">System Preferences</h2>
        <p className="label-small text-luwa-onSurfaceVariant font-black uppercase tracking-[0.4em] mt-2">{APP_FULL_VERSION}</p>
      </header>

      <div className="flex flex-1 flex-col md:flex-row gap-10 overflow-hidden">
        <aside className="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto px-4 md:px-0 pb-4 md:pb-0 custom-scrollbar-hide">
          {(['Profile', 'App', 'Security', 'Premium', 'Health', 'Support', 'Legal'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`text-left px-6 py-4 rounded-m3-xl label-large font-bold uppercase tracking-widest transition-all m3-ripple whitespace-nowrap ${activeTab === t ? 'bg-luwa-primary text-white shadow-m3-1' : 'text-luwa-onSurfaceVariant hover:bg-luwa-surfaceVariant'}`}>
              {t === 'Premium' ? 'Membership' : t}
            </button>
          ))}
          <button onClick={onLogout} className="mt-auto hidden md:block text-left px-6 py-4 rounded-m3-xl label-large font-bold uppercase text-luwa-error hover:bg-red-50 m3-ripple">Terminate session</button>
        </aside>

        <main className="flex-1 overflow-y-auto pr-4 custom-scrollbar px-4 md:px-0 pb-20">
          {activeTab === 'Premium' && (
            <div className="space-y-8 animate-m3-fade">
               <GlassCard className="p-10 border-none bg-luwa-primary text-white text-center" variant="elevated">
                  <h3 className="headline-medium font-serif font-black mb-2 tracking-tighter">Luwa Premium (12.2)</h3>
                  <p className="label-large uppercase font-black tracking-widest opacity-80 mb-10">Institutional Scholarship Upgrade</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="p-8 bg-white/10 rounded-m3-xl border border-white/20 flex flex-col items-center">
                        <p className="label-small font-black uppercase mb-2">Scholar Basic</p>
                        <p className="display-large font-black mb-4">0 <span className="text-xl">ETB</span></p>
                        <ul className="text-[10px] uppercase font-black tracking-widest space-y-3 mb-10 opacity-70">
                           <li>Standard Study Notes</li>
                           <li>Daily Planner</li>
                           <li>2 Mocks / Week</li>
                        </ul>
                        <button disabled className="w-full py-4 bg-white/10 rounded-m3-l font-bold text-xs uppercase cursor-default">Current Tier</button>
                     </div>
                     <div className="p-8 bg-white/20 rounded-m3-xl border-2 border-luwa-tertiary flex flex-col items-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-luwa-tertiary text-black px-4 py-1 label-small font-black uppercase">Most Popular</div>
                        <p className="label-small font-black uppercase mb-2">Scholar PRO</p>
                        <p className="display-large font-black mb-4">100 <span className="text-xl">ETB</span></p>
                        <ul className="text-[10px] uppercase font-black tracking-widest space-y-3 mb-10">
                           <li>Unlimited AI Tutoring</li>
                           <li>Unlimited Mock Exams</li>
                           <li>Advanced Performance Audit</li>
                           <li>Neural Voice Synthesis</li>
                        </ul>
                        <button onClick={() => handleUpgrade('PRO')} className="w-full py-4 bg-luwa-tertiary text-black rounded-m3-l font-black text-xs uppercase shadow-m3-2 m3-ripple">Upgrade Now</button>
                     </div>
                  </div>
               </GlassCard>
            </div>
          )}

          {activeTab === 'Profile' && (
            <GlassCard className="p-10 border-none flex items-center gap-10" variant="elevated">
               <div className="w-24 h-24 bg-luwa-primaryContainer text-luwa-onPrimaryContainer rounded-m3-xl flex items-center justify-center text-4xl font-black shadow-m3-1">{user.fullName.charAt(0)}</div>
               <div>
                 <h3 className="title-large font-serif font-bold text-luwa-onSurface">{user.fullName}</h3>
                 <p className="label-medium text-luwa-onSurfaceVariant uppercase tracking-widest mt-1">{user.subscriptionTier} REGISTRY MEMBER</p>
               </div>
            </GlassCard>
          )}

          {activeTab === 'Support' && (
            <div className="space-y-12 pb-10">
               <section>
                 <h4 className="label-large font-black uppercase text-luwa-onSurfaceVariant tracking-widest mb-6">Frequently Enquired (9.3)</h4>
                 <input value={faqQuery} onChange={(e) => setFaqQuery(e.target.value)} placeholder="Search FAQ archive..." className="w-full bg-luwa-surfaceVariant/30 border border-luwa-outline rounded-m3-xl p-6 text-sm font-medium focus:border-luwa-primary outline-none transition-all mb-6" />
               </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
