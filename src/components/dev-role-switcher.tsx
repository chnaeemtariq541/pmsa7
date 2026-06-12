'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { UserRole } from '@/types';
import { Shield, RefreshCw, Database, Eye, EyeOff } from 'lucide-react';

export const DevRoleSwitcher = () => {
  const { role, switchRole, isDbMock, user, originalRole } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  if (originalRole !== 'super_admin') {
    return null;
  }

  const roles: { value: UserRole; label: string; desc: string; color: string }[] = [
    { value: 'super_admin', label: 'Admin', desc: 'Manage orgs & system access', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
    { value: 'project_manager', label: 'Project Manager', desc: 'Manage sprints, boards & tasks', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    { value: 'team_member', label: 'Team Member', desc: 'Edit tasks & log time', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
    { value: 'client', label: 'Client', desc: 'Read-only progress & comments', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  ];

  const handleResetData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pmsa7_mock_database');
      window.location.reload();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      {isOpen ? (
        <div className="w-80 rounded-xl bg-card border border-border shadow-2xl p-4 transition-all duration-300">
          <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm">Admin Impersonation Console</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground text-xs font-medium"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-muted-foreground">Database Status:</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold border ${
                isDbMock 
                  ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' 
                  : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
              }`}>
                <Database className="w-3 h-3" />
                {isDbMock ? 'Local Mock (active)' : 'Supabase Live'}
              </span>
            </div>
            {isDbMock && (
              <button
                onClick={handleResetData}
                className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary transition-all duration-200"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Sandboxed Seed Data
              </button>
            )}
          </div>

          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            <span className="text-xs font-medium text-muted-foreground block mb-1">Select Persona Role:</span>
            {roles.map((r) => {
              const isActive = role === r.value;
              return (
                <button
                  key={r.value}
                  onClick={() => switchRole(r.value)}
                  className={`w-full text-left p-2 rounded-lg border transition-all duration-200 flex flex-col gap-0.5 ${
                    isActive 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : 'border-transparent hover:bg-muted/50 hover:border-border'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-foreground">{r.label}</span>
                    {isActive && (
                      <span className="text-[10px] uppercase font-bold text-primary">Active</span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground leading-snug">{r.desc}</span>
                </button>
              );
            })}
          </div>
          
          <div className="mt-3 pt-2 border-t border-border flex items-center gap-2">
            <img 
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
              className="w-7 h-7 rounded-full object-cover border border-border"
              alt="Avatar"
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold">{user?.name}</span>
              <span className="text-[10px] text-muted-foreground truncate max-w-[180px]">{user?.email}</span>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white py-2.5 px-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Shield className="w-4 h-4" />
          <span className="text-xs font-semibold">Impersonate: {roles.find(r => r.value === role)?.label}</span>
          <Eye className="w-4 h-4 ml-1 opacity-70" />
        </button>
      )}
    </div>
  );
};
