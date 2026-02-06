
/*
  Luwa Academy – Strategic Roadmap & Vision (12.1 Phase 2 & 3)
  Purpose: Outlines institutional growth from MVP to Full Scale Deployment.
*/

import React from 'react';
import { GlassCard } from './GlassCard.tsx';
import { APP_FULL_VERSION, SOCIAL_LINKS, ATTRIBUTIONS } from '../constants.tsx';

export const About: React.FC = () => {
  return (
    <div className="h-full flex flex-col items-center justify-start animate-m3-fade max-w-4xl mx-auto overflow-y-auto custom-scrollbar pb-20">
      <GlassCard className="w-full p-16 border-none bg-white text-center relative overflow-hidden mb-10" variant="elevated">
        <h1 className="display-large font-serif font-black text-luwa-primary mb-4 tracking-tighter uppercase">Strategic Roadmap</h1>
        <p className="label-small text-luwa-onSurfaceVariant font-black uppercase tracking-[0.6em] mb-12">Registry Node Integrity Protocol • {APP_FULL_VERSION}</p>
        
        <div className="space-y-16 max-w-2xl mx-auto">
          <section className="text-left">
            <h3 className="label-large font-black uppercase tracking-[0.4em] text-luwa-primary mb-10 text-center">Institutional Pipeline (12.1)</h3>
            <div className="space-y-10">
               <div className="p-10 bg-luwa-primaryContainer rounded-m3-xl border border-luwa-primary/10">
                  <h4 className="label-large font-black text-luwa-onPrimaryContainer uppercase mb-4 tracking-widest">Phase 2: Cognitive Enrichment (3-6 Months)</h4>
                  <ul className="text-sm font-medium text-luwa-onPrimaryContainer space-y-4 opacity-80 leading-relaxed">
                     <li className="flex items-start gap-4"><div className="w-2 h-2 rounded-full bg-luwa-primary mt-1.5" /> Neural Voice Synthesis: High-fidelity audio briefs for all curriculum nodes.</li>
                     <li className="flex items-start gap-4"><div className="w-2 h-2 rounded-full bg-luwa-primary mt-1.5" /> Social Gamification: Global leaderboards, badges, and scholar prestige challenges.</li>
                     <li className="flex items-start gap-4"><div className="w-2 h-2 rounded-full bg-luwa-primary mt-1.5" /> Peer Direct Sync: Real-time study groups with AI moderation.</li>
                  </ul>
               </div>

               <div className="p-10 bg-luwa-surfaceVariant rounded-m3-xl border border-luwa-outline/10">
                  <h4 className="label-large font-black text-luwa-onSurfaceVariant uppercase mb-4 tracking-widest">Phase 3: National Expansion (6-12 Months)</h4>
                  <ul className="text-sm font-medium text-luwa-onSurfaceVariant space-y-4 opacity-80 leading-relaxed">
                     <li className="flex items-start gap-4"><div className="w-2 h-2 rounded-full bg-luwa-outline mt-1.5" /> Curriculum Portability: Grade 10 & 11 nodes, TVET, and COC modules.</li>
                     <li className="flex items-start gap-4"><div className="w-2 h-2 rounded-full bg-luwa-outline mt-1.5" /> University Navigator: Automated guidance based on mock exam performance.</li>
                     <li className="flex items-start gap-4"><div className="w-2 h-2 rounded-full bg-luwa-outline mt-1.5" /> Multi-Lingual Engine: Oromiffa and Tigrinya cognitive support nodes.</li>
                  </ul>
               </div>
            </div>
          </section>

          <section className="text-left p-10 bg-luwa-surfaceVariant/20 rounded-m3-xl border border-luwa-surfaceVariant">
             <h3 className="label-small font-black uppercase tracking-[0.4em] text-luwa-primary mb-6">Monetization Statement (12.2)</h3>
             <p className="text-[11px] text-luwa-onSurfaceVariant mb-4 leading-relaxed font-medium">
               Luwa Academy utilizes a **Freemium Registry Model**. Core educational assets remain freely accessible to ensure academic equity. Premium features (Unlimited AI Tutoring, Neural Voice, and Detailed Audits) support operational sustainability.
             </p>
          </section>

          <div className="flex flex-wrap justify-center gap-4 pt-10 border-t border-luwa-surfaceVariant">
             <a href={SOCIAL_LINKS.TELEGRAM_CHANNEL} target="_blank" className="px-8 py-4 bg-luwa-primary text-white rounded-m3-xl label-small font-black uppercase shadow-m3-1 m3-ripple">Roadmap Telegram</a>
             <a href={SOCIAL_LINKS.BLOG} target="_blank" className="px-8 py-4 border border-luwa-primary text-luwa-primary rounded-m3-xl label-small font-black uppercase m3-ripple">Engineering Blog</a>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
