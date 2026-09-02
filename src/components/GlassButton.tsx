import React from 'react';
import { motion } from 'motion/react';

interface GlassButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'red' | 'default' | 'ghost';
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
  id?: string;
  ariaLabel?: string;
}

export const GlassButton: React.FC<GlassButtonProps> = ({ 
  children, 
  onClick, 
  className = '', 
  variant = 'default', 
  disabled = false,
  size = 'md',
  type = 'button',
  id,
  ariaLabel
}) => {
  const variants = {
    primary: 'border-[var(--secondary-accent)]/30 hover:border-[var(--secondary-accent)]/60 hover:bg-[var(--secondary-accent)]/10 text-[var(--secondary-accent)]',
    secondary: 'border-[var(--primary-accent)]/30 hover:border-[var(--primary-accent)]/60 hover:bg-[var(--primary-accent)]/10 text-[var(--primary-accent)]',
    red: 'border-[#ef4444]/30 hover:border-[#ef4444]/60 hover:bg-[#ef4444]/10 text-[#ef4444]',
    default: 'border-white/10 hover:border-white/20 hover:bg-white/5 text-white',
    ghost: 'border-transparent hover:bg-white/5 text-white/70 hover:text-white'
  };

  const sizes = {
    sm: 'px-4 py-1.5 text-[10px]',
    md: 'px-6 py-2.5 text-xs',
    lg: 'px-8 py-3.5 text-sm'
  };

  return (
    <motion.button
      id={id}
      type={type}
      aria-label={ariaLabel}
      whileHover={!disabled ? { 
        scale: 1.02, 
        translateY: -2,
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)'
      } : {}}
      whileTap={!disabled ? { scale: 0.97, translateY: 0 } : {}}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className={`
        glass-shimmer
        group
        relative
        overflow-hidden
        backdrop-blur-xl
        border
        rounded-xl
        font-bold
        uppercase
        tracking-widest
        transition-all
        duration-300
        flex
        items-center
        justify-center
        gap-2
        ${variants[variant]}
        ${sizes[size]}
        ${disabled ? 'opacity-40 cursor-not-allowed grayscale pointer-events-none' : 'cursor-pointer'}
        ${className}
      `}
    >
      <span className="relative z-10 flex items-center gap-2 transition-transform duration-300 group-hover:scale-105">
        {children}
      </span>
      
      {/* Dynamic Glow Layer */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Inner Border Glow */}
      <div className="absolute inset-0 border border-white/0 group-hover:border-white/10 rounded-xl transition-colors duration-500" />
    </motion.button>
  );
};
