'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import BottomTabBar from '@/components/mobile/BottomTabBar';

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { token, user } = useAuthStore();

  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

  if (!token) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="pb-16">
        {children}
      </div>
      <BottomTabBar />
    </div>
  );
}
