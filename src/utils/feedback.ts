// Feedback fisik & preferensi gerak — dipakai lintas komponen.

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Getar singkat sebagai konfirmasi taktil. Dihormati oleh preferensi
// "kurangi gerak" (di-skip) dan aman bila API tak tersedia.
export const haptic = (pattern: number | number[] = 8): void => {
  if (prefersReducedMotion()) return;
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* noop */
    }
  }
};

// Pola getar berjenjang sesuai peristiwa.
export const HAPTIC = {
  tap: 8, // pencatatan biasa
  complete: [12, 40, 12] as number[], // target sebuah habit tercapai
  celebrate: [18, 50, 18, 50, 30] as number[], // semua habit hari ini beres / milestone
};
