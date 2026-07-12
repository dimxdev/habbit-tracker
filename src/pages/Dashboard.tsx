import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Quote, CalendarX2, Clock, NotebookPen, CalendarClock, ChevronRight, ChevronDown, Check, Target, Flame, Thermometer } from 'lucide-react';
import useStorage from '../hooks/useStorage';
import type { AppData, TimeSlot, DailyNote } from '../types';
import { DEFAULT_DATA } from '../data/defaultData';
import { motivations } from '../data/motivations';
import {
  getTodayKey,
  getDateKey,
  getDayOfYear,
  getCurrentTimeString,
  formatDateIndonesia,
  getSlotStatus,
} from '../utils/helpers';
import { getNotesFor, addNote, updateNote, deleteNote } from '../utils/dailyNotes';
import { isDone, toggleDone, countDone } from '../utils/completion';
import {
  cycleHabit,
  isPeriodComplete,
  computeStreak,
  getHabitPeriod,
  getHabitCount,
  perDayCap,
  weeklyProgress,
  activeHabits,
  sortByTodayCompletion,
  isHabitExcused,
} from '../utils/habits';
import DailyNotesEditor from '../components/DailyNotesEditor';
import ProgressRing from '../components/ProgressRing';
// import WeeklyRecap from '../components/WeeklyRecap'; // sementara dinonaktifkan

export default function Dashboard() {
  const [data, setData] = useStorage<AppData>('habbit-tracker-data', DEFAULT_DATA);
  const [currentTime, setCurrentTime] = useState(getCurrentTimeString());
  const [clockTime, setClockTime] = useState(getCurrentTimeString());

  useEffect(() => {
    const interval = setInterval(() => {
      const t = getCurrentTimeString();
      setCurrentTime(t);
      setClockTime(t);
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const today = new Date();
  const todayKey = getTodayKey();
  const todayDateKey = getDateKey(today);
  const motivation =
    data.useCustomMotivation && data.activeMotivation?.trim()
      ? data.activeMotivation
      : motivations[getDayOfYear(today) % motivations.length];
  const slots: TimeSlot[] = [...(data.schedule[todayKey] ?? [])].sort((a, b) =>
    a.start.localeCompare(b.start)
  );
  // Jurnal hari ini (refleksi bebas) — CRUD penuh di Dashboard
  const journalToday: DailyNote[] = getNotesFor(data, 'journal', todayDateKey);
  // Agenda yang jatuh hari ini — tampil sebagai pengingat (dikelola di Kalender)
  const agendaToday: DailyNote[] = [...getNotesFor(data, 'agenda', todayDateKey)].sort((a, b) => {
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.time) return -1;
    if (b.time) return 1;
    return 0;
  });

  const addJournal = (text: string, time?: string) =>
    setData((prev) => addNote(prev, 'journal', todayDateKey, text, time));
  const updateJournal = (id: string, text: string, time?: string) =>
    setData((prev) => updateNote(prev, 'journal', todayDateKey, id, text, time));
  const deleteJournal = (id: string) =>
    setData((prev) => deleteNote(prev, 'journal', todayDateKey, id));

  // Progres hari ini = jadwal + agenda yang ditandai selesai
  const allTodayIds = [...slots.map((s) => s.id), ...agendaToday.map((a) => a.id)];
  const totalCount = allTodayIds.length;
  const doneCount = countDone(data, todayDateKey, allTodayIds);
  const percent = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
  const toggleItem = (id: string) => setData((prev) => toggleDone(prev, todayDateKey, id));

  // Habit (hanya yang aktif; yang diarsipkan disembunyikan).
  // Urutan dasar mengikuti urutan kustom hasil drag & drop di menu Habit;
  // yang sudah tercatat penuh hari ini turun ke bawah.
  const habits = sortByTodayCompletion(data, activeHabits(data), todayDateKey);
  const habitDoneCount = habits.filter((h) => isPeriodComplete(data, h, todayDateKey)).length;

  return (
    <div>
      <header className="bg-linear-to-br from-deep-navy to-ocean-blue px-5 pt-10 pb-10 md:mt-6 md:rounded-3xl md:px-8 md:pt-9 md:pb-11 md:shadow-sm">
        <p className="text-sky-tint text-sm font-medium mb-1">Hari ini</p>
        <h1 className="text-white text-2xl md:text-3xl font-bold leading-snug capitalize">
          {formatDateIndonesia(today)}
        </h1>
        <span className="text-white text-xl font-semibold tabular-nums tracking-tight mt-1 block">
          {clockTime}
        </span>
      </header>

      <div className="px-4 md:px-8 -mt-5 space-y-6">
        {/* Motivation Card */}
        <div className="glass-card p-5">
          <Quote size={22} className="text-sky-tint mb-2" />
          <p className="text-deep-navy text-sm md:text-base leading-relaxed italic dark:text-slate-100">
            {motivation}
          </p>
        </div>

        {/* Progres Hari Ini */}
        {totalCount > 0 && (
          <div className="glass-card p-5 flex items-center gap-5">
            <ProgressRing value={percent}>
              <span className="text-deep-navy font-bold text-lg tabular-nums dark:text-slate-100">
                {percent}%
              </span>
            </ProgressRing>
            <div className="min-w-0">
              <h2 className="text-deep-navy font-semibold text-base md:text-lg dark:text-slate-100">
                Progres Hari Ini
              </h2>
              <p className="text-slate-500 text-sm mt-0.5 dark:text-slate-400">
                <strong className="text-deep-navy dark:text-slate-100">{doneCount}</strong> dari{' '}
                {totalCount} aktivitas selesai
              </p>
            </div>
          </div>
        )}

        {/* Today's Schedule */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-deep-navy text-base md:text-lg font-semibold dark:text-slate-100">
              Jadwal Hari Ini
            </h2>
            {slots.length > 0 && (
              <span className="text-xs font-medium text-ocean-blue bg-mist px-2.5 py-1 rounded-full dark:text-sky-tint dark:bg-night-border">
                {slots.length} aktivitas
              </span>
            )}
          </div>

          {slots.length === 0 ? (
            <div className="glass-card p-8 md:p-12 flex flex-col items-center text-center gap-3">
              <CalendarX2 size={40} className="text-slate-300 dark:text-slate-600" />
              <p className="text-slate-400 text-sm dark:text-slate-500">Belum ada jadwal untuk hari ini.</p>
              <Link
                to="/schedule"
                className="mt-1 inline-flex items-center gap-1.5 bg-ocean-blue text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-deep-navy transition-colors"
              >
                Tambah jadwal sekarang
              </Link>
            </div>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {slots.map((slot) => {
                const status = getSlotStatus(slot.start, slot.end, currentTime);
                return (
                  <SlotCard
                    key={slot.id}
                    slot={slot}
                    status={status}
                    done={isDone(data, todayDateKey, slot.id)}
                    onToggle={() => toggleItem(slot.id)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Agenda Khusus Hari Ini — pengingat agenda yang jatuh hari ini */}
        {agendaToday.length > 0 && (
          <div className="bg-blue-50 rounded-2xl border border-sky-tint p-5 shadow-sm dark:bg-ocean-blue/10 dark:border-ocean-blue/40">
            <div className="flex items-center justify-between mb-3">
              <h2 className="inline-flex items-center gap-2 text-deep-navy text-base md:text-lg font-semibold dark:text-slate-100">
                <CalendarClock size={18} className="text-ocean-blue dark:text-sky-tint" />
                Agenda Khusus Hari Ini
              </h2>
              <Link
                to={`/calendar?date=${todayDateKey}`}
                className="inline-flex items-center gap-0.5 text-xs font-medium text-ocean-blue hover:underline dark:text-sky-tint"
              >
                Kelola
                <ChevronRight size={14} />
              </Link>
            </div>
            <ul className="space-y-2">
              {agendaToday.map((item) => {
                const done = isDone(data, todayDateKey, item.id);
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-2.5 rounded-xl bg-white border border-sky-tint/60 px-3 py-2.5 dark:bg-night-soft dark:border-ocean-blue/30"
                  >
                    <CheckButton
                      done={done}
                      onClick={() => toggleItem(item.id)}
                      label={`${done ? 'Batalkan' : 'Tandai selesai'} ${item.text}`}
                    />
                    {item.time && (
                      <span className="text-xs font-semibold text-ocean-blue bg-mist px-1.5 py-0.5 rounded shrink-0 tabular-nums dark:text-sky-tint dark:bg-night-border">
                        {item.time}
                      </span>
                    )}
                    <span
                      className={`flex-1 min-w-0 text-sm wrap-break-word ${
                        done
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-deep-navy dark:text-slate-100'
                      }`}
                    >
                      {item.text}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Rekap mingguan — sementara dinonaktifkan */}
        {/* {habits.length > 0 && <WeeklyRecap data={data} todayKey={todayDateKey} />} */}

        {/* Habit Hari Ini — centang cepat */}
        {habits.length > 0 && (
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="inline-flex items-center gap-2 text-deep-navy text-base md:text-lg font-semibold dark:text-slate-100">
                <Target size={18} className="text-ocean-blue dark:text-sky-tint" />
                Habit Hari Ini
              </h2>
              <Link
                to="/habits"
                className="inline-flex items-center gap-0.5 text-xs font-medium text-ocean-blue hover:underline dark:text-sky-tint"
              >
                {habitDoneCount}/{habits.length} · Semua
                <ChevronRight size={14} />
              </Link>
            </div>
            <ul className="space-y-2">
              {habits.map((h) => {
                const isWeekly = getHabitPeriod(h) === 'week';
                const cap = perDayCap(h);
                const todayCount = getHabitCount(data, todayDateKey, h.id);
                // "Tercentang" = pencatatan hari ini sudah cukup (harian: penuh target; mingguan: minimal sekali)
                const todayChecked = todayCount >= cap;
                const excused = isHabitExcused(data, todayDateKey, h.id);
                const streak = computeStreak(data, h, todayDateKey);
                // Progres di samping nama: mingguan -> hari tercatat/target minggu;
                // harian multi-target -> hitungan hari ini/target (selain di lingkaran).
                const week = weeklyProgress(data, h, todayDateKey);
                const progress = isWeekly
                  ? `${week.done}/${week.target} mgg`
                  : cap > 1
                    ? `${todayCount}/${cap}`
                    : null;
                const cycleLabel = `Catat ${h.name}${cap > 1 ? ` (${todayCount}/${cap})` : ''}`;
                return (
                  <li key={`${h.id}-${todayChecked}`} className="anim-fade-up flex items-center gap-3">
                    <CheckButton
                      done={todayChecked}
                      excused={excused}
                      round
                      count={todayCount}
                      cap={cap}
                      onClick={() => setData((prev) => cycleHabit(prev, todayDateKey, h))}
                      label={cycleLabel}
                    />
                    {/* Klik nama/progres/streak juga mencatat habit — bukan cuma lingkaran */}
                    <button
                      type="button"
                      onClick={() => setData((prev) => cycleHabit(prev, todayDateKey, h))}
                      aria-label={cycleLabel}
                      className="flex-1 min-w-0 flex items-center justify-between gap-2 text-left py-1 -my-1"
                    >
                      <span
                        className={`min-w-0 truncate text-sm ${
                          todayChecked
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-deep-navy dark:text-slate-100'
                        }`}
                      >
                        {h.icon ? `${h.icon} ` : ''}
                        {h.name}
                      </span>
                      <span className="flex items-center gap-2 shrink-0">
                        {excused ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                            <Thermometer size={12} />
                            Sakit
                          </span>
                        ) : (
                          progress && (
                            <span className="text-xs font-medium text-slate-400 tabular-nums dark:text-slate-500">
                              {progress}
                            </span>
                          )
                        )}
                        {streak > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
                            <Flame size={13} />
                            {streak}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Catatan Harian — jurnal/refleksi hari ini (paling bawah) */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="inline-flex items-center gap-2 text-deep-navy text-base md:text-lg font-semibold dark:text-slate-100">
              <NotebookPen size={18} className="text-ocean-blue dark:text-sky-tint" />
              Catatan Harian
            </h2>
            {journalToday.length > 0 && (
              <span className="text-xs font-medium text-ocean-blue bg-mist px-2.5 py-1 rounded-full dark:text-sky-tint dark:bg-night-border">
                {journalToday.length} catatan
              </span>
            )}
          </div>
          <DailyNotesEditor
            withTime
            defaultTimeNow
            notes={journalToday}
            onAdd={addJournal}
            onUpdate={updateJournal}
            onDelete={deleteJournal}
            placeholder="Tulis catatan atau refleksi hari ini…"
            emptyText="Belum ada catatan hari ini."
          />
        </div>
      </div>
    </div>
  );
}

function CheckButton({
  done,
  onClick,
  label,
  round = false,
  count,
  cap,
  excused = false,
}: {
  done: boolean;
  onClick: () => void;
  label: string;
  round?: boolean;
  // Bila cap > 1 (mis. sholat 5x), lingkaran menampilkan angka hitungan
  count?: number;
  cap?: number;
  // Ditandai sakit/berhalangan — beda warna, tidak dianggap selesai
  excused?: boolean;
}) {
  const showCount = cap != null && cap > 1;
  const c = count ?? 0;
  const complete = showCount ? c >= cap : done;
  const partial = showCount && c > 0 && !complete;

  // Pop dipicu dari klik (bukan saat halaman dimuat). Saat batal centang,
  // isi lingkaran transparan sehingga animasinya tak terlihat — aman.
  const [popKey, setPopKey] = useState(0);

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        onClick();
        setPopKey((k) => k + 1);
      }}
      className={`shrink-0 w-5 h-5 ${round ? 'rounded-full' : 'rounded-md'} border-2 grid place-items-center text-[10px] font-bold tabular-nums transition-colors ${
        excused
          ? 'bg-amber-400 border-amber-400 text-white dark:bg-amber-500 dark:border-amber-500'
          : complete
            ? 'bg-ocean-blue border-ocean-blue text-white dark:bg-sky-tint dark:border-sky-tint dark:text-night'
            : partial
              ? 'bg-ocean-blue/15 border-ocean-blue text-ocean-blue dark:bg-sky-tint/15 dark:border-sky-tint dark:text-sky-tint'
              : 'border-slate-300 text-transparent hover:border-ocean-blue dark:border-slate-600 dark:hover:border-sky-tint'
      }`}
    >
      <span key={popKey} className={`grid place-items-center ${popKey > 0 ? 'anim-pop' : ''}`}>
        {excused ? (
          <Thermometer size={11} strokeWidth={2.5} />
        ) : showCount ? (
          complete ? cap : partial ? c : null
        ) : (
          <Check size={13} strokeWidth={3} />
        )}
      </span>
    </button>
  );
}

function SlotCard({
  slot,
  status,
  done,
  onToggle,
}: {
  slot: TimeSlot;
  status: 'past' | 'current' | 'future';
  done: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasNotes = !!slot.notes;
  const checkLabel = `${done ? 'Batalkan' : 'Tandai selesai'} ${slot.activity || 'aktivitas'}`;

  // Tombol kecil terpisah untuk buka/tutup catatan — supaya tidak tabrakan
  // dengan tombol besar "tandai selesai" yang sekarang menutupi seluruh baris.
  const notesToggle = hasNotes ? (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      aria-label={expanded ? 'Sembunyikan catatan' : 'Lihat catatan'}
      aria-expanded={expanded ? 'true' : 'false'}
      className="shrink-0 p-1 -m-1 rounded-lg text-slate-400 hover:text-ocean-blue transition-colors dark:hover:text-sky-tint"
    >
      <ChevronDown size={15} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
    </button>
  ) : null;

  if (status === 'past') {
    return (
      <div className="bg-slate-100 border border-slate-200 rounded-xl overflow-hidden dark:bg-slate-800/60 dark:border-slate-700">
        <div className="px-4 py-3 flex items-center gap-3">
          <CheckButton done={done} onClick={onToggle} label={checkLabel} />
          <button
            type="button"
            onClick={onToggle}
            aria-label={checkLabel}
            className="flex-1 flex items-center justify-between gap-3 min-w-0 text-left"
          >
            <span className="text-slate-400 text-sm font-medium whitespace-nowrap dark:text-slate-500">
              {slot.start} – {slot.end}
            </span>
            <span className={`text-slate-400 text-sm truncate dark:text-slate-500 ${done ? 'line-through' : ''}`}>
              {slot.activity || '—'}
            </span>
          </button>
          {notesToggle}
        </div>
        {expanded && hasNotes && (
          <div className="px-4 pb-3 text-slate-400 text-xs dark:text-slate-500">
            {slot.notes}
          </div>
        )}
      </div>
    );
  }

  if (status === 'current') {
    return (
      <div className="sm:col-span-2 bg-blue-50 border border-sky-tint rounded-xl px-4 py-3.5 shadow-sm dark:bg-ocean-blue/15 dark:border-ocean-blue">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="inline-flex items-center gap-1.5 text-ocean-blue text-sm font-semibold dark:text-sky-tint">
            <Clock size={15} />
            {slot.start} – {slot.end}
          </span>
          <span className="bg-ocean-blue text-white text-xs font-medium px-2.5 py-0.5 rounded-full">
            Sekarang
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <CheckButton done={done} onClick={onToggle} label={checkLabel} />
          <button type="button" onClick={onToggle} aria-label={checkLabel} className="flex-1 min-w-0 text-left">
            <p
              className={`font-semibold text-base ${
                done ? 'line-through text-slate-400 dark:text-slate-500' : 'text-deep-navy dark:text-slate-100'
              }`}
            >
              {slot.activity || '—'}
            </p>
          </button>
        </div>
        {hasNotes && (
          <p className="text-ocean-blue/70 text-xs mt-1.5 dark:text-sky-tint/60">{slot.notes}</p>
        )}
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden hover:border-sky-tint transition-colors dark:hover:border-sky-tint">
      <div className="px-4 py-3 flex items-center gap-3">
        <CheckButton done={done} onClick={onToggle} label={checkLabel} />
        <button
          type="button"
          onClick={onToggle}
          aria-label={checkLabel}
          className="flex-1 flex items-center justify-between gap-3 min-w-0 text-left"
        >
          <span className="text-ocean-blue text-sm font-medium whitespace-nowrap dark:text-sky-tint">
            {slot.start} – {slot.end}
          </span>
          <span className={`text-deep-navy text-sm truncate dark:text-slate-100 ${done ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
            {slot.activity || '—'}
          </span>
        </button>
        {notesToggle}
      </div>
      {expanded && hasNotes && (
        <div className="px-4 pb-3 text-slate-500 text-xs dark:text-slate-400">
          {slot.notes}
        </div>
      )}
    </div>
  );
}
