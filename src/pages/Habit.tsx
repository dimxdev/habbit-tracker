import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, Flame, CalendarDays, ChevronDown, Minus, Archive, RotateCcw } from 'lucide-react';
import useStorage from '../hooks/useStorage';
import type { AppData, Habit as HabitType } from '../types';
import { DEFAULT_DATA } from '../data/defaultData';
import PageHeader from '../components/PageHeader';
import HabitHeatmap from '../components/HabitHeatmap';
import { getDateKey, shiftDateKey, parseDateKey, toTitleCase, formatDateKeyLong } from '../utils/helpers';
import {
  addHabit,
  updateHabit,
  deleteHabit,
  archiveHabit,
  unarchiveHabit,
  activeHabits,
  archivedHabits,
  cycleHabit,
  getHabitCount,
  getHabitTarget,
  getHabitPeriod,
  perDayCap,
  isPeriodComplete,
  computeStreak,
  computeConsistency,
  weeklyProgress,
} from '../utils/habits';

const JS_DAY_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const EMOJI_CHOICES = ['🎯', '💧', '🏃', '📖', '🧘', '💪', '🥗', '😴', '🙏', '✍️', '🎸', '🧹'];
const PERIOD_OPTIONS: { value: 'day' | 'week'; label: string }[] = [
  { value: 'day', label: 'Per hari' },
  { value: 'week', label: 'Per minggu' },
];

export default function Habit() {
  const [data, setData] = useStorage<AppData>('habbit-tracker-data', DEFAULT_DATA);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<HabitType | null>(null);

  const todayKey = getDateKey();
  const habits = activeHabits(data);
  const archived = archivedHabits(data);
  // 7 hari terakhir, dari yang paling lama ke hari ini
  const last7 = Array.from({ length: 7 }, (_, i) => shiftDateKey(todayKey, -(6 - i)));

  const saveHabit = (name: string, icon: string | undefined, target: number, period: 'day' | 'week') => {
    setData((prev) =>
      editing
        ? updateHabit(prev, editing.id, name, icon, target, period)
        : addHabit(prev, name, icon, target, period)
    );
    setShowModal(false);
    setEditing(null);
  };

  const doneTodayCount = habits.filter((h) => isPeriodComplete(data, h, todayKey)).length;

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
              onCycle={(key) => setData((prev) => cycleHabit(prev, key, habit))}
              onEdit={() => { setEditing(habit); setShowModal(true); }}
              onArchive={() => setData((prev) => archiveHabit(prev, habit.id))}
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

        {archived.length > 0 && (
          <ArchiveSection
            archived={archived}
            onRestore={(id) => setData((prev) => unarchiveHabit(prev, id))}
            onDelete={(id) => setData((prev) => deleteHabit(prev, id))}
          />
        )}
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
  onCycle,
  onEdit,
  onArchive,
}: {
  data: AppData;
  habit: HabitType;
  todayKey: string;
  last7: string[];
  onCycle: (dateKey: string) => void;
  onEdit: () => void;
  onArchive: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const yesterdayKey = shiftDateKey(todayKey, -1);

  const period = getHabitPeriod(habit);
  const target = getHabitTarget(habit);
  const cap = perDayCap(habit);
  const isWeekly = period === 'week';

  const streak = computeStreak(data, habit, todayKey);
  const streakUnit = isWeekly ? 'minggu' : 'hari';

  // Bar progres: habit mingguan -> progres minggu ini; harian -> konsistensi 30 hari
  const week = weeklyProgress(data, habit, todayKey);
  const barPercent = isWeekly ? week.percent : computeConsistency(data, habit, todayKey);
  const barLabel = isWeekly ? `${week.done}/${target} minggu ini` : `${barPercent}%`;

  // Keterangan target (chip)
  const targetLabel = isWeekly
    ? `${target}× / minggu`
    : target > 1
      ? `${target}× / hari`
      : null;

  return (
    <div className="bg-white rounded-2xl border border-mist p-4 md:p-5 shadow-sm dark:bg-night-soft dark:border-night-border">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xl shrink-0">{habit.icon || '🎯'}</span>
          <div className="min-w-0">
            <h3 className="text-deep-navy font-semibold text-sm md:text-base truncate dark:text-slate-100">
              {habit.name}
            </h3>
            {targetLabel && (
              <span className="text-[11px] font-medium text-ocean-blue dark:text-sky-tint">
                {targetLabel}
              </span>
            )}
          </div>
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
            aria-label="Arsipkan habit"
            onClick={() => setConfirming(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-ocean-blue hover:bg-mist transition-colors dark:hover:text-sky-tint dark:hover:bg-night-border"
          >
            <Archive size={15} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 mb-3">
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-500 shrink-0">
          <Flame size={15} />
          {streak} {streakUnit}
        </span>
        <div className="flex-1 h-2 rounded-full bg-mist overflow-hidden dark:bg-night-border">
          <div
            className="h-full rounded-full bg-ocean-blue dark:bg-sky-tint transition-[width] duration-500"
            style={{ width: `${barPercent}%` }}
          />
        </div>
        <span className="text-xs font-medium text-slate-500 tabular-nums shrink-0 dark:text-slate-400">
          {barLabel}
        </span>
      </div>

      {/* 7-day row — hanya hari ini & kemarin yang bisa diubah; sisanya riwayat */}
      {cap > 1 && (
        <p className="text-[11px] text-slate-400 mb-1 dark:text-slate-500">
          Ketuk lingkaran hari ini untuk menambah (maks {cap}× lalu ulang dari 0).
        </p>
      )}
      <div className="grid grid-cols-7 gap-1">
        {last7.map((key) => {
          const count = getHabitCount(data, key, habit.id);
          const complete = count >= cap;
          const partial = count > 0 && !complete;
          const isToday = key === todayKey;
          const editable = key === todayKey || key === yesterdayKey;
          const dayLabel = JS_DAY_SHORT[parseDateKey(key).getDay()];

          const label = (
            <span
              className={`text-[10px] font-medium ${
                isToday ? 'text-ocean-blue dark:text-sky-tint' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {dayLabel}
            </span>
          );
          const circle = (
            <span
              className={`w-7 h-7 rounded-full grid place-items-center border-2 text-xs font-semibold tabular-nums transition-colors ${
                complete
                  ? 'bg-ocean-blue border-ocean-blue text-white dark:bg-sky-tint dark:border-sky-tint dark:text-night'
                  : partial
                    ? 'bg-ocean-blue/15 border-ocean-blue text-ocean-blue dark:bg-sky-tint/15 dark:border-sky-tint dark:text-sky-tint'
                    : isToday
                      ? 'border-ocean-blue/50 text-transparent dark:border-sky-tint/50'
                      : 'border-mist text-transparent dark:border-night-border'
              }`}
            >
              {cap > 1 ? (partial ? count : complete ? cap : '') : <Check size={14} strokeWidth={3} />}
            </span>
          );

          return editable ? (
            <button
              key={key}
              type="button"
              onClick={() => onCycle(key)}
              aria-label={`Catat ${habit.name} ${isToday ? 'hari ini' : 'kemarin'} (sekarang ${count}${cap > 1 ? ` dari ${cap}` : ''})`}
              className="flex flex-col items-center gap-1 py-1"
            >
              {label}
              {circle}
            </button>
          ) : (
            <div
              key={key}
              title={`${habit.name} pada ${key}: ${count > 0 ? `${count}${cap > 1 ? `/${cap}` : ''}` : 'kosong'}`}
              className="flex flex-col items-center gap-1 py-1 opacity-70"
            >
              {label}
              {circle}
            </div>
          );
        })}
      </div>

      {/* Toggle riwayat heatmap */}
      <button
        type="button"
        onClick={() => setShowHeatmap((v) => !v)}
        aria-expanded={showHeatmap ? 'true' : 'false'}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-ocean-blue transition-colors dark:text-slate-400 dark:hover:text-sky-tint"
      >
        <CalendarDays size={14} />
        {showHeatmap ? 'Sembunyikan riwayat' : 'Lihat riwayat'}
        <ChevronDown
          size={14}
          className={`transition-transform ${showHeatmap ? 'rotate-180' : ''}`}
        />
      </button>

      {showHeatmap && <HabitHeatmap data={data} habit={habit} todayKey={todayKey} />}

      {/* Archive confirm */}
      {confirming && (
        <div className="mt-3 bg-mist/60 border border-mist rounded-xl px-4 py-3 flex items-center justify-between gap-2 dark:bg-night-border/40 dark:border-night-border">
          <p className="text-deep-navy text-sm dark:text-slate-200">
            Arsipkan habit ini? Riwayat tetap disimpan dan bisa dipulihkan.
          </p>
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
              onClick={onArchive}
              className="text-white bg-ocean-blue text-sm px-3 py-1 rounded-lg hover:bg-deep-navy transition-colors"
            >
              Arsipkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ArchiveSection({
  archived,
  onRestore,
  onDelete,
}: {
  archived: HabitType[];
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-2xl border border-mist shadow-sm dark:bg-night-soft dark:border-night-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open ? 'true' : 'false'}
        className="w-full flex items-center justify-between gap-2 px-4 py-3.5"
      >
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-deep-navy dark:text-slate-100">
          <Archive size={16} className="text-slate-400 dark:text-slate-500" />
          Arsip ({archived.length})
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform dark:text-slate-500 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul className="border-t border-mist px-4 py-2 space-y-1 dark:border-night-border">
          {archived.map((h) => (
            <li key={h.id} className="py-2">
              <div className="flex items-center gap-3">
                <span className="text-lg shrink-0 opacity-70">{h.icon || '🎯'}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-deep-navy truncate dark:text-slate-100">
                    {h.name}
                  </p>
                  {h.archivedAt && (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      Diarsipkan {formatDateKeyLong(h.archivedAt)}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onRestore(h.id)}
                  className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-ocean-blue border border-sky-tint px-2.5 py-1.5 rounded-lg hover:bg-mist transition-colors dark:text-sky-tint dark:hover:bg-night-border"
                >
                  <RotateCcw size={13} />
                  Pulihkan
                </button>
                <button
                  type="button"
                  aria-label="Hapus permanen"
                  onClick={() => setConfirmDelete((cur) => (cur === h.id ? null : h.id))}
                  className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors dark:hover:bg-red-500/10"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {confirmDelete === h.id && (
                <div className="mt-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-center justify-between gap-2 dark:bg-red-500/10 dark:border-red-500/30">
                  <p className="text-red-600 text-xs dark:text-red-400">
                    Hapus permanen beserta seluruh riwayatnya?
                  </p>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(null)}
                      className="text-slate-500 text-xs px-2.5 py-1 border border-slate-300 rounded-lg hover:bg-white transition-colors dark:text-slate-300 dark:border-slate-600 dark:hover:bg-night-border"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => { onDelete(h.id); setConfirmDelete(null); }}
                      className="text-white bg-red-500 text-xs px-2.5 py-1 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
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
  onSave: (name: string, icon: string | undefined, target: number, period: 'day' | 'week') => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? '');
  const [period, setPeriod] = useState<'day' | 'week'>(initial?.period ?? 'day');
  const [target, setTarget] = useState<number>(Math.max(1, Math.floor(initial?.target ?? 1)));
  const [error, setError] = useState('');

  // Batas target: per hari maks 20×, per minggu maks 7 hari
  const maxTarget = period === 'week' ? 7 : 20;
  const clampedTarget = Math.min(target, maxTarget);
  const stepTarget = (delta: number) =>
    setTarget((t) => Math.min(maxTarget, Math.max(1, t + delta)));

  const changePeriod = (p: 'day' | 'week') => {
    setPeriod(p);
    if (p === 'week') setTarget((t) => Math.min(7, t)); // rapikan bila lebih dari 7
  };

  const handleSave = () => {
    if (!name.trim()) { setError('Nama habit wajib diisi.'); return; }
    onSave(toTitleCase(name), icon.trim() || undefined, clampedTarget, period);
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

          {/* Target & periode */}
          <div>
            <label className="text-sm text-slate-500 mb-1.5 block dark:text-slate-400">
              Target
            </label>
            <div className="flex rounded-xl border border-mist p-1 mb-2.5 dark:border-night-border">
              {PERIOD_OPTIONS.map((opt) => {
                const active = period === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => changePeriod(opt.value)}
                    aria-pressed={active ? 'true' : 'false'}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-ocean-blue text-white'
                        : 'text-slate-500 hover:bg-mist dark:text-slate-400 dark:hover:bg-night-border'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-xl border border-mist dark:border-night-border">
                <button
                  type="button"
                  onClick={() => stepTarget(-1)}
                  disabled={clampedTarget <= 1}
                  aria-label="Kurangi target"
                  className="p-2.5 text-deep-navy disabled:opacity-30 hover:text-ocean-blue dark:text-slate-100 dark:hover:text-sky-tint"
                >
                  <Minus size={16} />
                </button>
                <span className="w-10 text-center text-deep-navy font-semibold tabular-nums dark:text-slate-100">
                  {clampedTarget}
                </span>
                <button
                  type="button"
                  onClick={() => stepTarget(1)}
                  disabled={clampedTarget >= maxTarget}
                  aria-label="Tambah target"
                  className="p-2.5 text-deep-navy disabled:opacity-30 hover:text-ocean-blue dark:text-slate-100 dark:hover:text-sky-tint"
                >
                  <Plus size={16} />
                </button>
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {period === 'day'
                  ? clampedTarget > 1 ? `kali setiap hari` : `kali sehari (habit biasa)`
                  : `hari berbeda tiap minggu`}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 dark:text-slate-500">
              {period === 'day'
                ? 'Contoh: Sholat → 5 kali setiap hari.'
                : 'Contoh: Olahraga → 3 hari berbeda tiap minggu.'}
            </p>
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
