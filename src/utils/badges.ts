import type { AppData } from '../types';
import { shiftDateKey } from './helpers';
import {
  computeBestStreak,
  isDayComplete,
  isHabitExcused,
  isSettledToday,
  activeHabits,
} from './habits';

export interface BadgeDef {
  id: string;
  name: string;
  emoji: string;
  desc: string;
}

// Daftar badge. Semuanya dihitung dari riwayat (tanpa server).
export const BADGES: BadgeDef[] = [
  { id: 'first-log', name: 'Langkah Pertama', emoji: '👣', desc: 'Catat habit pertamamu.' },
  { id: 'streak-7', name: 'Minggu Pertama', emoji: '🌱', desc: 'Capai streak 7 hari.' },
  { id: 'streak-30', name: 'Sebulan Penuh', emoji: '🗓️', desc: 'Capai streak 30 hari.' },
  { id: 'streak-100', name: 'Ratusan!', emoji: '💯', desc: 'Capai streak 100 hari.' },
  { id: 'perfect-day', name: 'Hari Sempurna', emoji: '⭐', desc: 'Selesaikan semua habit dalam sehari.' },
  { id: 'comeback', name: 'Bangkit', emoji: '💪', desc: 'Lanjutkan lagi setelah sempat terlewat.' },
  { id: 'collector', name: 'Kolektor', emoji: '📦', desc: 'Kumpulkan 100 pencatatan.' },
  { id: 'variety', name: 'Serba Bisa', emoji: '🎯', desc: 'Miliki 5 habit atau lebih.' },
];

const totalLogs = (data: AppData): number => {
  let total = 0;
  for (const day of Object.values(data.habitCounts ?? {})) {
    for (const n of Object.values(day)) total += n;
  }
  for (const ids of Object.values(data.habitLogs ?? {})) total += ids.length;
  return total;
};

const bestStreakAny = (data: AppData, todayKey: string): number => {
  let best = 0;
  for (const h of data.habits ?? []) {
    const s = computeBestStreak(data, h, todayKey);
    if (s > best) best = s;
  }
  return best;
};

const hadPerfectDay = (data: AppData, todayKey: string): boolean => {
  const active = activeHabits(data);
  if (active.length === 0) return false;
  let cursor = active.reduce((min, h) => (h.createdAt < min ? h.createdAt : min), todayKey);
  let guard = 0;
  while (cursor <= todayKey && guard++ < 800) {
    const relevant = active.filter((h) => h.createdAt <= cursor);
    if (relevant.length > 0 && relevant.every((h) => isSettledToday(data, h, cursor))) return true;
    cursor = shiftDateKey(cursor, 1);
  }
  return false;
};

const hadComeback = (data: AppData, todayKey: string): boolean => {
  for (const h of data.habits ?? []) {
    let seenComplete = false;
    let gapAfterComplete = false;
    let cursor = h.createdAt;
    let guard = 0;
    while (cursor <= todayKey && guard++ < 800) {
      const complete = isDayComplete(data, cursor, h);
      const excused = isHabitExcused(data, cursor, h.id);
      if (complete) {
        if (gapAfterComplete) return true;
        seenComplete = true;
      } else if (!excused && seenComplete) {
        gapAfterComplete = true;
      }
      cursor = shiftDateKey(cursor, 1);
    }
  }
  return false;
};

// Kumpulan id badge yang sudah diraih berdasarkan seluruh riwayat.
export const computeEarnedBadges = (data: AppData, todayKey: string): Set<string> => {
  const earned = new Set<string>();
  const logs = totalLogs(data);
  const best = bestStreakAny(data, todayKey);
  const habitCount = (data.habits ?? []).length;

  if (logs >= 1) earned.add('first-log');
  if (best >= 7) earned.add('streak-7');
  if (best >= 30) earned.add('streak-30');
  if (best >= 100) earned.add('streak-100');
  if (logs >= 100) earned.add('collector');
  if (habitCount >= 5) earned.add('variety');
  if (hadPerfectDay(data, todayKey)) earned.add('perfect-day');
  if (hadComeback(data, todayKey)) earned.add('comeback');

  return earned;
};

// Badge yang baru muncul di `after` dibanding `before` (untuk celebration).
export const newlyEarnedBadges = (
  before: AppData,
  after: AppData,
  todayKey: string
): BadgeDef[] => {
  const prev = computeEarnedBadges(before, todayKey);
  const now = computeEarnedBadges(after, todayKey);
  return BADGES.filter((b) => now.has(b.id) && !prev.has(b.id));
};
