import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, Flame } from 'lucide-react';
import useStorage from '../hooks/useStorage';
import type { AppData, Habit as HabitType } from '../types';
import { DEFAULT_DATA } from '../data/defaultData';
import PageHeader from '../components/PageHeader';
import { getDateKey, shiftDateKey, parseDateKey, toTitleCase } from '../utils/helpers';
import {
  addHabit,
  updateHabit,
  deleteHabit,
  isHabitDone,
  toggleHabit,
  computeStreak,
  computeConsistency,
} from '../utils/habits';

const JS_DAY_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const EMOJI_CHOICES = ['🎯', '💧', '🏃', '📖', '🧘', '💪', '🥗', '😴', '🙏', '✍️', '🎸', '🧹'];

export default function Habit() {
  const [data, setData] = useStorage<AppData>('habbit-tracker-data', DEFAULT_DATA);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<HabitType | null>(null);

  const todayKey = getDateKey();
  const habits = data.habits ?? [];
  // 7 hari terakhir, dari yang paling lama ke hari ini
  const last7 = Array.from({ length: 7 }, (_, i) => shiftDateKey(todayKey, -(6 - i)));

  const saveHabit = (name: string, icon?: string) => {
    setData((prev) =>
      editing ? updateHabit(prev, editing.id, name, icon) : addHabit(prev, name, icon)
    );
    setShowModal(false);
    setEditing(null);
  };

  const toggle = (habitId: string, dateKey: string) =>
    setData((prev) => toggleHabit(prev, dateKey, habitId));

  const doneTodayCount = habits.filter((h) => isHabitDone(data, todayKey, h.id)).length;

  return (
    <div>
      <PageHeader
        title="Habit"
        subtitle="Bangun kebiasaan, jaga streak-nya"
        right={
          habits.length > 0 ? (
            <div className="text-right">
              <p className="text-white text-2xl font-bold leading-none">
                {doneTodayCount}/{habits.length}
              </p>
              <p className="text-sky-tint text-xs mt-1">selesai hari ini</p>
            </div>
          ) : undefined
        }
      />

      <div className="px-4 md:px-8 -mt-5 space-y-3">
        {habits.length === 0 ? (
          <div className="bg-white rounded-2xl border border-mist p-8 md:p-12 flex flex-col items-center text-center gap-3 dark:bg-night-soft dark:border-night-border">
            <span className="text-4xl">🎯</span>
            <p className="text-slate-400 text-sm dark:text-slate-500">
              Belum ada habit. Tambah kebiasaan pertamamu!
            </p>
          </div>
        ) : (
          habits.map((habit) => (
            <HabitCard
              key={habit.id}
              data={data}
              habit={habit}
              todayKey={todayKey}
              last7={last7}
              onToggle={toggle}
              onEdit={() => { setEditing(habit); setShowModal(true); }}
              onDelete={() => setData((prev) => deleteHabit(prev, habit.id))}
            />
          ))
        )}

        <button
          type="button"
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-ocean-blue text-white font-medium px-5 py-3 rounded-xl hover:bg-deep-navy transition-colors"
        >
          <Plus size={18} />
          Tambah Habit
        </button>
      </div>

      {showModal && (
        <HabitModal
          initial={editing}
          onSave={saveHabit}
          onClose={() => { setShowModal(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function HabitCard({
  data,
  habit,
  todayKey,
  last7,
  onToggle,
  onEdit,
  onDelete,
}: {
  data: AppData;
  habit: HabitType;
  todayKey: string;
  last7: string[];
  onToggle: (habitId: string, dateKey: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const streak = computeStreak(data, habit.id, todayKey);
  const consistency = computeConsistency(data, habit, todayKey);

  return (
    <div className="bg-white rounded-2xl border border-mist p-4 md:p-5 shadow-sm dark:bg-night-soft dark:border-night-border">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xl shrink-0">{habit.icon || '🎯'}</span>
          <h3 className="text-deep-navy font-semibold text-sm md:text-base truncate dark:text-slate-100">
            {habit.name}
          </h3>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            type="button"
            aria-label="Edit habit"
            onClick={onEdit}
            className="p-1.5 rounded-lg text-slate-400 hover:text-ocean-blue hover:bg-mist transition-colors dark:hover:text-sky-tint dark:hover:bg-night-border"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            aria-label="Hapus habit"
            onClick={() => setConfirming(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors dark:hover:bg-red-500/10"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 mb-3">
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-500 shrink-0">
          <Flame size={15} />
          {streak} hari
        </span>
        <div className="flex-1 h-2 rounded-full bg-mist overflow-hidden dark:bg-night-border">
          <div
            className="h-full rounded-full bg-ocean-blue dark:bg-sky-tint transition-[width] duration-500"
            style={{ width: `${consistency}%` }}
          />
        </div>
        <span className="text-xs font-medium text-slate-500 tabular-nums shrink-0 dark:text-slate-400">
          {consistency}%
        </span>
      </div>

      {/* 7-day row */}
      <div className="grid grid-cols-7 gap-1">
        {last7.map((key) => {
          const done = isHabitDone(data, key, habit.id);
          const isToday = key === todayKey;
          const dayLabel = JS_DAY_SHORT[parseDateKey(key).getDay()];
          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggle(habit.id, key)}
              aria-label={`${done ? 'Batalkan' : 'Tandai'} ${habit.name} pada ${key}`}
              className="flex flex-col items-center gap-1 py-1"
            >
              <span
                className={`text-[10px] font-medium ${
                  isToday ? 'text-ocean-blue dark:text-sky-tint' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {dayLabel}
              </span>
              <span
                className={`w-7 h-7 rounded-full grid place-items-center border-2 transition-colors ${
                  done
                    ? 'bg-ocean-blue border-ocean-blue text-white dark:bg-sky-tint dark:border-sky-tint dark:text-night'
                    : isToday
                      ? 'border-ocean-blue/50 text-transparent dark:border-sky-tint/50'
                      : 'border-mist text-transparent dark:border-night-border'
                }`}
              >
                <Check size={14} strokeWidth={3} />
              </span>
            </button>
          );
        })}
      </div>

      {/* Delete confirm */}
      {confirming && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between gap-2 dark:bg-red-500/10 dark:border-red-500/30">
          <p className="text-red-600 text-sm dark:text-red-400">Hapus habit ini beserta riwayatnya?</p>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="text-slate-500 text-sm px-3 py-1 border border-slate-300 rounded-lg hover:bg-white transition-colors dark:text-slate-300 dark:border-slate-600 dark:hover:bg-night-border"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="text-white bg-red-500 text-sm px-3 py-1 rounded-lg hover:bg-red-600 transition-colors"
            >
              Hapus
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function HabitModal({
  initial,
  onSave,
  onClose,
}: {
  initial: HabitType | null;
  onSave: (name: string, icon?: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? '');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!name.trim()) { setError('Nama habit wajib diisi.'); return; }
    onSave(toTitleCase(name), icon.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-24 sm:pb-6 space-y-4 shadow-xl dark:bg-night-soft">
        <h2 className="text-deep-navy text-lg font-bold dark:text-slate-100">
          {initial ? 'Edit Habit' : 'Tambah Habit'}
        </h2>

        <div className="space-y-3">
          <div>
            <label htmlFor="habit-name" className="text-sm text-slate-500 mb-1 block dark:text-slate-400">
              Nama Habit
            </label>
            <input
              id="habit-name"
              type="text"
              autoFocus
              placeholder="Contoh: Minum air 8 gelas"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              className="w-full border border-mist rounded-xl px-4 py-2.5 text-deep-navy placeholder:text-slate-300 focus:outline-none focus:border-ocean-blue focus:ring-2 focus:ring-sky-tint/30 dark:border-night-border dark:bg-night dark:text-slate-100 dark:placeholder:text-slate-600"
            />
          </div>

          <div>
            <label className="text-sm text-slate-500 mb-1.5 block dark:text-slate-400">
              Ikon <span className="text-slate-400 font-normal dark:text-slate-500">(opsional)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_CHOICES.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setIcon((cur) => (cur === e ? '' : e))}
                  className={`w-9 h-9 rounded-lg text-lg grid place-items-center border transition-colors ${
                    icon === e
                      ? 'border-ocean-blue bg-blue-50 dark:bg-ocean-blue/20 dark:border-sky-tint'
                      : 'border-mist hover:bg-cloud-white dark:border-night-border dark:hover:bg-night-border'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
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
      </div>
    </div>
  );
}
