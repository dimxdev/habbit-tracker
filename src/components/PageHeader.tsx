import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  right?: ReactNode;
}

export default function PageHeader({ title, subtitle, eyebrow, right }: PageHeaderProps) {
  return (
    <header className="relative overflow-hidden bg-linear-to-br from-deep-navy to-ocean-blue px-5 pt-10 pb-10 md:mt-6 md:rounded-3xl md:px-8 md:pt-9 md:pb-11 md:shadow-sm">
      {/* Kilau kaca: highlight lembut di sudut atas + garis tepi tipis */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 md:rounded-3xl"
        style={{
          background:
            'radial-gradient(120% 80% at 0% 0%, rgba(255,255,255,0.22), transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.12), transparent 40%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)',
        }}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          {eyebrow && (
            <p className="text-sky-tint text-sm font-medium mb-1">{eyebrow}</p>
          )}
          <h1 className="text-white text-2xl md:text-3xl font-bold leading-snug capitalize">
            {title}
          </h1>
          {subtitle && <p className="text-sky-tint text-sm mt-1.5">{subtitle}</p>}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
    </header>
  );
}
