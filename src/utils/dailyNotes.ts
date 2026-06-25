import type { AppData, DailyNote } from '../types';
import { generateId } from './helpers';

// Field AppData yang menyimpan catatan per tanggal
export type NotesField = 'journal' | 'agenda';

// Ambil catatan untuk satu tanggal (key 'YYYY-MM-DD')
export const getNotesFor = (data: AppData, field: NotesField, dateKey: string): DailyNote[] =>
  data[field]?.[dateKey] ?? [];

// Tanggal-tanggal (terurut) yang punya minimal satu catatan
export const getNoteDateKeys = (data: AppData, field: NotesField): string[] =>
  Object.keys(data[field] ?? {})
    .filter((k) => (data[field]?.[k]?.length ?? 0) > 0)
    .sort();

export const addNote = (
  data: AppData,
  field: NotesField,
  dateKey: string,
  text: string,
  time?: string
): AppData => {
  const notes = data[field]?.[dateKey] ?? [];
  return {
    ...data,
    [field]: {
      ...(data[field] ?? {}),
      [dateKey]: [...notes, { id: generateId(), text, ...(time ? { time } : {}) }],
    },
  };
};

export const updateNote = (
  data: AppData,
  field: NotesField,
  dateKey: string,
  id: string,
  text: string,
  time?: string
): AppData => {
  const notes = data[field]?.[dateKey] ?? [];
  return {
    ...data,
    [field]: {
      ...(data[field] ?? {}),
      [dateKey]: notes.map((n) =>
        n.id === id ? { ...n, text, time: time ? time : undefined } : n
      ),
    },
  };
};

export const deleteNote = (
  data: AppData,
  field: NotesField,
  dateKey: string,
  id: string
): AppData => {
  const notes = (data[field]?.[dateKey] ?? []).filter((n) => n.id !== id);
  const next = { ...(data[field] ?? {}) };
  // Buang key tanggal kalau catatannya habis, biar storage tetap bersih
  if (notes.length > 0) next[dateKey] = notes;
  else delete next[dateKey];
  return { ...data, [field]: next };
};
