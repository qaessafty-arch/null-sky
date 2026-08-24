import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MOTION } from './motion';

interface ModalProps { open: boolean; onClose: () => void; title?: string; children: React.ReactNode; footer?: React.ReactNode; }
export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, footer }) => {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);
  return <AnimatePresence>{open && <motion.div className="modal-backdrop" {...MOTION.fade} onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <motion.section role="dialog" aria-modal="true" aria-label={title} className="modal-shell" {...MOTION.panel} transition={MOTION.spring}>
      {title && <header className="modal-header"><h2>{title}</h2><button className="modal-close" onClick={onClose} aria-label="Close">×</button></header>}
      <div className="modal-body">{children}</div>{footer && <footer className="modal-footer">{footer}</footer>}
    </motion.section>
  </motion.div>}</AnimatePresence>;
};
