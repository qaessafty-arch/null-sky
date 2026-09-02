import { useMemo } from 'react';
import { Variants } from 'motion/react';

/**
 * useGlassFloat
 * Generates subtle, randomized floating animation variants for Framer Motion.
 * 
 * @param intensity - Multiplier for movement range (default: 1)
 * @param speed - Multiplier for animation speed (lower is slower, default: 1)
 */
export const useGlassFloat = (intensity: number = 1, speed: number = 1) => {
  const variants: Variants = useMemo(() => {
    // Generate random offsets that are unique per instance but stable across renders
    const offsetX = (Math.random() - 0.5) * 8 * intensity;
    const offsetY = (Math.random() - 0.5) * 12 * intensity;
    const rotation = (Math.random() - 0.5) * 2 * intensity;
    
    // Randomize duration and delay for non-repetitive organic feel
    const duration = (15 + Math.random() * 15) / speed;
    const delay = Math.random() * -20; // Negative delay starts animation at random point in cycle

    return {
      float: {
        x: [0, offsetX, -offsetX * 0.5, offsetX * 0.2, 0],
        y: [0, offsetY, -offsetY * 0.8, offsetY * 0.3, 0],
        rotate: [0, rotation, -rotation * 0.5, rotation * 0.2, 0],
        transition: {
          duration: duration,
          repeat: Infinity,
          ease: "easeInOut",
          delay: delay,
        }
      }
    };
  }, [intensity, speed]);

  return variants;
};
