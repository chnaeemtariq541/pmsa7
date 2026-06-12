-- Create custom types for roles and priorities
DO $$ BEGIN
    CREATE TYPE org_role AS ENUM ('super_admin', 'org_admin', 'project_manager', 'team_member', 'client');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('backlog', 'todo', 'in_progress', 'review', 'done');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sprint_status AS ENUM ('upcoming', 'active', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Organizations
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    timezone TEXT DEFAULT 'UTC',
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    updated_by UUID
);

-- 2. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    designation TEXT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    skills TEXT[] DEFAULT '{}',
    department TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Organization Members
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role org_role NOT NULL DEFAULT 'team_member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    updated_by UUID,
    UNIQUE (organization_id, user_id)
);

-- 4. Projects
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    priority project_priority NOT NULL DEFAULT 'medium',
    status project_status NOT NULL DEFAULT 'planning',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    updated_by UUID,
    UNIQUE (organization_id, code)
);

-- 5. Project Members
CREATE TABLE IF NOT EXISTS project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role_override org_role, -- Optional override role for a specific project
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, user_id)
);

-- 6. Sprints
CREATE TABLE IF NOT EXISTS sprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    goal TEXT,
    status sprint_status NOT NULL DEFAULT 'upcoming',
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    updated_by UUID
);

-- 7. Tasks
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority project_priority NOT NULL DEFAULT 'medium',
    status task_status NOT NULL DEFAULT 'todo',
    assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    due_date TIMESTAMPTZ,
    labels TEXT[] DEFAULT '{}',
    estimated_hours NUMERIC DEFAULT 0,
    actual_hours NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    updated_by UUID
);

-- 8. Task Comments
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Task Attachments
CREATE TABLE IF NOT EXISTS task_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    size INTEGER NOT NULL,
    type TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Task Activity (History Logs)
CREATE TABLE IF NOT EXISTS task_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    field TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Time Logs
CREATE TABLE IF NOT EXISTS time_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    description TEXT,
    hours NUMERIC NOT NULL CHECK (hours > 0),
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Clients
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. Project Clients
CREATE TABLE IF NOT EXISTS project_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    UNIQUE (project_id, client_id)
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_clients ENABLE ROW LEVEL SECURITY;

-- Dynamic Helper Functions for RBAC RLS policies

-- Get user role inside an organization
CREATE OR REPLACE FUNCTION get_user_role_in_org(org_id UUID, user_id UUID)
RETURNS org_role AS $$
DECLARE
    user_role org_role;
BEGIN
    SELECT role INTO user_role 
    FROM organization_members 
    WHERE organization_id = org_id AND organization_members.user_id = user_id;
    
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is super admin globally (for demo simplicity, we can have a meta role or config)
CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM organization_members 
        WHERE organization_members.user_id = user_id AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user belongs to project
CREATE OR REPLACE FUNCTION is_project_member(proj_id UUID, usr_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Super Admin or Org Admin of project's org has full access
    IF EXISTS (
        SELECT 1 FROM projects p
        JOIN organization_members om ON om.organization_id = p.organization_id
        WHERE p.id = proj_id AND om.user_id = usr_id AND om.role IN ('super_admin', 'org_admin')
    ) THEN
        RETURN TRUE;
    END IF;

    -- Explicit project membership
    RETURN EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_id = proj_id AND user_id = usr_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is client associated with project
CREATE OR REPLACE FUNCTION is_project_client(proj_id UUID, usr_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM project_clients pc
        JOIN clients c ON c.id = pc.client_id
        -- Link client profile's email to clients table email
        JOIN profiles p ON p.email = c.email
        WHERE pc.project_id = proj_id AND p.id = usr_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ROW LEVEL SECURITY POLICIES

-- Profiles RLS
CREATE POLICY "Public profiles are viewable by authenticated users" 
ON profiles FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE USING (auth.uid() = id);

-- Organizations RLS
CREATE POLICY "Orgs viewable by members" 
ON organizations FOR SELECT USING (
    is_super_admin(auth.uid()) OR 
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = id AND user_id = auth.uid())
);

CREATE POLICY "Orgs manageable by Super/Org Admins" 
ON organizations FOR ALL USING (
    is_super_admin(auth.uid()) OR 
    get_user_role_in_org(id, auth.uid()) = 'org_admin'
);

-- Org Members RLS
CREATE POLICY "Members viewable by members of same org" 
ON organization_members FOR SELECT USING (
    is_super_admin(auth.uid()) OR
    EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = organization_id AND om.user_id = auth.uid())
);

CREATE POLICY "Members manageable by Org Admin" 
ON organization_members FOR ALL USING (
    is_super_admin(auth.uid()) OR
    get_user_role_in_org(organization_id, auth.uid()) = 'org_admin'
);

-- Projects RLS
CREATE POLICY "Projects viewable by project members or clients" 
ON projects FOR SELECT USING (
    is_super_admin(auth.uid()) OR
    is_project_member(id, auth.uid()) OR
    is_project_client(id, auth.uid())
);

CREATE POLICY "Projects manageable by Admins and PMs" 
ON projects FOR ALL USING (
    is_super_admin(auth.uid()) OR
    get_user_role_in_org(organization_id, auth.uid()) IN ('org_admin', 'project_manager')
);

-- Sprints RLS
CREATE POLICY "Sprints viewable by project viewers" 
ON sprints FOR SELECT USING (
    is_project_member(project_id, auth.uid()) OR is_project_client(project_id, auth.uid())
);

CREATE POLICY "Sprints manageable by Project Managers" 
ON sprints FOR ALL USING (
    is_super_admin(auth.uid()) OR
    EXISTS (
        SELECT 1 FROM projects p 
        WHERE p.id = project_id AND 
        get_user_role_in_org(p.organization_id, auth.uid()) IN ('org_admin', 'project_manager')
    )
);

-- Tasks RLS
CREATE POLICY "Tasks viewable by project viewers" 
ON tasks FOR SELECT USING (
    is_project_member(project_id, auth.uid()) OR is_project_client(project_id, auth.uid())
);

CREATE POLICY "Tasks manageable by internal team members" 
ON tasks FOR ALL USING (
    is_project_member(project_id, auth.uid()) AND 
    NOT is_project_client(project_id, auth.uid())
);

-- Comments RLS
CREATE POLICY "Comments viewable by project viewers" 
ON task_comments FOR SELECT USING (
    EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_id AND (is_project_member(t.project_id, auth.uid()) OR is_project_client(t.project_id, auth.uid())))
);

CREATE POLICY "Comments editable by author" 
ON task_comments FOR ALL USING (
    auth.uid() = author_id
);

-- Attachments RLS
CREATE POLICY "Attachments viewable by project viewers" 
ON task_attachments FOR SELECT USING (
    EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_id AND (is_project_member(t.project_id, auth.uid()) OR is_project_client(t.project_id, auth.uid())))
);

CREATE POLICY "Attachments manageable by project members" 
ON task_attachments FOR ALL USING (
    EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_id AND is_project_member(t.project_id, auth.uid()))
);

-- Time Logs RLS
CREATE POLICY "Time logs viewable by project members" 
ON time_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_id AND is_project_member(t.project_id, auth.uid()))
);

CREATE POLICY "Time logs manageable by owner" 
ON time_logs FOR ALL USING (
    auth.uid() = user_id
);

-- Notifications RLS
CREATE POLICY "Notifications owner access only" 
ON notifications FOR ALL USING (
    auth.uid() = user_id
);

-- Clients RLS
CREATE POLICY "Clients viewable by org members" 
ON clients FOR SELECT USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_id = organization_id AND user_id = auth.uid())
);

CREATE POLICY "Clients manageable by Org Admins" 
ON clients FOR ALL USING (
    get_user_role_in_org(organization_id, auth.uid()) = 'org_admin'
);


-- TRIGGER TO AUTO-UPDATE updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_modtime BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_organization_members_modtime BEFORE UPDATE ON organization_members FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_projects_modtime BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_sprints_modtime BEFORE UPDATE ON sprints FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_tasks_modtime BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_task_comments_modtime BEFORE UPDATE ON task_comments FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_time_logs_modtime BEFORE UPDATE ON time_logs FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_clients_modtime BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_modified_column();


-- AUTOMATIC PROFILE CREATION FROM AUTH.USERS (Standard Supabase Auth Flow)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
