'use client';

import { useRouter } from 'next/navigation';

interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
  actions?: React.ReactNode;
}

export default function MobileHeader({ title, showBack, actions }: MobileHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 bg-slate-900 text-white px-4 py-3 flex items-center gap-3">
      {showBack && (
        <button onClick={() => router.back()} className="p-1 -ml-1">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      <h1 className="flex-1 text-lg font-semibold truncate">{title}</h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
