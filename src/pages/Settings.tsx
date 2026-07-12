import { useRef, useState } from 'react';
import { Download, Upload, FileText, Trash2, MessageCircle, Sun, Moon, Quote, Plus, Pencil, Check, X } from 'lucide-react';
import useStorage from '../hooks/useStorage';
import useTheme from '../hooks/useTheme';
import type { AppData } from '../types';
import { DEFAULT_DATA } from '../data/defaultData';
import { exportToPDF } from '../utils/pdfExport';
import PageHeader from '../components/PageHeader';

export default function Settings() {
  const [data, setData] = useStorage<AppData>('habbit-tracker-data', DEFAULT_DATA);
  const { theme, setTheme } = useTheme();
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newMotivation, setNewMotivation] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const customMotivations = data.customMotivations ?? [];

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleCustomMotivation = () => {
    setData((prev) => ({ ...prev, useCustomMotivation: !prev.useCustomMotivation }));
  };

  const handleAddMotivation = () => {
    const text = newMotivation.trim();
    if (!text) return;
    const list = data.customMotivations ?? [];
    if (list.includes(text)) {
      showToast('Kata motivasi itu sudah ada.', 'error');
      return;
    }
    setData((prev) => ({
      ...prev,
      customMotivations: [...(prev.customMotivations ?? []), text],
      // Otomatis pilih yang baru ditambahkan sebagai yang aktif
      activeMotivation: text,
    }));
    setNewMotivation('');
    showToast('Kata motivasi ditambahkan!');
  };

  const handleSelectMotivation = (text: string) => {
    setData((prev) => ({ ...prev, activeMotivation: text }));
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingText(customMotivations[index]);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingText('');
  };

  const handleSaveEdit = (index: number) => {
    const text = editingText.trim();
    if (!text) return;
    const list = data.customMotivations ?? [];
    const old = list[index];
    if (text === old) {
      handleCancelEdit();
      return;
    }
    if (list.includes(text)) {
      showToast('Kata motivasi itu sudah ada.', 'error');
      return;
    }
    setData((prev) => {
      const next = [...(prev.customMotivations ?? [])];
      next[index] = text;
      return {
        ...prev,
        customMotivations: next,
        // Jika kata ini sedang aktif, ikut diperbarui
        activeMotivation: prev.activeMotivation === old ? text : prev.activeMotivation,
      };
    });
    handleCancelEdit();
    showToast('Kata motivasi diperbarui!');
  };

  const handleDeleteMotivation = (index: number) => {
    setData((prev) => {
      const list = prev.customMotivations ?? [];
      const removed = list[index];
      const next = list.filter((_, i) => i !== index);
      return {
        ...prev,
        customMotivations: next,
        // Jika yang dihapus sedang aktif, pindah ke sisa pertama (atau kosong)
        activeMotivation:
          prev.activeMotivation === removed ? (next[0] ?? '') : prev.activeMotivation,
      };
    });
    if (editingIndex === index) handleCancelEdit();
    showToast('Kata motivasi dihapus.');
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'habbit-tracker-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as AppData;
        if (!parsed.schedule) throw new Error('Format tidak valid');
        setData(parsed);
        showToast('Data berhasil diimpor!');
      } catch {
        showToast('Gagal mengimpor: format file tidak valid.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportPDF = () => {
    exportToPDF(data.schedule);
  };

  const handleDeleteAll = () => {
    setData(DEFAULT_DATA);
    setShowDeleteModal(false);
    showToast('Semua data telah dihapus.');
  };

  const handleDownloadQRIS = () => {
    const a = document.createElement('a');
    a.href = '/qris.png';
    a.download = 'QRIS-HabbitTracker.png';
    a.click();
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Kelola data & dukung pengembang" />

      <div className="px-4 md:px-8 -mt-5 grid gap-4 md:grid-cols-2">
        {/* Appearance */}
        <section className="md:col-span-2 glass-card p-5 shadow-sm space-y-3">
          <h2 className="text-deep-navy font-semibold text-base dark:text-slate-100">Tampilan</h2>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-deep-navy text-sm font-medium dark:text-slate-100">Mode Gelap</p>
              <p className="text-slate-500 text-sm dark:text-slate-400">Sesuaikan tampilan agar nyaman di mata.</p>
            </div>
            <div className="flex shrink-0 rounded-xl border border-mist p-1 dark:border-night-border">
              <button
                type="button"
                aria-pressed={theme === 'light' ? 'true' : 'false'}
                onClick={() => setTheme('light')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  theme === 'light'
                    ? 'bg-ocean-blue text-white'
                    : 'text-slate-500 hover:bg-mist dark:text-slate-400 dark:hover:bg-night-border'
                }`}
              >
                <Sun size={16} />
                Terang
              </button>
              <button
                type="button"
                aria-pressed={theme === 'dark' ? 'true' : 'false'}
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-ocean-blue text-white'
                    : 'text-slate-500 hover:bg-mist dark:text-slate-400 dark:hover:bg-night-border'
                }`}
              >
                <Moon size={16} />
                Gelap
              </button>
            </div>
          </div>
        </section>

        {/* Custom Motivation */}
        <section className="md:col-span-2 glass-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="inline-flex items-center gap-2 text-deep-navy font-semibold text-base dark:text-slate-100">
                <Quote size={18} className="text-ocean-blue dark:text-sky-tint" />
                Kustom Motivasi
              </h2>
              <p className="text-slate-500 text-sm mt-0.5 dark:text-slate-400">
                Aktifkan untuk memakai kata-kata motivasimu sendiri di Dashboard.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!!data.useCustomMotivation}
              aria-label="Aktifkan kustom motivasi"
              onClick={handleToggleCustomMotivation}
              className={`relative shrink-0 w-12 h-7 rounded-full transition-colors ${
                data.useCustomMotivation ? 'bg-ocean-blue' : 'bg-slate-300 dark:bg-night-border'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  data.useCustomMotivation ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {data.useCustomMotivation && (
            <div className="space-y-3 border-t border-mist pt-4 dark:border-night-border">
              {/* Dropdown pilih kata aktif */}
              <div>
                <label
                  htmlFor="active-motivation"
                  className="block text-deep-navy text-sm font-medium mb-1.5 dark:text-slate-100"
                >
                  Kata motivasi yang dipakai
                </label>
                {customMotivations.length > 0 ? (
                  <select
                    id="active-motivation"
                    value={data.activeMotivation ?? ''}
                    onChange={(e) => handleSelectMotivation(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-mist bg-white text-deep-navy text-sm focus:outline-none focus:border-ocean-blue dark:bg-night dark:border-night-border dark:text-slate-100"
                  >
                    {customMotivations.map((m, i) => (
                      <option key={i} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-slate-400 text-sm dark:text-slate-500">
                    Belum ada kata motivasi. Tambahkan di bawah ini.
                  </p>
                )}
              </div>

              {/* Daftar kata — bisa diedit & dihapus */}
              {customMotivations.length > 0 && (
                <div>
                  <p className="text-deep-navy text-sm font-medium mb-1.5 dark:text-slate-100">
                    Daftar kata motivasi
                  </p>
                  <ul className="space-y-2">
                    {customMotivations.map((m, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 rounded-xl border border-mist bg-white px-3 py-2 dark:border-night-border dark:bg-night"
                      >
                        {editingIndex === i ? (
                          <>
                            <input
                              type="text"
                              value={editingText}
                              aria-label="Edit kata motivasi"
                              onChange={(e) => setEditingText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveEdit(i);
                                } else if (e.key === 'Escape') {
                                  handleCancelEdit();
                                }
                              }}
                              autoFocus
                              className="flex-1 min-w-0 px-2 py-1 rounded-lg border border-mist bg-white text-deep-navy text-sm focus:outline-none focus:border-ocean-blue dark:bg-night-soft dark:border-night-border dark:text-slate-100"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(i)}
                              aria-label="Simpan perubahan"
                              className="shrink-0 p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors dark:text-green-400 dark:hover:bg-green-500/10"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              aria-label="Batalkan edit"
                              className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:bg-mist transition-colors dark:text-slate-400 dark:hover:bg-night-border"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 min-w-0 text-deep-navy text-sm wrap-break-word dark:text-slate-100">
                              {m}
                              {data.activeMotivation === m && (
                                <span className="ml-2 text-xs font-medium text-ocean-blue dark:text-sky-tint">
                                  • dipakai
                                </span>
                              )}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(i)}
                              aria-label={`Edit "${m}"`}
                              className="shrink-0 p-1.5 rounded-lg text-slate-500 hover:bg-mist hover:text-ocean-blue transition-colors dark:text-slate-400 dark:hover:bg-night-border dark:hover:text-sky-tint"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMotivation(i)}
                              aria-label={`Hapus "${m}"`}
                              className="shrink-0 p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors dark:text-red-400 dark:hover:bg-red-500/10"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tambah kata baru */}
              <div>
                <label
                  htmlFor="new-motivation"
                  className="block text-deep-navy text-sm font-medium mb-1.5 dark:text-slate-100"
                >
                  Tambah kata motivasi baru
                </label>
                <div className="flex gap-2">
                  <input
                    id="new-motivation"
                    type="text"
                    value={newMotivation}
                    onChange={(e) => setNewMotivation(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddMotivation();
                      }
                    }}
                    placeholder="Tulis kalimat motivasimu…"
                    className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-mist bg-white text-deep-navy text-sm focus:outline-none focus:border-ocean-blue dark:bg-night dark:border-night-border dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddMotivation}
                    className="shrink-0 inline-flex items-center gap-1.5 bg-ocean-blue text-white text-sm font-medium px-4 rounded-xl hover:bg-deep-navy transition-colors"
                  >
                    <Plus size={16} />
                    Tambah
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Data Management */}
        <section className="md:col-span-2 glass-card p-5 shadow-sm space-y-3">
          <h2 className="text-deep-navy font-semibold text-base dark:text-slate-100">Kelola Data</h2>

          <div className="grid gap-3 sm:grid-cols-3">
            <ActionButton icon={<Download size={18} />} label="Export JSON" onClick={handleExportJSON} />
            <ActionButton icon={<Upload size={18} />} label="Import JSON" onClick={() => fileInputRef.current?.click()} />
            <ActionButton icon={<FileText size={18} />} label="Export PDF" onClick={handleExportPDF} />
          </div>

          <label className="sr-only" htmlFor="import-json-input">Import file JSON</label>
          <input
            id="import-json-input"
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportJSON}
          />

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            <Trash2 size={18} />
            <span className="text-sm font-medium">Hapus Semua Data</span>
          </button>
        </section>

        {/* Support Developer */}
        <section className="glass-card p-5 shadow-sm space-y-3 text-center flex flex-col">
          <h2 className="text-deep-navy font-semibold text-base dark:text-slate-100">Support Developer ☕</h2>
          <p className="text-slate-500 text-sm dark:text-slate-400">
            Aplikasi ini gratis. Jika bermanfaat, kamu bisa support dengan scan QRIS di bawah ini.
          </p>
          <div className="w-48 h-48 mx-auto rounded-xl border border-mist overflow-hidden bg-mist dark:border-night-border dark:bg-night">
            <img
              src="/qris.png"
              alt="QRIS"
              className="w-full h-full object-contain"
            />
          </div>
          <button
            type="button"
            onClick={handleDownloadQRIS}
            className="flex items-center gap-2 mx-auto text-ocean-blue text-sm font-medium border border-sky-tint px-4 py-2 rounded-xl hover:bg-mist transition-colors dark:text-sky-tint dark:hover:bg-night-border"
          >
            <Download size={16} />
            Download QRIS
          </button>
        </section>

        {/* Feedback */}
        <section className="glass-card p-5 shadow-sm space-y-3 flex flex-col">
          <h2 className="text-deep-navy font-semibold text-base dark:text-slate-100">Feedback & Bug Report</h2>
          <p className="text-slate-500 text-sm dark:text-slate-400">
            Ada saran fitur atau menemukan bug? Hubungi pengembang langsung via WhatsApp.
          </p>
          <a
            href="https://wa.me/6281212834013"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-xl transition-colors"
          >
            <MessageCircle size={18} />
            Chat via WhatsApp
          </a>
        </section>

        {/* Footer */}
        <p className="md:col-span-2 text-center text-slate-400 text-xs py-2 dark:text-slate-500">
          Habbit Tracker v1.0.0 — Made with ❤️
        </p>
      </div>

      {/* Delete Confirm Modal */}
      {showDeleteModal && (
        <div className="anim-overlay fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="anim-sheet bg-white w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-xl dark:bg-night-soft">
            <h3 className="text-deep-navy font-bold text-base dark:text-slate-100">Hapus Semua Data?</h3>
            <p className="text-slate-500 text-sm dark:text-slate-400">
              Aksi ini akan menghapus seluruh jadwal yang tersimpan dan tidak bisa dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-cloud-white transition-colors dark:border-slate-600 dark:text-slate-300 dark:hover:bg-night-border"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteAll}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`anim-toast fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg z-50 ${
            toast.type === 'error' ? 'bg-red-500' : 'bg-deep-navy'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-mist text-deep-navy hover:bg-mist hover:border-sky-tint transition-colors dark:border-night-border dark:text-slate-100 dark:hover:bg-night-border"
    >
      <span className="text-ocean-blue dark:text-sky-tint">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
