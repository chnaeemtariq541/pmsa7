'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/app-shell';
import { useApp } from '@/context/AppContext';
import { db } from '@/services/db';
import { Project, ProjectPriority, ProjectStatus, UserProfile, Client } from '@/types';
import { 
  Folder, Plus, Calendar, AlertTriangle, ArrowRight, Trash2, 
  Copy, Shield, User, Users, Briefcase, Tag, Sparkles
} from 'lucide-react';
import Link from 'next/link';

export default function ProjectsPage() {
  const { projects, org, role, user, reloadProjects, setActiveProject } = useApp();
  
  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [priority, setPriority] = useState<ProjectPriority>('medium');
  const [status, setStatus] = useState<ProjectStatus>('planning');

  // Assignment states inside form
  const [selectedPMId, setSelectedPMId] = useState('');
  const [selectedTMIds, setSelectedTMIds] = useState<string[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');

  // Dropdowns sources
  const [availablePMs, setAvailablePMs] = useState<UserProfile[]>([]);
  const [availableTMs, setAvailableTMs] = useState<UserProfile[]>([]);
  const [availableClients, setAvailableClients] = useState<Client[]>([]);

  // Project Team mapping for cards
  const [projectTeamMap, setProjectTeamMap] = useState<Record<string, {
    pm: UserProfile | null;
    members: UserProfile[];
    clients: Client[];
  }>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isClient = role === 'client';
  const canManage = role === 'super_admin' || role === 'org_admin' || role === 'project_manager';

  // Fetch project team members and clients for cards
  const fetchProjectDetails = async () => {
    if (projects.length === 0) return;
    
    const newMap: Record<string, {
      pm: UserProfile | null;
      members: UserProfile[];
      clients: Client[];
    }> = {};

    try {
      const orgMembers = org ? await db.getOrgMembers(org.id) : [];

      await Promise.all(projects.map(async (p) => {
        const pMembers = await db.getProjectMembers(p.id);
        
        let pmUser: UserProfile | null = null;
        const normalMembers: UserProfile[] = [];

        pMembers.forEach(pm => {
          const orgMember = orgMembers.find(om => om.user_id === pm.user_id);
          if (orgMember) {
            if (orgMember.role === 'project_manager') {
              pmUser = pm.profile;
            } else if (orgMember.role === 'team_member') {
              normalMembers.push(pm.profile);
            }
          } else {
            // Fallback based on profile designation
            if ((pm.profile.designation || '').toLowerCase().includes('manager')) {
              pmUser = pm.profile;
            } else {
              normalMembers.push(pm.profile);
            }
          }
        });

        const pClients = await db.getProjectClients(p.id);

        newMap[p.id] = {
          pm: pmUser,
          members: normalMembers,
          clients: pClients
        };
      }));

      setProjectTeamMap(newMap);
    } catch (err) {
      console.error('Failed to load project details:', err);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [projects, org]);

  // Load selection options when create modal is opened
  useEffect(() => {
    if (!isCreateOpen || !org) return;
    
    const loadModalOptions = async () => {
      try {
        const orgMembers = await db.getOrgMembers(org.id);
        const clientsList = await db.getClients(org.id);
        
        // Filter PMs and TMs
        const pms = orgMembers.filter(m => m.role === 'project_manager').map(m => m.profile);
        const tms = orgMembers.filter(m => m.role === 'team_member').map(m => m.profile);
        
        setAvailablePMs(pms);
        setAvailableTMs(tms);
        setAvailableClients(clientsList);
      } catch (err) {
        console.error('Failed to load modal options:', err);
      }
    };
    
    loadModalOptions();
  }, [isCreateOpen, org]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) return;
    setError(null);
    setLoading(true);

    try {
      // 1. Create project
      const newProj = await db.createProject(org.id, {
        name: projectName,
        code: projectCode.toUpperCase(),
        description,
        start_date: startDate ? new Date(startDate).toISOString() : undefined,
        end_date: endDate ? new Date(endDate).toISOString() : undefined,
        priority,
        status,
        created_by: user?.id
      });

      // 2. Assign Project Manager
      let pmToAssign = '';
      if (role === 'super_admin' || role === 'org_admin') {
        pmToAssign = selectedPMId;
      } else if (role === 'project_manager' && user) {
        pmToAssign = user.id;
      }

      if (pmToAssign) {
        await db.addProjectMember(newProj.id, pmToAssign);
      }

      // 3. Assign Team Members
      if (selectedTMIds.length > 0) {
        await Promise.all(selectedTMIds.map(tmId => db.addProjectMember(newProj.id, tmId)));
      }

      // 4. Associate Client
      if (selectedClientId) {
        await db.associateClientToProject(newProj.id, selectedClientId);
      }

      // Reset states
      setProjectName('');
      setProjectCode('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setPriority('medium');
      setStatus('planning');
      setSelectedPMId('');
      setSelectedTMIds([]);
      setSelectedClientId('');
      setIsCreateOpen(false);

      // Reload Context Projects
      await reloadProjects();
    } catch (err: any) {
      setError(err.message || 'Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('Are you sure you want to delete this project? This will permanently delete all associated tasks, sprints, comments, and logs.')) {
      return;
    }

    try {
      await db.deleteProject(projectId);
      await reloadProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicateProject = async (proj: Project) => {
    if (!org) return;
    try {
      // Get existing details to copy associations
      const details = projectTeamMap[proj.id];

      const newProj = await db.createProject(org.id, {
        name: `${proj.name} (Copy)`,
        code: `${proj.code}C`.substring(0, 5),
        description: proj.description,
        priority: proj.priority,
        status: 'planning',
        created_by: user?.id
      });

      // Copy project manager and team members
      if (details) {
        if (details.pm) {
          await db.addProjectMember(newProj.id, details.pm.id);
        }
        await Promise.all(details.members.map(m => db.addProjectMember(newProj.id, m.id)));
        await Promise.all(details.clients.map(c => db.associateClientToProject(newProj.id, c.id)));
      }

      await reloadProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const getPriorityStyle = (p: ProjectPriority) => {
    const maps = {
      low: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
      medium: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      critical: 'bg-red-500/10 text-red-500 border-red-500/20',
    };
    return maps[p] || maps.medium;
  };

  const getStatusStyle = (s: ProjectStatus) => {
    const maps = {
      planning: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20',
      active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20',
      on_hold: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      completed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      cancelled: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    };
    return maps[s] || maps.planning;
  };

  return (
    <AppShell>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Projects Workspace</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage core project lifecycles, project codes, assigned team roles, and clients.
            </p>
          </div>
          
          {canManage && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold shadow-sm transition-all duration-200 cursor-pointer"
            >
              <Plus className="w-4.5 h-4.5" /> New Project
            </button>
          )}
        </div>

        {/* Project List Grid */}
        {projects.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center max-w-xl mx-auto mt-8">
            <Folder className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="font-bold text-sm text-foreground">No Assigned Projects</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              You do not have any projects assigned to you. Contact your organization administrator to get added to a project.
            </p>
            {canManage && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="mt-4 inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => {
              const details = projectTeamMap[p.id];
              return (
                <div 
                  key={p.id}
                  className="rounded-3xl bg-card border border-border p-5 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-border/80 transition-all duration-200"
                >
                  <div className="space-y-4">
                    {/* Top section: Code & Actions */}
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold bg-muted text-muted-foreground py-1 px-2.5 rounded-lg border border-border/60">
                        {p.code}
                      </span>
                      
                      {/* Inline management actions */}
                      {canManage && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDuplicateProject(p)}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                            title="Duplicate project"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProject(p.id)}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-red-500 transition-all cursor-pointer"
                            title="Delete project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Title & Desc */}
                    <div>
                      <h3 className="font-bold text-sm text-foreground">{p.name}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1 line-clamp-2">
                        {p.description || 'No description provided.'}
                      </p>
                    </div>

                    {/* Project Team & Client Info */}
                    <div className="border-t border-border/50 pt-3.5 space-y-2.5">
                      {/* Project Manager */}
                      {details?.pm ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-muted-foreground uppercase font-black tracking-wider w-12 shrink-0">Manager:</span>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <img 
                              src={details.pm.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50'} 
                              className="w-5.5 h-5.5 rounded-full object-cover border border-border"
                              alt="PM"
                            />
                            <span className="font-semibold text-foreground truncate text-[11px]">
                              {details.pm.name}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-muted-foreground uppercase font-black tracking-wider w-12 shrink-0">Manager:</span>
                          <span className="text-[10px] text-muted-foreground italic">Unassigned</span>
                        </div>
                      )}

                      {/* Team Members */}
                      {details?.members && details.members.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-muted-foreground uppercase font-black tracking-wider w-12 shrink-0">Team:</span>
                          <div className="flex items-center -space-x-1.5 overflow-hidden">
                            {details.members.slice(0, 5).map((m, idx) => (
                              <img 
                                key={m.id || idx}
                                src={m.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50'} 
                                className="w-5.5 h-5.5 rounded-full object-cover border border-card shadow-sm"
                                alt={m.name}
                                title={`${m.name} (${m.designation || 'Member'})`}
                              />
                            ))}
                            {details.members.length > 5 && (
                              <div className="w-5.5 h-5.5 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[9px] font-black text-muted-foreground shadow-sm">
                                +{details.members.length - 5}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-muted-foreground uppercase font-black tracking-wider w-12 shrink-0">Team:</span>
                          <span className="text-[10px] text-muted-foreground italic">No members assigned</span>
                        </div>
                      )}

                      {/* Associated Client */}
                      {details?.clients && details.clients.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-muted-foreground uppercase font-black tracking-wider w-12 shrink-0">Client:</span>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-semibold text-[11px] text-primary truncate">
                              {details.clients[0].name}
                            </span>
                            <span className="text-[9px] text-muted-foreground truncate leading-none">
                              ({details.clients[0].company})
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-muted-foreground uppercase font-black tracking-wider w-12 shrink-0">Client:</span>
                          <span className="text-[10px] text-muted-foreground italic">No client linked</span>
                        </div>
                      )}
                    </div>

                    {/* Metrics Pills */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityStyle(p.priority)}`}>
                        {p.priority}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyle(p.status)}`}>
                        {p.status}
                      </span>
                    </div>
                  </div>

                  {/* Footer section: Timelines & Redirections */}
                  <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>
                        {p.start_date ? new Date(p.start_date).toLocaleDateString([], {month:'short', day:'numeric'}) : 'TBD'}
                        {' - '}
                        {p.end_date ? new Date(p.end_date).toLocaleDateString([], {month:'short', day:'numeric'}) : 'TBD'}
                      </span>
                    </div>

                    <Link
                      href={`/projects/${p.id}/board`}
                      onClick={() => setActiveProject(p)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-all group cursor-pointer"
                    >
                      <span>Board</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Modal overlay */}
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center px-4">
            <div className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Folder className="w-4 h-4 text-primary" /> Create Project
                </h3>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Project Name</label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="e.g. Mobile Redesign"
                      className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs p-3 text-foreground"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Project Code</label>
                    <input
                      type="text"
                      value={projectCode}
                      onChange={(e) => setProjectCode(e.target.value.toUpperCase())}
                      placeholder="e.g. MOB"
                      maxLength={5}
                      className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs p-3 text-foreground font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Summarize the project's target deliverables..."
                    className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs p-3 h-20 resize-none text-foreground"
                  />
                </div>

                {/* Project Manager Selection (Admin only) */}
                {(role === 'super_admin' || role === 'org_admin') && (
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Assign Project Manager</label>
                    <select
                      value={selectedPMId}
                      onChange={(e) => setSelectedPMId(e.target.value)}
                      className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs p-3 text-foreground cursor-pointer font-medium"
                      required
                    >
                      <option value="">Select a Project Manager...</option>
                      {availablePMs.map((pm) => (
                        <option key={pm.id} value={pm.id}>{pm.name} ({pm.designation || 'PM'})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Team Members Checkboxes Selection */}
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Assign Team Members</label>
                  <div className="max-h-32 overflow-y-auto border border-border rounded-xl p-3 bg-muted/40 space-y-2">
                    {availableTMs.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic">No team members available in this organization.</span>
                    ) : (
                      availableTMs.map((tm) => {
                        const isChecked = selectedTMIds.includes(tm.id);
                        return (
                          <label key={tm.id} className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedTMIds(selectedTMIds.filter(id => id !== tm.id));
                                } else {
                                  setSelectedTMIds([...selectedTMIds, tm.id]);
                                }
                              }}
                              className="rounded text-primary border-border focus:ring-0 cursor-pointer"
                            />
                            <span className="font-semibold">{tm.name}</span>
                            <span className="text-[10px] text-muted-foreground">({tm.designation || 'Engineer'})</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Client Selection */}
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Associate Client</label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs p-3 text-foreground cursor-pointer font-medium"
                    required
                  >
                    <option value="">Select a Client...</option>
                    {availableClients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.company})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs p-3 text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs p-3 text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as ProjectPriority)}
                      className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs p-3 text-foreground cursor-pointer"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                      className="w-full bg-muted border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-xs p-3 text-foreground cursor-pointer"
                    >
                      <option value="planning">Planning</option>
                      <option value="active">Active</option>
                      <option value="on_hold">On Hold</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
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
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/95 disabled:bg-primary/50 text-primary-foreground text-xs font-semibold cursor-pointer"
                  >
                    {loading ? 'Creating...' : 'Create Project'}
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

// Inline fallback for Close X Icon
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
