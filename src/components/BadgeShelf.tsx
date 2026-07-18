import { useState } from 'react';
import { Award, ChevronDown } from 'lucide-react';
import type { AppData } from '../types';
import { BADGES, computeEarnedBadges } from '../utils/badges';

export default function BadgeShelf({
  data,
  todayKey,
}: {
  data: AppData;
  todayKey: string;
}) {
  const [open, setOpen] = useState(false);
  const earned = computeEarnedBadges(data, todayKey);
  const earnedCount = BADGES.filter((b) => earned.has(b.id)).length;

  return (
    <div className="glass-card shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open ? 'true' : 'false'}
        className="w-full flex items-center justify-between gap-2 px-4 py-3.5"
      >
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-deep-navy dark:text-slate-100">
          <Award size={16} className="text-amber-500" />
          Pencapaian ({earnedCount}/{BADGES.length})
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform dark:text-slate-500 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="anim-fade-up border-t border-mist px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-2 dark:border-night-border">
          {BADGES.map((b) => {
            const has = earned.has(b.id);
            return (
              <div
                key={b.id}
                title={b.desc}
                className={`flex flex-col items-center text-center gap-1 rounded-xl p-3 transition-colors ${
                  has
                    ? 'bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30'
                    : 'bg-mist/40 border border-transparent opacity-60 dark:bg-night-border/40'
                }`}
              >
                <span className={`text-2xl ${has ? '' : 'grayscale'}`}>{b.emoji}</span>
                <span className="text-[11px] font-semibold text-deep-navy leading-tight dark:text-slate-100">
                  {b.name}
                </span>
                <span className="text-[10px] text-slate-400 leading-tight dark:text-slate-500">
                  {has ? 'Diraih' : b.desc}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
