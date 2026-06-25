import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import type { DailyNote } from '../types';
import { getCurrentTimeString, toTitleCase, toSentenceCase } from '../utils/helpers';

export default function DailyNotesEditor({
  notes,
  onAdd,
  onUpdate,
  onDelete,
  placeholder = 'Tambah catatan…',
  emptyText,
  withTime = false,
  defaultTimeNow = false,
  capitalize = 'sentence',
}: {
  notes: DailyNote[];
  onAdd: (text: string, time?: string) => void;
  onUpdate: (id: string, text: string, time?: string) => void;
  onDelete: (id: string) => void;
  placeholder?: string;
  emptyText?: string;
  withTime?: boolean;
  // Isi otomatis input jam dengan jam sekarang (untuk jurnal)
  defaultTimeNow?: boolean;
  // Gaya kapitalisasi teks: 'sentence' (awal kalimat) atau 'title' (tiap kata)
  capitalize?: 'sentence' | 'title';
}) {
  const formatText = capitalize === 'title' ? toTitleCase : toSentenceCase;
  const initialDraftTime = () =>
    withTime && defaultTimeNow ? getCurrentTimeString() : '';

  const [draft, setDraft] = useState('');
  const [draftTime, setDraftTime] = useState(initialDraftTime);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editTime, setEditTime] = useState('');

  // Urutkan agenda berjadwal: yang ada jam tampil lebih dulu (menaik), lalu tanpa jam
  const items = withTime
    ? [...notes].sort((a, b) => {
        if (a.time && b.time) return a.time.localeCompare(b.time);
        if (a.time) return -1;
        if (b.time) return 1;
        return 0;
      })
    : notes;

  // Tentukan jam yang disimpan. Untuk jurnal (defaultTimeNow) jam wajib:
  // kalau dikosongkan, jatuh ke jam sekarang. Untuk agenda boleh kosong.
  const resolveTime = (t: string): string | undefined => {
    if (!withTime) return undefined;
    if (t) return t;
    return defaultTimeNow ? getCurrentTimeString() : undefined;
  };

  const handleAdd = () => {
    const text = formatText(draft);
    if (!text) return;
    onAdd(text, resolveTime(draftTime));
    setDraft('');
    setDraftTime(initialDraftTime());
  };

  const startEdit = (note: DailyNote) => {
    setEditingId(note.id);
    setEditText(note.text);
    setEditTime(note.time ?? '');
  };

  const saveEdit = () => {
    const text = formatText(editText);
    if (editingId && text) onUpdate(editingId, text, resolveTime(editTime));
    setEditingId(null);
    setEditText('');
    setEditTime('');
  };

  const inputCls =
    'min-w-0 border border-mist rounded-xl px-3.5 py-2.5 text-sm text-deep-navy placeholder:text-slate-300 focus:outline-none focus:border-ocean-blue focus:ring-2 focus:ring-sky-tint/30 dark:border-night-border dark:bg-night dark:text-slate-100 dark:placeholder:text-slate-600';
  const timeInputCls =
    'shrink-0 w-24 border border-mist rounded-xl px-2.5 py-2.5 text-sm text-deep-navy focus:outline-none focus:border-ocean-blue focus:ring-2 focus:ring-sky-tint/30 dark:border-night-border dark:bg-night dark:text-slate-100 dark:scheme-dark';

  return (
    <div>
      {items.length > 0 ? (
        <ul className="space-y-2 mb-3">
          {items.map((note) => (
            <li
              key={note.id}
              className="flex items-start gap-2 rounded-xl border border-mist px-3 py-2.5 dark:border-night-border"
            >
              {editingId === note.id ? (
                <>
                  {withTime && (
                    <input
                      type="time"
                      aria-label="Jam agenda"
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className={timeInputCls}
                    />
                  )}
                  <input
                    type="text"
                    autoFocus
                    aria-label="Edit catatan"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit();
                      if (e.key === 'Escape') { setEditingId(null); setEditText(''); setEditTime(''); }
                    }}
                    className="flex-1 min-w-0 bg-transparent text-deep-navy text-sm focus:outline-none dark:text-slate-100"
                  />
                  <button
                    type="button"
                    aria-label="Simpan catatan"
                    onClick={saveEdit}
                    className="p-1 rounded-lg text-ocean-blue hover:bg-mist transition-colors dark:text-sky-tint dark:hover:bg-night-border"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label="Batal edit"
                    onClick={() => { setEditingId(null); setEditText(''); setEditTime(''); }}
                    className="p-1 rounded-lg text-slate-400 hover:bg-mist transition-colors dark:hover:bg-night-border"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  {note.time ? (
                    <span className="mt-0.5 text-xs font-semibold text-ocean-blue bg-mist px-1.5 py-0.5 rounded shrink-0 tabular-nums dark:text-sky-tint dark:bg-night-border">
                      {note.time}
                    </span>
                  ) : (
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-ocean-blue shrink-0 dark:bg-sky-tint" />
                  )}
                  <span className="flex-1 min-w-0 text-deep-navy text-sm wrap-break-word dark:text-slate-100">
                    {note.text}
                  </span>
                  <button
                    type="button"
                    aria-label="Edit catatan"
                    onClick={() => startEdit(note)}
                    className="p-1 rounded-lg text-slate-400 hover:text-ocean-blue hover:bg-mist transition-colors dark:hover:text-sky-tint dark:hover:bg-night-border"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    aria-label="Hapus catatan"
                    onClick={() => onDelete(note.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors dark:hover:bg-red-500/10"
                  >
                    <Trash2 size={15} />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : (
        emptyText && (
          <p className="text-slate-400 text-sm mb-3 dark:text-slate-500">{emptyText}</p>
        )
      )}

      <div className="flex items-center gap-2">
        {withTime && (
          <input
            type="time"
            aria-label="Jam agenda"
            value={draftTime}
            onChange={(e) => setDraftTime(e.target.value)}
            className={timeInputCls}
          />
        )}
        <input
          type="text"
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          className={`flex-1 ${inputCls}`}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!draft.trim()}
          className="inline-flex items-center justify-center gap-1.5 bg-ocean-blue text-white text-sm font-medium px-3.5 py-2.5 rounded-xl hover:bg-deep-navy transition-colors disabled:opacity-40 disabled:hover:bg-ocean-blue shrink-0"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Tambah</span>
        </button>
      </div>
    </div>
  );
}
