import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-cloud-white font-sans text-deep-navy transition-colors dark:bg-night dark:text-slate-100">
      <Sidebar />
      <div className="md:pl-64">
        <main className="mx-auto w-full max-w-3xl pb-24 md:pb-12">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
