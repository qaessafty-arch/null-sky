/** Shared motion vocabulary for panels, overlays, and board feedback. */
export const MOTION = {
  spring: { type: 'spring' as const, stiffness: 420, damping: 30 },
  panel: { initial: { opacity: 0, y: 24, scale: .96 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 12, scale: .98 } },
  fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
  stagger: { hidden: {}, show: { transition: { staggerChildren: .045 } } }
};
