import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useSettings } from '../context/SettingsContext';

export const AmbientBackground: React.FC = () => {
  const { customBackground } = useSettings();
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [customBackground.imageUrl]);

  const isHighContrast = customBackground.mode === 'high_contrast';
  const isCustomImage = customBackground.mode === 'image' && customBackground.imageUrl && !imageFailed;
  const isCustomGradient = customBackground.mode === 'gradient';
  const isCustomColor = customBackground.mode === 'color';

  return (
    <>
      {/* Custom Wallpaper Layer if user selected an image */}
      {isCustomImage && (
        <>
          <div
            className="custom-bg-layer"
            style={{
              backgroundImage: `url("${customBackground.imageUrl}")`,
              opacity: customBackground.imageOpacity ?? 0.65,
              filter: customBackground.blur ? `blur(${customBackground.blur}px)` : undefined,
            }}
          >
            {/* Hidden image element to detect load error and fail gracefully */}
            <img
              src={customBackground.imageUrl}
              alt=""
              className="hidden"
              onError={() => setImageFailed(true)}
              referrerPolicy="no-referrer"
            />
          </div>
          {/* Readability Shield: protects glassmorphism panels against bright/cluttered photos */}
          <div className="custom-bg-shield" />
        </>
      )}

      {/* Custom Gradient Layer */}
      {isCustomGradient && (
        <div
          className="custom-bg-layer"
          style={{
            background: `linear-gradient(${customBackground.gradientAngle ?? 135}deg, ${
              customBackground.gradientStart || '#0f172a'
            }, ${customBackground.gradientEnd || '#1e1b4b'})`,
            opacity: 1,
          }}
        />
      )}

      {/* Custom Solid Color Layer */}
      {isCustomColor && (
        <div
          className="custom-bg-layer"
          style={{
            backgroundColor: customBackground.color || '#05070a',
            opacity: 1,
          }}
        />
      )}

      {/* High Contrast Background Layer */}
      {isHighContrast && (
        <div
          className="custom-bg-layer"
          style={{
            backgroundColor: '#080C14',
            opacity: 1,
          }}
        />
      )}

      {/* Cinematic Base Layers (suppressed in High Contrast to maximize visual clarity) */}
      {!isHighContrast && <div className="bg-grain" />}
      {!isHighContrast && <div className="bg-vignette" />}
      
      {/* Ambient Mesh Spheres and Floating Particles (rendered only for normal themes or subtle tint) */}
      {!isHighContrast && (
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

          {/* Floating Dust Particles */}
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
      )}
    </>
  );
};

