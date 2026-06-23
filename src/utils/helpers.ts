import type { DayKey } from '../types';

export const DAY_KEYS: DayKey[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
];

export const DAY_LABELS: Record<DayKey, string> = {
  monday:    'Senin',
  tuesday:   'Selasa',
  wednesday: 'Rabu',
  thursday:  'Kamis',
  friday:    'Jumat',
  saturday:  'Sabtu',
  sunday:    'Minggu',
};

export const DAY_SHORT: Record<DayKey, string> = {
  monday:    'Sen',
  tuesday:   'Sel',
  wednesday: 'Rab',
  thursday:  'Kam',
  friday:    'Jum',
  saturday:  'Sab',
  sunday:    'Min',
};

const JS_DAY_TO_KEY: DayKey[] = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
];

export const getTodayKey = (): DayKey => {
  return JS_DAY_TO_KEY[new Date().getDay()];
};

export const getDayOfYear = (date: Date): number => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

export const getCurrentTimeString = (): string => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

export const getCurrentTimeFullString = (): string => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
};

export const formatDateIndonesia = (date: Date): string => {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  });
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
};

export const getSlotStatus = (
  start: string,
  end: string,
  currentTime: string
): 'past' | 'current' | 'future' => {
  if (end <= currentTime) return 'past';
  if (start <= currentTime) return 'current';
  return 'future';
};
