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

// Kebiasaan yang dilacak
export interface Habit {
  id: string;
  name: string;
  icon?: string;        // emoji opsional
  createdAt: string;    // tanggal dibuat ('YYYY-MM-DD')
  // Target: berapa kali per periode. Default: 1 kali per hari (habit biasa).
  // - period 'day'  -> harus tercatat `target` kali dalam sehari (mis. sholat 5x)
  // - period 'week' -> harus tercatat pada `target` hari berbeda dalam seminggu (mis. olahraga 3x)
  target?: number;
  period?: 'day' | 'week';
  // Tanggal diarsipkan ('YYYY-MM-DD'). Bila ada, habit disembunyikan dari
  // daftar aktif tapi riwayatnya tetap disimpan.
  archivedAt?: string;
  // Alasan/identitas opsional — "kenapa" kamu menjalani habit ini
  // (mis. "Karena aku orang yang sehat"). Ditampilkan tipis di kartu.
  why?: string;
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
  // (LAMA) Id habit yang selesai per tanggal ('YYYY-MM-DD' -> [habitId]).
  // Masih dibaca demi kompatibilitas; penulisan baru memakai habitCounts.
  habitLogs?: Record<string, string[]>;
  // Jumlah pencatatan habit per tanggal ('YYYY-MM-DD' -> habitId -> berapa kali)
  habitCounts?: Record<string, Record<string, number>>;
  // Id habit yang ditandai sakit/berhalangan per tanggal ('YYYY-MM-DD' -> [habitId]).
  // Streak tidak putus pada hari ini, tapi juga tidak bertambah.
  habitExcused?: Record<string, string[]>;
  // Badge/pencapaian yang sudah diraih (badgeId -> tanggal diraih 'YYYY-MM-DD').
  badges?: Record<string, string>;
  // Aktifkan kata-kata motivasi kustom (menggantikan kutipan bawaan)
  useCustomMotivation?: boolean;
  // Kumpulan kata-kata motivasi kustom yang pernah ditambahkan (tidak dihapus)
  customMotivations?: string[];
  // Kata motivasi kustom yang sedang dipilih/aktif dari dropdown
  activeMotivation?: string;
}
