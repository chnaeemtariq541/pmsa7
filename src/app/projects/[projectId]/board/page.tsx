'use client';

import React, { use, useState, useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { useApp } from '@/context/AppContext';
import { db } from '@/services/db';
import { Task, TaskStatus, TaskPriority, UserProfile, TaskComment, TaskAttachment, TaskActivity } from '@/types';
import { 
  Plus, Search, Filter, ShieldAlert, Clock, Play, UserPlus, 
  Paperclip, Trash2, Send, CornerDownRight, CheckSquare, Edit,
  X, Check, AlertCircle, FileText, ArrowRight, MessageSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function BoardPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const { 
    user, role, activeProject, setActiveProject, projects,
    allProfiles, startTimer, timer
  } = useApp();

  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  
  // Filters
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');

  // Modal / Drawer states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<(TaskComment & { author: UserProfile })[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [activityLogs, setActivityLogs] = useState<(TaskActivity & { user: UserProfile })[]>([]);

  // Task creation form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newStatus, setNewStatus] = useState<TaskStatus>('todo');
  const [newAssignee, setNewAssignee] = useState('');
  const [newEstHours, setNewEstHours] = useState(0);
  const [newLabels, setNewLabels] = useState('');

  // Comment form
  const [commentContent, setCommentContent] = useState('');
  const [mentionSuggestions, setMentionSuggestions] = useState<UserProfile[]>([]);
  const [mentionQuery, setMentionQuery] = useState('');

  // Time logging
  const [isLogHoursOpen, setIsLogHoursOpen] = useState(false);
  const [logHours, setLogHours] = useState(1);
  const [logDesc, setLogDesc] = useState('');

  // Loader states
  const [loading, setLoading] = useState(true);
  const [taskFormLoading, setTaskFormLoading] = useState(false);

  // Sync active project if page loaded directly
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const proj = await db.getProject(projectId);
        setProject(proj);
        if (proj && (!activeProject || activeProject.id !== projectId)) {
          setActiveProject(proj);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchProject();
  }, [projectId]);

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await db.getTasks(projectId);
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  // Apply filters
  useEffect(() => {
    let result = [...tasks];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)
      );
    }

    if (filterPriority !== 'all') {
      result = result.filter(t => t.priority === filterPriority);
    }

    if (filterAssignee !== 'all') {
      result = result.filter(t => t.assignee_id === filterAssignee);
    }

    setFilteredTasks(result);
  }, [tasks, search, filterPriority, filterAssignee]);

  // Task Details Drawer Loader
  const handleOpenDrawer = async (task: Task) => {
    setSelectedTask(task);
    try {
      const c = await db.getComments(task.id);
      const a = await db.getAttachments(task.id);
      const logs = await db.getActivityLogs(task.id);
      setComments(c);
      setAttachments(a);
      setActivityLogs(logs);
    } catch (err) {
      console.error('Drawer logs fetch failed:', err);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate || taskToUpdate.status === targetStatus) return;

    try {
      // Optimistic UI update
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: targetStatus } : t));
      
      await db.updateTask(taskId, { status: targetStatus }, user?.id);
      
      // If task is completed, shoot confetti!
      if (targetStatus === 'done') {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 }
        });
      }

      // Refresh data
      const data = await db.getTasks(projectId);
      setTasks(data);

      // Update current selected drawer task if open
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(prev => prev ? { ...prev, status: targetStatus } : null);
        const logs = await db.getActivityLogs(taskId);
        setActivityLogs(logs);
      }
    } catch (err) {
      console.error('Drag update failed:', err);
      fetchTasks();
    }
  };

  // Create Task Form Submit
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setTaskFormLoading(true);

    try {
      const parsedLabels = newLabels.split(',').map(l => l.trim()).filter(Boolean);
      await db.createTask(projectId, {
        title: newTitle,
        description: newDesc,
        priority: newPriority,
        status: newStatus,
        assignee_id: newAssignee || undefined,
        reporter_id: user?.id,
        labels: parsedLabels,
        estimated_hours: newEstHours,
        created_by: user?.id
      });

      // Clear
      setNewTitle('');
      setNewDesc('');
      setNewPriority('medium');
      setNewStatus('todo');
      setNewAssignee('');
      setNewEstHours(0);
      setNewLabels('');
      setIsCreateOpen(false);

      fetchTasks();
    } catch (err) {
      console.error(err);
    } finally {
      setTaskFormLoading(false);
    }
  };

  // Drawer changes: Assignee, Priority, Status dropdowns
  const handleUpdateTaskField = async (field: keyof Task, val: any) => {
    if (!selectedTask) return;
    try {
      const updated = await db.updateTask(selectedTask.id, { [field]: val }, user?.id);
      setSelectedTask(updated);
      setTasks(prev => prev.map(t => t.id === selectedTask.id ? updated : t));
      const logs = await db.getActivityLogs(selectedTask.id);
      setActivityLogs(logs);
      
      if (field === 'status' && val === 'done') {
        confetti({ particleCount: 50, spread: 40 });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Comments submit with mentions handler
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || !selectedTask || !user) return;

    try {
      await db.createComment(selectedTask.id, user.id, commentContent);
      setCommentContent('');
      const c = await db.getComments(selectedTask.id);
      setComments(c);
    } catch (err) {
      console.error(err);
    }
  };

  // Parsing content for rendering @mentions inside comment feeds
  const renderCommentContent = (content: string) => {
    const mentionRegex = /@([a-zA-Z0-9.\s]+)/g;
    const parts = content.split(mentionRegex);
    if (parts.length === 1) return content;

    return parts.map((part, index) => {
      // Matches username profile
      const matched = allProfiles.find(p => p.name.toLowerCase().includes(part.toLowerCase()) || p.email.toLowerCase().startsWith(part.toLowerCase()));
      if (matched && index % 2 === 1) {
        return (
          <span key={index} className="text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded text-xs select-none">
            @{matched.name}
          </span>
        );
      }
      return part;
    });
  };

  // Time logging modal submit
  const handleTimeLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !user) return;
    try {
      await db.createTimeLog(
        selectedTask.id,
        user.id,
        logHours,
        logDesc || 'Logged manually from details drawer',
        new Date().toISOString().split('T')[0]
      );
      
      setLogDesc('');
      setLogHours(1);
      setIsLogHoursOpen(false);

      // Refresh task detail metrics
      const updatedTask = await db.getTasks(projectId);
      setTasks(updatedTask);
      const selectRecheck = updatedTask.find(t => t.id === selectedTask.id);
      if (selectRecheck) setSelectedTask(selectRecheck);

      const logs = await db.getActivityLogs(selectedTask.id);
      setActivityLogs(logs);
    } catch (err) {
      console.error(err);
    }
  };

  // Mock upload attachment
  const handleMockAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedTask || !user || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    
    try {
      await db.createAttachment(selectedTask.id, {
        name: file.name,
        url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500', // Mock representation url
        size: file.size,
        type: file.type || 'application/octet-stream',
        uploaded_by: user.id
      });
      const a = await db.getAttachments(selectedTask.id);
      setAttachments(a);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAttachment = async (id: string) => {
    try {
      await db.deleteAttachment(id);
      const a = await db.getAttachments(selectedTask!.id);
      setAttachments(a);
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityFlag = (p: TaskPriority) => {
    const colors = {
      low: 'text-slate-400',
      medium: 'text-blue-500',
      high: 'text-orange-500',
      critical: 'text-red-500 font-extrabold animate-pulse'
    };
    return colors[p] || colors.medium;
  };

  // Columns specification
  const columns: { status: TaskStatus; label: string; color: string }[] = [
    { status: 'backlog', label: 'Backlog', color: 'border-slate-500/30 bg-slate-500/5' },
    { status: 'todo', label: 'To Do', color: 'border-blue-500/30 bg-blue-500/5' },
    { status: 'in_progress', label: 'In Progress', color: 'border-amber-500/30 bg-amber-500/5' },
    { status: 'review', label: 'Review Queue', color: 'border-indigo-500/30 bg-indigo-500/5' },
    { status: 'done', label: 'Done', color: 'border-emerald-500/30 bg-emerald-500/5' },
  ];

  return (
    <AppShell>
      <div className="space-y-6 h-full flex flex-col">
        
        {/* Board Header Title & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5 shrink-0">
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              {project?.name || 'Project Board'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Drag-and-drop tasks to update status pipelines. Syncs instantly across active team logs.
            </p>
          </div>

          {role !== 'client' && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold shadow transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Task
            </button>
          )}
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/30 p-3 rounded-2xl border border-border/80 shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search board..."
                className="bg-card border border-border focus:border-primary rounded-xl text-xs pl-9 pr-3.5 py-2 w-48 md:w-60 focus:outline-none"
              />
            </div>
            
            {/* Priority Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="bg-card text-foreground text-xs font-semibold py-2 px-3 rounded-xl border border-border focus:outline-none"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="critical">Critical Priority</option>
              </select>
            </div>

            {/* Assignee Filter */}
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="bg-card text-foreground text-xs font-semibold py-2 px-3 rounded-xl border border-border focus:outline-none"
            >
              <option value="all">All Assignees</option>
              {allProfiles.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="text-[10px] font-bold text-muted-foreground uppercase">
            Showing {filteredTasks.length} / {tasks.length} tasks
          </div>
        </div>

        {/* Columns Grid */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20 text-xs text-muted-foreground">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mr-2" />
            Loading project board...
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
            {columns.map((col) => {
              const colTasks = filteredTasks.filter(t => t.status === col.status);
              return (
                <div
                  key={col.status}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.status)}
                  className={`rounded-2xl border ${col.color} p-3 flex flex-col min-w-[220px] max-h-[70vh] overflow-hidden`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-3 border-b border-border/60 pb-2 shrink-0">
                    <span className="font-bold text-xs text-foreground uppercase tracking-wider">{col.label}</span>
                    <span className="text-[10px] font-bold bg-muted-foreground/15 text-muted-foreground px-2 py-0.5 rounded-full">
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Column Body - Draggable Cards Container */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 kanban-column-scroll">
                    {colTasks.map((t) => {
                      const assignee = allProfiles.find(u => u.id === t.assignee_id);
                      return (
                        <div
                          key={t.id}
                          draggable={role !== 'client'}
                          onDragStart={(e) => handleDragStart(e, t.id)}
                          onClick={() => handleOpenDrawer(t)}
                          className="p-3.5 bg-card border border-border hover:border-primary/50 rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all duration-150 relative group"
                        >
                          <div className="flex flex-col gap-2">
                            {/* Card Header: Project tag & Priority flag */}
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono font-bold text-muted-foreground">
                                {project?.code}-{t.id.split('-')[1] || t.id.substring(0,3)}
                              </span>
                              <span className={`text-[10px] font-semibold flex items-center gap-1 ${getPriorityFlag(t.priority)}`}>
                                • {t.priority}
                              </span>
                            </div>

                            {/* Card Title */}
                            <h4 className="text-xs font-semibold text-foreground leading-snug truncate max-w-[200px]">
                              {t.title}
                            </h4>

                            {/* Card Footer: Assignee & Time estimates */}
                            <div className="flex items-center justify-between mt-1.5 border-t border-border/40 pt-2 shrink-0">
                              <div className="flex items-center gap-1">
                                {t.estimated_hours > 0 && (
                                  <span className="text-[9px] font-semibold bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border/50 font-mono">
                                    {t.actual_hours}/{t.estimated_hours}h
                                  </span>
                                )}
                              </div>
                              
                              {/* Avatar */}
                              {assignee ? (
                                <img
                                  src={assignee.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                                  className="w-5.5 h-5.5 rounded-full object-cover border border-border"
                                  title={assignee.name}
                                  alt="Assignee"
                                />
                              ) : (
                                <div className="w-5.5 h-5.5 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground border border-border border-dashed">
                                  ?
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {colTasks.length === 0 && (
                      <div className="text-center py-8 text-[10px] text-muted-foreground border border-dashed border-border/30 rounded-xl">
                        Drop tasks here
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Task Modal */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center px-4">
            <div className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-primary" /> Create Task
                </h3>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Task Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Implement drag and drop board UI"
                    className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs p-3 text-foreground"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Description</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Explain the technical criteria for completion..."
                    className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs p-3 h-20 resize-none text-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Priority</label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                      className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs p-3 text-foreground"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Default Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as TaskStatus)}
                      className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs p-3 text-foreground"
                    >
                      <option value="backlog">Backlog</option>
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Assignee</label>
                    <select
                      value={newAssignee}
                      onChange={(e) => setNewAssignee(e.target.value)}
                      className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs p-3 text-foreground"
                    >
                      <option value="">Unassigned</option>
                      {allProfiles.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Est. Hours</label>
                    <input
                      type="number"
                      value={newEstHours}
                      onChange={(e) => setNewEstHours(Number(e.target.value))}
                      className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs p-3 text-foreground"
                      min={0}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Labels (comma separated)</label>
                  <input
                    type="text"
                    value={newLabels}
                    onChange={(e) => setNewLabels(e.target.value)}
                    placeholder="e.g. Frontend, UI, critical"
                    className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs p-3 text-foreground"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 rounded-lg hover:bg-muted text-xs text-muted-foreground font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={taskFormLoading}
                    className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold cursor-pointer"
                  >
                    {taskFormLoading ? 'Creating...' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task Details sliding drawer panel */}
        {selectedTask && (
          <div className="fixed inset-0 z-40 bg-background/50 backdrop-blur-xs flex justify-end">
            <div className="w-full max-w-2xl bg-card border-l border-border h-full flex flex-col shadow-2xl animate-slide-up">
              {/* Drawer Header */}
              <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-muted/10 shrink-0">
                <span className="font-mono text-xs font-bold text-muted-foreground">
                  Task Command / {project?.code}-{selectedTask.id.split('-')[1] || selectedTask.id.substring(0,3)}
                </span>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Task Title */}
                <div>
                  <h2 className="text-lg font-black text-foreground">{selectedTask.title}</h2>
                  <p className="text-xs text-muted-foreground mt-1 leading-normal">
                    {selectedTask.description || 'No description provided.'}
                  </p>
                </div>

                {/* Attributes Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/20 border border-border/80 rounded-2xl">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground block mb-0.5">Status</span>
                    <select
                      value={selectedTask.status}
                      disabled={role === 'client'}
                      onChange={(e) => handleUpdateTaskField('status', e.target.value)}
                      className="bg-card text-foreground text-xs font-semibold py-1 px-2 rounded-lg border border-border focus:outline-none"
                    >
                      <option value="backlog">Backlog</option>
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground block mb-0.5">Priority</span>
                    <select
                      value={selectedTask.priority}
                      disabled={role === 'client'}
                      onChange={(e) => handleUpdateTaskField('priority', e.target.value)}
                      className="bg-card text-foreground text-xs font-semibold py-1 px-2 rounded-lg border border-border focus:outline-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground block mb-0.5">Assignee</span>
                    <select
                      value={selectedTask.assignee_id || ''}
                      disabled={role === 'client'}
                      onChange={(e) => handleUpdateTaskField('assignee_id', e.target.value || null)}
                      className="bg-card text-foreground text-xs font-semibold py-1 px-2 rounded-lg border border-border focus:outline-none max-w-[120px]"
                    >
                      <option value="">Unassigned</option>
                      {allProfiles.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground block mb-0.5">Logging</span>
                    <span className="text-xs font-bold font-mono block mt-1">
                      {selectedTask.actual_hours} / {selectedTask.estimated_hours}h
                    </span>
                  </div>
                </div>

                {/* Operations: StopWatch launch & Add manually */}
                {role !== 'client' && (
                  <div className="flex items-center gap-3 border-t border-border pt-4">
                    <button
                      onClick={() => {
                        startTimer(selectedTask.id, selectedTask.title);
                        setSelectedTask(null); // Close drawer to let them look at the floating header timer
                      }}
                      disabled={timer.taskId === selectedTask.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-4 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Start Live Timer
                    </button>
                    <button
                      onClick={() => setIsLogHoursOpen(true)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-4 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-xl border border-border transition-all cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5" /> Log Hours Manually
                    </button>
                  </div>
                )}

                {/* File Attachments */}
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-foreground flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-muted-foreground" /> File Attachments
                    </h4>
                    {role !== 'client' && (
                      <label className="text-[10px] font-bold text-primary hover:underline cursor-pointer">
                        Upload File
                        <input
                          type="file"
                          onChange={handleMockAttachmentUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {attachments.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground italic">No file attachments associated.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {attachments.map((a) => (
                        <div key={a.id} className="p-2.5 rounded-xl border border-border flex items-center justify-between gap-2 bg-muted/10 hover:bg-muted/30 transition-all">
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
                            <div className="flex flex-col truncate">
                              <span className="text-[10px] font-bold text-foreground truncate">{a.name}</span>
                              <span className="text-[8px] text-muted-foreground">{(a.size/1024).toFixed(1)} KB</span>
                            </div>
                          </div>
                          {role !== 'client' && (
                            <button
                              onClick={() => handleDeleteAttachment(a.id)}
                              className="p-1 rounded text-muted-foreground hover:text-red-500 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Comments discussion board */}
                <div className="border-t border-border pt-4 space-y-4">
                  <h4 className="font-bold text-xs text-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" /> Discussion & Collaboration
                  </h4>
                  
                  {/* Comments feed */}
                  <div className="space-y-3.5 max-h-48 overflow-y-auto pr-1">
                    {comments.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground italic">No comments. start the discussion.</p>
                    ) : (
                      comments.map((c) => (
                        <div key={c.id} className="flex gap-2.5 items-start">
                          <img
                            src={c.author?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                            className="w-7 h-7 rounded-full object-cover border border-border"
                            alt="Avatar"
                          />
                          <div className="flex-1 bg-muted/30 p-2.5 rounded-2xl border border-border/60">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-extrabold text-foreground">{c.author?.name}</span>
                              <span className="text-[8px] text-muted-foreground font-mono">
                                {new Date(c.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-normal">
                              {renderCommentContent(c.content)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add comment Form */}
                  <form onSubmit={handleCommentSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      placeholder="Comment... type @Bob to mention team members"
                      className="flex-1 bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs px-3.5 py-2.5 text-foreground"
                      required
                    />
                    <button
                      type="submit"
                      className="p-2.5 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground transition-all cursor-pointer shrink-0"
                    >
                      <Send className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </form>
                </div>

                {/* Audit Logs */}
                <div className="border-t border-border pt-4 space-y-2.5">
                  <h4 className="font-bold text-xs text-foreground uppercase tracking-wider text-muted-foreground">
                    Activity History logs
                  </h4>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto text-[10px] font-mono pr-1">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-1 text-muted-foreground">
                        <CornerDownRight className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
                        <span>
                          <span className="font-semibold text-foreground">{log.user?.name}</span> updated{' '}
                          <span className="text-foreground">{log.field}</span>:{' '}
                          {log.old_value && <span className="line-through">{log.old_value}</span>}{' '}
                          <span className="text-primary font-bold">{log.new_value}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Manual Time Logging modal */}
        {isLogHoursOpen && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 animate-slide-up">
              <h3 className="font-bold text-sm text-foreground mb-1 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Manual Time Logs
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Record manual hours completed for: <span className="font-bold text-foreground">"{selectedTask?.title}"</span>.
              </p>
              
              <form onSubmit={handleTimeLogSubmit} className="space-y-4">
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
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Work Description</label>
                  <textarea
                    value={logDesc}
                    onChange={(e) => setLogDesc(e.target.value)}
                    placeholder="Describe what was accomplished during this session..."
                    className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs p-3 h-20 resize-none text-foreground"
                    required
                  />
                </div>
                
                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsLogHoursOpen(false)}
                    className="px-4 py-2 rounded-lg hover:bg-muted text-xs text-muted-foreground font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold cursor-pointer"
                  >
                    Log Time
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
