export const UNIFIED_SPRING = {
  type: "spring",
  stiffness: 320,
  damping: 26,
  mass: 0.8
};

export const MODAL_ANIMATION = {
  initial: { opacity: 0, scale: 0.94, y: 15 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.94, y: 10 },
  transition: UNIFIED_SPRING
};

export const LIST_ITEM_ANIMATION = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  transition: { ...UNIFIED_SPRING, damping: 30 }
};
