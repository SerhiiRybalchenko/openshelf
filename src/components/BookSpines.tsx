import { motion } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';
import './BookSpines.css';

// A small generative motif: a row of "book spines" of varying height/width,
// standing in for the generic hero gradient/blob. Ties the visual identity
// back to the product's name instead of decorating with unrelated shapes.
const SPINES = [
  { h: 62, c: 'brass' },
  { h: 88, c: 'teal' },
  { h: 46, c: 'muted' },
  { h: 100, c: 'brass' },
  { h: 70, c: 'muted' },
  { h: 54, c: 'teal' },
  { h: 92, c: 'brass' },
  { h: 40, c: 'muted' },
  { h: 76, c: 'teal' },
  { h: 58, c: 'brass' },
  { h: 84, c: 'muted' },
  { h: 66, c: 'teal' },
];

export function BookSpines({ className }: { className?: string }) {
  const reducedMotion = useReducedMotion();

  return (
    <div className={`shelf-spines ${className ?? ''}`} aria-hidden="true">
      {SPINES.map((spine, index) => (
        <motion.span
          key={index}
          className={`shelf-spines__bar shelf-spines__bar--${spine.c}`}
          style={{ height: `${spine.h}%`, transformOrigin: 'bottom' }}
          initial={reducedMotion ? { opacity: 0 } : { scaleY: 0, opacity: 0 }}
          animate={reducedMotion ? { opacity: 1 } : { scaleY: 1, opacity: 1 }}
          transition={{
            duration: reducedMotion ? 0.3 : 0.6,
            delay: reducedMotion ? 0 : index * 0.045,
            ease: [0.16, 1, 0.3, 1],
          }}
          whileHover={reducedMotion ? undefined : { scaleY: 1.06, translateY: -4 }}
        />
      ))}
      <div className="shelf-spines__shelf" />
    </div>
  );
}
