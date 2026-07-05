import { useMemo } from 'react';
import type { AppData, Habit } from '../types';
import { getDateKey, parseDateKey, shiftDateKey, formatDateKeyLong } from '../utils/helpers';
import { getHabitCount, perDayCap } from '../utils/habits';

const WEEKS = 18; // ~4 bulan terakhir
const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];
// Label baris (Senin di atas) — hanya sebagian ditampilkan biar rapi
const ROW_LABELS = ['Sen', '', 'Rab', '', 'Jum', '', ''];

type CellState = 'future' | 'untracked' | 'empty' | 'partial' | 'done';

export default function HabitHeatmap({
  data,
  habit,
  todayKey,
}: {
  data: AppData;
  habit: Habit;
  todayKey: string;
}) {
  const { columns, doneCount } = useMemo(() => {
    // Mulai dari Senin pada minggu ini, mundur (WEEKS-1) minggu
    const sinceMonday = (parseDateKey(todayKey).getDay() + 6) % 7;
    const thisMonday = shiftDateKey(todayKey, -sinceMonday);
    const startMonday = shiftDateKey(thisMonday, -(WEEKS - 1) * 7);

    const cap = perDayCap(habit);
    const cols: { month: string | null; days: { key: string; state: CellState }[] }[] = [];
    let done = 0;
    let prevMonth = -1;

    for (let w = 0; w < WEEKS; w++) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        const key = shiftDateKey(startMonday, w * 7 + d);
        let state: CellState;
        if (key > todayKey) {
          state = 'future';
        } else if (key < habit.createdAt) {
          state = 'untracked';
        } else {
          const count = getHabitCount(data, key, habit.id);
          if (count >= cap) {
            state = 'done';
            done++;
          } else if (count > 0) {
            state = 'partial';
          } else {
            state = 'empty';
          }
        }
        days.push({ key, state });
      }
      // Label bulan muncul saat bulan pada Senin kolom ini berubah
      const monthOfCol = parseDateKey(days[0].key).getMonth();
      const month = monthOfCol !== prevMonth ? SHORT_MONTHS[monthOfCol] : null;
      prevMonth = monthOfCol;
      cols.push({ month, days });
    }
    return { columns: cols, doneCount: done };
  }, [data, habit, todayKey]);

  return (
    <div className="mt-3 border-t border-mist pt-3 dark:border-night-border">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Riwayat {WEEKS} minggu terakhir
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {doneCount} hari tercatat
        </p>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="inline-flex flex-col gap-1">
          {/* Baris label bulan */}
          <div className="flex gap-[3px] pl-6">
            {columns.map((col, i) => (
              <div key={i} className="w-3 text-[9px] leading-none text-slate-400 whitespace-nowrap dark:text-slate-500">
                {col.month}
              </div>
            ))}
          </div>

          {/* Label hari + grid minggu */}
          <div className="flex gap-[3px]">
            <div className="flex flex-col gap-[3px] pr-1 w-6 shrink-0">
              {ROW_LABELS.map((label, i) => (
                <span key={i} className="h-3 text-[9px] leading-3 text-slate-400 dark:text-slate-500">
                  {label}
                </span>
              ))}
            </div>

            {columns.map((col, i) => (
              <div key={i} className="flex flex-col gap-[3px]">
                {col.days.map((cell) => (
                  <Cell key={cell.key} state={cell.state} dateKey={cell.key} habitName={habit.name} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-1.5 mt-2 justify-end">
        <span className="text-[10px] text-slate-400 dark:text-slate-500">Kosong</span>
        <span className="w-3 h-3 rounded-[3px] bg-mist dark:bg-night-border" />
        <span className="w-3 h-3 rounded-[3px] bg-ocean-blue dark:bg-sky-tint" />
        <span className="text-[10px] text-slate-400 dark:text-slate-500">Selesai</span>
      </div>
    </div>
  );
}

function Cell({
  state,
  dateKey,
  habitName,
}: {
  state: CellState;
  dateKey: string;
  habitName: string;
}) {
  if (state === 'future') {
    return <span className="w-3 h-3" />;
  }
  const isToday = dateKey === getDateKey();
  const base = 'w-3 h-3 rounded-[3px]';
  const tone =
    state === 'done'
      ? 'bg-ocean-blue dark:bg-sky-tint'
      : state === 'partial'
        ? 'bg-ocean-blue/40 dark:bg-sky-tint/40'
        : state === 'untracked'
          ? 'bg-mist/40 dark:bg-night-border/40'
          : 'bg-mist dark:bg-night-border';
  const ring = isToday ? ' ring-1 ring-ocean-blue ring-offset-1 ring-offset-white dark:ring-sky-tint dark:ring-offset-night-soft' : '';
  const status = state === 'done' ? 'selesai' : state === 'partial' ? 'sebagian' : 'kosong';
  const title =
    state === 'untracked'
      ? `${formatDateKeyLong(dateKey)} — belum dilacak`
      : `${formatDateKeyLong(dateKey)} — ${habitName}: ${status}`;

  return <span className={base + ' ' + tone + ring} title={title} />;
}
