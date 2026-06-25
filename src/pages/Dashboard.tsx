import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Quote, CalendarX2, Clock, NotebookPen, CalendarClock, ChevronRight } from 'lucide-react';
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
import DailyNotesEditor from '../components/DailyNotesEditor';

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
  const motivation = motivations[getDayOfYear(today) % motivations.length];
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

  const addJournal = (text: string) =>
    setData((prev) => addNote(prev, 'journal', todayDateKey, text));
  const updateJournal = (id: string, text: string) =>
    setData((prev) => updateNote(prev, 'journal', todayDateKey, id, text));
  const deleteJournal = (id: string) =>
    setData((prev) => deleteNote(prev, 'journal', todayDateKey, id));

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
        <div className="bg-white rounded-2xl shadow-sm border border-mist p-5 dark:bg-night-soft dark:border-night-border">
          <Quote size={22} className="text-sky-tint mb-2" />
          <p className="text-deep-navy text-sm md:text-base leading-relaxed italic dark:text-slate-100">
            {motivation}
          </p>
        </div>

        {/* Agenda Hari Ini — pengingat dari agenda yang jatuh hari ini */}
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
              {agendaToday.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-2.5 rounded-xl bg-white border border-sky-tint/60 px-3 py-2.5 dark:bg-night-soft dark:border-ocean-blue/30"
                >
                  {item.time ? (
                    <span className="mt-0.5 text-xs font-semibold text-ocean-blue bg-mist px-1.5 py-0.5 rounded shrink-0 tabular-nums dark:text-sky-tint dark:bg-night-border">
                      {item.time}
                    </span>
                  ) : (
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-ocean-blue shrink-0 dark:bg-sky-tint" />
                  )}
                  <span className="flex-1 min-w-0 text-deep-navy text-sm wrap-break-word dark:text-slate-100">
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
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
            <div className="bg-white rounded-2xl border border-mist p-8 md:p-12 flex flex-col items-center text-center gap-3 dark:bg-night-soft dark:border-night-border">
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
                return <SlotCard key={slot.id} slot={slot} status={status} />;
              })}
            </div>
          )}
        </div>

        {/* Catatan Harian — jurnal/refleksi hari ini (paling bawah) */}
        <div className="bg-white rounded-2xl shadow-sm border border-mist p-5 dark:bg-night-soft dark:border-night-border">
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

function SlotCard({
  slot,
  status,
}: {
  slot: TimeSlot;
  status: 'past' | 'current' | 'future';
}) {
  const [expanded, setExpanded] = useState(false);
  const hasNotes = !!slot.notes;

  if (status === 'past') {
    return (
      <div className="relative bg-slate-100 border border-slate-200 rounded-xl overflow-hidden dark:bg-slate-800/60 dark:border-slate-700">
        {hasNotes && !expanded && (
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
        )}
        <div
          className={`px-4 py-3 flex items-center justify-between gap-3 ${hasNotes ? 'cursor-pointer' : ''}`}
          onClick={() => hasNotes && setExpanded((v) => !v)}
        >
          <span className="text-slate-400 text-sm font-medium whitespace-nowrap dark:text-slate-500">
            {slot.start} – {slot.end}
          </span>
          <span className="text-slate-400 text-sm truncate dark:text-slate-500">{slot.activity || '—'}</span>
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
        <p className="text-deep-navy font-semibold text-base dark:text-slate-100">{slot.activity || '—'}</p>
        {hasNotes && (
          <p className="text-ocean-blue/70 text-xs mt-1.5 dark:text-sky-tint/60">{slot.notes}</p>
        )}
      </div>
    );
  }

  return (
    <div className="relative bg-white border border-mist rounded-xl overflow-hidden hover:border-sky-tint transition-colors dark:bg-night-soft dark:border-night-border dark:hover:border-sky-tint">
      {hasNotes && !expanded && (
        <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-ocean-blue dark:bg-sky-tint" />
      )}
      <div
        className={`px-4 py-3 flex items-center justify-between gap-3 ${hasNotes ? 'cursor-pointer' : ''}`}
        onClick={() => hasNotes && setExpanded((v) => !v)}
      >
        <span className="text-ocean-blue text-sm font-medium whitespace-nowrap dark:text-sky-tint">
          {slot.start} – {slot.end}
        </span>
        <span className="text-deep-navy text-sm truncate dark:text-slate-100">{slot.activity || '—'}</span>
      </div>
      {expanded && hasNotes && (
        <div className="px-4 pb-3 text-slate-500 text-xs dark:text-slate-400">
          {slot.notes}
        </div>
      )}
    </div>
  );
}
