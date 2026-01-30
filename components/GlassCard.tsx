
/*
  Module: Shared UI Components (GlassCard)
  Purpose: A highly reusable container component implementing the application's clean, modern branding.
*/

import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-2xl p-6 transition-all duration-300 card-shadow border border-luwa-border ${className}`}
    >
      {children}
    </div>
  );
};
