import { NavLink } from 'react-router-dom';
import { Home, CalendarDays, CalendarRange, Target, Settings, CalendarCheck } from 'lucide-react';

const links = [
  { to: '/',         label: 'Dashboard', Icon: Home },
  { to: '/schedule', label: 'Jadwal',    Icon: CalendarDays },
  { to: '/calendar', label: 'Kalender',  Icon: CalendarRange },
  { to: '/habits',   label: 'Habit',     Icon: Target },
  { to: '/settings', label: 'Settings',  Icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 glass-nav border-r border-white/40 z-40 transition-colors dark:border-white/10">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-6 h-16 border-b border-mist dark:border-night-border">
        <span className="grid place-items-center w-9 h-9 rounded-xl bg-ocean-blue text-white">
          <CalendarCheck size={20} />
        </span>
        <span className="font-bold text-deep-navy text-lg dark:text-slate-100">Habbit Tracker</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 ` +
              (isActive
                ? 'bg-white/50 text-ocean-blue shadow-sm dark:bg-white/10 dark:text-sky-tint'
                : 'text-slate-500 hover:bg-white/40 hover:text-deep-navy dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-100')
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.4 : 1.9} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-mist dark:border-night-border">
        <p className="text-xs text-slate-400 dark:text-slate-500">v1.0.0 — Made with ❤️</p>
      </div>
    </aside>
  );
}
