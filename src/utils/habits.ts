import type { AppData, Habit } from '../types';
import { generateId, getDateKey, shiftDateKey, daysBetweenKeys, parseDateKey } from './helpers';

// ── Konfigurasi target ────────────────────────────────────────────────
export const getHabitTarget = (habit: Habit): number =>
  Math.max(1, Math.floor(habit.target ?? 1));

export const getHabitPeriod = (habit: Habit): 'day' | 'week' => habit.period ?? 'day';

// Batas pencatatan per hari:
// - habit harian  -> sebanyak target (mis. sholat 5x)
// - habit mingguan -> cukup 1x per hari (targetnya dihitung per jumlah hari)
export const perDayCap = (habit: Habit): number =>
  getHabitPeriod(habit) === 'day' ? getHabitTarget(habit) : 1;

// ── CRUD ──────────────────────────────────────────────────────────────
export const addHabit = (
  data: AppData,
  name: string,
  icon?: string,
  target = 1,
  period: 'day' | 'week' = 'day'
): AppData => ({
  ...data,
  habits: [
    ...(data.habits ?? []),
    {
      id: generateId(),
      name,
      ...(icon ? { icon } : {}),
      target: Math.max(1, Math.floor(target)),
      period,
      createdAt: getDateKey(),
    },
  ],
});

export const updateHabit = (
  data: AppData,
  id: string,
  name: string,
  icon?: string,
  target = 1,
  period: 'day' | 'week' = 'day'
): AppData => ({
  ...data,
  habits: (data.habits ?? []).map((h) =>
    h.id === id
      ? { ...h, name, icon: icon || undefined, target: Math.max(1, Math.floor(target)), period }
      : h
  ),
});

// ── Arsip ─────────────────────────────────────────────────────────────
export const activeHabits = (data: AppData): Habit[] =>
  (data.habits ?? []).filter((h) => !h.archivedAt);

export const archivedHabits = (data: AppData): Habit[] =>
  (data.habits ?? []).filter((h) => !!h.archivedAt);

// Apakah habit sudah "beres" untuk hari ini — target harian tercapai ATAU
// ditandai sakit/berhalangan. Keduanya sama-sama tidak perlu dikerjakan lagi
// hari ini, jadi diturunkan ke bawah daftar.
export const isSettledToday = (data: AppData, habit: Habit, todayKey: string): boolean =>
  getHabitCount(data, todayKey, habit.id) >= perDayCap(habit) ||
  isHabitExcused(data, todayKey, habit.id);

// Urutkan habit: yang belum beres hari ini tetap di atas, yang sudah beres
// (selesai atau sakit) turun ke bawah. Urutan relatif dalam masing-masing
// kelompok mengikuti urutan asli (Array.sort stabil) — yaitu urutan kustom
// hasil drag & drop (lihat reorderActiveHabits).
export const sortByTodayCompletion = (
  data: AppData,
  habits: Habit[],
  todayKey: string
): Habit[] =>
  [...habits].sort((a, b) => {
    const aDone = isSettledToday(data, a, todayKey) ? 1 : 0;
    const bDone = isSettledToday(data, b, todayKey) ? 1 : 0;
    return aDone - bDone;
  });

// Terapkan urutan kustom baru (hasil drag & drop) untuk habit aktif.
// Habit lain (arsip) tetap ada, ditaruh setelah yang aktif — posisinya di
// antara arsip tidak berpengaruh karena selalu difilter ulang.
export const reorderActiveHabits = (data: AppData, orderedActiveIds: string[]): AppData => {
  const all = data.habits ?? [];
  const byId = new Map(all.map((h) => [h.id, h]));
  const reorderedActive = orderedActiveIds
    .map((id) => byId.get(id))
    .filter((h): h is Habit => !!h);
  const rest = all.filter((h) => !orderedActiveIds.includes(h.id));
  return { ...data, habits: [...reorderedActive, ...rest] };
};

// Sembunyikan habit tanpa menghapus riwayat pencatatannya
export const archiveHabit = (data: AppData, id: string): AppData => ({
  ...data,
  habits: (data.habits ?? []).map((h) =>
    h.id === id ? { ...h, archivedAt: getDateKey() } : h
  ),
});

export const unarchiveHabit = (data: AppData, id: string): AppData => ({
  ...data,
  habits: (data.habits ?? []).map((h) => {
    if (h.id !== id) return h;
    const rest = { ...h };
    delete rest.archivedAt;
    return rest;
  }),
});

export const deleteHabit = (data: AppData, id: string): AppData => {
  // Buang habit + bersihkan jejaknya di habitLogs (lama) & habitCounts (baru)
  const habitLogs: Record<string, string[]> = {};
  for (const [date, ids] of Object.entries(data.habitLogs ?? {})) {
    const filtered = ids.filter((x) => x !== id);
    if (filtered.length > 0) habitLogs[date] = filtered;
  }
  const habitCounts: Record<string, Record<string, number>> = {};
  for (const [date, map] of Object.entries(data.habitCounts ?? {})) {
    const rest: Record<string, number> = {};
    for (const [hid, n] of Object.entries(map)) {
      if (hid !== id) rest[hid] = n;
    }
    if (Object.keys(rest).length > 0) habitCounts[date] = rest;
  }
  return {
    ...data,
    habits: (data.habits ?? []).filter((h) => h.id !== id),
    habitLogs,
    habitCounts,
  };
};

// ── Baca / tulis pencatatan ──────────────────────────────────────────
// Baca jumlah pencatatan; fallback ke data lama (habitLogs = 1 kali)
export const getHabitCount = (data: AppData, dateKey: string, habitId: string): number => {
  const c = data.habitCounts?.[dateKey]?.[habitId];
  if (c !== undefined) return c;
  return (data.habitLogs?.[dateKey] ?? []).includes(habitId) ? 1 : 0;
};

// Tulis jumlah pencatatan; sekalian bersihkan jejak lama di habitLogs
// supaya tidak dobel dengan fallback.
const setHabitCount = (
  data: AppData,
  dateKey: string,
  habitId: string,
  count: number
): AppData => {
  const habitCounts = { ...(data.habitCounts ?? {}) };
  const day = { ...(habitCounts[dateKey] ?? {}) };
  if (count > 0) day[habitId] = count;
  else delete day[habitId];
  if (Object.keys(day).length > 0) habitCounts[dateKey] = day;
  else delete habitCounts[dateKey];

  let habitLogs = data.habitLogs;
  if (habitLogs?.[dateKey]?.includes(habitId)) {
    const filtered = habitLogs[dateKey].filter((x) => x !== habitId);
    habitLogs = { ...habitLogs };
    if (filtered.length > 0) habitLogs[dateKey] = filtered;
    else delete habitLogs[dateKey];
  }

  return { ...data, habitCounts, habitLogs };
};

// Ketuk untuk menambah +1; kembali ke 0 bila sudah mencapai batas harian.
// Ketukan langsung berarti ada usaha nyata hari itu — batalkan status
// sakit/berhalangan yang mungkin sedang aktif untuk tanggal ini.
export const cycleHabit = (data: AppData, dateKey: string, habit: Habit): AppData => {
  const cap = perDayCap(habit);
  const cur = getHabitCount(data, dateKey, habit.id);
  const next = cur >= cap ? 0 : cur + 1;
  return setHabitCount(clearHabitExcused(data, dateKey, habit.id), dateKey, habit.id, next);
};

// Toggle biner 0/1 (masih dipakai bila hanya perlu tandai/hapus)
export const toggleHabit = (data: AppData, dateKey: string, habitId: string): AppData => {
  const cur = getHabitCount(data, dateKey, habitId);
  return setHabitCount(clearHabitExcused(data, dateKey, habitId), dateKey, habitId, cur > 0 ? 0 : 1);
};

// Apakah ada pencatatan sama sekali di hari itu
export const isHabitDone = (data: AppData, dateKey: string, habitId: string): boolean =>
  getHabitCount(data, dateKey, habitId) > 0;

// ── Sakit / berhalangan (streak freeze) ─────────────────────────────
// Ditandai saat berhalangan menjalani habit (sakit, dsb). Hari itu tidak
// menambah streak, tapi juga tidak memutusnya — "apinya tetap menyala".
export const isHabitExcused = (data: AppData, dateKey: string, habitId: string): boolean =>
  (data.habitExcused?.[dateKey] ?? []).includes(habitId);

const clearHabitExcused = (data: AppData, dateKey: string, habitId: string): AppData => {
  if (!data.habitExcused?.[dateKey]?.includes(habitId)) return data;
  const list = data.habitExcused[dateKey].filter((x) => x !== habitId);
  const habitExcused = { ...data.habitExcused };
  if (list.length > 0) habitExcused[dateKey] = list;
  else delete habitExcused[dateKey];
  return { ...data, habitExcused };
};

// Tandai/batalkan sakit-berhalangan. Menandai sakit mengosongkan pencatatan
// hari itu (bukan dianggap selesai) — dua status ini saling meniadakan.
export const toggleHabitExcused = (data: AppData, dateKey: string, habitId: string): AppData => {
  if (isHabitExcused(data, dateKey, habitId)) {
    return clearHabitExcused(data, dateKey, habitId);
  }
  const cleared = setHabitCount(data, dateKey, habitId, 0);
  const list = cleared.habitExcused?.[dateKey] ?? [];
  return {
    ...cleared,
    habitExcused: { ...(cleared.habitExcused ?? {}), [dateKey]: [...list, habitId] },
  };
};

// Apakah hari itu memenuhi target harian (mis. sholat sudah 5/5)
export const isDayComplete = (data: AppData, dateKey: string, habit: Habit): boolean =>
  getHabitCount(data, dateKey, habit.id) >= getHabitTarget(habit);

// ── Perhitungan mingguan ─────────────────────────────────────────────
// Senin dari minggu yang memuat dateKey (minggu mulai Senin)
export const weekStartKey = (dateKey: string): string => {
  const sinceMonday = (parseDateKey(dateKey).getDay() + 6) % 7;
  return shiftDateKey(dateKey, -sinceMonday);
};

// Jumlah hari 'ada pencatatan' dalam minggu yang memuat refKey.
// Hari di masa depan (setelah todayKey) tidak dihitung.
export const weeklyDoneDays = (
  data: AppData,
  habit: Habit,
  refKey: string,
  todayKey: string
): number => {
  const mon = weekStartKey(refKey);
  let done = 0;
  for (let d = 0; d < 7; d++) {
    const key = shiftDateKey(mon, d);
    if (key > todayKey) break;
    if (getHabitCount(data, key, habit.id) > 0) done++;
  }
  return done;
};

// Progres minggu berjalan untuk habit mingguan
export const weeklyProgress = (
  data: AppData,
  habit: Habit,
  todayKey: string
): { done: number; target: number; percent: number } => {
  const target = getHabitTarget(habit);
  const done = weeklyDoneDays(data, habit, todayKey, todayKey);
  return { done, target, percent: Math.min(100, Math.round((done / target) * 100)) };
};

// Apakah target periode (hari atau minggu) sudah tercapai
export const isPeriodComplete = (data: AppData, habit: Habit, todayKey: string): boolean =>
  getHabitPeriod(habit) === 'week'
    ? weeklyDoneDays(data, habit, todayKey, todayKey) >= getHabitTarget(habit)
    : isDayComplete(data, todayKey, habit);

// Hari yang tidak memutus streak: target tercapai ATAU ditandai sakit/
// berhalangan (freeze — tidak menambah, tidak memutus).
const keepsStreakAlive = (data: AppData, habit: Habit, dateKey: string): boolean =>
  isDayComplete(data, dateKey, habit) || isHabitExcused(data, dateKey, habit.id);

// ── Streak ───────────────────────────────────────────────────────────
// Streak harian = jumlah hari berturut-turut target tercapai sampai hari ini.
// Bila hari ini belum tercapai, dihitung mundur dari kemarin (biar tidak hangus).
// Hari yang ditandai sakit dilompati (tidak menambah angka) tapi tetap
// menyambungkan streak sebelum & sesudahnya.
const dailyStreak = (data: AppData, habit: Habit, todayKey: string): number => {
  let streak = 0;
  let cursor = keepsStreakAlive(data, habit, todayKey) ? todayKey : shiftDateKey(todayKey, -1);
  while (keepsStreakAlive(data, habit, cursor)) {
    if (isDayComplete(data, cursor, habit)) streak++;
    cursor = shiftDateKey(cursor, -1);
  }
  return streak;
};

// Streak mingguan = jumlah minggu berturut-turut target tercapai.
// Minggu berjalan yang belum lengkap tidak menghanguskan streak.
const weeklyStreak = (data: AppData, habit: Habit, todayKey: string): number => {
  const target = getHabitTarget(habit);
  let streak = 0;
  let mon = weekStartKey(todayKey);
  if (weeklyDoneDays(data, habit, mon, todayKey) < target) mon = shiftDateKey(mon, -7);
  while (weeklyDoneDays(data, habit, mon, todayKey) >= target) {
    streak++;
    mon = shiftDateKey(mon, -7);
  }
  return streak;
};

// Streak dalam satuan hari (habit harian) atau minggu (habit mingguan).
export const computeStreak = (data: AppData, habit: Habit, todayKey: string): number =>
  getHabitPeriod(habit) === 'week'
    ? weeklyStreak(data, habit, todayKey)
    : dailyStreak(data, habit, todayKey);

// Streak terpanjang (rekor) sepanjang umur habit — hari atau minggu.
export const computeBestStreak = (data: AppData, habit: Habit, todayKey: string): number => {
  let best = 0;
  let run = 0;

  if (getHabitPeriod(habit) === 'week') {
    const target = getHabitTarget(habit);
    let mon = weekStartKey(habit.createdAt);
    const lastMon = weekStartKey(todayKey);
    while (mon <= lastMon) {
      if (weeklyDoneDays(data, habit, mon, todayKey) >= target) {
        run++;
        if (run > best) best = run;
      } else {
        run = 0;
      }
      mon = shiftDateKey(mon, 7);
    }
    return best;
  }

  let cursor = habit.createdAt;
  while (cursor <= todayKey) {
    if (isDayComplete(data, cursor, habit)) {
      run++;
      if (run > best) best = run;
    } else if (!isHabitExcused(data, cursor, habit.id)) {
      run = 0;
    }
    // sakit/berhalangan: pertahankan run saat ini, tidak menambah/memutus
    cursor = shiftDateKey(cursor, 1);
  }
  return best;
};

// Apakah suatu hari "dihitung selesai" untuk rekap:
// - harian  -> target harian tercapai
// - mingguan -> ada pencatatan hari itu (menyumbang ke target mingguan)
export const isDayCounted = (data: AppData, habit: Habit, dateKey: string): boolean =>
  getHabitPeriod(habit) === 'week'
    ? getHabitCount(data, dateKey, habit.id) > 0
    : isDayComplete(data, dateKey, habit);

// Skor minggu berjalan (0..1) untuk memeringkat habit terbaik/terlemah.
// - harian  -> hari lengkap / jumlah hari yang sudah berjalan minggu ini
// - mingguan -> hari tercatat / target
export const weeklyScore = (data: AppData, habit: Habit, todayKey: string): number => {
  if (getHabitPeriod(habit) === 'week') {
    const { done, target } = weeklyProgress(data, habit, todayKey);
    return Math.min(1, done / target);
  }
  const mon = weekStartKey(todayKey);
  const elapsed = daysBetweenKeys(mon, todayKey) + 1; // 1..7
  let done = 0;
  for (let i = 0; i < elapsed; i++) {
    if (isDayComplete(data, shiftDateKey(mon, i), habit)) done++;
  }
  return done / elapsed;
};

// Konsistensi (%) hari-hari yang memenuhi target dalam jendela hingga 30 hari
// terakhir, dibatasi umur habit supaya yang baru tidak otomatis rendah.
// Hari yang ditandai sakit dikecualikan dari penyebut (tidak menghukum,
// tidak menguntungkan).
export const computeConsistency = (data: AppData, habit: Habit, todayKey: string): number => {
  const age = daysBetweenKeys(habit.createdAt, todayKey) + 1;
  const windowDays = Math.min(30, Math.max(1, age));
  let done = 0;
  let counted = 0;
  for (let i = 0; i < windowDays; i++) {
    const key = shiftDateKey(todayKey, -i);
    if (isHabitExcused(data, key, habit.id)) continue;
    counted++;
    if (isDayComplete(data, key, habit)) done++;
  }
  return counted > 0 ? Math.round((done / counted) * 100) : 100;
};
