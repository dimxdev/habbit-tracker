import type { AppData, Habit } from '../types';
import { generateId, getDateKey, shiftDateKey, daysBetweenKeys } from './helpers';

export const addHabit = (data: AppData, name: string, icon?: string): AppData => ({
  ...data,
  habits: [
    ...(data.habits ?? []),
    { id: generateId(), name, ...(icon ? { icon } : {}), createdAt: getDateKey() },
  ],
});

export const updateHabit = (
  data: AppData,
  id: string,
  name: string,
  icon?: string
): AppData => ({
  ...data,
  habits: (data.habits ?? []).map((h) =>
    h.id === id ? { ...h, name, icon: icon || undefined } : h
  ),
});

export const deleteHabit = (data: AppData, id: string): AppData => {
  // Buang habit + bersihkan jejaknya di habitLogs
  const habitLogs: Record<string, string[]> = {};
  for (const [date, ids] of Object.entries(data.habitLogs ?? {})) {
    const filtered = ids.filter((x) => x !== id);
    if (filtered.length > 0) habitLogs[date] = filtered;
  }
  return {
    ...data,
    habits: (data.habits ?? []).filter((h) => h.id !== id),
    habitLogs,
  };
};

export const isHabitDone = (data: AppData, dateKey: string, habitId: string): boolean =>
  (data.habitLogs?.[dateKey] ?? []).includes(habitId);

export const toggleHabit = (data: AppData, dateKey: string, habitId: string): AppData => {
  const list = data.habitLogs?.[dateKey] ?? [];
  const next = list.includes(habitId)
    ? list.filter((x) => x !== habitId)
    : [...list, habitId];
  const habitLogs = { ...(data.habitLogs ?? {}) };
  if (next.length > 0) habitLogs[dateKey] = next;
  else delete habitLogs[dateKey];
  return { ...data, habitLogs };
};

// Streak = jumlah hari berturut-turut tercentang sampai hari ini.
// Kalau hari ini belum dicentang, dihitung mundur dari kemarin (biar tidak hangus).
export const computeStreak = (data: AppData, habitId: string, todayKey: string): number => {
  let streak = 0;
  let cursor = isHabitDone(data, todayKey, habitId) ? todayKey : shiftDateKey(todayKey, -1);
  while (isHabitDone(data, cursor, habitId)) {
    streak++;
    cursor = shiftDateKey(cursor, -1);
  }
  return streak;
};

// Konsistensi (%) dalam jendela hingga 30 hari terakhir,
// dibatasi umur habit supaya yang baru tidak otomatis rendah.
export const computeConsistency = (data: AppData, habit: Habit, todayKey: string): number => {
  const age = daysBetweenKeys(habit.createdAt, todayKey) + 1;
  const windowDays = Math.min(30, Math.max(1, age));
  let done = 0;
  for (let i = 0; i < windowDays; i++) {
    if (isHabitDone(data, shiftDateKey(todayKey, -i), habit.id)) done++;
  }
  return Math.round((done / windowDays) * 100);
};
