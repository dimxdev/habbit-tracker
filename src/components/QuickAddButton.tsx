import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Target, CalendarDays, CalendarClock, NotebookPen, X } from 'lucide-react';

const ACTIONS = [
  { label: 'Catat habit', Icon: Target, to: '/habits?add=habit' },
  { label: 'Tambah jadwal', Icon: CalendarDays, to: '/schedule?add=slot' },
  { label: 'Tambah agenda', Icon: CalendarClock, to: '/calendar' },
  { label: 'Tulis catatan', Icon: NotebookPen, to: '/' },
];

export default function QuickAddButton() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <>
      {/* Backdrop saat menu terbuka */}
      {open && (
        <button
          type="button"
          aria-label="Tutup menu tambah"
          onClick={() => setOpen(false)}
          className="anim-overlay fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
        />
      )}

      <div className="fixed right-4 bottom-24 md:right-8 md:bottom-8 z-40 flex flex-col items-end gap-2">
        {open && (
          <div className="anim-fade-up flex flex-col items-end gap-2 mb-1">
            {ACTIONS.map(({ label, Icon, to }) => (
              <button
                key={to}
                type="button"
                onClick={() => go(to)}
                className="flex items-center gap-2 rounded-full bg-white pl-3 pr-4 py-2 shadow-lg text-sm font-medium text-deep-navy hover:bg-mist transition-colors dark:bg-night-soft dark:text-slate-100 dark:hover:bg-night-border"
              >
                <Icon size={16} className="text-ocean-blue dark:text-sky-tint" />
                {label}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          aria-label={open ? 'Tutup menu tambah' : 'Tambah cepat'}
          aria-expanded={open ? 'true' : 'false'}
          onClick={() => setOpen((v) => !v)}
          className="grid place-items-center w-14 h-14 rounded-full bg-ocean-blue text-white shadow-xl hover:bg-deep-navy transition-colors"
        >
          <span className={`transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>
            {open ? <X size={24} /> : <Plus size={26} />}
          </span>
        </button>
      </div>
    </>
  );
}
