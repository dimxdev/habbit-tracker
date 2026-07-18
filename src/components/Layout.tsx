import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import QuickAddButton from './QuickAddButton';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  // Key per rute → animasi masuk halaman replay tiap pindah tab
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen font-sans text-deep-navy transition-colors dark:text-slate-100">
      <Sidebar />
      <div className="md:pl-64">
        <main key={pathname} className="anim-page mx-auto w-full max-w-3xl pb-24 md:pb-12">
          {children}
        </main>
      </div>
      <QuickAddButton />
      <BottomNav />
    </div>
  );
}
