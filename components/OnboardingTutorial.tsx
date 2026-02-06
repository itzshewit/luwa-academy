
/*
  Luwa Academy – Institutional Onboarding Tutorial (11.2)
  Purpose: 4-slide interactive walkthrough for first-time scholars.
*/

import React, { useState } from 'react';
import { GlassCard } from './GlassCard.tsx';
import { ICONS } from '../constants.tsx';

interface OnboardingTutorialProps {
  onComplete: () => void;
}

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Welcome, Scholar",
      description: "You have been admitted to the Luwa Academy Institutional Registry. Our mission is your academic excellence in the EUEE.",
      icon: <div className="w-20 h-20 bg-luwa-primary text-white rounded-m3-xl flex items-center justify-center text-4xl font-serif font-black shadow-m3-2">L</div>
    },
    {
      title: "Neural AI Tutoring",
      description: "Engage with 'The Instructor', a neural co-pilot that adapts to your unique cognitive signature and explains concepts with scholarly precision.",
      icon: <ICONS.Brain className="w-20 h-20 text-luwa-primary" />
    },
    {
      title: "Diagnostic Mock Exams",
      description: "Simulate official national exams under timed conditions. Our engine provides immediate feedback and predicted university entrance readiness.",
      icon: <ICONS.Zap className="w-20 h-20 text-luwa-secondary" />
    },
    {
      title: "Dynamic Academic Planner",
      description: "Your daily study objectives are synthesized based on identified mastery gaps. Complete tasks to increase your Scholar Prestige.",
      icon: <ICONS.Layout className="w-20 h-20 text-luwa-tertiary" />
    }
  ];

  const next = () => {
    if (currentSlide < slides.length - 1) setCurrentSlide(currentSlide + 1);
    else onComplete();
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6 animate-m3-fade">
      <GlassCard className="max-w-md w-full p-10 flex flex-col items-center text-center overflow-hidden relative" variant="elevated">
        <div className="absolute top-0 left-0 w-full h-1 bg-luwa-surfaceVariant">
           <div className="h-full bg-luwa-primary transition-all duration-500" style={{ width: `${((currentSlide + 1)/slides.length)*100}%` }} />
        </div>

        <div className="mb-10 mt-6 animate-bounce">
          {slides[currentSlide].icon}
        </div>

        <h2 className="headline-medium font-serif font-bold text-luwa-onSurface mb-4">
          {slides[currentSlide].title}
        </h2>
        
        <p className="body-medium text-luwa-onSurfaceVariant leading-relaxed mb-12">
          {slides[currentSlide].description}
        </p>

        <div className="flex flex-col w-full gap-4">
          <button 
            onClick={next}
            className="w-full py-4 bg-luwa-primary text-white label-large font-bold uppercase rounded-m3-xl shadow-m3-2 hover:shadow-m3-3 m3-ripple"
          >
            {currentSlide === slides.length - 1 ? "Begin Admission" : "Continue"}
          </button>
          
          <button 
            onClick={onComplete}
            className="w-full py-2 text-luwa-onSurfaceVariant label-small font-black uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity"
          >
            Skip Orientation
          </button>
        </div>

        <div className="flex gap-2 mt-10">
           {slides.map((_, i) => (
             <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentSlide ? 'w-6 bg-luwa-primary' : 'bg-luwa-surfaceVariant'}`} />
           ))}
        </div>
      </GlassCard>
    </div>
  );
};
