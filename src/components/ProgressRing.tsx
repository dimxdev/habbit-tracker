import type { ReactNode } from 'react';

export default function ProgressRing({
  value,
  size = 76,
  stroke = 8,
  children,
}: {
  value: number; // 0–100
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;
  const full = clamped >= 100;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {/* Halo saat 100% */}
      {full && (
        <span className="absolute inset-0 rounded-full bg-ocean-blue/20 blur-md dark:bg-sky-tint/20" />
      )}
      <svg
        width={size}
        height={size}
        className={`relative -rotate-90 ${full ? 'anim-check-fill' : ''}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-mist dark:stroke-night-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          // Easing "rumah" (expo-out) supaya seirama dengan animasi lain
          className="stroke-ocean-blue dark:stroke-sky-tint transition-[stroke-dashoffset] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
      )}
    </div>
  );
}
