import { useCallback, useState } from 'react';
import { prefersReducedMotion } from '../utils/feedback';

// Warna confetti dari palet app
const CONFETTI_COLORS = ['#1B6CA8', '#5BA4CF', '#F59E0B', '#22C55E', '#E0FBFC'];

// Potongan confetti dengan posisi/timing acak — dibekukan sekali (stabil).
const PIECES = Array.from({ length: 18 }, (_, i) => ({
  left: Math.round((i / 18) * 100 + (Math.random() * 6 - 3)),
  delay: Math.round(Math.random() * 260),
  duration: 2.2 + Math.random() * 0.9,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  rotate: Math.round(Math.random() * 360),
}));

type Celebration = { message: string; big: boolean; burst: number };

// Hook: sediakan `celebrate(message, { big })` dan `node` (overlay JSX).
// Overlay = confetti (bila big & gerak diizinkan) + toast pesan.
export function useCelebration() {
  const [state, setState] = useState<Celebration | null>(null);

  const celebrate = useCallback((message: string, opts?: { big?: boolean }) => {
    const big = opts?.big ?? false;
    setState((prev) => ({ message, big, burst: (prev?.burst ?? 0) + 1 }));
    window.setTimeout(() => setState(null), big ? 3000 : 2200);
  }, []);

  const node = state ? (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {state.big && !prefersReducedMotion() && (
        <div key={state.burst} className="absolute inset-0">
          {PIECES.map((p, i) => (
            <span
              key={i}
              className="confetti-piece"
              style={{
                left: `${p.left}%`,
                background: p.color,
                animationDelay: `${p.delay}ms`,
                animationDuration: `${p.duration}s`,
                transform: `rotate(${p.rotate}deg)`,
              }}
            />
          ))}
        </div>
      )}
      <div className="anim-toast fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 max-w-[90vw] px-5 py-3 rounded-2xl bg-deep-navy text-white text-sm font-semibold shadow-xl text-center dark:bg-night-soft">
        {state.message}
      </div>
    </div>
  ) : null;

  return { celebrate, node };
}
