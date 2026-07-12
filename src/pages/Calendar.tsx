import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronDown, CalendarDays, CalendarClock, NotebookPen } from 'lucide-react';
import useStorage from '../hooks/useStorage';
import type { AppData } from '../types';
import { DEFAULT_DATA } from '../data/defaultData';
import PageHeader from '../components/PageHeader';
import DailyNotesEditor from '../components/DailyNotesEditor';
import {
  DAY_KEYS,
  DAY_SHORT,
  MONTH_LABELS,
  getDateKey,
  formatDateKeyLong,
  parseDateKey,
} from '../utils/helpers';
import { getNotesFor, addNote, updateNote, deleteNote } from '../utils/dailyNotes';

export default function Calendar() {
  const [data, setData] = useStorage<AppData>('habbit-tracker-data', DEFAULT_DATA);
  const [searchParams] = useSearchParams();

  const todayKey = getDateKey();
  // Tanggal awal dari query (?date=YYYY-MM-DD) kalau valid, kalau tidak pakai hari ini
  const initialKey = (() => {
    const q = searchParams.get('date');
    return q && /^\d{4}-\d{2}-\d{2}$/.test(q) ? q : todayKey;
  })();

  const [selectedKey, setSelectedKey] = useState(initialKey);
  // Bulan yang sedang ditampilkan (tanggal 1 bulan tsb)
  const [viewDate, setViewDate] = useState(() => {
    const d = parseDateKey(initialKey);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  // Pemilih bulan/tahun cepat
  const [showPicker, setShowPicker] = useState(false);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Offset Senin-pertama: getDay() 0=Minggu..6=Sabtu
  const leadingBlanks = (new Date(year, month, 1).getDay() + 6) % 7;

  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Tahun yang dipilih di picker (default = tahun yang sedang dilihat)
  const [pickerYear, setPickerYear] = useState(year);
  const todayYear = Number(todayKey.slice(0, 4));
  const years = Array.from({ length: 21 }, (_, i) => todayYear - 10 + i);

  const goToMonth = (delta: number) =>
    setViewDate(new Date(year, month + delta, 1));

  const togglePicker = () => {
    setPickerYear(year);
    setShowPicker((v) => !v);
  };

  const pickMonth = (monthIndex: number) => {
    setViewDate(new Date(pickerYear, monthIndex, 1));
    setShowPicker(false);
  };

  const selectedAgenda = getNotesFor(data, 'agenda', selectedKey);
  const selectedJournal = getNotesFor(data, 'journal', selectedKey);

  return (
    <div>
      <PageHeader title="Kalender" subtitle="Agenda & catatan harian per tanggal" />

      <div className="px-4 md:px-8 -mt-5 space-y-4">
        {/* Calendar Card */}
        <div className="glass-card p-4 md:p-5 shadow-sm">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              aria-label="Bulan sebelumnya"
              onClick={() => goToMonth(-1)}
              className="p-2 rounded-lg text-slate-500 hover:bg-mist transition-colors dark:text-slate-400 dark:hover:bg-night-border"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={togglePicker}
              aria-label="Pilih bulan dan tahun"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-mist transition-colors dark:hover:bg-night-border"
            >
              <h2 className="text-deep-navy font-semibold text-base md:text-lg dark:text-slate-100">
                {MONTH_LABELS[month]} {year}
              </h2>
              <ChevronDown
                size={16}
                className={`text-slate-400 transition-transform ${showPicker ? 'rotate-180' : ''}`}
              />
            </button>
            <button
              type="button"
              aria-label="Bulan berikutnya"
              onClick={() => goToMonth(1)}
              className="p-2 rounded-lg text-slate-500 hover:bg-mist transition-colors dark:text-slate-400 dark:hover:bg-night-border"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {showPicker ? (
            /* Quick month/year picker */
            <div>
              {/* Year chips */}
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-2 mb-2">
                {years.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setPickerYear(y)}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      y === pickerYear
                        ? 'bg-ocean-blue text-white'
                        : 'text-slate-500 hover:bg-mist dark:text-slate-400 dark:hover:bg-night-border'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
              {/* Month grid */}
              <div className="grid grid-cols-3 gap-1.5">
                {MONTH_LABELS.map((label, idx) => {
                  const isCurrent = idx === month && pickerYear === year;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => pickMonth(idx)}
                      className={`px-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isCurrent
                          ? 'bg-ocean-blue text-white'
                          : 'text-deep-navy hover:bg-mist dark:text-slate-100 dark:hover:bg-night-border'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_KEYS.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-medium text-slate-400 py-1 dark:text-slate-500"
              >
                {DAY_SHORT[d]}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <div key={`b${i}`} />;
              const key = getDateKey(new Date(year, month, day));
              const hasAgenda = getNotesFor(data, 'agenda', key).length > 0;
              const hasJournal = getNotesFor(data, 'journal', key).length > 0;
              const isToday = key === todayKey;
              const isSelected = key === selectedKey;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedKey(key)}
                  className={`relative aspect-square flex items-center justify-center rounded-xl text-sm transition-colors ${
                    isSelected
                      ? 'bg-ocean-blue text-white font-semibold'
                      : isToday
                        ? 'bg-mist text-ocean-blue font-semibold dark:bg-night-border dark:text-sky-tint'
                        : 'text-deep-navy hover:bg-mist dark:text-slate-100 dark:hover:bg-night-border'
                  }`}
                >
                  {day}
                  {(hasAgenda || hasJournal) && (
                    <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {hasAgenda && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-white' : 'bg-ocean-blue dark:bg-sky-tint'
                          }`}
                        />
                      )}
                      {hasJournal && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-amber-300' : 'bg-amber-400'
                          }`}
                        />
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-mist dark:border-night-border">
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-ocean-blue dark:bg-sky-tint" />
              Agenda
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Catatan Harian
            </span>
          </div>
            </>
          )}
        </div>

        {/* Selected date detail */}
        <div className="glass-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays size={18} className="text-ocean-blue shrink-0 dark:text-sky-tint" />
            <h3 className="text-deep-navy font-semibold text-sm md:text-base dark:text-slate-100">
              {formatDateKeyLong(selectedKey)}
              {selectedKey === todayKey && (
                <span className="ml-2 text-xs font-medium text-ocean-blue bg-mist px-2 py-0.5 rounded-full dark:text-sky-tint dark:bg-night-border">
                  Hari ini
                </span>
              )}
            </h3>
          </div>

          {/* Agenda */}
          <div className="mb-5">
            <h4 className="inline-flex items-center gap-1.5 text-deep-navy text-sm font-semibold mb-2 dark:text-slate-100">
              <CalendarClock size={15} className="text-ocean-blue dark:text-sky-tint" />
              Agenda
            </h4>
            <DailyNotesEditor
              withTime
              capitalize="title"
              notes={selectedAgenda}
              onAdd={(text, time) => setData((prev) => addNote(prev, 'agenda', selectedKey, text, time))}
              onUpdate={(id, text, time) => setData((prev) => updateNote(prev, 'agenda', selectedKey, id, text, time))}
              onDelete={(id) => setData((prev) => deleteNote(prev, 'agenda', selectedKey, id))}
              placeholder="Tambah agenda untuk tanggal ini…"
              emptyText="Belum ada agenda untuk tanggal ini."
            />
          </div>

          {/* Catatan Harian (jurnal) */}
          <div className="border-t border-mist pt-4 dark:border-night-border">
            <h4 className="inline-flex items-center gap-1.5 text-deep-navy text-sm font-semibold mb-2 dark:text-slate-100">
              <NotebookPen size={15} className="text-ocean-blue dark:text-sky-tint" />
              Catatan Harian
            </h4>
            <DailyNotesEditor
              withTime
              defaultTimeNow
              notes={selectedJournal}
              onAdd={(text, time) => setData((prev) => addNote(prev, 'journal', selectedKey, text, time))}
              onUpdate={(id, text, time) => setData((prev) => updateNote(prev, 'journal', selectedKey, id, text, time))}
              onDelete={(id) => setData((prev) => deleteNote(prev, 'journal', selectedKey, id))}
              placeholder="Tulis catatan atau refleksi…"
              emptyText="Belum ada catatan untuk tanggal ini."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
