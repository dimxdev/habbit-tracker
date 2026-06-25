import { NavLink } from 'react-router-dom';
import { Home, CalendarDays, CalendarRange, Settings } from 'lucide-react';

const tabs = [
  { to: '/',         label: 'Dashboard', Icon: Home },
  { to: '/schedule', label: 'Jadwal',    Icon: CalendarDays },
  { to: '/calendar', label: 'Kalender',  Icon: CalendarRange },
  { to: '/settings', label: 'Settings',  Icon: Settings },
];

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-mist z-50 dark:bg-night-soft/95 dark:border-night-border">
      <div className="max-w-md mx-auto flex">
        {tabs.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ` +
              (isActive
                ? 'text-ocean-blue border-t-2 border-ocean-blue bg-mist dark:text-sky-tint dark:border-sky-tint dark:bg-night-border'
                : 'text-slate-400 border-t-2 border-transparent dark:text-slate-500')
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-xs font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
