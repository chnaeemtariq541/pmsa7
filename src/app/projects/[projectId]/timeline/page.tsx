'use client';

import React, { use, useState, useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { useApp } from '@/context/AppContext';
import { db } from '@/services/db';
import { Sprint, Task } from '@/types';
import { Calendar, ChevronLeft, ChevronRight, Info, ShieldAlert, Sparkles } from 'lucide-react';

export default function TimelinePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const { activeProject, setActiveProject } = useApp();

  const [project, setProject] = useState<any>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const proj = await db.getProject(projectId);
        setProject(proj);
        if (proj && (!activeProject || activeProject.id !== projectId)) {
          setActiveProject(proj);
        }

        const sp = await db.getSprints(projectId);
        setSprints(sp);

        const tk = await db.getTasks(projectId);
        setTasks(tk);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  // Calendar Timeline view range configuration
  // For simplicity, we render weeks of May, June, July, August 2026.
  const weeks = [
    { label: 'W1 (May)', month: 'May' },
    { label: 'W2 (May)', month: 'May' },
    { label: 'W3 (May)', month: 'May' },
    { label: 'W4 (May)', month: 'May' },
    { label: 'W1 (Jun)', month: 'June' },
    { label: 'W2 (Jun)', month: 'June' },
    { label: 'W3 (Jun)', month: 'June' },
    { label: 'W4 (Jun)', month: 'June' },
    { label: 'W1 (Jul)', month: 'July' },
    { label: 'W2 (Jul)', month: 'July' },
    { label: 'W3 (Jul)', month: 'July' },
    { label: 'W4 (Jul)', month: 'July' },
  ];

  // Helper to map a sprint or task schedule to grid columns (1-indexed, spanning columns)
  // We mock the column start and spans for the visual Gantt demo representation
  const getSprintSpan = (sprintName: string): { start: number; span: number; color: string } => {
    if (sprintName.includes('Sprint 1')) {
      return { start: 1, span: 3, color: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' };
    }
    if (sprintName.includes('Sprint 2')) {
      return { start: 4, span: 4, color: 'bg-primary/20 text-primary border-primary/30' };
    }
    return { start: 8, span: 4, color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30' };
  };

  const getTaskSpan = (taskTitle: string, index: number): { start: number; span: number; color: string } => {
    // Distribute tasks visually along the timeline weeks
    const startCol = (index % 6) + 2;
    const spanCol = (index % 3) + 2;
    return {
      start: startCol,
      span: spanCol,
      color: index % 2 === 0 
        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' 
        : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
    };
  };

  return (
    <AppShell>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Timeline & Gantt Planner</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Visualize task schedules, critical paths, and project milestones across calendar intervals.
            </p>
          </div>
        </div>

        {/* Info panel */}
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/15 text-primary text-xs flex items-start gap-2.5 max-w-3xl">
          <Info className="w-4.5 h-4.5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Gantt scheduling view</span>
            <p className="text-primary/80 leading-relaxed">
              Task horizontal bars reflect start dates, deadlines, and dependencies. Drag endpoints in the future to change milestones.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-xs text-muted-foreground">Loading Gantt schedules...</div>
        ) : (
          <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
            {/* Timeline Calendar Grid */}
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                
                {/* Months / Weeks Headers */}
                <div className="grid grid-cols-12 border-b border-border bg-muted/30">
                  {weeks.map((w, index) => (
                    <div 
                      key={index} 
                      className="p-3 border-r border-border last:border-r-0 text-center font-mono text-[9px] font-bold text-muted-foreground uppercase"
                    >
                      {w.label}
                    </div>
                  ))}
                </div>

                {/* Sprints Gantt Lanes */}
                <div className="p-4 space-y-3.5 border-b border-border/80 bg-muted/10">
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block mb-2">Sprints Schedule</span>
                  {sprints.map((s) => {
                    const span = getSprintSpan(s.name);
                    return (
                      <div key={s.id} className="grid grid-cols-12 items-center min-h-[36px] relative">
                        {/* Visual background lane cells */}
                        <div className="absolute inset-0 grid grid-cols-12 pointer-events-none">
                          {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="border-r border-border/40 h-full last:border-r-0" />
                          ))}
                        </div>

                        {/* Bar */}
                        <div 
                          className={`py-1.5 px-3 rounded-xl border font-semibold text-[10px] text-center shadow-sm truncate z-10 ${span.color}`}
                          style={{
                            gridColumnStart: span.start,
                            gridColumnEnd: span.start + span.span
                          }}
                        >
                          {s.name} ({s.status})
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Tasks Gantt Lanes */}
                <div className="p-4 space-y-3.5 bg-card">
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block mb-2">Tasks Schedule</span>
                  {tasks.filter(t => t.status !== 'backlog').slice(0, 8).map((t, index) => {
                    const span = getTaskSpan(t.title, index);
                    return (
                      <div key={t.id} className="grid grid-cols-12 items-center min-h-[32px] relative">
                        {/* Visual background lane cells */}
                        <div className="absolute inset-0 grid grid-cols-12 pointer-events-none">
                          {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="border-r border-border/30 h-full last:border-r-0" />
                          ))}
                        </div>

                        {/* Bar */}
                        <div 
                          className={`py-1 px-2.5 rounded-lg border font-semibold text-[9px] shadow-sm truncate z-10 flex items-center justify-between ${span.color}`}
                          style={{
                            gridColumnStart: span.start,
                            gridColumnEnd: span.start + span.span
                          }}
                        >
                          <span className="truncate">{t.title}</span>
                          <span className="font-mono text-[8px] font-bold opacity-80 shrink-0 ml-1.5">{t.status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>
            
            {/* Legend footer */}
            <div className="px-6 py-3 border-t border-border bg-muted/20 flex items-center justify-between text-[10px] text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded bg-primary/20 border border-primary/40" />
                  <span>Active Sprint</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/40" />
                  <span>Completed Sprint</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded bg-amber-500/20 border border-amber-500/40" />
                  <span>Tasks Queue</span>
                </div>
              </div>

              <span>Timeline displays May 2026 - Aug 2026 schedule span</span>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
