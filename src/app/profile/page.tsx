'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { useApp } from '@/context/AppContext';
import { 
  User, Mail, Shield, Check, Save, Sparkles, LogOut,
  UserCheck, ShieldCheck, Tag, X, Plus, Image
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/services/db/client';
import confetti from 'canvas-confetti';

export default function ProfilePage() {
  const router = useRouter();
  const { user, role, org, updateUserProfile, theme } = useApp();

  // Form States
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  
  // Tag input
  const [skillInput, setSkillInput] = useState('');

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Sync state when user profile is loaded
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatarUrl(user.avatar_url || '');
      setDesignation(user.designation || '');
      setDepartment(user.department || '');
      setSkills(user.skills || []);
    }
  }, [user]);

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updateUserProfile({
        name,
        avatar_url: avatarUrl,
        designation,
        department,
        skills
      });
      
      setSuccess(true);
      
      // Fire confetti celebration
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      // Auto-hide success message after 4 seconds
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to update profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (isSupabaseConfigured) {
      await supabase!.auth.signOut();
    }
    router.push('/auth');
  };

  if (!user) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <User className="w-6 h-6 text-primary" /> Profile Settings
            </h1>
            <p className="text-xs text-muted-foreground">
              Update your account details, design system profile metadata, and skill tags.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-muted hover:bg-destructive/10 hover:text-destructive border border-border hover:border-destructive/20 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
            
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground disabled:opacity-50 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
            >
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>
        </div>

        {/* Notifications and Alerts */}
        {success && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2.5 animate-slide-in">
            <Sparkles className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="font-bold">Profile Updated Successfully!</span>
              <span>Your profile edits have been synced to the database and reflect live.</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2.5">
            <X className="w-4.5 h-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel: Profile Card Card */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-primary via-blue-500 to-indigo-500" />
              
              <div className="relative mt-4 group">
                <img 
                  src={avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
                  className="w-24 h-24 rounded-full object-cover border-2 border-border shadow-md group-hover:scale-105 transition-transform duration-300"
                  alt={name}
                  onError={(e) => {
                    // Fallback avatar image
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
                  }}
                />
              </div>

              <h2 className="mt-4 font-bold text-base text-foreground">{name || 'Guest User'}</h2>
              <span className="text-xs text-muted-foreground">{designation || 'Consultant'}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1 bg-muted px-2.5 py-1 rounded-full border border-border/80">
                {role.replace('_', ' ')}
              </span>

              <div className="w-full border-t border-border mt-6 pt-5 space-y-3.5 text-left">
                <div className="flex items-center gap-3 text-xs">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex flex-col truncate min-w-0">
                    <span className="text-[10px] text-muted-foreground leading-none mb-0.5">Email Workspace</span>
                    <span className="text-foreground font-medium truncate leading-tight">{user.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <ShieldCheck className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex flex-col truncate min-w-0">
                    <span className="text-[10px] text-muted-foreground leading-none mb-0.5">Organization</span>
                    <span className="text-foreground font-medium truncate leading-tight">{org?.name || 'Sheikho & Tolvi LLC'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <UserCheck className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex flex-col truncate min-w-0">
                    <span className="text-[10px] text-muted-foreground leading-none mb-0.5">Department</span>
                    <span className="text-foreground font-medium truncate leading-tight">{department || 'Not Assigned'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Fields and Settings */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-bold text-foreground border-b border-border pb-3">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs pl-9 pr-4 py-2.5 text-foreground font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Designation</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="Senior Engineer"
                      className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs pl-9 pr-4 py-2.5 text-foreground font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Department</label>
                  <div className="relative">
                    <UserCheck className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Engineering"
                      className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs pl-9 pr-4 py-2.5 text-foreground font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Avatar Photo URL</label>
                  <div className="relative">
                    <Image className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                    <input
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs pl-9 pr-4 py-2.5 text-foreground font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Skills Card */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" /> Skills & Core Competencies
                </h3>
                <span className="text-[10px] text-muted-foreground font-bold uppercase">{skills.length} skills</span>
              </div>

              {/* Skill Tags List */}
              <div className="flex flex-wrap gap-2 min-h-10 p-3 bg-muted/40 border border-border/60 rounded-xl">
                {skills.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic my-auto">No skills added yet. Add tags below.</span>
                ) : (
                  skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-2.5 py-1 rounded-lg transition-all"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="p-0.5 rounded-full hover:bg-primary/20 text-primary cursor-pointer"
                        title="Remove skill"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Add Skill Form */}
              <form onSubmit={handleAddSkill} className="flex gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="Type a skill... e.g. React, Next.js, PostgreSQL"
                  className="flex-1 bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs px-3.5 py-2 text-foreground font-medium"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground border border-border text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Skill
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
