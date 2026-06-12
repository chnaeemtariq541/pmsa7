'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, Organization, Project, Notification, UserRole } from '@/types';
import { db, dbMode } from '@/services/db';
import { supabase, isSupabaseConfigured } from '@/services/db/client';

interface TimerState {
  taskId: string | null;
  taskTitle: string | null;
  startTime: string | null;
  elapsedSeconds: number;
  isRunning: boolean;
}

interface AppContextProps {
  user: UserProfile | null;
  role: UserRole;
  org: Organization | null;
  projects: Project[];
  activeProject: Project | null;
  setActiveProject: (proj: Project | null) => void;
  notifications: Notification[];
  unreadNotificationCount: number;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  triggerNotification: (title: string, content: string, link?: string) => Promise<void>;
  timer: TimerState;
  startTimer: (taskId: string, taskTitle: string) => void;
  stopTimer: (description: string) => Promise<number | null>;
  cancelTimer: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  switchRole: (role: UserRole) => void;
  reloadProjects: () => Promise<void>;
  reloadProfiles: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  isDbMock: boolean;
  allProfiles: UserProfile[];
  originalRole: UserRole;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [actualUser, setActualUser] = useState<UserProfile | null>(null);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [role, setRole] = useState<UserRole>('project_manager'); // Default active role for demo
  const [originalRole, setOriginalRole] = useState<UserRole>('project_manager');
  const [org, setOrg] = useState<Organization | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProjectState] = useState<Project | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Time Tracker State
  const [timer, setTimer] = useState<TimerState>({
    taskId: null,
    taskTitle: null,
    startTime: null,
    elapsedSeconds: 0,
    isRunning: false,
  });

  // Sync theme class to document element
  useEffect(() => {
    const savedTheme = localStorage.getItem('pmsa7_theme') as 'light' | 'dark' | null;
    const prefDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefDark ? 'dark' : 'light');
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('pmsa7_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Seed / Fetch initial data
  useEffect(() => {
    const initData = async () => {
      try {
        // Fetch all profiles
        const profiles = await db.getProfiles();
        setAllProfiles(profiles);

        // In Supabase mode, find the actual authenticated user
        let currentUserProfile = null;
        if (isSupabaseConfigured) {
          const { data: { user: authUser } } = await supabase!.auth.getUser();
          if (authUser) {
            currentUserProfile = profiles.find(p => p.id === authUser.id) || null;
          }
        }

        // Fallback for mock db mode or unauthenticated testing
        if (!currentUserProfile) {
          currentUserProfile = profiles.find(p => p.id === 'usr-project-manager') || profiles[0] || null;
        }

        setUser(currentUserProfile);
        setActualUser(currentUserProfile);

        // Fetch organizations
        const orgs = await db.getOrganizations();
        let activeOrg = null;
        let activeRole: UserRole = 'project_manager';

        if (currentUserProfile) {
          for (const o of orgs) {
            try {
              const members = await db.getOrgMembers(o.id);
              const currentMember = members.find(m => m.user_id === currentUserProfile.id);
              if (currentMember) {
                activeOrg = o;
                activeRole = currentMember.role;
                break;
              }
            } catch (err) {
              console.error('Error checking membership for org:', o.id, err);
            }
          }
        }

        if (!activeOrg && orgs.length > 0) {
          activeOrg = orgs[0];
          // Try to check role for fallback org
          try {
            const members = await db.getOrgMembers(activeOrg.id);
            const currentMember = members.find(m => m.user_id === (currentUserProfile?.id || ''));
            if (currentMember) {
              activeRole = currentMember.role;
            }
          } catch (e) {}
        }

        setOrg(activeOrg);
        setRole(activeRole);
        setOriginalRole(activeRole);

        if (activeOrg) {
          // Fetch projects
          const orgProjects = await db.getProjects(activeOrg.id);
          setAllProjects(orgProjects);
          
          const defaultProject = orgProjects.find(p => p.id === 'proj-pmsa7') || orgProjects[0] || null;
          setActiveProjectState(defaultProject);
        }

        // Fetch Notifications
        if (currentUserProfile) {
          const userNotifs = await db.getNotifications(currentUserProfile.id);
          setNotifications(userNotifs);
        }
      } catch (err) {
        console.error('Failed to initialize AppContext data:', err);
      }
    };
    initData();
  }, []);

  // Fetch Notifications when active user changes
  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      const userNotifs = await db.getNotifications(user.id);
      setNotifications(userNotifs);
    };
    fetchNotifs();
  }, [user]);

  // Timer Tick implementation
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (timer.isRunning && timer.startTime) {
      intervalId = setInterval(() => {
        const start = new Date(timer.startTime!).getTime();
        const now = Date.now();
        setTimer(prev => ({
          ...prev,
          elapsedSeconds: Math.floor((now - start) / 1000),
        }));
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [timer.isRunning, timer.startTime]);

  // Reactive Filtering of Projects by User Assignments
  useEffect(() => {
    if (!org || !user) {
      setProjects([]);
      return;
    }

    const filterProjects = async () => {
      try {
        // Super Admins and Org Admins see all projects
        if (role === 'super_admin' || role === 'org_admin') {
          setProjects(allProjects);
          return;
        }

        const filtered: Project[] = [];
        for (const p of allProjects) {
          // Check project members
          const members = await db.getProjectMembers(p.id);
          const isMember = members.some(m => m.user_id === user.id);

          if (isMember) {
            filtered.push(p);
            continue;
          }

          // Check clients mapping
          const clients = await db.getProjectClients(p.id);
          const isClientAssigned = clients.some(
            c => c.email.toLowerCase() === user.email.toLowerCase()
          );

          if (isClientAssigned) {
            filtered.push(p);
          }
        }

        setProjects(filtered);

        // Sync active project to ensure it belongs to the filtered list
        if (activeProject && !filtered.some(p => p.id === activeProject.id)) {
          setActiveProjectState(filtered[0] || null);
        } else if (!activeProject && filtered.length > 0) {
          setActiveProjectState(filtered[0]);
        }
      } catch (err) {
        console.error('Error filtering projects for user context:', err);
      }
    };

    filterProjects();
  }, [allProjects, user, role, org]);

  // Reload Projects
  const reloadProjects = async () => {
    if (!org) return;
    try {
      const orgProjects = await db.getProjects(org.id);
      setAllProjects(orgProjects);
      // Synchronize active project
      if (activeProject) {
        const recheck = orgProjects.find(p => p.id === activeProject.id);
        setActiveProjectState(recheck || orgProjects[0] || null);
      }
    } catch (err) {
      console.error('Failed to reload projects:', err);
    }
  };

  // Reload Profiles
  const reloadProfiles = async () => {
    try {
      const profiles = await db.getProfiles();
      setAllProfiles(profiles);
    } catch (err) {
      console.error('Failed to reload profiles:', err);
    }
  };

  // Update User Profile
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    try {
      const updated = await db.updateProfile(user.id, updates);
      setUser(updated);
      if (actualUser && actualUser.id === user.id) {
        setActualUser(updated);
      }
      await reloadProfiles();
    } catch (err) {
      console.error('Failed to update profile:', err);
      throw err;
    }
  };

  // Set active project override
  const setActiveProject = (proj: Project | null) => {
    setActiveProjectState(proj);
  };

  // Switch role dynamically (Dev Switcher tool)
  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    
    // If switching back to original role, restore actual logged-in user
    if (newRole === originalRole && actualUser) {
      setUser(actualUser);
      return;
    }

    // Dynamically adjust current user mock state to match the role profile for demo clarity
    const roleToUserId: Record<UserRole, string> = {
      super_admin: 'usr-super-admin',
      org_admin: 'usr-org-admin',
      project_manager: 'usr-project-manager',
      team_member: 'usr-team-member-1',
      client: 'usr-client',
    };
    const targetUserId = roleToUserId[newRole];
    const targetProfile = allProfiles.find(p => p.id === targetUserId);
    if (targetProfile) {
      setUser(targetProfile);
    }
  };

  // Notification Operations
  const markNotificationRead = async (id: string) => {
    try {
      await db.markNotificationRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsRead = async () => {
    if (!user) return;
    try {
      await db.markAllNotificationsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const triggerNotification = async (title: string, content: string, link?: string) => {
    if (!user) return;
    try {
      const notif = await db.createNotification(user.id, title, content, link);
      setNotifications(prev => [notif, ...prev]);
    } catch (err) {
      console.error(err);
    }
  };

  // Time Tracker Operations
  const startTimer = (taskId: string, taskTitle: string) => {
    setTimer({
      taskId,
      taskTitle,
      startTime: new Date().toISOString(),
      elapsedSeconds: 0,
      isRunning: true,
    });
  };

  const stopTimer = async (description: string): Promise<number | null> => {
    if (!timer.taskId || !user || !timer.startTime) return null;
    
    const elapsedHrs = Number((timer.elapsedSeconds / 3600).toFixed(2));
    const hoursToLog = Math.max(0.01, elapsedHrs); // Minimum log of 0.01 hours
    
    try {
      await db.createTimeLog(
        timer.taskId,
        user.id,
        hoursToLog,
        description || 'Logged from active timer stopwatch',
        new Date().toISOString().split('T')[0]
      );
      
      const finishedSeconds = timer.elapsedSeconds;
      
      setTimer({
        taskId: null,
        taskTitle: null,
        startTime: null,
        elapsedSeconds: 0,
        isRunning: false,
      });

      return finishedSeconds;
    } catch (err) {
      console.error('Failed to log time from timer:', err);
      return null;
    }
  };

  const cancelTimer = () => {
    setTimer({
      taskId: null,
      taskTitle: null,
      startTime: null,
      elapsedSeconds: 0,
      isRunning: false,
    });
  };

  const unreadNotificationCount = notifications.filter(n => !n.is_read).length;

  return (
    <AppContext.Provider value={{
      user,
      role,
      org,
      projects,
      activeProject,
      setActiveProject,
      notifications,
      unreadNotificationCount,
      markNotificationRead,
      markAllNotificationsRead,
      triggerNotification,
      timer,
      startTimer,
      stopTimer,
      cancelTimer,
      theme,
      toggleTheme,
      switchRole,
      reloadProjects,
      reloadProfiles,
      updateUserProfile,
      isDbMock: dbMode === 'mock',
      allProfiles,
      originalRole
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
