'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { useApp } from '@/context/AppContext';
import { db } from '@/services/db';
import { UserProfile, Task } from '@/types';
import { Users, Search, Mail, Phone, Briefcase, Award, ShieldCheck } from 'lucide-react';

export default function TeamPage() {
  const { allProfiles, projects, role } = useApp();
  
  const [search, setSearch] = useState('');
  const [workloads, setWorkloads] = useState<Record<string, { tasksCount: number; estHours: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateWorkloads = async () => {
      if (allProfiles.length === 0) return;
      try {
        setLoading(true);
        const map: Record<string, { tasksCount: number; estHours: number }> = {};
        
        // Initialize maps
        allProfiles.forEach(u => {
          map[u.id] = { tasksCount: 0, estHours: 0 };
        });

        // Scan all tasks in all projects
        for (const p of projects) {
          const tasks = await db.getTasks(p.id);
          tasks.forEach(t => {
            if (t.assignee_id && map[t.assignee_id] && t.status !== 'done') {
              map[t.assignee_id].tasksCount += 1;
              map[t.assignee_id].estHours += Number(t.estimated_hours || 0);
            }
          });
        }

        setWorkloads(map);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    calculateWorkloads();
  }, [allProfiles, projects]);

  const filteredUsers = allProfiles.filter(u => {
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      (u.designation || '').toLowerCase().includes(q) ||
      u.skills.some(s => s.toLowerCase().includes(q)) ||
      (u.department || '').toLowerCase().includes(q)
    );
  });

  return (
    <AppShell>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Team Directory</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review employee directories, workload assignments, skillsets, and departmental rosters.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members by skill, name..."
              className="w-full bg-card border border-border focus:border-primary rounded-xl text-xs pl-10 pr-4 py-2 focus:outline-none"
            />
          </div>
        </div>

        {/* Directory Grid */}
        {loading ? (
          <div className="text-center py-20 text-xs text-muted-foreground">Calculating workload capacities...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 text-xs text-muted-foreground">No team members match your filter criteria.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((u) => {
              const uWorkload = workloads[u.id] || { tasksCount: 0, estHours: 0 };
              
              return (
                <div 
                  key={u.id}
                  className="rounded-3xl bg-card border border-border p-5 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200"
                >
                  <div className="space-y-4">
                    {/* Header info card */}
                    <div className="flex items-start gap-3.5">
                      <img 
                        src={u.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                        className="w-12 h-12 rounded-full object-cover border border-border"
                        alt={u.name}
                      />
                      <div className="flex-1 flex flex-col min-w-0">
                        <span className="font-bold text-sm text-foreground truncate leading-tight">{u.name}</span>
                        <span className="text-xs text-muted-foreground truncate mt-0.5">{u.designation || 'Specialist'}</span>
                        <span className="text-[9px] font-bold text-primary uppercase tracking-wider mt-1">{u.department || 'Staff'}</span>
                      </div>
                    </div>

                    {/* Skill tags */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-muted-foreground" /> Skillsets
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {u.skills.length === 0 ? (
                          <span className="text-[10px] text-muted-foreground italic">No skills listed</span>
                        ) : (
                          u.skills.map((s, idx) => (
                            <span 
                              key={idx} 
                              className="text-[9px] font-bold bg-muted border border-border/80 px-2 py-0.5 rounded-lg text-muted-foreground"
                            >
                              {s}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Workload statistics */}
                    <div className="grid grid-cols-2 gap-3 p-3 bg-muted/20 border border-border/60 rounded-2xl">
                      <div className="text-center border-r border-border/40 last:border-r-0">
                        <span className="text-[8px] uppercase font-bold text-muted-foreground block">Active Tasks</span>
                        <span className="text-sm font-black text-foreground block mt-1">{uWorkload.tasksCount} open</span>
                      </div>
                      <div className="text-center border-r border-border/40 last:border-r-0">
                        <span className="text-[8px] uppercase font-bold text-muted-foreground block">Remaining Est</span>
                        <span className="text-sm font-black text-primary block mt-1">{uWorkload.estHours} hrs</span>
                      </div>
                    </div>

                  </div>

                  {/* Footer contact details */}
                  <div className="mt-5 pt-3 border-t border-border space-y-1.5">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{u.email}</span>
                    </div>
                    {u.phone && (
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span>{u.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </AppShell>
  );
}
