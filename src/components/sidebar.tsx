'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { 
  LayoutDashboard, FolderKanban, Users, Clock, BarChart3, 
  Settings, ShieldAlert, Sun, Moon, Briefcase, Calendar, LogOut
} from 'lucide-react';

export const Sidebar = () => {
  const pathname = usePathname();
  const { role, org, activeProject, theme, toggleTheme, user } = useApp();

  const isClient = role === 'client';
  const isAdmin = role === 'super_admin' || role === 'org_admin';
  const isPM = role === 'project_manager';

  // Navigation schema depending on active role
  const navItems = [
    {
      label: 'Client Dashboard',
      href: '/client',
      icon: Briefcase,
      show: isClient
    },
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      show: !isClient
    },
    {
      label: 'Projects',
      href: '/projects',
      icon: FolderKanban,
      show: !isClient
    },
    {
      label: 'Team Directory',
      href: '/team',
      icon: Users,
      show: !isClient
    },
    {
      label: 'Time Logs',
      href: '/time',
      icon: Clock,
      show: !isClient
    },
    {
      label: 'Org Settings',
      href: '/settings',
      icon: Settings,
      show: isAdmin
    }
  ];

  // Nested Project-specific navigation when a project is selected
  const projectNavItems = activeProject && !isClient ? [
    {
      label: 'Kanban Board',
      href: `/projects/${activeProject.id}/board`,
      icon: FolderKanban
    },
    {
      label: 'Backlog & Sprints',
      href: `/projects/${activeProject.id}/backlog`,
      icon: ShieldAlert // Using a simpler icon fallback
    },
    {
      label: 'Timeline & Gantt',
      href: `/projects/${activeProject.id}/timeline`,
      icon: Calendar
    },
    {
      label: 'Reports & Velocity',
      href: `/projects/${activeProject.id}/reports`,
      icon: BarChart3
    }
  ] : [];

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-full shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 border-b border-border flex items-center px-6 gap-3 bg-muted/20">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-lg shadow-sm">
          P
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-tight leading-none text-foreground">PMSA7</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">Agile Project Suite</span>
        </div>
      </div>

      {/* Organization Context */}
      {org && !isClient && (
        <div className="p-4 mx-3 my-3 bg-muted/40 rounded-xl border border-border/50 flex items-center gap-3">
          <img 
            src={org.logo_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128'} 
            className="w-8 h-8 rounded-lg object-cover border border-border"
            alt="Org Logo"
          />
          <div className="flex flex-col truncate">
            <span className="text-xs font-semibold text-foreground truncate">{org.name}</span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
              {role.replace('_', ' ')}
            </span>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        <div className="space-y-1">
          {navItems.filter(item => item.show).map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href) && !pathname.includes('/projects/'));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Project Specific Sub-Menu */}
        {activeProject && !isClient && (
          <div className="space-y-1 pt-4 border-t border-border">
            <div className="px-3 mb-2 flex flex-col gap-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                Active Project
              </span>
              <span className="text-xs font-semibold text-foreground truncate">
                {activeProject.name}
              </span>
            </div>
            {projectNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-primary/10 text-primary border border-primary/20' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-border space-y-3 bg-muted/10">
        {/* Toggle Theme / Log out mock */}
        <div className="flex items-center justify-between">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center p-2 rounded-lg border border-border hover:bg-muted transition-all duration-200 text-muted-foreground hover:text-foreground"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          
          <span className="text-[10px] font-semibold text-muted-foreground uppercase">
            v1.0 (Sandbox)
          </span>
        </div>

        {/* User Card */}
        {user && (
          <div className="flex items-center gap-3 pt-1">
            <img 
              src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
              className="w-9 h-9 rounded-full object-cover border border-border"
              alt="Profile"
            />
            <div className="flex flex-col truncate min-w-0">
              <span className="text-xs font-semibold text-foreground truncate leading-tight">
                {user.name}
              </span>
              <span className="text-[10px] text-muted-foreground truncate leading-tight">
                {user.designation || 'Member'}
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
