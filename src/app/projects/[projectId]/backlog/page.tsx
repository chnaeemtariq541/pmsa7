'use client';

import React, { use, useState, useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { useApp } from '@/context/AppContext';
import { db } from '@/services/db';
import { Sprint, Task, TaskPriority, TaskStatus, SprintStatus } from '@/types';
import { 
  Plus, Play, Check, X, Calendar, Flame, AlertCircle, 
  ChevronDown, ChevronRight, MoreHorizontal, ArrowRight, ShieldAlert
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function BacklogPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const { role, activeProject, setActiveProject, allProfiles, user } = useApp();

  const [project, setProject] = useState<any>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Sprint form
  const [isCreateSprintOpen, setIsCreateSprintOpen] = useState(false);
  const [sprintName, setSprintName] = useState('');
  const [sprintGoal, setSprintGoal] = useState('');
  const [sprintStart, setSprintStart] = useState('');
  const [sprintEnd, setSprintEnd] = useState('');

  // Expand state
  const [expandedSprints, setExpandedSprints] = useState<Record<string, boolean>>({
    'backlog': true
  });

  const canManage = role === 'super_admin' || role === 'project_manager';

  const fetchData = async () => {
    try {
      setLoading(true);
      const proj = await db.getProject(projectId);
      setProject(proj);
      if (proj && (!activeProject || activeProject.id !== projectId)) {
        setActiveProject(proj);
      }

      const activeSprints = await db.getSprints(projectId);
      setSprints(activeSprints);

      const activeTasks = await db.getTasks(projectId);
      setTasks(activeTasks);

      // Set expand default for active sprint
      const activeSp = activeSprints.find(s => s.status === 'active');
      if (activeSp) {
        setExpandedSprints(prev => ({ ...prev, [activeSp.id]: true }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const toggleExpand = (sprintId: string) => {
    setExpandedSprints(prev => ({ ...prev, [sprintId]: !prev[sprintId] }));
  };

  const handleCreateSprintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sprintName.trim()) return;

    try {
      await db.createSprint(projectId, {
        name: sprintName,
        goal: sprintGoal || undefined,
        start_date: sprintStart ? new Date(sprintStart).toISOString() : undefined,
        end_date: sprintEnd ? new Date(sprintEnd).toISOString() : undefined,
        status: 'upcoming'
      });

      setSprintName('');
      setSprintGoal('');
      setSprintStart('');
      setSprintEnd('');
      setIsCreateSprintOpen(false);
      
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartSprint = async (sprintId: string) => {
    try {
      await db.updateSprint(sprintId, { 
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString() // 2 weeks default
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteSprint = async (sprintId: string) => {
    if (!window.confirm('Are you sure you want to complete this sprint? All uncompleted tasks will remain in the backlog.')) {
      return;
    }

    try {
      await db.updateSprint(sprintId, { status: 'completed' });
      
      // Celebrate completion
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.8 }
      });
      
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveTaskSprint = async (taskId: string, targetSprintId: string | null) => {
    try {
      await db.updateTask(taskId, { sprint_id: targetSprintId || undefined }, user?.id);
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTasks = async () => {
    const activeTasks = await db.getTasks(projectId);
    setTasks(activeTasks);
  };

  const getPriorityColor = (p: TaskPriority) => {
    const maps = {
      low: 'bg-slate-500/10 text-slate-500',
      medium: 'bg-blue-500/10 text-blue-500',
      high: 'bg-orange-500/10 text-orange-500',
      critical: 'bg-red-500/10 text-red-500'
    };
    return maps[p] || maps.medium;
  };

  const getStatusColor = (s: TaskStatus) => {
    const maps = {
      backlog: 'bg-slate-500/10 text-slate-500',
      todo: 'bg-blue-500/10 text-blue-500',
      in_progress: 'bg-amber-500/10 text-amber-500',
      review: 'bg-indigo-500/10 text-indigo-500',
      done: 'bg-emerald-500/10 text-emerald-500'
    };
    return maps[s] || maps.todo;
  };

  // Sprints layout details
  const renderSprintTasks = (sprintId: string | null) => {
    const sprintTasks = tasks.filter(t => sprintId ? t.sprint_id === sprintId : !t.sprint_id);
    
    if (sprintTasks.length === 0) {
      return (
        <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border/40 rounded-xl my-2">
          Drag/move tasks into this queue to start planning.
        </div>
      );
    }

    return (
      <div className="space-y-1.5 mt-2">
        {sprintTasks.map((t) => {
          const assignee = allProfiles.find(u => u.id === t.assignee_id);
          return (
            <div 
              key={t.id}
              className="p-3 bg-card border border-border hover:border-primary/40 rounded-xl flex items-center justify-between gap-4 transition-all duration-150"
            >
              {/* Left section: code, status, title */}
              <div className="flex items-center gap-3 truncate min-w-0">
                <span className="text-[10px] font-mono font-bold text-muted-foreground w-12 shrink-0">
                  {project?.code}-{t.id.split('-')[1] || t.id.substring(0,3)}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getStatusColor(t.status)} shrink-0`}>
                  {t.status}
                </span>
                <span className="text-xs font-semibold text-foreground truncate">{t.title}</span>
              </div>

              {/* Right section: Priority, hours, assignee, Move dropdown */}
              <div className="flex items-center gap-3 shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getPriorityColor(t.priority)}`}>
                  {t.priority}
                </span>
                
                {t.estimated_hours > 0 && (
                  <span className="text-[9px] font-mono font-bold bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                    {t.estimated_hours}h
                  </span>
                )}

                {assignee ? (
                  <img 
                    src={assignee.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'} 
                    className="w-5.5 h-5.5 rounded-full object-cover border border-border" 
                    title={assignee.name}
                    alt="User"
                  />
                ) : (
                  <div className="w-5.5 h-5.5 rounded-full bg-muted flex items-center justify-center text-[9px] text-muted-foreground border border-dashed border-border">
                    ?
                  </div>
                )}

                {/* Move option */}
                {canManage && (
                  <select
                    onChange={(e) => {
                      const val = e.target.value;
                      handleMoveTaskSprint(t.id, val === 'backlog' ? null : val);
                    }}
                    value={sprintId || 'backlog'}
                    className="bg-muted text-foreground text-[10px] font-bold py-1 px-2 rounded-lg border border-border/80 focus:outline-none cursor-pointer"
                  >
                    <option value="backlog">Backlog</option>
                    {sprints.filter(s => s.status !== 'completed').map(s => (
                      <option key={s.id} value={s.id}>{s.name.substring(0,12)}...</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <AppShell>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Sprint Backlog</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Plan iterations, manage upcoming sprints, and distribute developer workloads.
            </p>
          </div>

          {canManage && (
            <button
              onClick={() => setIsCreateSprintOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold shadow transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Sprint
            </button>
          )}
        </div>

        {/* Backlog Planning Dashboard */}
        {loading ? (
          <div className="text-center py-20 text-xs text-muted-foreground">Loading backlog content...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Col: Sprint Backlog Panels */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Sprints listing */}
              {sprints.map((s) => {
                const isExpanded = expandedSprints[s.id];
                const sprintTasks = tasks.filter(t => t.sprint_id === s.id);
                const doneCount = sprintTasks.filter(t => t.status === 'done').length;
                const totalHours = sprintTasks.reduce((sum, t) => sum + Number(t.estimated_hours || 0), 0);

                return (
                  <div key={s.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                    {/* Header */}
                    <div className="p-4 flex items-center justify-between gap-4 bg-muted/20 border-b border-border">
                      <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleExpand(s.id)}>
                        {isExpanded ? <ChevronDown className="w-4.5 h-4.5 text-muted-foreground" /> : <ChevronRight className="w-4.5 h-4.5 text-muted-foreground" />}
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground flex items-center gap-2">
                            {s.name}
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                              s.status === 'active' 
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                : s.status === 'completed' 
                                  ? 'bg-slate-500/10 text-slate-500 border-slate-500/20' 
                                  : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            }`}>
                              {s.status}
                            </span>
                          </span>
                          {s.goal && <span className="text-[10px] text-muted-foreground mt-0.5 leading-none">{s.goal}</span>}
                        </div>
                      </div>

                      {/* Right section metrics & actions */}
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[10px] font-mono font-bold text-muted-foreground">
                          {doneCount} / {sprintTasks.length} tasks done • {totalHours}h est.
                        </span>
                        
                        {canManage && (
                          <>
                            {s.status === 'upcoming' && (
                              <button
                                onClick={() => handleStartSprint(s.id)}
                                className="flex items-center gap-1 py-1 px-3.5 bg-primary hover:bg-primary/95 text-primary-foreground text-[10px] font-extrabold rounded-lg transition-all"
                              >
                                <Play className="w-3 h-3 fill-current" /> Start Sprint
                              </button>
                            )}
                            {s.status === 'active' && (
                              <button
                                onClick={() => handleCompleteSprint(s.id)}
                                className="flex items-center gap-1 py-1 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-extrabold rounded-lg transition-all"
                              >
                                <Check className="w-3 h-3" /> Complete Sprint
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Expand Tasks */}
                    {isExpanded && (
                      <div className="p-4 bg-card">
                        {renderSprintTasks(s.id)}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Backlog panel */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="p-4 flex items-center justify-between gap-4 bg-muted/20 border-b border-border">
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleExpand('backlog')}>
                    {expandedSprints['backlog'] ? <ChevronDown className="w-4.5 h-4.5 text-muted-foreground" /> : <ChevronRight className="w-4.5 h-4.5 text-muted-foreground" />}
                    <span className="text-xs font-bold text-foreground">Backlog (Unplanned Queue)</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-muted-foreground">
                    {tasks.filter(t => !t.sprint_id).length} items
                  </span>
                </div>
                {expandedSprints['backlog'] && (
                  <div className="p-4 bg-card">
                    {renderSprintTasks(null)}
                  </div>
                )}
              </div>

            </div>

            {/* Right Col: Agile Metrics Dashboard */}
            <div className="space-y-6">
              
              {/* Sprint Velocity */}
              <div className="p-5 rounded-3xl bg-card border border-border shadow-sm">
                <h3 className="font-bold text-xs text-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-primary animate-pulse" /> Agile Velocity Logs
                </h3>
                
                <div className="space-y-3.5 pt-2">
                  {sprints.filter(s => s.status === 'completed').length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No completed sprints to compute velocity.</p>
                  ) : (
                    sprints.filter(s => s.status === 'completed').map(s => {
                      const spTasks = tasks.filter(t => t.sprint_id === s.id);
                      const completedPct = spTasks.length > 0 ? Math.round((spTasks.filter(t => t.status === 'done').length / spTasks.length) * 100) : 0;
                      return (
                        <div key={s.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-foreground">{s.name}</span>
                            <span className="font-bold text-muted-foreground">{completedPct}% success</span>
                          </div>
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${completedPct}%` }} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Burndown visual widget mockup */}
              <div className="p-5 rounded-3xl bg-card border border-border shadow-sm">
                <h3 className="font-bold text-xs text-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-500" /> Active Burn-Down Chart
                </h3>

                {/* SVG Mock Burn-down chart */}
                <div className="w-full h-32 flex items-end justify-between relative mt-2">
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                    <div className="border-t border-border w-full" />
                    <div className="border-t border-border w-full" />
                    <div className="border-t border-border w-full" />
                    <div className="border-t border-border w-full" />
                  </div>

                  {/* SVG Line representation */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Guideline */}
                    <line x1="0" y1="10" x2="100" y2="90" stroke="hsl(var(--muted-foreground) / 0.3)" strokeWidth="1" strokeDasharray="3" />
                    {/* Actual burn */}
                    <polyline
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="2.5"
                      points="0,10 20,20 40,30 60,65 80,75 100,85"
                    />
                  </svg>

                  {/* X Axis indicators */}
                  <div className="absolute bottom-[-18px] left-0 right-0 flex justify-between text-[8px] text-muted-foreground font-mono">
                    <span>Day 1</span>
                    <span>Day 5</span>
                    <span>Day 10</span>
                    <span>Day 14</span>
                  </div>
                </div>

                <div className="text-[10px] text-muted-foreground leading-normal mt-7 text-center">
                  Guideline (gray) vs. Actual Burn (blue) in hours.
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Create Sprint Modal */}
        {isCreateSprintOpen && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 animate-slide-up">
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <ShieldAlert className="w-4.5 h-4.5 text-primary" /> Create Agile Sprint
                </h3>
                <button
                  onClick={() => setIsCreateSprintOpen(false)}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateSprintSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Sprint Name</label>
                  <input
                    type="text"
                    value={sprintName}
                    onChange={(e) => setSprintName(e.target.value)}
                    placeholder="e.g. Sprint 3: Polish & Deploy"
                    className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs p-3 text-foreground"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Sprint Goal</label>
                  <textarea
                    value={sprintGoal}
                    onChange={(e) => setSprintGoal(e.target.value)}
                    placeholder="Describe the sprint goal focus..."
                    className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs p-3 h-20 resize-none text-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Start Date</label>
                    <input
                      type="date"
                      value={sprintStart}
                      onChange={(e) => setSprintStart(e.target.value)}
                      className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs p-3 text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">End Date</label>
                    <input
                      type="date"
                      value={sprintEnd}
                      onChange={(e) => setSprintEnd(e.target.value)}
                      className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs p-3 text-foreground"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsCreateSprintOpen(false)}
                    className="px-4 py-2 rounded-lg hover:bg-muted text-xs text-muted-foreground font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold cursor-pointer"
                  >
                    Create Sprint
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
