'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { useApp } from '@/context/AppContext';
import { db } from '@/services/db';
import { Task, TimeLog, Project } from '@/types';
import { Clock, Plus, FileText, Check, AlertCircle, ArrowUpRight, DollarSign } from 'lucide-react';

export default function TimePage() {
  const { user, projects, reloadProjects } = useApp();

  const [timeLogs, setTimeLogs] = useState<(TimeLog & { taskTitle: string })[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Selection helpers
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [logHours, setLogHours] = useState(1);
  const [logDesc, setLogDesc] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    if (projects.length === 0) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      let list: any[] = [];
      for (const p of projects) {
        const logs = await db.getTimeLogs(p.id);
        list = [...list, ...logs];
      }
      // Sort logs decending
      list.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setTimeLogs(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [projects]);

  // Load tasks when project selection changes in form
  useEffect(() => {
    if (!selectedProjectId) {
      setTasks([]);
      return;
    }
    const fetchProjTasks = async () => {
      try {
        const projTasks = await db.getTasks(selectedProjectId);
        // Exclude closed tasks if wanted, but standard time track allows any
        setTasks(projTasks);
        if (projTasks.length > 0) setSelectedTaskId(projTasks[0].id);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProjTasks();
  }, [selectedProjectId]);

  // Set default project selection
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects]);

  const handleManualLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskId || !user) {
      setError('Please select a project task to log hours.');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      await db.createTimeLog(
        selectedTaskId,
        user.id,
        logHours,
        logDesc || 'Logged from dashboard timesheet',
        logDate
      );
      
      // Reset
      setLogDesc('');
      setLogHours(1);
      
      // Refresh
      await fetchLogs();
      await reloadProjects();
    } catch (err: any) {
      setError(err.message || 'Failed to submit log entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalLoggedHours = timeLogs.reduce((sum, log) => sum + Number(log.hours || 0), 0);
  const billableHours = Math.round(totalLoggedHours * 0.85); // 85% simulated billable hours

  return (
    <AppShell>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Time Logs & Sheets</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Submit manual work summaries, view timesheets, and review weekly workloads.
            </p>
          </div>
        </div>

        {/* Stats & Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Form manual input */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-sm lg:col-span-2">
            <h3 className="font-bold text-xs text-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Clock className="w-4.5 h-4.5 text-primary animate-pulse" /> Manual Time Logs Form
            </h3>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleManualLogSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Select Project</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs p-3 text-foreground"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Select Task</label>
                  <select
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs p-3 text-foreground"
                    required
                  >
                    {tasks.length === 0 ? (
                      <option value="">No active tasks on project</option>
                    ) : (
                      tasks.map(t => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Hours Logged</label>
                  <input
                    type="number"
                    value={logHours}
                    onChange={(e) => setLogHours(Number(e.target.value))}
                    step={0.1}
                    min={0.1}
                    className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs p-3 text-foreground font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Log Date</label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs p-3 text-foreground"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Work Description</label>
                <textarea
                  value={logDesc}
                  onChange={(e) => setLogDesc(e.target.value)}
                  placeholder="Describe your progress completed during this tracked session..."
                  className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs p-3 h-20 resize-none text-foreground"
                  required
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting || tasks.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  {submitting ? 'Logging hours...' : 'Submit Log Entry'}
                </button>
              </div>
            </form>
          </div>

          {/* Timesheet Summary Metrics widgets */}
          <div className="space-y-4">
            
            {/* Hour summary */}
            <div className="p-5 rounded-3xl bg-card border border-border shadow-sm">
              <span className="text-[9px] font-bold text-muted-foreground uppercase">Total Work Logged</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-foreground font-mono">{totalLoggedHours}h</span>
                <span className="text-xs text-muted-foreground">accumulated</span>
              </div>
              
              <div className="mt-4 pt-4 border-t border-border space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    <span>Billable Hours (85%)</span>
                  </div>
                  <span className="font-bold text-foreground font-mono">{billableHours}h</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Weekly Target Goal</span>
                  </div>
                  <span className="font-bold text-foreground font-mono">40h</span>
                </div>
              </div>
            </div>

            {/* Quote of operations */}
            <div className="p-5 rounded-3xl bg-primary/5 border border-primary/10">
              <h4 className="font-bold text-xs text-primary mb-1">Stopwatch tracking</h4>
              <p className="text-[10px] text-primary/80 leading-normal">
                Prefer live timings? Find any card on the Kanban Board page, click it, and launch the floating Live Stopwatch to record timings automatically at 100% precision.
              </p>
            </div>

          </div>
        </div>

        {/* Audit Sheet History Table */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <FileText className="w-4.5 h-4.5 text-muted-foreground" /> Timesheet Audit Logs
            </h3>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Logged Entries</span>
          </div>

          {loading ? (
            <div className="text-center py-6 text-xs text-muted-foreground">Loading timesheet records...</div>
          ) : timeLogs.length === 0 ? (
            <p className="text-xs text-muted-foreground italic text-center py-4">No hours logged in this workspace yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-muted-foreground text-[10px] font-bold uppercase">
                    <th className="p-3">Team Member</th>
                    <th className="p-3">Task Title</th>
                    <th className="p-3">Tracked Hours</th>
                    <th className="p-3">Logged Date</th>
                    <th className="p-3">Progress Memo Note</th>
                  </tr>
                </thead>
                <tbody>
                  {timeLogs.map((log) => (
                    <tr key={log.id} className="border-b border-border/50 hover:bg-muted/10 last:border-none">
                      <td className="p-3 font-bold flex items-center gap-1.5">
                        <img 
                          src={(log as any).userProfile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                          className="w-6 h-6 rounded-full object-cover border border-border" 
                          alt="User" 
                        />
                        {(log as any).userProfile?.name || 'Workspace Member'}
                      </td>
                      <td className="p-3 text-muted-foreground truncate max-w-sm">{(log as any).taskTitle}</td>
                      <td className="p-3 font-mono font-bold text-foreground">{log.hours} hrs</td>
                      <td className="p-3 text-muted-foreground font-mono">{log.logged_date}</td>
                      <td className="p-3 text-muted-foreground max-w-xs truncate">{log.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </AppShell>
  );
}
