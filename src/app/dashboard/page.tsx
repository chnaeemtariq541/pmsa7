'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { useApp } from '@/context/AppContext';
import { db } from '@/services/db';
import { Project, Task, TaskActivity, UserProfile } from '@/types';
import { 
  Folder, CheckCircle2, Clock, Users, ArrowUpRight, Plus,
  TrendingUp, Activity, ClipboardList, CheckSquare
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { org, projects, allProfiles, role } = useApp();
  
  const [totalTasks, setTotalTasks] = useState(0);
  const [doneTasks, setDoneTasks] = useState(0);
  const [overdueTasks, setOverdueTasks] = useState(0);
  const [activeTasks, setActiveTasks] = useState(0);
  
  const [recentActivities, setRecentActivities] = useState<(TaskActivity & { user: UserProfile, taskTitle: string, projectId: string, projectCode: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (projects.length === 0) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        let tCount = 0;
        let dCount = 0;
        let oCount = 0;
        let aCount = 0;
        let activitiesList: any[] = [];
        
        const now = new Date();

        for (const p of projects) {
          const tasks = await db.getTasks(p.id);
          tCount += tasks.length;
          dCount += tasks.filter(t => t.status === 'done').length;
          aCount += tasks.filter(t => t.status === 'in_progress' || t.status === 'review').length;
          
          // Overdue calculation
          oCount += tasks.filter(t => {
            if (t.status === 'done' || !t.due_date) return false;
            return new Date(t.due_date) < now;
          }).length;

          // Fetch recent activities for this project's tasks
          for (const t of tasks.slice(0, 3)) {
            const logs = await db.getActivityLogs(t.id);
            logs.forEach(log => {
              activitiesList.push({
                ...log,
                taskTitle: t.title,
                projectCode: p.code,
                projectId: p.id
              });
            });
          }
        }

        setTotalTasks(tCount);
        setDoneTasks(dCount);
        setOverdueTasks(oCount);
        setActiveTasks(aCount);

        // Sort activities by date decending
        activitiesList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setRecentActivities(activitiesList.slice(0, 8));
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [projects]);

  const activeProjectsCount = projects.filter(p => p.status === 'active').length;
  const completedProjectsCount = projects.filter(p => p.status === 'completed').length;

  // Render Dashboard
  return (
    <AppShell>
      <div className="space-y-6">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Console Command</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Welcome back to your workspace workspace. Here is your team operations overview.
            </p>
          </div>
          
          {/* Quick actions for managers */}
          {(role === 'super_admin' || role === 'project_manager') && (
            <Link 
              href="/projects" 
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold shadow-sm transition-all duration-200"
            >
              <Plus className="w-4 h-4" /> Create Project
            </Link>
          )}
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* KPI 1 */}
          <div className="p-4 rounded-2xl bg-card border border-border flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Projects</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-105 transition-all">
                <Folder className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-black tracking-tight text-foreground">{projects.length}</span>
              <span className="text-[10px] text-muted-foreground block mt-1">SaaS Workspace focus</span>
            </div>
          </div>

          {/* KPI 2 */}
          <div className="p-4 rounded-2xl bg-card border border-border flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Active Sprints</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-105 transition-all">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-black tracking-tight text-foreground">{activeProjectsCount}</span>
              <span className="text-[10px] text-emerald-500 block mt-1 font-semibold">In active execution</span>
            </div>
          </div>

          {/* KPI 3 */}
          <div className="p-4 rounded-2xl bg-card border border-border flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Completed</span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 group-hover:scale-105 transition-all">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-black tracking-tight text-foreground">{completedProjectsCount}</span>
              <span className="text-[10px] text-indigo-500 block mt-1 font-semibold">Successfully closed</span>
            </div>
          </div>

          {/* KPI 4 */}
          <div className="p-4 rounded-2xl bg-card border border-border flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Overdue Tasks</span>
              <div className="p-2 rounded-xl bg-red-500/10 text-red-500 group-hover:scale-105 transition-all">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className={`text-2xl font-black tracking-tight ${overdueTasks > 0 ? 'text-red-500' : 'text-foreground'}`}>
                {overdueTasks}
              </span>
              <span className="text-[10px] text-muted-foreground block mt-1">Requires PM intervention</span>
            </div>
          </div>

          {/* KPI 5 */}
          <div className="p-4 rounded-2xl bg-card border border-border flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Team Size</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-105 transition-all">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-2xl font-black tracking-tight text-foreground">{allProfiles.length}</span>
              <span className="text-[10px] text-muted-foreground block mt-1">Registered members</span>
            </div>
          </div>
        </div>

        {/* Visual Charts / Layout Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Project Progress Tracker */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-sm flex flex-col justify-between col-span-2">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-primary" /> Active Project Lifecycles
                </h3>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Completion Rates</span>
              </div>
              
              <div className="space-y-4">
                {projects.map((p) => {
                  const tasksCount = 10; // Simple baseline representation
                  const progressPct = p.status === 'completed' ? 100 : p.status === 'planning' ? 15 : 62;
                  
                  return (
                    <div key={p.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <Link href={`/projects/${p.id}/board`} className="font-semibold hover:text-primary transition-all">
                          {p.name} ({p.code})
                        </Link>
                        <span className="font-bold text-muted-foreground">{progressPct}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden flex">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            p.status === 'completed' 
                              ? 'bg-emerald-500' 
                              : p.status === 'on_hold' 
                                ? 'bg-amber-500' 
                                : 'bg-primary'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Productivity Insight bar */}
            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Overall Tasks Done:</span>
              <span className="font-bold text-foreground">
                {doneTasks} / {totalTasks} Tasks ({totalTasks > 0 ? Math.round((doneTasks/totalTasks)*100) : 0}%)
              </span>
            </div>
          </div>

          {/* Quick Metrics donut replacement */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-primary" /> Task Breakdown
                </h3>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Ratios</span>
              </div>

              {totalTasks === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">No tasks inside projects</div>
              ) : (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-muted-foreground">Done</span>
                    </div>
                    <span className="font-bold">{doneTasks} ({Math.round((doneTasks/totalTasks)*100)}%)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span className="text-muted-foreground">Active Work</span>
                    </div>
                    <span className="font-bold">{activeTasks} ({Math.round((activeTasks/totalTasks)*100)}%)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                      <span className="text-muted-foreground">Backlog / Todo</span>
                    </div>
                    <span className="font-bold">
                      {totalTasks - doneTasks - activeTasks} ({Math.round(((totalTasks - doneTasks - activeTasks)/totalTasks)*100)}%)
                    </span>
                  </div>

                  {/* Simple CSS Visual Stack Bar */}
                  <div className="w-full h-3 rounded-full overflow-hidden flex mt-6 bg-muted">
                    <div 
                      className="bg-emerald-500 h-full" 
                      style={{ width: `${(doneTasks/totalTasks)*100}%` }} 
                    />
                    <div 
                      className="bg-blue-500 h-full" 
                      style={{ width: `${(activeTasks/totalTasks)*100}%` }} 
                    />
                    <div 
                      className="bg-slate-500 h-full" 
                      style={{ width: `${((totalTasks - doneTasks - activeTasks)/totalTasks)*100}%` }} 
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border text-[10px] text-muted-foreground text-center leading-normal">
              Breakdown syncs automatically across all board columns.
            </div>
          </div>
        </div>

        {/* Bottom Section: Recent Activity Feed */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary animate-pulse" /> Live Activity Command Logs
            </h3>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Realtime Feed</span>
          </div>

          {loading ? (
            <div className="text-center py-6 text-xs text-muted-foreground">Loading feed...</div>
          ) : recentActivities.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">No recent edits or task logs recorded.</div>
          ) : (
            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {recentActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 border-b border-border/40 pb-3 last:border-none last:pb-0">
                  <img 
                    src={act.user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                    className="w-8 h-8 rounded-full object-cover border border-border mt-0.5"
                    alt="User"
                  />
                  <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-1">
                    <div>
                      <span className="text-xs font-bold text-foreground">{act.user?.name}</span>
                      <span className="text-xs text-muted-foreground"> changed status of task </span>
                      <Link 
                        href={`/projects/${act.projectId}/board`}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        {act.taskTitle}
                      </Link>
                      <span className="text-xs text-muted-foreground"> to </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                        {act.new_value}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(act.created_at).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </AppShell>
  );
}
