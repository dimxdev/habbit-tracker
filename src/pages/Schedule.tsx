import { useState } from 'react';
import { Pencil, Trash2, Copy, Plus, AlertTriangle } from 'lucide-react';
import useStorage from '../hooks/useStorage';
import type { AppData, DayKey, TimeSlot } from '../types';
import { DEFAULT_DATA } from '../data/defaultData';
import PageHeader from '../components/PageHeader';
import { DAY_KEYS, DAY_LABELS, DAY_SHORT, getTodayKey, generateId } from '../utils/helpers';

export default function Schedule() {
  const [data, setData] = useStorage<AppData>('habbit-tracker-data', DEFAULT_DATA);
  const [selectedDay, setSelectedDay] = useState<DayKey>(getTodayKey());
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [conflictInfo, setConflictInfo] = useState<{
    sourceDay: DayKey;
    conflicts: Array<{ src: TimeSlot; existing: TimeSlot }>;
  } | null>(null);

  const slots = [...(data.schedule[selectedDay] ?? [])].sort((a, b) =>
    a.start.localeCompare(b.start)
  );

  const saveSlot = (slot: TimeSlot) => {
    setData((prev) => {
      const existing = prev.schedule[selectedDay];
      const updated = editingSlot
        ? existing.map((s) => (s.id === slot.id ? slot : s))
        : [...existing, slot];
      return { ...prev, schedule: { ...prev.schedule, [selectedDay]: updated } };
    });
    setShowSlotModal(false);
    setEditingSlot(null);
  };

  const deleteSlot = (id: string) => {
    setData((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [selectedDay]: prev.schedule[selectedDay].filter((s) => s.id !== id),
      },
    }));
    setDeleteConfirmId(null);
  };

  // Eksekusi copy — full replace
  const executeCopy = (sourceDay: DayKey) => {
    const sourceSlots = data.schedule[sourceDay].map((s) => ({
      ...s,
      id: generateId(),
    }));
    setData((prev) => ({
      ...prev,
      schedule: { ...prev.schedule, [selectedDay]: sourceSlots },
    }));
    setConflictInfo(null);
    setShowCopyModal(false);
  };

  // Request copy — cek konflik dulu
  const handleCopyRequest = (sourceDay: DayKey) => {
    const sourceSlots = data.schedule[sourceDay];
    const targetSlots = data.schedule[selectedDay];

    const conflicts: Array<{ src: TimeSlot; existing: TimeSlot }> = [];
    for (const src of sourceSlots) {
      for (const existing of targetSlots) {
        const overlaps = src.start < existing.end && src.end > existing.start;
        const identical = src.start === existing.start && src.end === existing.end;
        if (overlaps && !identical) {
          // hindari duplikat pasangan yang sama
          const alreadyAdded = conflicts.some(
            (c) => c.src.id === src.id && c.existing.id === existing.id
          );
          if (!alreadyAdded) conflicts.push({ src, existing });
        }
      }
    }

    if (conflicts.length > 0) {
      setShowCopyModal(false);
      setConflictInfo({ sourceDay, conflicts });
    } else {
      executeCopy(sourceDay);
    }
  };

  return (
    <div>
      <PageHeader title="Atur Jadwal" subtitle="Kelola jadwal mingguan kamu" />

      <div className="px-4 md:px-8 -mt-5 space-y-4">
        {/* Day Tabs */}
        <div className="bg-white rounded-2xl border border-mist p-2 shadow-sm dark:bg-night-soft dark:border-night-border">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none md:grid md:grid-cols-7 md:gap-1">
            {DAY_KEYS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`shrink-0 md:shrink px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedDay === day
                    ? 'bg-ocean-blue text-white'
                    : 'text-slate-500 hover:bg-mist dark:text-slate-400 dark:hover:bg-night-border'
                }`}
              >
                {DAY_SHORT[day]}
              </button>
            ))}
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-deep-navy font-semibold text-base md:text-lg dark:text-slate-100">
            {DAY_LABELS[selectedDay]}
          </h2>
          <button
            type="button"
            onClick={() => setShowCopyModal(true)}
            className="inline-flex items-center gap-1.5 border border-sky-tint text-ocean-blue text-sm font-medium px-3 py-1.5 rounded-xl hover:bg-mist transition-colors dark:text-sky-tint dark:hover:bg-night-border"
          >
            <Copy size={15} />
            <span className="hidden sm:inline">Copy dari hari lain</span>
            <span className="sm:hidden">Copy</span>
          </button>
        </div>

        {/* Slot List */}
        {slots.length === 0 ? (
          <div className="bg-white rounded-2xl border border-mist p-8 md:p-12 text-center dark:bg-night-soft dark:border-night-border">
            <p className="text-slate-400 text-sm dark:text-slate-500">Belum ada jadwal untuk hari ini.</p>
          </div>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {slots.map((slot) => (
              <div key={slot.id} className="space-y-1.5">
                <div className="bg-white border border-mist rounded-xl px-4 py-3 flex items-center justify-between gap-3 hover:border-sky-tint transition-colors dark:bg-night-soft dark:border-night-border dark:hover:border-sky-tint">
                  <div className="min-w-0">
                    <p className="text-ocean-blue text-sm font-medium whitespace-nowrap dark:text-sky-tint">
                      {slot.start} – {slot.end}
                    </p>
                    <p className="text-deep-navy text-sm truncate dark:text-slate-100">{slot.activity || '—'}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      aria-label="Edit slot"
                      onClick={() => { setEditingSlot(slot); setShowSlotModal(true); }}
                      className="p-2 rounded-lg text-slate-400 hover:text-ocean-blue hover:bg-mist transition-colors dark:hover:text-sky-tint dark:hover:bg-night-border"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label="Hapus slot"
                      onClick={() => setDeleteConfirmId(slot.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Delete Confirm */}
                {deleteConfirmId === slot.id && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between gap-2 dark:bg-red-500/10 dark:border-red-500/30">
                    <p className="text-red-600 text-sm dark:text-red-400">Hapus slot ini?</p>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(null)}
                        className="text-slate-500 text-sm px-3 py-1 border border-slate-300 rounded-lg hover:bg-white transition-colors dark:text-slate-300 dark:border-slate-600 dark:hover:bg-night-border"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSlot(slot.id)}
                        className="text-white bg-red-500 text-sm px-3 py-1 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Button */}
        <button
          type="button"
          onClick={() => { setEditingSlot(null); setShowSlotModal(true); }}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-ocean-blue text-white font-medium px-5 py-3 rounded-xl hover:bg-deep-navy transition-colors"
        >
          <Plus size={18} />
          Tambah Slot
        </button>
      </div>

      {/* Slot Modal */}
      {showSlotModal && (
        <SlotModal
          initial={editingSlot}
          existingSlots={slots}
          onSave={saveSlot}
          onClose={() => { setShowSlotModal(false); setEditingSlot(null); }}
        />
      )}

      {/* Copy Modal */}
      {showCopyModal && (
        <CopyModal
          currentDay={selectedDay}
          onCopy={handleCopyRequest}
          onClose={() => setShowCopyModal(false)}
        />
      )}

      {/* Conflict Confirmation Modal */}
      {conflictInfo && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-xl dark:bg-night-soft">
            <div className="flex items-start gap-3">
              <span className="grid place-items-center w-10 h-10 rounded-xl bg-amber-100 text-amber-500 shrink-0 dark:bg-amber-500/15">
                <AlertTriangle size={20} />
              </span>
              <div>
                <h3 className="text-deep-navy font-bold text-base dark:text-slate-100">Ada Jadwal Bentrok</h3>
                <p className="text-slate-500 text-sm mt-0.5 dark:text-slate-400">
                  {conflictInfo.conflicts.length} slot dari{' '}
                  <strong>{DAY_LABELS[conflictInfo.sourceDay]}</strong> bertabrakan dengan
                  jadwal <strong>{DAY_LABELS[selectedDay]}</strong>.
                </p>
              </div>
            </div>

            {/* Conflict list */}
            <div className="space-y-1.5 max-h-44 overflow-y-auto">
              {conflictInfo.conflicts.map(({ src, existing }, i) => (
                <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-slate-600 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-slate-300">
                  <span className="font-semibold text-amber-700">{src.start}–{src.end}</span>
                  {src.activity ? ` (${src.activity})` : ''}{' '}
                  <span className="text-slate-400">bentrok dengan</span>{' '}
                  <span className="font-semibold text-red-500">{existing.start}–{existing.end}</span>
                  {existing.activity ? ` (${existing.activity})` : ''}
                </div>
              ))}
            </div>

            <p className="text-slate-500 text-xs dark:text-slate-400">
              Jika tetap copy, semua jadwal <strong>{DAY_LABELS[selectedDay]}</strong> akan diganti.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConflictInfo(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-cloud-white transition-colors dark:border-slate-600 dark:text-slate-300 dark:hover:bg-night-border"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => executeCopy(conflictInfo.sourceDay)}
                className="flex-1 py-2.5 rounded-xl bg-ocean-blue text-white font-medium hover:bg-deep-navy transition-colors"
              >
                Tetap Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Modal Shell ---------- */
function ModalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-24 sm:pb-6 space-y-4 shadow-xl dark:bg-night-soft">
        {children}
      </div>
    </div>
  );
}

/* ---------- Slot Modal ---------- */
function SlotModal({
  initial,
  existingSlots,
  onSave,
  onClose,
}: {
  initial: TimeSlot | null;
  existingSlots: TimeSlot[];
  onSave: (slot: TimeSlot) => void;
  onClose: () => void;
}) {
  const [start, setStart] = useState(initial?.start ?? '');
  const [end, setEnd] = useState(initial?.end ?? '');
  const [activity, setActivity] = useState(initial?.activity ?? '');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!start || !end) { setError('Jam mulai dan selesai wajib diisi.'); return; }
    if (end <= start) { setError('Jam selesai harus lebih besar dari jam mulai.'); return; }

    if (!activity.trim()) { setError('Aktivitas wajib diisi.'); return; }

    const conflict = existingSlots.find(
      (s) => s.id !== initial?.id && start < s.end && end > s.start
    );
    if (conflict) {
      setError(`Bentrok dengan slot ${conflict.start}–${conflict.end}${conflict.activity ? ` (${conflict.activity})` : ''}.`);
      return;
    }

    const titleCase = activity.trim().replace(/\b\w/g, (c) => c.toUpperCase());
    onSave({ id: initial?.id ?? generateId(), start, end, activity: titleCase });
  };

  return (
    <ModalShell>
      <h2 className="text-deep-navy text-lg font-bold dark:text-slate-100">
        {initial ? 'Edit Slot' : 'Tambah Slot'}
      </h2>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="slot-start" className="text-sm text-slate-500 mb-1 block dark:text-slate-400">Jam Mulai</label>
            <input
              id="slot-start"
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full border border-mist rounded-xl px-3 py-2.5 text-deep-navy focus:outline-none focus:border-ocean-blue focus:ring-2 focus:ring-sky-tint/30 dark:border-night-border dark:bg-night dark:text-slate-100 dark:scheme-dark"
            />
          </div>
          <div>
            <label htmlFor="slot-end" className="text-sm text-slate-500 mb-1 block dark:text-slate-400">Jam Selesai</label>
            <input
              id="slot-end"
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full border border-mist rounded-xl px-3 py-2.5 text-deep-navy focus:outline-none focus:border-ocean-blue focus:ring-2 focus:ring-sky-tint/30 dark:border-night-border dark:bg-night dark:text-slate-100 dark:scheme-dark"
            />
          </div>
        </div>
        <div>
          <label htmlFor="slot-activity" className="text-sm text-slate-500 mb-1 block dark:text-slate-400">Aktivitas</label>
          <input
            id="slot-activity"
            type="text"
            placeholder="Contoh: Olahraga, Belajar"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            className="w-full border border-mist rounded-xl px-4 py-2.5 text-deep-navy placeholder:text-slate-300 focus:outline-none focus:border-ocean-blue focus:ring-2 focus:ring-sky-tint/30 dark:border-night-border dark:bg-night dark:text-slate-100 dark:placeholder:text-slate-600"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-cloud-white transition-colors dark:border-slate-600 dark:text-slate-300 dark:hover:bg-night-border"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 py-3 rounded-xl bg-ocean-blue text-white font-medium hover:bg-deep-navy transition-colors"
        >
          Simpan
        </button>
      </div>
    </ModalShell>
  );
}

/* ---------- Copy Modal ---------- */
function CopyModal({
  currentDay,
  onCopy,
  onClose,
}: {
  currentDay: DayKey;
  onCopy: (day: DayKey) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<DayKey | null>(null);

  const otherDays = DAY_KEYS.filter((d) => d !== currentDay);

  return (
    <ModalShell>
      <h2 className="text-deep-navy text-lg font-bold dark:text-slate-100">Copy Jadwal Dari</h2>

      <div className="grid grid-cols-2 gap-2">
        {otherDays.map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => setSelected(day)}
            className={`text-left px-4 py-3 rounded-xl border transition-colors ${
              selected === day
                ? 'border-ocean-blue bg-blue-50 text-ocean-blue font-medium dark:bg-ocean-blue/15 dark:text-sky-tint'
                : 'border-mist text-deep-navy hover:bg-cloud-white dark:border-night-border dark:text-slate-100 dark:hover:bg-night-border'
            }`}
          >
            {DAY_LABELS[day]}
          </button>
        ))}
      </div>

      {selected && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Jadwal <strong>{DAY_LABELS[currentDay]}</strong> akan diganti dengan jadwal{' '}
          <strong>{DAY_LABELS[selected]}</strong>.
        </p>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-cloud-white transition-colors dark:border-slate-600 dark:text-slate-300 dark:hover:bg-night-border"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={() => selected && onCopy(selected)}
          disabled={!selected}
          className="flex-1 py-3 rounded-xl bg-ocean-blue text-white font-medium hover:bg-deep-navy transition-colors disabled:opacity-40 disabled:hover:bg-ocean-blue"
        >
          Copy
        </button>
      </div>
    </ModalShell>
  );
}
