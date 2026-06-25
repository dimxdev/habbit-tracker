export interface TimeSlot {
  id: string;
  start: string;
  end: string;
  activity: string;
  notes?: string;
}

export type DayKey =
  | 'monday' | 'tuesday' | 'wednesday' | 'thursday'
  | 'friday' | 'saturday' | 'sunday';

export interface ScheduleData {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

export interface DailyNote {
  id: string;
  text: string;
  // Jam opsional (format 'HH:MM') — dipakai untuk agenda berjadwal
  time?: string;
}

// Kumpulan catatan/item per tanggal kalender (key: 'YYYY-MM-DD')
export type DatedNotes = Record<string, DailyNote[]>;

// Kebiasaan yang dilacak harian
export interface Habit {
  id: string;
  name: string;
  icon?: string;        // emoji opsional
  createdAt: string;    // tanggal dibuat ('YYYY-MM-DD')
}

export interface AppData {
  schedule: ScheduleData;
  // Jurnal/refleksi harian — isi bebas tentang hari itu
  journal?: DatedNotes;
  // Agenda/rencana terjadwal untuk tanggal tertentu
  agenda?: DatedNotes;
  // Id slot jadwal & agenda yang sudah ditandai selesai, per tanggal
  completed?: Record<string, string[]>;
  // Daftar habit yang dilacak
  habits?: Habit[];
  // Id habit yang selesai per tanggal ('YYYY-MM-DD' -> [habitId])
  habitLogs?: Record<string, string[]>;
}
