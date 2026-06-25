import type { AppData } from '../types';

// Apakah sebuah item (slot jadwal / agenda) sudah ditandai selesai pada tanggal tsb
export const isDone = (data: AppData, dateKey: string, id: string): boolean =>
  (data.completed?.[dateKey] ?? []).includes(id);

// Toggle status selesai sebuah item pada tanggal tsb
export const toggleDone = (data: AppData, dateKey: string, id: string): AppData => {
  const list = data.completed?.[dateKey] ?? [];
  const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  const completed = { ...(data.completed ?? {}) };
  if (next.length > 0) completed[dateKey] = next;
  else delete completed[dateKey];
  return { ...data, completed };
};

// Jumlah id yang selesai dari sekumpulan id pada tanggal tsb
export const countDone = (data: AppData, dateKey: string, ids: string[]): number => {
  const list = data.completed?.[dateKey] ?? [];
  return ids.filter((id) => list.includes(id)).length;
};
