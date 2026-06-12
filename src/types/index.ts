export type UserRole = 'super_admin' | 'org_admin' | 'project_manager' | 'team_member' | 'client';

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type SprintStatus = 'upcoming' | 'active' | 'completed';

export interface UserProfile {
  id: string;
  name: string;
  avatar_url?: string;
  designation?: string;
  email: string;
  phone?: string;
  skills: string[];
  department?: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  logo_url?: string;
  timezone: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface Project {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  priority: ProjectPriority;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role_override?: UserRole;
  created_at: string;
}

export interface Sprint {
  id: string;
  project_id: string;
  name: string;
  goal?: string;
  status: SprintStatus;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  sprint_id?: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignee_id?: string;
  reporter_id?: string;
  due_date?: string;
  labels: string[];
  estimated_hours: number;
  actual_hours: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploaded_by: string;
  created_at: string;
}

export interface TaskActivity {
  id: string;
  task_id: string;
  user_id: string;
  field: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
}

export interface TimeLog {
  id: string;
  task_id: string;
  user_id: string;
  description?: string;
  hours: number;
  logged_date: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface Client {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  company?: string;
  created_at: string;
}

export interface ProjectClient {
  id: string;
  project_id: string;
  client_id: string;
}
