
/*
  Module: Shared UI Components (GlassCard)
  Purpose: A container component implementing Material Design 3 card standards (Medium Shape, Elevation Level 1).
*/

import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'elevated' | 'filled' | 'outlined';
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', onClick, variant = 'elevated' }) => {
  const baseStyles = "rounded-m3-m transition-all duration-200 ease-in-out m3-ripple";
  
  const variantStyles = {
    elevated: "bg-white shadow-m3-1 hover:shadow-m3-2",
    filled: "bg-luwa-surfaceVariant border-none",
    outlined: "bg-transparent border border-luwa-outline"
  };

  return (
    <div 
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${onClick ? 'cursor-pointer active:scale-[0.99]' : ''} ${className}`}
    >
      {children}
    </div>
  );
};
