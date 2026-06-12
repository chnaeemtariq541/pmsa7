'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

export default function Home() {
  const router = useRouter();
  const { user, role } = useApp();

  useEffect(() => {
    // If not loaded, or unauthenticated, redirect to auth portal
    if (!user) {
      router.push('/auth');
    } else {
      if (role === 'client') {
        router.push('/client');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, role, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        {/* Sleek loading spinner */}
        <div className="w-10 h-10 rounded-xl border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-xs font-semibold text-slate-400">Verifying security credentials...</span>
      </div>
    </div>
  );
}
