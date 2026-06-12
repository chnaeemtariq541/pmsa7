'use client';

import React from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { DevRoleSwitcher } from './dev-role-switcher';
import { useApp } from '@/context/AppContext';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { role } = useApp();

  // If client role is active, they are dynamically isolated to client dashboard layouts
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-200">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header />
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6 transition-all">
          <div className="max-w-7xl mx-auto w-full h-full">
            {children}
          </div>
        </main>
      </div>
      <DevRoleSwitcher />
    </div>
  );
};
