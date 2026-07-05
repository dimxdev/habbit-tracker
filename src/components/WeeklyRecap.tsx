import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import type { AppData, Habit } from '../types';
import { shiftDateKey, parseDateKey } from '../utils/helpers';
import { activeHabits, isDayCounted, weeklyScore } from '../utils/habits';

const JS_DAY_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default function WeeklyRecap({
  data,
  todayKey,
}: {
  data: AppData;
  todayKey: string;
}) {
  const habits = activeHabits(data);
  if (habits.length === 0) return null;

  // 7 hari terakhir (lama -> hari ini), jumlah habit "selesai" per hari
  const days = Array.from({ length: 7 }, (_, i) => {
    const key = shiftDateKey(todayKey, -(6 - i));
    const count = habits.filter((h) => isDayCounted(data, h, key)).length;
    return { key, count, label: JS_DAY_SHORT[parseDateKey(key).getDay()] };
  });
  const maxBar = Math.max(habits.length, 1);

  // Peringkat habit berdasarkan skor minggu ini
  const ranked = habits
    .map((h) => ({ habit: h, score: weeklyScore(data, h, todayKey) }))
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  const worst = ranked.length > 1 ? ranked[ranked.length - 1] : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-mist p-5 dark:bg-night-soft dark:border-night-border">
      <h2 className="inline-flex items-center gap-2 text-deep-navy text-base md:text-lg font-semibold mb-4 dark:text-slate-100">
        <BarChart3 size={18} className="text-ocean-blue dark:text-sky-tint" />
        Rekap Minggu Ini
      </h2>

      {/* Grafik batang: habit selesai per hari */}
      <div className="flex items-end justify-between gap-2 h-28">
        {days.map((d) => {
          const isToday = d.key === todayKey;
          const heightPct = (d.count / maxBar) * 100;
          return (
            <div key={d.key} className="flex-1 flex flex-col items-center gap-1 h-full">
              <span className="text-[10px] font-semibold tabular-nums text-slate-400 dark:text-slate-500">
                {d.count}
              </span>
              <div className="flex-1 w-full flex items-end">
                <div
                  className={`w-full rounded-md transition-[height] duration-500 ${
                    isToday ? 'bg-ocean-blue dark:bg-sky-tint' : 'bg-sky-tint/60 dark:bg-ocean-blue/70'
                  }`}
                  style={{ height: `${Math.max(heightPct, d.count > 0 ? 6 : 0)}%` }}
                  title={`${d.count} habit selesai`}
                />
              </div>
              <span
                className={`text-[10px] font-medium ${
                  isToday ? 'text-ocean-blue dark:text-sky-tint' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {d.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Terbaik / perlu perhatian */}
      <div className="mt-4 space-y-2 border-t border-mist pt-3 dark:border-night-border">
        <RankRow
          icon={<TrendingUp size={15} className="text-green-500" />}
          caption="Terbaik minggu ini"
          habit={best.habit}
          score={best.score}
        />
        {worst && (
          <RankRow
            icon={<TrendingDown size={15} className="text-amber-500" />}
            caption="Perlu perhatian"
            habit={worst.habit}
            score={worst.score}
          />
        )}
      </div>
    </div>
  );
}

function RankRow({
  icon,
  caption,
  habit,
  score,
}: {
  icon: React.ReactNode;
  caption: string;
  habit: Habit;
  score: number;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-slate-400 leading-none dark:text-slate-500">{caption}</p>
        <p className="text-sm font-medium text-deep-navy truncate dark:text-slate-100">
          {habit.icon ? `${habit.icon} ` : ''}
          {habit.name}
        </p>
      </div>
      <span className="text-sm font-semibold tabular-nums text-slate-500 shrink-0 dark:text-slate-400">
        {Math.round(score * 100)}%
      </span>
    </div>
  );
}
