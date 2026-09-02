import React from 'react';
import { motion } from 'motion/react';
import { useGlassFloat } from '../hooks/useGlassFloat';

interface GlassProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
  animateFloat?: boolean;
}

export const GlassCard: React.FC<GlassProps> = ({ 
  children, 
  className = '', 
  intensity = 'medium',
  animateFloat = false
}) => {
  const opacities = {
    low: 'rgba(255, 255, 255, 0.04)',
    medium: 'rgba(255, 255, 255, 0.08)',
    high: 'rgba(255, 255, 255, 0.15)'
  };

  const floatVariants = useGlassFloat(
    intensity === 'high' ? 1.5 : intensity === 'medium' ? 1 : 0.5
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={animateFloat ? ["visible", "float"] : "visible"}
      variants={{
        visible: { opacity: 1, y: 0 },
        ...floatVariants
      }}
      className={`glass-premium ${className}`}
      style={{ backgroundColor: opacities[intensity] }}
    >
      {children}
    </motion.div>
  );
};

export const GlassBadge: React.FC<{ 
  children: React.ReactNode;
  className?: string;
  color?: 'primary' | 'secondary' | string;
}> = ({ children, className = '', color = 'secondary' }) => {
  const finalColor = color === 'primary' ? 'var(--primary-accent)' : color === 'secondary' ? 'var(--secondary-accent)' : color;
  
  return (
    <div 
      className={`backdrop-blur-xl px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 shadow-lg ${className}`}
      style={{ 
        color: finalColor, 
        backgroundColor: `color-mix(in srgb, ${finalColor}, transparent 85%)`, 
        borderColor: `color-mix(in srgb, ${finalColor}, transparent 70%)` 
      }}
    >
      {children}
    </div>
  );
};
