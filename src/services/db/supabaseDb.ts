import { supabase } from './client';
import { 
  UserProfile, Organization, OrganizationMember, Project, ProjectMember,
  Sprint, Task, TaskComment, TaskAttachment, TaskActivity, TimeLog,
  Notification, Client, ProjectClient, UserRole
} from '@/types';

export const supabaseDb = {
  // Profiles
  getProfiles: async (): Promise<UserProfile[]> => {
    const { data, error } = await supabase!
      .from('profiles')
      .select('*');
    if (error) throw error;
    return data || [];
  },
  
  getProfile: async (id: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase!
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  updateProfile: async (id: string, updates: Partial<UserProfile>): Promise<UserProfile> => {
    const { data, error } = await supabase!
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Organizations
  getOrganizations: async (): Promise<Organization[]> => {
    const { data, error } = await supabase!
      .from('organizations')
      .select('*');
    if (error) throw error;
    return data || [];
  },

  getOrganization: async (id: string): Promise<Organization | null> => {
    const { data, error } = await supabase!
      .from('organizations')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  updateOrganization: async (id: string, updates: Partial<Organization>): Promise<Organization> => {
    const { data, error } = await supabase!
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Organization Members
  getOrgMembers: async (orgId: string): Promise<(OrganizationMember & { profile: UserProfile })[]> => {
    const { data, error } = await supabase!
      .from('organization_members')
      .select('*, profile:profiles(*)')
      .eq('organization_id', orgId);
    if (error) throw error;
    return (data || []) as any;
  },

  inviteOrgMember: async (orgId: string, email: string, name: string, role: UserRole, designation?: string): Promise<OrganizationMember> => {
    // Note: Standard Supabase setup handles email invites via Supabase Auth admin APIs.
    // Here we simulate the direct table insertion corresponding to user invite maps.
    
    // First, find or create the profile by email
    const { data: profileSearch, error: pError } = await supabase!
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();
      
    if (pError) throw pError;
    
    let userId = profileSearch?.id;
    
    if (!userId) {
      // Create user profile record placeholder
      // For real Supabase, this would be auto-created after auth signup,
      // but we add it to the profile table for directory completeness.
      const tempId = crypto.randomUUID();
      const { data: newP, error: newPError } = await supabase!
        .from('profiles')
        .insert({
          id: tempId,
          name,
          email,
          designation: designation || 'Consultant',
          skills: []
        })
        .select()
        .single();
      if (newPError) throw newPError;
      userId = newP.id;
    }

    const { data, error } = await supabase!
      .from('organization_members')
      .upsert({
        organization_id: orgId,
        user_id: userId,
        role
      }, { onConflict: 'organization_id, user_id' })
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },

  updateMemberRole: async (memberId: string, role: UserRole): Promise<OrganizationMember> => {
    const { data, error } = await supabase!
      .from('organization_members')
      .update({ role })
      .eq('id', memberId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Projects
  getProjects: async (orgId: string): Promise<Project[]> => {
    const { data, error } = await supabase!
      .from('projects')
      .select('*')
      .eq('organization_id', orgId);
    if (error) throw error;
    return data || [];
  },

  getProject: async (id: string): Promise<Project | null> => {
    const { data, error } = await supabase!
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  createProject: async (orgId: string, project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'organization_id'>): Promise<Project> => {
    const { data, error } = await supabase!
      .from('projects')
      .insert({
        ...project,
        organization_id: orgId
      })
      .select()
      .single();
      
    if (error) throw error;

    // Auto add creator to project_members
    if (project.created_by) {
      await supabase!
        .from('project_members')
        .insert({
          project_id: data.id,
          user_id: project.created_by
        });
    }

    return data;
  },

  updateProject: async (id: string, updates: Partial<Project>): Promise<Project> => {
    const { data, error } = await supabase!
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteProject: async (id: string): Promise<boolean> => {
    const { error } = await supabase!
      .from('projects')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  // Project Members
  getProjectMembers: async (projectId: string): Promise<(ProjectMember & { profile: UserProfile })[]> => {
    const { data, error } = await supabase!
      .from('project_members')
      .select('*, profile:profiles(*)')
      .eq('project_id', projectId);
    if (error) throw error;
    return (data || []) as any;
  },

  addProjectMember: async (projectId: string, userId: string): Promise<ProjectMember> => {
    const { data, error } = await supabase!
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: userId
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  removeProjectMember: async (projectId: string, userId: string): Promise<boolean> => {
    const { error } = await supabase!
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);
    if (error) throw error;
    return true;
  },

  // Sprints
  getSprints: async (projectId: string): Promise<Sprint[]> => {
    const { data, error } = await supabase!
      .from('sprints')
      .select('*')
      .eq('project_id', projectId);
    if (error) throw error;
    return data || [];
  },

  createSprint: async (projectId: string, sprint: Omit<Sprint, 'id' | 'created_at' | 'updated_at' | 'project_id'>): Promise<Sprint> => {
    const { data, error } = await supabase!
      .from('sprints')
      .insert({
        ...sprint,
        project_id: projectId
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateSprint: async (id: string, updates: Partial<Sprint>): Promise<Sprint> => {
    // If starting a sprint, other sprints might need to be verified (normally only one active sprint per project)
    if (updates.status === 'active') {
      // Find project_id
      const { data: curSprint } = await supabase!.from('sprints').select('project_id').eq('id', id).single();
      if (curSprint) {
        // Mark active ones as completed
        await supabase!
          .from('sprints')
          .update({ status: 'completed' })
          .eq('project_id', curSprint.project_id)
          .eq('status', 'active');
      }
    }

    const { data, error } = await supabase!
      .from('sprints')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Tasks
  getTasks: async (projectId: string): Promise<Task[]> => {
    const { data, error } = await supabase!
      .from('tasks')
      .select('*')
      .eq('project_id', projectId);
    if (error) throw error;
    return data || [];
  },

  createTask: async (projectId: string, task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'project_id' | 'actual_hours'>): Promise<Task> => {
    const { data, error } = await supabase!
      .from('tasks')
      .insert({
        ...task,
        project_id: projectId,
        actual_hours: 0
      })
      .select()
      .single();
      
    if (error) throw error;

    // Add activity log
    await supabase!
      .from('task_activity')
      .insert({
        task_id: data.id,
        user_id: task.created_by || 'usr-project-manager',
        field: 'created',
        new_value: task.title
      });

    return data;
  },

  updateTask: async (id: string, updates: Partial<Task>, modifierUserId?: string): Promise<Task> => {
    // To get change logs, fetch the original task first
    const { data: original } = await supabase!.from('tasks').select('*').eq('id', id).single();

    const { data, error } = await supabase!
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;

    if (original && modifierUserId) {
      const fieldsToLog: (keyof Task)[] = ['status', 'priority', 'assignee_id', 'sprint_id'];
      for (const field of fieldsToLog) {
        if (updates[field] !== undefined && updates[field] !== original[field]) {
          await supabase!
            .from('task_activity')
            .insert({
              task_id: id,
              user_id: modifierUserId,
              field: field as string,
              old_value: String(original[field] || ''),
              new_value: String(updates[field] || '')
            });
        }
      }
    }

    return data;
  },

  deleteTask: async (id: string): Promise<boolean> => {
    const { error } = await supabase!
      .from('tasks')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  // Comments
  getComments: async (taskId: string): Promise<(TaskComment & { author: UserProfile })[]> => {
    const { data, error } = await supabase!
      .from('task_comments')
      .select('*, author:profiles(*)')
      .eq('task_id', taskId);
    if (error) throw error;
    return (data || []) as any;
  },

  createComment: async (taskId: string, authorId: string, content: string): Promise<TaskComment> => {
    const { data, error } = await supabase!
      .from('task_comments')
      .insert({
        task_id: taskId,
        author_id: authorId,
        content
      })
      .select()
      .single();
    if (error) throw error;

    // Real notifications can be handled on the backend via Postgres triggers or triggers on inserts in task_comments.
    // For RLS & Realtime client alerts, comments will broadcast automatically.
    return data;
  },

  // Attachments
  getAttachments: async (taskId: string): Promise<TaskAttachment[]> => {
    const { data, error } = await supabase!
      .from('task_attachments')
      .select('*')
      .eq('task_id', taskId);
    if (error) throw error;
    return data || [];
  },

  createAttachment: async (taskId: string, attachment: Omit<TaskAttachment, 'id' | 'created_at' | 'task_id'>): Promise<TaskAttachment> => {
    const { data, error } = await supabase!
      .from('task_attachments')
      .insert({
        ...attachment,
        task_id: taskId
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteAttachment: async (id: string): Promise<boolean> => {
    const { error } = await supabase!
      .from('task_attachments')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  // Time Logs
  getTimeLogs: async (projectId: string): Promise<(TimeLog & { taskTitle: string, userProfile: UserProfile })[]> => {
    // Perform relational query to fetch time logs belonging to tasks in specified project
    const { data, error } = await supabase!
      .from('time_logs')
      .select('*, task:tasks!inner(title, project_id), profile:profiles(*)')
      .eq('tasks.project_id', projectId);
      
    if (error) throw error;
    return (data || []).map(d => ({
      ...d,
      taskTitle: (d.task as any)?.title || '',
      userProfile: d.profile as any
    })) as any;
  },

  createTimeLog: async (taskId: string, userId: string, hours: number, description: string, loggedDate: string): Promise<TimeLog> => {
    const { data, error } = await supabase!
      .from('time_logs')
      .insert({
        task_id: taskId,
        user_id: userId,
        hours,
        description,
        logged_date: loggedDate
      })
      .select()
      .single();
      
    if (error) throw error;

    // Increment actual_hours on the task using Postgres RPC or manual update
    const { data: taskData } = await supabase!.from('tasks').select('actual_hours').eq('id', taskId).single();
    if (taskData) {
      await supabase!
        .from('tasks')
        .update({ actual_hours: Number(taskData.actual_hours || 0) + Number(hours) })
        .eq('id', taskId);
    }

    return data;
  },

  // Notifications
  getNotifications: async (userId: string): Promise<Notification[]> => {
    const { data, error } = await supabase!
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  markNotificationRead: async (id: string): Promise<boolean> => {
    const { error } = await supabase!
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  markAllNotificationsRead: async (userId: string): Promise<boolean> => {
    const { error } = await supabase!
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId);
    if (error) throw error;
    return true;
  },

  createNotification: async (userId: string, title: string, content: string, link?: string): Promise<Notification> => {
    const { data, error } = await supabase!
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        content,
        link,
        is_read: false
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Clients
  getClients: async (orgId: string): Promise<Client[]> => {
    const { data, error } = await supabase!
      .from('clients')
      .select('*')
      .eq('organization_id', orgId);
    if (error) throw error;
    return data || [];
  },

  createClient: async (orgId: string, client: Omit<Client, 'id' | 'created_at'>): Promise<Client> => {
    const { data, error } = await supabase!
      .from('clients')
      .insert({
        ...client,
        organization_id: orgId
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  getProjectClients: async (projectId: string): Promise<Client[]> => {
    const { data, error } = await supabase!
      .from('project_clients')
      .select('*, client:clients!inner(*)')
      .eq('project_id', projectId);
    if (error) throw error;
    return (data || []).map(d => d.client) as any;
  },

  associateClientToProject: async (projectId: string, clientId: string): Promise<ProjectClient> => {
    const { data, error } = await supabase!
      .from('project_clients')
      .insert({
        project_id: projectId,
        client_id: clientId
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Task Activity Logs
  getActivityLogs: async (taskId: string): Promise<(TaskActivity & { user: UserProfile })[]> => {
    const { data, error } = await supabase!
      .from('task_activity')
      .select('*, user:profiles(*)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as any;
  }
};
