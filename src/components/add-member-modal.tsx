'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { db } from '@/services/db';
import { UserRole } from '@/types';
import { X, UserPlus, Shield, Sparkles, Mail, Briefcase, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddMemberModal = ({ isOpen, onClose, onSuccess }: AddMemberModalProps) => {
  const { org, role: currentUserRole, triggerNotification, reloadProfiles } = useApp();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState<UserRole>('team_member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter allowed roles based on active role rules
  // 1- Admin (super_admin) can add: super_admin, project_manager, team_member, client
  // 2- Project Manager (project_manager) can add: team_member, client
  // 3- Team Member (team_member) can add: client
  const getAllowedRoles = (): { value: UserRole; label: string }[] => {
    switch (currentUserRole) {
      case 'super_admin':
      case 'org_admin':
        return [
          { value: 'project_manager', label: 'Project Manager' },
          { value: 'team_member', label: 'Team Member' },
          { value: 'client', label: 'Client' },
          { value: 'org_admin', label: 'Admin' },
        ];
      case 'project_manager':
        return [
          { value: 'team_member', label: 'Team Member' },
          { value: 'client', label: 'Client' },
        ];
      case 'team_member':
        return [
          { value: 'client', label: 'Client' },
        ];
      default:
        return []; // Clients or undefined roles cannot add anyone
    }
  };

  const allowedRoles = getAllowedRoles();

  // Set default role selection based on allowed roles
  useEffect(() => {
    if (allowedRoles.length > 0) {
      setRole(allowedRoles[0].value);
    }
  }, [currentUserRole]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) {
      setError('No active organization context found.');
      return;
    }
    if (!name.trim()) {
      setError('Please provide a full name.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please provide a valid email address.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call database API
      await db.inviteOrgMember(org.id, email, name, role, designation || undefined);

      // Create notification
      await triggerNotification(
        'Team Member Added',
        `Successfully added/invited ${name} (${email}) as a ${role.replace('_', ' ')}.`,
        '/team'
      );

      // Pop premium confetti effect
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });

      // Reload directory data
      await reloadProfiles();

      // Reset form
      setName('');
      setEmail('');
      setDesignation('');
      setDepartment('');
      
      if (allowedRoles.length > 0) {
        setRole(allowedRoles[0].value);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to add team member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-tight">Add Team Member</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Invite new users with specific roles to your workspace</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-150"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
            <div className="relative">
              <Sparkles className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground/75" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full bg-muted/30 hover:bg-muted/50 focus:bg-card border border-border focus:border-primary rounded-xl text-xs pl-10 pr-4 py-3 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground/75" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. john.doe@acme.com"
                className="w-full bg-muted/30 hover:bg-muted/50 focus:bg-card border border-border focus:border-primary rounded-xl text-xs pl-10 pr-4 py-3 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Role Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Assign Role</label>
            <div className="relative">
              <Shield className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground/75" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full bg-muted/30 hover:bg-muted/50 focus:bg-card border border-border focus:border-primary rounded-xl text-xs pl-10 pr-10 py-3 focus:outline-none transition-all appearance-none cursor-pointer"
              >
                {allowedRoles.map((r) => (
                  <option key={r.value} value={r.value} className="bg-card text-foreground">
                    {r.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 top-4.5 pointer-events-none w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-muted-foreground" />
            </div>
            <p className="text-[9px] text-muted-foreground/80 mt-1 italic">
              * Role selection is restricted based on your active role: <span className="font-semibold">{currentUserRole.replace('_', ' ')}</span>.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Designation */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Designation</label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground/75" />
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. UX Designer"
                  className="w-full bg-muted/30 hover:bg-muted/50 focus:bg-card border border-border focus:border-primary rounded-xl text-xs pl-10 pr-4 py-3 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Department</label>
              <div className="relative">
                <Award className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground/75" />
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Design"
                  className="w-full bg-muted/30 hover:bg-muted/50 focus:bg-card border border-border focus:border-primary rounded-xl text-xs pl-10 pr-4 py-3 focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-border mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold hover:text-foreground transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold shadow-sm hover:shadow transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Inviting...
                </>
              ) : (
                'Add Member'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
