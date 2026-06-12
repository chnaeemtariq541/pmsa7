'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { db } from '@/services/db';
import { Project, Task, UserProfile, Notification } from '@/types';
import { 
  Bell, Search, Clock, Play, Square, X, Check, CheckCircle2,
  Folder, User, MessageSquare, AlertCircle, Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export const Header = () => {
  const router = useRouter();
  const { 
    projects, activeProject, setActiveProject, 
    notifications, unreadNotificationCount, markNotificationRead, markAllNotificationsRead,
    timer, stopTimer, cancelTimer
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    projects: Project[];
    tasks: Task[];
    users: UserProfile[];
  }>({ projects: [], tasks: [], users: [] });

  const [isStopTimerOpen, setIsStopTimerOpen] = useState(false);
  const [timeLogDescription, setTimeLogDescription] = useState('');

  const notifRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Handle Global Search Queries
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ projects: [], tasks: [], users: [] });
      return;
    }

    const performSearch = async () => {
      try {
        const query = searchQuery.toLowerCase();
        
        // Load all entities (mock or live)
        const allProjs = projects;
        let allTasks: Task[] = [];
        for (const p of allProjs) {
          const pTasks = await db.getTasks(p.id);
          allTasks = [...allTasks, ...pTasks];
        }
        const allUsers = await db.getProfiles();

        // Filters
        const filteredProjs = allProjs.filter(p => 
          p.name.toLowerCase().includes(query) || p.code.toLowerCase().includes(query)
        );
        const filteredTasks = allTasks.filter(t => 
          t.title.toLowerCase().includes(query) || (t.description || '').toLowerCase().includes(query)
        );
        const filteredUsers = allUsers.filter(u => 
          u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
        );

        setSearchResults({
          projects: filteredProjs,
          tasks: filteredTasks,
          users: filteredUsers
        });
      } catch (err) {
        console.error('Search failed:', err);
      }
    };

    const debounce = setTimeout(performSearch, 200);
    return () => clearTimeout(debounce);
  }, [searchQuery, projects]);

  // Focus search input on open
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Format Timer output
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  const handleStopTimerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await stopTimer(timeLogDescription);
    setTimeLogDescription('');
    setIsStopTimerOpen(false);
  };

  return (
    <header className="h-16 border-b border-border bg-card/85 backdrop-blur-md flex items-center justify-between px-6 z-30 sticky top-0">
      
      {/* Left section: Project Selection */}
      <div className="flex items-center gap-4">
        {projects.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold">Active Workspace:</span>
            <select
              value={activeProject?.id || ''}
              onChange={(e) => {
                const selected = projects.find(p => p.id === e.target.value) || null;
                setActiveProject(selected);
                if (selected) {
                  router.push(`/projects/${selected.id}/board`);
                }
              }}
              className="bg-muted text-foreground text-xs font-semibold py-1.5 px-3 rounded-lg border border-border focus:outline-none focus:border-primary transition-all duration-200 cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Global Search Bar trigger button */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-2 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground text-xs py-1.5 px-3 rounded-lg border border-border/80 transition-all duration-200 cursor-pointer w-48 md:w-64"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="text-left flex-1 font-medium">Search project, tasks...</span>
          <kbd className="hidden md:inline-flex bg-background text-[10px] px-1.5 py-0.5 rounded border border-border font-mono">Ctrl+K</kbd>
        </button>
      </div>

      {/* Right section: Active Time Tracker, Notifications, Actions */}
      <div className="flex items-center gap-4">
        
        {/* Live Stopwatch UI */}
        {timer.isRunning && (
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary py-1.5 px-3.5 rounded-full animate-pulse shadow-sm">
            <Clock className="w-4 h-4 animate-spin" />
            <div className="flex flex-col text-[10px] leading-tight max-w-[140px] hidden md:block">
              <span className="font-bold truncate">{timer.taskTitle}</span>
              <span className="text-primary/70">Timer active</span>
            </div>
            <span className="font-mono text-xs font-bold ml-1">{formatTime(timer.elapsedSeconds)}</span>
            <button
              onClick={() => setIsStopTimerOpen(true)}
              className="p-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 ml-1.5 cursor-pointer"
              title="Stop and log time"
            >
              <Square className="w-3 h-3 fill-current" />
            </button>
            <button
              onClick={cancelTimer}
              className="p-1 rounded-full hover:bg-primary/20 transition-all duration-200 cursor-pointer text-primary/70 hover:text-primary"
              title="Cancel timer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Notifications Icon and Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center animate-bounce">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-card border border-border shadow-2xl overflow-hidden py-1">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/20">
                <span className="font-semibold text-xs text-foreground">Notifications</span>
                {unreadNotificationCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-[10px] font-semibold text-primary hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`p-3 border-b border-border last:border-none flex items-start gap-3 cursor-pointer hover:bg-muted/50 transition-all duration-150 ${
                        !n.is_read ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary mt-0.5">
                        <Bell className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-foreground">{n.title}</span>
                        <span className="text-[10px] text-muted-foreground leading-normal">{n.content}</span>
                        <span className="text-[9px] text-muted-foreground/70 mt-1 font-mono">
                          {new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      {!n.is_read && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Search Modal Dialouge */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center pt-24 px-4">
          <div className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[550px] animate-slide-up">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/10">
              <Search className="w-5 h-5 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects, tasks, team members..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground border-none outline-none focus:ring-0"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-150 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {!searchQuery.trim() ? (
                <div className="text-center py-8 text-xs text-muted-foreground flex flex-col items-center gap-2">
                  <Sparkles className="w-8 h-8 text-primary/50 animate-pulse" />
                  <span>Type something to search the entire project space.</span>
                </div>
              ) : (searchResults.projects.length === 0 && searchResults.tasks.length === 0 && searchResults.users.length === 0) ? (
                <div className="text-center py-8 text-xs text-muted-foreground flex flex-col items-center gap-2">
                  <AlertCircle className="w-8 h-8 text-muted-foreground/50" />
                  <span>No results match your search term.</span>
                </div>
              ) : (
                <>
                  {/* Project Results */}
                  {searchResults.projects.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block px-2">Projects</span>
                      {searchResults.projects.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setActiveProject(p);
                            setIsSearchOpen(false);
                            router.push(`/projects/${p.id}/board`);
                          }}
                          className="flex items-center gap-3 p-2 rounded-xl border border-transparent hover:border-border hover:bg-muted/40 cursor-pointer transition-all duration-200"
                        >
                          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                            <Folder className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-foreground">{p.name}</span>
                            <span className="text-[10px] text-muted-foreground">Code: {p.code} • Status: {p.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Task Results */}
                  {searchResults.tasks.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block px-2">Tasks</span>
                      {searchResults.tasks.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => {
                            const parentProj = projects.find(p => p.id === t.project_id);
                            if (parentProj) setActiveProject(parentProj);
                            setIsSearchOpen(false);
                            router.push(`/projects/${t.project_id}/board?taskId=${t.id}`);
                          }}
                          className="flex items-center gap-3 p-2 rounded-xl border border-transparent hover:border-border hover:bg-muted/40 cursor-pointer transition-all duration-200"
                        >
                          <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-foreground truncate max-w-md">{t.title}</span>
                            <span className="text-[10px] text-muted-foreground">Priority: {t.priority} • Status: {t.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* User Results */}
                  {searchResults.users.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block px-2">Team Members</span>
                      {searchResults.users.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => {
                            setIsSearchOpen(false);
                            router.push(`/team?userId=${u.id}`);
                          }}
                          className="flex items-center gap-3 p-2 rounded-xl border border-transparent hover:border-border hover:bg-muted/40 cursor-pointer transition-all duration-200"
                        >
                          <img
                            src={u.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                            className="w-8 h-8 rounded-full object-cover border border-border"
                            alt="Avatar"
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-foreground">{u.name}</span>
                            <span className="text-[10px] text-muted-foreground">{u.designation || 'Team Member'} • {u.email}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="px-4 py-2 border-t border-border bg-muted/20 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Press <kbd className="bg-background px-1 py-0.5 rounded border border-border font-mono">Esc</kbd> to close</span>
              <span>Use switcher dropdown to change active project focus</span>
            </div>
          </div>
        </div>
      )}

      {/* Stop Timer Dialogue */}
      {isStopTimerOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 animate-slide-up">
            <h3 className="font-bold text-sm text-foreground mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Log Hours
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Stop tracking time and save logged hours for task: <span className="font-bold text-foreground">"{timer.taskTitle}"</span>.
            </p>
            <form onSubmit={handleStopTimerSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                  What did you work on?
                </label>
                <textarea
                  value={timeLogDescription}
                  onChange={(e) => setTimeLogDescription(e.target.value)}
                  placeholder="Summarize your progress... e.g. Fixed board element drop handler bugs"
                  className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs p-3 h-20 resize-none"
                  required
                />
              </div>
              
              <div className="text-xs text-muted-foreground border-t border-border pt-3 flex items-center justify-between">
                <span>Calculated Log:</span>
                <span className="font-mono font-bold text-foreground">
                  {((timer.elapsedSeconds) / 3600).toFixed(2)} hours ({formatTime(timer.elapsedSeconds)})
                </span>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsStopTimerOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg hover:bg-muted text-xs text-muted-foreground font-semibold cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Save Logs
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
