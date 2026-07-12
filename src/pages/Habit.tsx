import { useState, useRef, useLayoutEffect } from 'react';
import { Plus, Pencil, Trash2, Check, Flame, CalendarDays, ChevronDown, Minus, Archive, RotateCcw, GripVertical, Thermometer } from 'lucide-react';
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
  sortByTodayCompletion,
  reorderActiveHabits,
  isHabitExcused,
  toggleHabitExcused,
  isSettledToday,
} from '../utils/habits';

const JS_DAY_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const EMOJI_CHOICES = ['🎯', '💧', '🏃', '📖', '🧘', '💪', '🥗', '😴', '🙏', '✍️', '🎸', '🧹'];
const PERIOD_OPTIONS: { value: 'day' | 'week'; label: string }[] = [
  { value: 'day', label: 'Per hari' },
  { value: 'week', label: 'Per minggu' },
];

// Ambil satu "karakter tampak" pertama (grapheme) — supaya emoji gabungan
// seperti ✍️ atau 👨‍👩‍👧 tidak terpotong.
const firstEmoji = (value: string): string => {
  const t = value.trim();
  if (!t) return '';
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const seg = new Intl.Segmenter('id', { granularity: 'grapheme' });
    const first = seg.segment(t)[Symbol.iterator]().next();
    if (!first.done && first.value) return first.value.segment;
  }
  return Array.from(t)[0] ?? '';
};

export default function Habit() {
  const [data, setData] = useStorage<AppData>('habbit-tracker-data', DEFAULT_DATA);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<HabitType | null>(null);

  const todayKey = getDateKey();
  // Urutan dasar mengikuti urutan kustom hasil drag & drop, dengan yang
  // sudah tercatat penuh hari ini turun ke bawah.
  const habits = sortByTodayCompletion(data, activeHabits(data), todayKey);
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
          <div className="glass-card p-8 md:p-12 flex flex-col items-center text-center gap-3">
            <span className="text-4xl">🎯</span>
            <p className="text-slate-400 text-sm dark:text-slate-500">
              Belum ada habit. Tambah kebiasaan pertamamu!
            </p>
          </div>
        ) : (
          <HabitList
            habits={habits}
            data={data}
            todayKey={todayKey}
            last7={last7}
            onCycle={(habit, key) => setData((prev) => cycleHabit(prev, key, habit))}
            onToggleExcused={(habit) => setData((prev) => toggleHabitExcused(prev, todayKey, habit.id))}
            onEdit={(habit) => { setEditing(habit); setShowModal(true); }}
            onArchive={(habit) => setData((prev) => archiveHabit(prev, habit.id))}
            onDelete={(habit) => setData((prev) => deleteHabit(prev, habit.id))}
            onReorder={(orderedIds) => setData((prev) => reorderActiveHabits(prev, orderedIds))}
          />
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

// Daftar habit dengan drag & drop untuk mengurutkan ulang (via handle grip).
// Hanya habit yang belum selesai hari ini yang bisa diseret — yang sudah
// selesai otomatis turun ke bawah dan urutannya tidak relevan untuk hari ini.
// Perpindahan (baik dari drag maupun dari auto-sink saat dicentang) dianimasikan
// dengan teknik FLIP: ukur posisi lama, lalu geser mundur & animasikan ke posisi baru.
function HabitList({
  habits,
  data,
  todayKey,
  last7,
  onCycle,
  onToggleExcused,
  onEdit,
  onArchive,
  onDelete,
  onReorder,
}: {
  habits: HabitType[];
  data: AppData;
  todayKey: string;
  last7: string[];
  onCycle: (habit: HabitType, dateKey: string) => void;
  onToggleExcused: (habit: HabitType) => void;
  onEdit: (habit: HabitType) => void;
  onArchive: (habit: HabitType) => void;
  onDelete: (habit: HabitType) => void;
  onReorder: (orderedActiveIds: string[]) => void;
}) {
  const baseOrder = habits.map((h) => h.id);
  const habitMap = new Map(habits.map((h) => [h.id, h]));
  const pendingCount = habits.filter((h) => !isSettledToday(data, h, todayKey)).length;

  const [liveOrder, setLiveOrder] = useState<string[] | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const itemRefs = useRef(new Map<string, HTMLDivElement>()).current;
  const dragInfo = useRef<{ startClientY: number; startTop: number; height: number } | null>(null);
  const prevRects = useRef(new Map<string, DOMRect>()).current;

  const order = liveOrder ?? baseOrder;

  // FLIP: setiap kali urutan berubah (drag atau auto-sink), geser item yang
  // bukan sedang diseret dari posisi lamanya lalu animasikan ke posisi baru.
  useLayoutEffect(() => {
    const nextRects = new Map<string, DOMRect>();
    itemRefs.forEach((el, id) => {
      if (id === draggingId) return;
      nextRects.set(id, el.getBoundingClientRect());
    });
    nextRects.forEach((rect, id) => {
      const before = prevRects.get(id);
      if (!before) return;
      const dy = before.top - rect.top;
      if (Math.abs(dy) < 0.5) return;
      const el = itemRefs.get(id);
      if (!el) return;
      el.style.transition = 'none';
      el.style.transform = `translateY(${dy}px)`;
      el.getBoundingClientRect(); // paksa reflow
      requestAnimationFrame(() => {
        el.style.transition = 'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)';
        el.style.transform = '';
      });
    });
    prevRects.clear();
    nextRects.forEach((rect, id) => prevRects.set(id, rect));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.join('|')]);

  const startDrag = (habit: HabitType) => (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const el = itemRefs.get(habit.id);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragInfo.current = { startClientY: e.clientY, startTop: rect.top, height: rect.height };
    setLiveOrder(baseOrder);
    setDraggingId(habit.id);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(10); } catch { /* noop */ }
    }
  };

  const moveDrag = (habit: HabitType) => (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragInfo.current || draggingId !== habit.id) return;
    e.preventDefault();
    const deltaY = e.clientY - dragInfo.current.startClientY;
    const el = itemRefs.get(habit.id);
    if (el) el.style.transform = `translateY(${deltaY}px) scale(1.02)`;

    const centerY = dragInfo.current.startTop + deltaY + dragInfo.current.height / 2;
    const currentOrder = liveOrder ?? baseOrder;
    const others = currentOrder.filter((id) => id !== habit.id);

    let idx = 0;
    for (const id of others) {
      const otherEl = itemRefs.get(id);
      if (!otherEl) continue;
      const rect = otherEl.getBoundingClientRect();
      if (centerY > rect.top + rect.height / 2) idx++;
    }
    // Tidak boleh diseret melewati zona habit yang sudah selesai hari ini
    const maxIdx = Math.max(0, pendingCount - 1);
    idx = Math.min(idx, maxIdx);

    const next = [...others];
    next.splice(idx, 0, habit.id);
    if (next.join('|') !== currentOrder.join('|')) setLiveOrder(next);
  };

  const endDrag = (habit: HabitType) => () => {
    const el = itemRefs.get(habit.id);
    if (el) {
      el.style.transition = 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)';
      el.style.transform = '';
    }
    if (liveOrder && liveOrder.join('|') !== baseOrder.join('|')) {
      onReorder(liveOrder);
    }
    dragInfo.current = null;
    setDraggingId(null);
    setLiveOrder(null);
  };

  return (
    <div className="space-y-3">
      {order.map((id) => {
        const habit = habitMap.get(id);
        if (!habit) return null;
        const isPending = !isSettledToday(data, habit, todayKey);
        const isDragging = draggingId === habit.id;
        return (
          <HabitCard
            key={habit.id}
            cardRef={(el) => { if (el) itemRefs.set(habit.id, el); else itemRefs.delete(habit.id); }}
            isDragging={isDragging}
            draggable={isPending}
            dragHandleProps={{
              onPointerDown: startDrag(habit),
              onPointerMove: moveDrag(habit),
              onPointerUp: endDrag(habit),
              onPointerCancel: endDrag(habit),
            }}
            data={data}
            habit={habit}
            todayKey={todayKey}
            last7={last7}
            onCycle={(key) => onCycle(habit, key)}
            onToggleExcused={() => onToggleExcused(habit)}
            onEdit={() => onEdit(habit)}
            onArchive={() => onArchive(habit)}
            onDelete={() => onDelete(habit)}
          />
        );
      })}
    </div>
  );
}

function HabitCard({
  cardRef,
  isDragging,
  draggable,
  dragHandleProps,
  data,
  habit,
  todayKey,
  last7,
  onCycle,
  onToggleExcused,
  onEdit,
  onArchive,
  onDelete,
}: {
  cardRef?: (el: HTMLDivElement | null) => void;
  isDragging?: boolean;
  draggable?: boolean;
  dragHandleProps?: {
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => void;
    onPointerMove: (e: React.PointerEvent<HTMLButtonElement>) => void;
    onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => void;
    onPointerCancel: (e: React.PointerEvent<HTMLButtonElement>) => void;
  };
  data: AppData;
  habit: HabitType;
  todayKey: string;
  last7: string[];
  onCycle: (dateKey: string) => void;
  onToggleExcused: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState<'archive' | 'delete' | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const yesterdayKey = shiftDateKey(todayKey, -1);

  // Sel yang barusan diketuk → hanya sel itu yang dapat animasi pop.
  // `n` naik tiap ketukan supaya animasi replay walau sel sama diketuk lagi.
  const [pop, setPop] = useState<{ key: string; n: number } | null>(null);

  const period = getHabitPeriod(habit);
  const target = getHabitTarget(habit);
  const cap = perDayCap(habit);
  const isWeekly = period === 'week';

  const streak = computeStreak(data, habit, todayKey);
  const streakUnit = isWeekly ? 'minggu' : 'hari';
  const excusedToday = isHabitExcused(data, todayKey, habit.id);

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
    <div
      ref={cardRef}
      style={isDragging ? { zIndex: 30, boxShadow: '0 24px 48px -12px rgba(10,37,64,0.35)' } : undefined}
      className="glass-card p-4 md:p-5 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-1.5 min-w-0">
          {draggable && dragHandleProps && (
            <button
              type="button"
              aria-label={`Seret untuk mengurutkan ${habit.name}`}
              onPointerDown={dragHandleProps.onPointerDown}
              onPointerMove={dragHandleProps.onPointerMove}
              onPointerUp={dragHandleProps.onPointerUp}
              onPointerCancel={dragHandleProps.onPointerCancel}
              className="shrink-0 -ml-1 p-1.5 rounded-lg text-slate-300 touch-none cursor-grab active:cursor-grabbing hover:text-slate-500 hover:bg-mist transition-colors dark:text-slate-600 dark:hover:text-slate-400 dark:hover:bg-night-border"
            >
              <GripVertical size={16} />
            </button>
          )}
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
            onClick={() => setConfirming('archive')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-ocean-blue hover:bg-mist transition-colors dark:hover:text-sky-tint dark:hover:bg-night-border"
          >
            <Archive size={15} />
          </button>
          <button
            type="button"
            aria-label="Hapus habit"
            onClick={() => setConfirming('delete')}
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
          const excused = isHabitExcused(data, key, habit.id);
          const isToday = key === todayKey;
          const editable = key === todayKey || key === yesterdayKey;
          const dayLabel = JS_DAY_SHORT[parseDateKey(key).getDay()];
          // Pop hanya untuk sel yang barusan diketuk (bukan saat halaman dimuat)
          const shouldPop = pop?.key === key && count > 0;

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
              // key berubah tiap ketukan → animasi pop replay
              key={shouldPop ? pop.n : 0}
              className={`w-7 h-7 rounded-full grid place-items-center border-2 text-xs font-semibold tabular-nums transition-colors ${
                shouldPop ? 'anim-pop ' : ''
              }${
                excused
                  ? 'bg-amber-400 border-amber-400 text-white dark:bg-amber-500 dark:border-amber-500'
                  : complete
                    ? 'bg-ocean-blue border-ocean-blue text-white dark:bg-sky-tint dark:border-sky-tint dark:text-night'
                    : partial
                      ? 'bg-ocean-blue/15 border-ocean-blue text-ocean-blue dark:bg-sky-tint/15 dark:border-sky-tint dark:text-sky-tint'
                      : isToday
                        ? 'border-ocean-blue/50 text-transparent dark:border-sky-tint/50'
                        : 'border-mist text-transparent dark:border-night-border'
              }`}
            >
              {excused ? (
                <Thermometer size={13} strokeWidth={2.5} />
              ) : cap > 1 ? (
                partial ? count : complete ? cap : ''
              ) : (
                <Check size={14} strokeWidth={3} />
              )}
            </span>
          );

          const cellStatus = excused
            ? 'sakit/berhalangan'
            : count > 0
              ? `${count}${cap > 1 ? `/${cap}` : ''}`
              : 'kosong';

          return editable ? (
            <button
              key={key}
              type="button"
              onClick={() => {
                onCycle(key);
                setPop((p) => ({ key, n: (p?.n ?? 0) + 1 }));
              }}
              aria-label={`Catat ${habit.name} ${isToday ? 'hari ini' : 'kemarin'} (sekarang ${cellStatus})`}
              className="flex flex-col items-center gap-1 py-1"
            >
              {label}
              {circle}
            </button>
          ) : (
            <div
              key={key}
              title={`${habit.name} pada ${key}: ${cellStatus}`}
              className="flex flex-col items-center gap-1 py-1 opacity-70"
            >
              {label}
              {circle}
            </div>
          );
        })}
      </div>

      {/* Aksi kartu: masing-masing di barisnya sendiri biar rapi */}
      <div className="mt-3 flex flex-col items-start gap-2">
        {/* Tandai sakit/berhalangan hari ini — streak tidak putus, tapi juga tidak bertambah */}
        <button
          type="button"
          onClick={onToggleExcused}
          aria-pressed={excusedToday ? 'true' : 'false'}
          className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${
            excusedToday
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400'
          }`}
        >
          <Thermometer size={14} />
          {excusedToday ? 'Batalkan tanda sakit hari ini' : 'Sakit/berhalangan hari ini?'}
        </button>

        {/* Toggle riwayat heatmap */}
        <button
          type="button"
          onClick={() => setShowHeatmap((v) => !v)}
          aria-expanded={showHeatmap ? 'true' : 'false'}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-ocean-blue transition-colors dark:text-slate-400 dark:hover:text-sky-tint"
        >
          <CalendarDays size={14} />
          {showHeatmap ? 'Sembunyikan riwayat' : 'Lihat riwayat'}
          <ChevronDown
            size={14}
            className={`transition-transform ${showHeatmap ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {showHeatmap && (
        <div className="anim-fade-up">
          <HabitHeatmap data={data} habit={habit} todayKey={todayKey} />
        </div>
      )}

      {/* Archive confirm */}
      {confirming === 'archive' && (
        <div className="anim-fade-up mt-3 bg-mist/60 border border-mist rounded-xl px-4 py-3 flex items-center justify-between gap-2 dark:bg-night-border/40 dark:border-night-border">
          <p className="text-deep-navy text-sm dark:text-slate-200">
            Arsipkan habit ini? Riwayat tetap disimpan dan bisa dipulihkan.
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setConfirming(null)}
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

      {/* Delete confirm */}
      {confirming === 'delete' && (
        <div className="anim-fade-up mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between gap-2 dark:bg-red-500/10 dark:border-red-500/30">
          <p className="text-red-600 text-sm dark:text-red-400">
            Hapus habit ini beserta seluruh riwayatnya? Tidak bisa dibatalkan.
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setConfirming(null)}
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
    <div className="glass-card shadow-sm">
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
        <ul className="anim-fade-up border-t border-mist px-4 py-2 space-y-1 dark:border-night-border">
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
                <div className="anim-fade-up mt-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-center justify-between gap-2 dark:bg-red-500/10 dark:border-red-500/30">
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
    <div className="anim-overlay fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="anim-sheet bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-24 sm:pb-6 space-y-4 shadow-xl dark:bg-night-soft">
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

            {/* Emoji kustom — ketik/tempel apa saja */}
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(firstEmoji(e.target.value))}
                placeholder="🙂"
                aria-label="Ikon kustom (emoji)"
                className="w-12 h-9 text-lg text-center rounded-lg border border-mist bg-white focus:outline-none focus:border-ocean-blue focus:ring-2 focus:ring-sky-tint/30 dark:border-night-border dark:bg-night"
              />
              <span className="text-xs text-slate-400 dark:text-slate-500">
                atau ketik / tempel emoji sendiri
              </span>
              {icon && !EMOJI_CHOICES.includes(icon) && (
                <button
                  type="button"
                  onClick={() => setIcon('')}
                  className="ml-auto text-xs font-medium text-slate-400 hover:text-red-500 transition-colors dark:text-slate-500"
                >
                  Hapus
                </button>
              )}
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
