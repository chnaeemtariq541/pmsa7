'use client';

import React, { use, useState, useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { useApp } from '@/context/AppContext';
import { db } from '@/services/db';
import { Task, TimeLog, UserProfile, Sprint } from '@/types';
import { BarChart3, Clock, AlertTriangle, CheckCircle2, FileSpreadsheet, Download } from 'lucide-react';

export default function ReportsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const { activeProject, setActiveProject, allProfiles } = useApp();

  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeLogs, setTimeLogs] = useState<(TimeLog & { taskTitle: string; userProfile: UserProfile })[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportsData = async () => {
      try {
        setLoading(true);
        const proj = await db.getProject(projectId);
        setProject(proj);
        if (proj && (!activeProject || activeProject.id !== projectId)) {
          setActiveProject(proj);
        }

        const t = await db.getTasks(projectId);
        setTasks(t);

        const logs = await db.getTimeLogs(projectId);
        setTimeLogs(logs);

        const sp = await db.getSprints(projectId);
        setSprints(sp);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReportsData();
  }, [projectId]);

  // Calculations
  const doneCount = tasks.filter(t => t.status === 'done').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const reviewCount = tasks.filter(t => t.status === 'review').length;
  const backlogCount = tasks.filter(t => t.status === 'backlog' || t.status === 'todo').length;

  const totalEst = tasks.reduce((sum, t) => sum + Number(t.estimated_hours || 0), 0);
  const totalAct = tasks.reduce((sum, t) => sum + Number(t.actual_hours || 0), 0);

  const now = new Date();
  const delayedTasks = tasks.filter(t => {
    if (t.status === 'done' || !t.due_date) return false;
    return new Date(t.due_date) < now;
  });

  // Calculate time logs per user profile
  const userTimeBreakdown: Record<string, { name: string; hours: number; avatar: string }> = {};
  timeLogs.forEach(log => {
    const uid = log.user_id;
    if (!userTimeBreakdown[uid]) {
      userTimeBreakdown[uid] = {
        name: log.userProfile?.name || 'Unknown',
        hours: 0,
        avatar: log.userProfile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
      };
    }
    userTimeBreakdown[uid].hours += Number(log.hours || 0);
  });

  return (
    <AppShell>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Reports & Velocity</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review sprint burndowns, time logging timesheets, delayed deliverables, and performance ratios.
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-xs text-muted-foreground">Generating report metrics...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Progression summary */}
            <div className="space-y-6 lg:col-span-2">
              
              {/* Hour Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-card border border-border">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase">Estimated Hours</span>
                  <h3 className="text-2xl font-black text-foreground mt-1.5 font-mono">{totalEst}h</h3>
                  <span className="text-[10px] text-muted-foreground block mt-1">Sprints baseline est</span>
                </div>
                <div className="p-4 rounded-2xl bg-card border border-border">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase">Actual Logged Hours</span>
                  <h3 className="text-2xl font-black text-primary mt-1.5 font-mono">{totalAct}h</h3>
                  <span className="text-[10px] text-primary block mt-1 font-semibold">
                    {totalEst > 0 ? `${Math.round((totalAct/totalEst)*100)}%` : '0%'} of estimation
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-card border border-border">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase">Delayed Tasks</span>
                  <h3 className={`text-2xl font-black mt-1.5 font-mono ${delayedTasks.length > 0 ? 'text-red-500' : 'text-foreground'}`}>
                    {delayedTasks.length}
                  </h3>
                  <span className="text-[10px] text-muted-foreground block mt-1">Overdue deadline warnings</span>
                </div>
              </div>

              {/* Weekly Time Logs Timesheet */}
              <div className="p-5 rounded-3xl bg-card border border-border shadow-sm">
                <h3 className="font-bold text-xs text-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4.5 h-4.5 text-primary" /> Logged Hours Sheet (Recent)
                </h3>

                <div className="space-y-3">
                  {timeLogs.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-4">No hours logged yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-border bg-muted/20 text-muted-foreground text-[10px] font-bold uppercase">
                            <th className="p-2.5">Member</th>
                            <th className="p-2.5">Task</th>
                            <th className="p-2.5">Hours</th>
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5">Note</th>
                          </tr>
                        </thead>
                        <tbody>
                          {timeLogs.slice(0, 5).map((log) => (
                            <tr key={log.id} className="border-b border-border/50 hover:bg-muted/10 last:border-none">
                              <td className="p-2.5 font-bold flex items-center gap-1.5">
                                <img src={log.userProfile?.avatar_url} className="w-5 h-5 rounded-full object-cover" alt="User" />
                                {log.userProfile?.name}
                              </td>
                              <td className="p-2.5 text-muted-foreground truncate max-w-[150px]">{log.taskTitle}</td>
                              <td className="p-2.5 font-mono font-bold">{log.hours}h</td>
                              <td className="p-2.5 text-muted-foreground font-mono">{log.logged_date}</td>
                              <td className="p-2.5 text-muted-foreground truncate max-w-[120px]">{log.description || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Delayed deliverables warning log */}
              {delayedTasks.length > 0 && (
                <div className="p-5 rounded-3xl bg-destructive/5 border border-destructive/15">
                  <h3 className="font-bold text-xs text-destructive uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <AlertTriangle className="w-4.5 h-4.5 animate-pulse" /> Delayed Deliverables Audit
                  </h3>
                  <div className="space-y-2">
                    {delayedTasks.map(t => (
                      <div key={t.id} className="text-xs flex items-center justify-between border-b border-destructive/10 pb-2 last:border-none last:pb-0">
                        <span className="font-semibold text-foreground">{t.title}</span>
                        <span className="text-[10px] text-destructive font-mono font-bold bg-destructive/10 px-2 py-0.5 rounded border border-destructive/20">
                          Due: {t.due_date ? new Date(t.due_date).toLocaleDateString() : 'TBD'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Right: Team effort breakdown */}
            <div className="space-y-6">
              
              {/* Progress Breakdown */}
              <div className="p-5 rounded-3xl bg-card border border-border shadow-sm">
                <h3 className="font-bold text-xs text-foreground uppercase tracking-wider mb-4">Task Completion Ratios</h3>
                
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Done Tasks</span>
                    <span className="font-bold">{doneCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">In Review Queue</span>
                    <span className="font-bold">{reviewCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">In Active Work</span>
                    <span className="font-bold">{inProgressCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Planned Backlog</span>
                    <span className="font-bold">{backlogCount}</span>
                  </div>

                  {/* Visual Completion bar */}
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden flex mt-4">
                    <div className="bg-emerald-500 h-full" style={{ width: `${tasks.length > 0 ? (doneCount/tasks.length)*100 : 0}%` }} />
                    <div className="bg-indigo-500 h-full" style={{ width: `${tasks.length > 0 ? (reviewCount/tasks.length)*100 : 0}%` }} />
                    <div className="bg-blue-500 h-full" style={{ width: `${tasks.length > 0 ? (inProgressCount/tasks.length)*100 : 0}%` }} />
                  </div>
                </div>
              </div>

              {/* Team Effort Hours Allocation */}
              <div className="p-5 rounded-3xl bg-card border border-border shadow-sm">
                <h3 className="font-bold text-xs text-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" /> Workload Allocation
                </h3>

                <div className="space-y-3 pt-1">
                  {Object.keys(userTimeBreakdown).length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-2">No logging recorded by team.</p>
                  ) : (
                    Object.values(userTimeBreakdown).map((user, i) => (
                      <div key={i} className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <img src={user.avatar} className="w-6.5 h-6.5 rounded-full object-cover" alt="User" />
                          <span className="font-semibold text-foreground truncate max-w-[120px]">{user.name}</span>
                        </div>
                        <span className="font-mono font-bold text-primary bg-primary/5 px-2.5 py-0.5 rounded border border-primary/10">
                          {user.hours} hrs
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </AppShell>
  );
}
