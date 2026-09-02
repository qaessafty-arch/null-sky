import React from 'react';
import { motion } from 'motion/react';

export const AmbientBackground: React.FC = () => {
  return (
    <>
      {/* Cinematic Base Layers */}
      <div className="bg-grain" />
      <div className="bg-vignette" />
      
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        {/* Mesh 1 Ambient Sphere */}
        <motion.div
          className="ambient-sphere w-[800px] h-[800px] bg-[var(--mesh-1)]"
          animate={{
            x: ['-20%', '10%', '-10%'],
            y: ['-10%', '20%', '5%'],
            scale: [1, 1.2, 1.1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ top: '-10%', left: '-10%' }}
        />

        {/* Mesh 2 Ambient Sphere */}
        <motion.div
          className="ambient-sphere w-[600px] h-[600px] bg-[var(--mesh-2)]"
          animate={{
            x: ['110%', '80%', '100%'],
            y: ['90%', '60%', '80%'],
            scale: [1.1, 0.9, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ top: '20%', left: '0%' }}
        />

        {/* Mesh 3 Ambient Sphere */}
        <motion.div
          className="ambient-sphere w-[500px] h-[500px] bg-[var(--mesh-3)]"
          animate={{
            x: ['-40%', '-10%', '-30%'],
            y: ['80%', '50%', '70%'],
            scale: [0.9, 1.1, 1],
          }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ top: '40%', left: '20%' }}
        />

        {/* Floating Dust Particles wrapped in explicit container */}
        <div className="particles-container">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/10 rounded-full blur-[1px]"
              initial={{
                x: Math.random() * 100 + 'vw',
                y: Math.random() * 100 + 'vh',
                opacity: 0,
              }}
              animate={{
                y: [null, '-100vh'],
                opacity: [0, 0.3, 0],
                x: [null, `${(Math.random() - 0.5) * 50}px`],
              }}
              transition={{
                duration: 20 + Math.random() * 30,
                repeat: Infinity,
                delay: Math.random() * 20,
                ease: 'linear',
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
};
