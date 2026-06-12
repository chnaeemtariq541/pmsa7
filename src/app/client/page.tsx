'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { DevRoleSwitcher } from '@/components/dev-role-switcher';
import { useApp } from '@/context/AppContext';
import { db } from '@/services/db';
import { Project, Task, TaskComment, TaskAttachment, UserProfile } from '@/types';
import { 
  Briefcase, CheckCircle2, FileText, Download, Send, MessageSquare, 
  HelpCircle, Clock, Calendar, Sparkles, FolderLock
} from 'lucide-react';

export default function ClientPage() {
  const { user, role, projects, allProfiles } = useApp();

  const [clientProjects, setClientProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Comments / Drawer details
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<(TaskComment & { author: UserProfile })[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [commentContent, setCommentContent] = useState('');

  useEffect(() => {
    const fetchClientData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        // For client role, fetch only associated projects
        // In local mock, proj-pmsa7 is associated with client usr-client
        const list = projects; // In demo sandbox, we can show client access to projects list
        setClientProjects(list);
        
        if (list.length > 0) {
          setSelectedProject(list[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchClientData();
  }, [user, projects]);

  // Load project tasks
  useEffect(() => {
    if (!selectedProject) return;
    const fetchProjTasks = async () => {
      try {
        const list = await db.getTasks(selectedProject.id);
        // Filter out backlog and private sprint items. Only show Todo, In Progress, Review, Done.
        const clientVisible = list.filter(t => t.status !== 'backlog');
        setTasks(clientVisible);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProjTasks();
  }, [selectedProject]);

  const handleOpenTask = async (task: Task) => {
    setSelectedTask(task);
    try {
      const c = await db.getComments(task.id);
      const a = await db.getAttachments(task.id);
      setComments(c);
      setAttachments(a);
    } catch (err) {
      console.error(err);
    }
  };

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

  // Metrics
  const doneCount = tasks.filter(t => t.status === 'done').length;
  const progressPct = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      
      {/* Sidebar navigation */}
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header />
        
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
          <div className="max-w-7xl mx-auto w-full h-full space-y-6">
            
            {/* Header banner */}
            <div className="p-6 rounded-3xl bg-primary/5 border border-primary/15 relative overflow-hidden">
              <div className="absolute top-[-30%] right-[-10%] w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Client Portal Console</span>
              </div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">Welcome to Acme Software Labs Portal</h1>
              <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                Review live execution milestones, download delivered assets, and communicate with lead project engineers. Sprints, timers, and internal boards are hidden for security compliance.
              </p>
            </div>

            {loading ? (
              <div className="text-center py-20 text-xs text-muted-foreground">Loading workspace portals...</div>
            ) : clientProjects.length === 0 ? (
              <div className="text-center py-20 text-xs text-muted-foreground">No client projects assigned to your account.</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left: Project selector & Task progress list */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Selector & Progress */}
                  <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-5">
                    <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4.5 h-4.5 text-primary" />
                        <span className="font-bold text-xs text-foreground uppercase tracking-wider">Select Project:</span>
                        <select
                          value={selectedProject?.id || ''}
                          onChange={(e) => {
                            const sel = clientProjects.find(p => p.id === e.target.value) || null;
                            setSelectedProject(sel);
                          }}
                          className="bg-muted text-foreground text-xs font-semibold py-1 px-2.5 rounded-lg border border-border/80"
                        >
                          {clientProjects.map(p => (
                            <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                          ))}
                        </select>
                      </div>

                      <span className="text-[10px] font-bold text-primary bg-primary/5 px-2.5 py-0.5 rounded border border-primary/10">
                        {progressPct}% Completed
                      </span>
                    </div>

                    {/* Progress visual bar */}
                    <div className="space-y-1.5">
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                        <span>Initiated</span>
                        <span>{doneCount} of {tasks.length} Deliverables Approved</span>
                        <span>Delivered</span>
                      </div>
                    </div>
                  </div>

                  {/* Tasks Table (Client view) */}
                  <div className="p-6 rounded-3xl bg-card border border-border shadow-sm">
                    <h3 className="font-bold text-xs text-foreground uppercase tracking-wider mb-4">
                      Client Review Pipelines
                    </h3>

                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {tasks.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic text-center py-4">No deliverables listed yet.</p>
                      ) : (
                        tasks.map((t) => (
                          <div 
                            key={t.id}
                            onClick={() => handleOpenTask(t)}
                            className="p-3 bg-muted/20 border border-border hover:border-primary/45 rounded-xl flex items-center justify-between gap-4 cursor-pointer transition-all"
                          >
                            <div className="flex items-center gap-2.5 truncate min-w-0">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${
                                t.status === 'done' 
                                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                  : t.status === 'review'
                                    ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                                    : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                              }`}>
                                {t.status === 'done' ? 'Delivered' : t.status === 'review' ? 'Ready for review' : 'In development'}
                              </span>
                              <span className="text-xs font-semibold text-foreground truncate">{t.title}</span>
                            </div>
                            
                            <span className="text-[10px] text-primary hover:underline font-bold shrink-0 flex items-center gap-0.5">
                              Open Discussions
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

                {/* Right side: Shared assets/Deliverables */}
                <div className="p-6 rounded-3xl bg-card border border-border shadow-sm h-fit space-y-4">
                  <h3 className="font-bold text-xs text-foreground uppercase tracking-wider border-b border-border pb-3 flex items-center gap-1.5">
                    <FolderLock className="w-4.5 h-4.5 text-muted-foreground" /> Shared Deliverable Files
                  </h3>

                  <p className="text-[10px] text-muted-foreground leading-normal">
                    Download visual exports, mock wireframes, PDF scopes, or code deliverables shared by the product lead.
                  </p>

                  <div className="space-y-2.5">
                    <div className="p-3 rounded-xl border border-border bg-muted/10 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4.5 h-4.5 text-muted-foreground" />
                        <div className="flex flex-col truncate">
                          <span className="text-[10px] font-bold text-foreground truncate">Product Scope.pdf</span>
                          <span className="text-[8px] text-muted-foreground">1.4 MB</span>
                        </div>
                      </div>
                      <a href="#" className="p-1 text-primary hover:text-primary-foreground hover:bg-primary rounded transition-all">
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    
                    <div className="p-3 rounded-xl border border-border bg-muted/10 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4.5 h-4.5 text-muted-foreground" />
                        <div className="flex flex-col truncate">
                          <span className="text-[10px] font-bold text-foreground truncate">Figma Boards Exports.zip</span>
                          <span className="text-[8px] text-muted-foreground">12.5 MB</span>
                        </div>
                      </div>
                      <a href="#" className="p-1 text-primary hover:text-primary-foreground hover:bg-primary rounded transition-all">
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Task Detail dialogue */}
            {selectedTask && (
              <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center px-4">
                <div className="w-full max-w-xl bg-card border border-border rounded-3xl shadow-2xl p-6 animate-slide-up max-h-[85vh] overflow-y-auto flex flex-col">
                  
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                    <span className="text-[10px] font-mono font-bold text-muted-foreground">
                      Client Portal / Discussion
                    </span>
                    <button
                      onClick={() => setSelectedTask(null)}
                      className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Body info */}
                  <div className="space-y-4 flex-1 overflow-y-auto">
                    <div>
                      <h3 className="font-bold text-sm text-foreground">{selectedTask.title}</h3>
                      <p className="text-xs text-muted-foreground leading-normal mt-1">
                        {selectedTask.description || 'No description available.'}
                      </p>
                    </div>

                    <div className="p-3.5 bg-muted/30 border border-border/60 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Delivery Status:</span>
                      <span className="font-bold text-primary">
                        {selectedTask.status === 'done' ? 'Completed & Delivered' : selectedTask.status === 'review' ? 'Ready for Client Review' : 'Under Development'}
                      </span>
                    </div>

                    {/* Shared files list */}
                    <div className="space-y-2 border-t border-border pt-4">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground block">Associated Deliverable Files</span>
                      {attachments.length === 0 ? (
                        <p className="text-[9px] text-muted-foreground italic">No shared source files for this task item.</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {attachments.map(a => (
                            <div key={a.id} className="p-2 border border-border rounded-xl flex items-center justify-between gap-2 bg-muted/10">
                              <span className="text-[9px] font-semibold truncate text-foreground">{a.name}</span>
                              <a href="#" className="p-1 text-primary hover:text-primary/75">
                                <Download className="w-3 h-3" />
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Comments section */}
                    <div className="space-y-3 border-t border-border pt-4">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground block">Discussion Feed</span>
                      <div className="space-y-3.5 max-h-40 overflow-y-auto pr-1">
                        {comments.length === 0 ? (
                          <p className="text-[9px] text-muted-foreground italic">No feedback entries left yet.</p>
                        ) : (
                          comments.map((c) => (
                            <div key={c.id} className="flex gap-2.5 items-start">
                              <img src={c.author?.avatar_url} className="w-6.5 h-6.5 rounded-full object-cover" alt="User" />
                              <div className="flex-1 bg-muted/20 p-2.5 rounded-xl border border-border/55 text-[10px]">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="font-extrabold text-foreground">{c.author?.name}</span>
                                  <span className="text-[7.5px] text-muted-foreground">
                                    {new Date(c.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                  </span>
                                </div>
                                <p className="text-muted-foreground leading-normal">{c.content}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add comment */}
                      <form onSubmit={handleCommentSubmit} className="flex gap-2">
                        <input
                          type="text"
                          value={commentContent}
                          onChange={(e) => setCommentContent(e.target.value)}
                          placeholder="Submit feedback/question to engineers..."
                          className="flex-1 bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs px-3.5 py-2.5 text-foreground"
                          required
                        />
                        <button
                          type="submit"
                          className="p-2.5 bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </form>
                    </div>

                  </div>

                </div>
              </div>
            )}

          </div>
        </main>
      </div>
      
      {/* Dev role switcher */}
      <DevRoleSwitcher />

    </div>
  );
}

const X = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
