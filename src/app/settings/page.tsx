'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { useApp } from '@/context/AppContext';
import { db } from '@/services/db';
import { UserProfile, OrganizationMember, UserRole } from '@/types';
import { Settings, Shield, UserPlus, Save, CheckCircle, AlertCircle, Mail } from 'lucide-react';

export default function SettingsPage() {
  const { org, role, allProfiles, reloadProjects } = useApp();

  // Settings states
  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [currency, setCurrency] = useState('USD');

  // Invite states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('team_member');
  const [inviteDesignation, setInviteDesignation] = useState('');

  // Members list
  const [members, setMembers] = useState<(OrganizationMember & { profile: UserProfile })[]>([]);

  // Feedbacks
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = role === 'super_admin';

  const fetchMembers = async () => {
    if (!org) return;
    try {
      const list = await db.getOrgMembers(org.id);
      setMembers(list);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (org) {
      setCompanyName(org.name);
      setLogoUrl(org.logo_url || '');
      setTimezone(org.timezone);
      setCurrency(org.currency);
      fetchMembers();
    }
  }, [org]);

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org || !isAdmin) return;
    setSettingsSuccess(false);

    try {
      await db.updateOrganization(org.id, {
        name: companyName,
        logo_url: logoUrl,
        timezone,
        currency
      });
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
      window.location.reload(); // Refresh to update layouts
    } catch (err) {
      console.error(err);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org || !isAdmin) return;
    setError(null);
    setInviteSuccess(false);

    try {
      await db.inviteOrgMember(org.id, inviteEmail, inviteName, inviteRole, inviteDesignation);
      setInviteSuccess(true);
      setInviteEmail('');
      setInviteName('');
      setInviteDesignation('');
      setInviteRole('team_member');
      
      // Reload member listing
      await fetchMembers();
      setTimeout(() => setInviteSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Invitation operation failed.');
    }
  };

  const handleUpdateMemberRole = async (memberId: string, targetRole: UserRole) => {
    if (!isAdmin) return;
    try {
      await db.updateMemberRole(memberId, targetRole);
      fetchMembers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Organization Settings</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure business metadata, invite employees, and distribute granular system access roles.
            </p>
          </div>
        </div>

        {/* Access Restriction check */}
        {!isAdmin ? (
          <div className="p-8 rounded-3xl bg-destructive/5 border border-destructive/15 text-center max-w-lg mx-auto mt-12">
            <Shield className="w-12 h-12 text-destructive/60 mx-auto mb-3" />
            <h3 className="font-bold text-sm text-foreground">Access Restricted</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              Only Organization Admins or Super Admins are authorized to view or edit configurations. Please use the Tester Panel in the bottom right to elevate your permissions.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: General Configs */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Org Settings Form */}
              <div className="p-6 rounded-3xl bg-card border border-border shadow-sm">
                <h3 className="font-bold text-xs text-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Settings className="w-4.5 h-4.5 text-primary" /> Company Profile Metadata
                </h3>

                {settingsSuccess && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Organization details updated successfully.</span>
                  </div>
                )}

                <form onSubmit={handleUpdateSettings} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Company Name</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs p-3 text-foreground"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Company Logo URL</label>
                      <input
                        type="url"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://company.com/logo.png"
                        className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs p-3 text-foreground"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Time Zone</label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs p-3 text-foreground"
                      >
                        <option value="UTC">UTC (Coordinated Universal Time)</option>
                        <option value="America/New_York">EST (Eastern Standard Time)</option>
                        <option value="Europe/London">GMT (Greenwich Mean Time)</option>
                        <option value="Asia/Tokyo">JST (Japan Standard Time)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Currency</label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs p-3 text-foreground"
                      >
                        <option value="USD">USD ($ United States Dollar)</option>
                        <option value="EUR">EUR (€ Euro)</option>
                        <option value="GBP">GBP (£ British Pound)</option>
                        <option value="JPY">JPY (¥ Japanese Yen)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-border">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold shadow flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-4 h-4" /> Save Settings
                    </button>
                  </div>
                </form>
              </div>

              {/* Members listing Table */}
              <div className="p-6 rounded-3xl bg-card border border-border shadow-sm">
                <h3 className="font-bold text-xs text-foreground uppercase tracking-wider mb-4">
                  Active Roster Directory & Permissions
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/20 text-muted-foreground text-[10px] font-bold uppercase">
                        <th className="p-2.5">Member Name</th>
                        <th className="p-2.5">Email Contact</th>
                        <th className="p-2.5">Role Permission</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m) => (
                        <tr key={m.id} className="border-b border-border/50 hover:bg-muted/10 last:border-none">
                          <td className="p-2.5 font-bold flex items-center gap-2">
                            <img src={m.profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} className="w-6.5 h-6.5 rounded-full object-cover border border-border" alt="Avatar" />
                            <div className="flex flex-col">
                              <span>{m.profile?.name}</span>
                              <span className="text-[9px] text-muted-foreground leading-none">{m.profile?.designation}</span>
                            </div>
                          </td>
                          <td className="p-2.5 text-muted-foreground">{m.profile?.email}</td>
                          <td className="p-2.5">
                            {/* Make role switcher dropdown only accessible to administrators, and prevent self locked out */}
                            <select
                              value={m.role}
                              disabled={m.profile?.id === 'usr-org-admin' || m.profile?.id === 'usr-super-admin'}
                              onChange={(e) => handleUpdateMemberRole(m.id, e.target.value as UserRole)}
                              className="bg-muted text-foreground text-[10px] font-semibold py-1 px-2.5 rounded-lg border border-border/60 focus:outline-none cursor-pointer disabled:opacity-75"
                            >
                              <option value="super_admin">Admin</option>
                              <option value="project_manager">Project Manager</option>
                              <option value="team_member">Team Member</option>
                              <option value="client">Client</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Right: Team Invitations Form */}
            <div className="p-6 rounded-3xl bg-card border border-border shadow-sm">
              <h3 className="font-bold text-xs text-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <UserPlus className="w-4.5 h-4.5 text-primary" /> Invite New Member
              </h3>

              {inviteSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Invitation dispatched. Profile created.</span>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Member Name</label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Charlie Brown"
                    className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs p-3 text-foreground"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="charlie@company.com"
                      className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs pl-10 pr-4 py-3 text-foreground"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Designation</label>
                  <input
                    type="text"
                    value={inviteDesignation}
                    onChange={(e) => setInviteDesignation(e.target.value)}
                    placeholder="e.g. Backend Architect"
                    className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs p-3 text-foreground"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Assign Access Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as UserRole)}
                    className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs p-3 text-foreground cursor-pointer"
                  >
                    <option value="super_admin">Admin (System full access)</option>
                    <option value="project_manager">Project Manager (Sprints + tasks)</option>
                    <option value="team_member">Team Member (Edit assigned tasks)</option>
                    <option value="client">Client (Read-only portal views)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Send Sandbox Invitation
                </button>
              </form>
            </div>

          </div>
        )}

      </div>
    </AppShell>
  );
}
