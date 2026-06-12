'use client';

import React, { use, useState, useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { useApp } from '@/context/AppContext';
import { db } from '@/services/db';
import { Task } from '@/types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Info, Plus } from 'lucide-react';

export default function CalendarPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const { activeProject, setActiveProject } = useApp();

  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const proj = await db.getProject(projectId);
        setProject(proj);
        if (proj && (!activeProject || activeProject.id !== projectId)) {
          setActiveProject(proj);
        }

        const t = await db.getTasks(projectId);
        setTasks(t.filter(task => task.due_date)); // Only tasks with due dates
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  // Generate calendar grid for June 2026 (Demo layout)
  // June 1, 2026 starts on Monday. So 30 days.
  const juneDays = Array.from({ length: 30 }, (_, i) => i + 1);

  const getTasksForDay = (day: number) => {
    // Return tasks due on 2026-06-{day}
    const dayStr = day.toString().padStart(2, '0');
    const targetDateStr = `2026-06-${dayStr}`;
    return tasks.filter(t => t.due_date && t.due_date.startsWith(targetDateStr));
  };

  return (
    <AppShell>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Deadlines Calendar</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review deadlines, schedule task milestones, and track upcoming deliveries.
            </p>
          </div>

          {/* View Mode toggler */}
          <div className="flex items-center gap-1.5 bg-muted p-1 rounded-xl border border-border">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                viewMode === 'month' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                viewMode === 'week' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                viewMode === 'day' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Day
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/15 text-primary text-xs flex items-start gap-2.5 max-w-3xl">
          <Info className="w-4.5 h-4.5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Milestones drag rescheduling</span>
            <p className="text-primary/80 leading-relaxed">
              Drag-and-drop card blocks between calendar days to instantly update their due dates in the workspace.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-xs text-muted-foreground">Rendering calendar grids...</div>
        ) : (
          <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
            
            {/* Calendar Header selector */}
            <div className="p-4 border-b border-border flex items-center justify-between gap-4 bg-muted/10">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                <span className="font-bold text-sm text-foreground">June 2026</span>
              </div>
              
              <div className="flex items-center gap-1">
                <button className="p-1.5 rounded-lg hover:bg-muted border border-border text-muted-foreground cursor-pointer">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-muted border border-border text-muted-foreground cursor-pointer">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Grid Headers */}
            <div className="grid grid-cols-7 border-b border-border text-center font-mono text-[9px] font-bold text-muted-foreground uppercase bg-muted/20">
              <div className="p-2 border-r border-border last:border-r-0">Mon</div>
              <div className="p-2 border-r border-border last:border-r-0">Tue</div>
              <div className="p-2 border-r border-border last:border-r-0">Wed</div>
              <div className="p-2 border-r border-border last:border-r-0">Thu</div>
              <div className="p-2 border-r border-border last:border-r-0">Fri</div>
              <div className="p-2 border-r border-border last:border-r-0">Sat</div>
              <div className="p-2 border-r border-border last:border-r-0">Sun</div>
            </div>

            {/* Calendar Days grid */}
            <div className="grid grid-cols-7 min-h-[450px]">
              {juneDays.map((day) => {
                const dayTasks = getTasksForDay(day);
                const isToday = day === 9; // Simulated local date: June 9, 2026.
                
                return (
                  <div 
                    key={day} 
                    className={`p-2 border-r border-b border-border/80 last:border-r-0 flex flex-col justify-between group min-h-[90px] ${
                      isToday ? 'bg-primary/5' : 'hover:bg-muted/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold ${
                        isToday 
                          ? 'w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center' 
                          : 'text-muted-foreground'
                      }`}>
                        {day}
                      </span>
                    </div>

                    {/* Task deadlines list for this day */}
                    <div className="flex-1 mt-1.5 space-y-1 overflow-y-auto max-h-[70px] pr-0.5">
                      {dayTasks.map(t => (
                        <div 
                          key={t.id}
                          className={`px-1.5 py-0.5 rounded text-[8px] font-semibold border truncate ${
                            t.status === 'done'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/15'
                              : 'bg-primary/10 text-primary border-primary/15'
                          }`}
                          title={t.title}
                        >
                          {t.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

      </div>
    </AppShell>
  );
}
