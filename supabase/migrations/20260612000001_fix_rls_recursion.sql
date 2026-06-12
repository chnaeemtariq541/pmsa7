-- ===================================================================
-- 1. DROP ALL OLD RLS POLICIES TO AVOID CONFLICTS & RECURSION
-- ===================================================================
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Orgs viewable by members" ON public.organizations;
DROP POLICY IF EXISTS "Orgs manageable by Super/Org Admins" ON public.organizations;
DROP POLICY IF EXISTS "Members viewable by members of same org" ON public.organization_members;
DROP POLICY IF EXISTS "Members manageable by Org Admin" ON public.organization_members;
DROP POLICY IF EXISTS "Projects viewable by project members or clients" ON public.projects;
DROP POLICY IF EXISTS "Projects manageable by Admins and PMs" ON public.projects;
DROP POLICY IF EXISTS "Project members are viewable by organization members" ON public.project_members;
DROP POLICY IF EXISTS "Project members are manageable by Admins and PMs" ON public.project_members;
DROP POLICY IF EXISTS "Project clients are viewable by organization members" ON public.project_clients;
DROP POLICY IF EXISTS "Project clients are manageable by Admins and PMs" ON public.project_clients;
DROP POLICY IF EXISTS "Sprints viewable by project viewers" ON public.sprints;
DROP POLICY IF EXISTS "Sprints manageable by Project Managers" ON public.sprints;
DROP POLICY IF EXISTS "Tasks viewable by project viewers" ON public.tasks;
DROP POLICY IF EXISTS "Tasks manageable by internal team members" ON public.tasks;
DROP POLICY IF EXISTS "Comments viewable by project viewers" ON public.task_comments;
DROP POLICY IF EXISTS "Comments editable by author" ON public.task_comments;
DROP POLICY IF EXISTS "Attachments viewable by project viewers" ON public.task_attachments;
DROP POLICY IF EXISTS "Attachments manageable by project members" ON public.task_attachments;
DROP POLICY IF EXISTS "Task activity is viewable by project viewers" ON public.task_activity;
DROP POLICY IF EXISTS "Task activity is manageable by project members" ON public.task_activity;
DROP POLICY IF EXISTS "Time logs viewable by project members" ON public.time_logs;
DROP POLICY IF EXISTS "Time logs manageable by owner" ON public.time_logs;
DROP POLICY IF EXISTS "Notifications owner access only" ON public.notifications;
DROP POLICY IF EXISTS "Clients viewable by org members" ON public.clients;
DROP POLICY IF EXISTS "Clients manageable by Org Admins" ON public.clients;

-- ===================================================================
-- 2. DROP OLD HELPER FUNCTIONS TO PREVENT AMBIGUITY / OVERLOADS
-- ===================================================================
DROP FUNCTION IF EXISTS public.is_super_admin(UUID);
DROP FUNCTION IF EXISTS public.get_user_role_in_org(UUID, UUID);
DROP FUNCTION IF EXISTS public.is_project_member(UUID, UUID);
DROP FUNCTION IF EXISTS public.is_project_client(UUID, UUID);
DROP FUNCTION IF EXISTS public.is_pm_or_admin_of_project(UUID, UUID);
DROP FUNCTION IF EXISTS public.is_org_member(UUID, UUID);
DROP FUNCTION IF EXISTS public.is_org_member_of_project(UUID, UUID);
DROP FUNCTION IF EXISTS public.is_task_viewer(UUID, UUID);
DROP FUNCTION IF EXISTS public.is_task_member(UUID, UUID);

-- ===================================================================
-- 3. DEFINE NEW, CLEAN SECURITY DEFINER HELPER FUNCTIONS
-- ===================================================================

-- 3.1 Check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organization_members 
        WHERE user_id = p_user_id AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.2 Check if user belongs to an organization
CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organization_members 
        WHERE organization_id = p_org_id AND user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.3 Get role of user inside an organization
CREATE OR REPLACE FUNCTION public.get_user_role_in_org(p_org_id UUID, p_user_id UUID)
RETURNS public.org_role AS $$
DECLARE
    v_role public.org_role;
BEGIN
    SELECT role INTO v_role 
    FROM public.organization_members 
    WHERE organization_id = p_org_id AND user_id = p_user_id;
    
    RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.4 Check if user is an explicit project member or admin of the project's org
CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_org_id UUID;
    v_role public.org_role;
BEGIN
    -- Get project organization ID
    SELECT organization_id INTO v_org_id FROM public.projects WHERE id = p_project_id;
    IF v_org_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Get user role in organization
    SELECT role INTO v_role FROM public.organization_members 
    WHERE organization_id = v_org_id AND user_id = p_user_id;

    -- Super Admin or Org Admin has full access to all projects inside their organization
    IF v_role IN ('super_admin', 'org_admin') THEN
        RETURN TRUE;
    END IF;

    -- Check explicit project membership
    RETURN EXISTS (
        SELECT 1 FROM public.project_members 
        WHERE project_id = p_project_id AND user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.5 Check if user is a client assigned to the project
CREATE OR REPLACE FUNCTION public.is_project_client(p_project_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_email TEXT;
BEGIN
    -- Get the profile email of the user
    SELECT email INTO v_email FROM public.profiles WHERE id = p_user_id;
    IF v_email IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Check if client is assigned to the project
    RETURN EXISTS (
        SELECT 1 FROM public.project_clients pc
        JOIN public.clients c ON c.id = pc.client_id
        WHERE pc.project_id = p_project_id AND c.email = v_email
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.6 Check if user is PM, Org Admin, or Super Admin of the project's organization
CREATE OR REPLACE FUNCTION public.is_pm_or_admin_of_project(p_project_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_org_id UUID;
    v_role public.org_role;
BEGIN
    SELECT organization_id INTO v_org_id FROM public.projects WHERE id = p_project_id;
    IF v_org_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    SELECT role INTO v_role FROM public.organization_members 
    WHERE organization_id = v_org_id AND user_id = p_user_id;
    
    RETURN v_role IN ('super_admin', 'org_admin', 'project_manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.7 Check if user belongs to the organization that owns the project
CREATE OR REPLACE FUNCTION public.is_org_member_of_project(p_project_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_org_id UUID;
BEGIN
    SELECT organization_id INTO v_org_id FROM public.projects WHERE id = p_project_id;
    IF v_org_id IS NULL THEN
        RETURN FALSE;
    END IF;
    RETURN public.is_org_member(v_org_id, p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.8 Check if user is a viewer of a task (project member or project client)
CREATE OR REPLACE FUNCTION public.is_task_viewer(p_task_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_project_id UUID;
BEGIN
    SELECT project_id INTO v_project_id FROM public.tasks WHERE id = p_task_id;
    IF v_project_id IS NULL THEN
        RETURN FALSE;
    END IF;
    RETURN public.is_project_member(v_project_id, p_user_id) OR public.is_project_client(v_project_id, p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.9 Check if user is an internal project member of a task
CREATE OR REPLACE FUNCTION public.is_task_member(p_task_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_project_id UUID;
BEGIN
    SELECT project_id INTO v_project_id FROM public.tasks WHERE id = p_task_id;
    IF v_project_id IS NULL THEN
        RETURN FALSE;
    END IF;
    RETURN public.is_project_member(v_project_id, p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================================
-- 4. RECREATE RECURSION-FREE ROW LEVEL SECURITY (RLS) POLICIES
-- ===================================================================

-- 4.1 Profiles
CREATE POLICY "Public profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 4.2 Organizations
CREATE POLICY "Orgs viewable by members" 
ON public.organizations FOR SELECT USING (
    public.is_super_admin(auth.uid()) OR 
    public.is_org_member(id, auth.uid())
);

CREATE POLICY "Orgs manageable by Super/Org Admins" 
ON public.organizations FOR ALL USING (
    public.is_super_admin(auth.uid()) OR 
    public.get_user_role_in_org(id, auth.uid()) = 'org_admin'
);

-- 4.3 Organization Members
CREATE POLICY "Members viewable by members of same org" 
ON public.organization_members FOR SELECT USING (
    public.is_super_admin(auth.uid()) OR
    public.is_org_member(organization_id, auth.uid())
);

CREATE POLICY "Members manageable by Org Admin" 
ON public.organization_members FOR ALL USING (
    public.is_super_admin(auth.uid()) OR
    public.get_user_role_in_org(organization_id, auth.uid()) = 'org_admin'
);

-- 4.4 Projects
CREATE POLICY "Projects viewable by project members or clients" 
ON public.projects FOR SELECT USING (
    public.is_super_admin(auth.uid()) OR
    public.is_project_member(id, auth.uid()) OR
    public.is_project_client(id, auth.uid())
);

CREATE POLICY "Projects manageable by Admins and PMs" 
ON public.projects FOR ALL USING (
    public.is_super_admin(auth.uid()) OR
    public.get_user_role_in_org(organization_id, auth.uid()) IN ('org_admin', 'project_manager')
);

-- 4.5 Project Members (Security Definer Wrapper Bypasses RLS recursion)
CREATE POLICY "Project members are viewable by organization members" 
ON public.project_members FOR SELECT USING (
    public.is_super_admin(auth.uid()) OR
    public.is_org_member_of_project(project_id, auth.uid())
);

CREATE POLICY "Project members are manageable by Admins and PMs" 
ON public.project_members FOR ALL USING (
    public.is_super_admin(auth.uid()) OR
    public.is_pm_or_admin_of_project(project_id, auth.uid())
);

-- 4.6 Project Clients (Security Definer Wrapper Bypasses RLS recursion)
CREATE POLICY "Project clients are viewable by organization members" 
ON public.project_clients FOR SELECT USING (
    public.is_super_admin(auth.uid()) OR
    public.is_org_member_of_project(project_id, auth.uid())
);

CREATE POLICY "Project clients are manageable by Admins and PMs" 
ON public.project_clients FOR ALL USING (
    public.is_super_admin(auth.uid()) OR
    public.is_pm_or_admin_of_project(project_id, auth.uid())
);

-- 4.7 Sprints
CREATE POLICY "Sprints viewable by project viewers" 
ON public.sprints FOR SELECT USING (
    public.is_super_admin(auth.uid()) OR
    public.is_project_member(project_id, auth.uid()) OR 
    public.is_project_client(project_id, auth.uid())
);

CREATE POLICY "Sprints manageable by Project Managers" 
ON public.sprints FOR ALL USING (
    public.is_super_admin(auth.uid()) OR
    public.is_pm_or_admin_of_project(project_id, auth.uid())
);

-- 4.8 Tasks
CREATE POLICY "Tasks viewable by project viewers" 
ON public.tasks FOR SELECT USING (
    public.is_super_admin(auth.uid()) OR
    public.is_project_member(project_id, auth.uid()) OR 
    public.is_project_client(project_id, auth.uid())
);

CREATE POLICY "Tasks manageable by internal team members" 
ON public.tasks FOR ALL USING (
    public.is_super_admin(auth.uid()) OR
    (public.is_project_member(project_id, auth.uid()) AND NOT public.is_project_client(project_id, auth.uid()))
);

-- 4.9 Task Comments
CREATE POLICY "Comments viewable by project viewers" 
ON public.task_comments FOR SELECT USING (
    public.is_super_admin(auth.uid()) OR
    public.is_task_viewer(task_id, auth.uid())
);

CREATE POLICY "Comments editable by author" 
ON public.task_comments FOR ALL USING (
    public.is_super_admin(auth.uid()) OR
    auth.uid() = author_id
);

-- 4.10 Task Attachments
CREATE POLICY "Attachments viewable by project viewers" 
ON public.task_attachments FOR SELECT USING (
    public.is_super_admin(auth.uid()) OR
    public.is_task_viewer(task_id, auth.uid())
);

CREATE POLICY "Attachments manageable by project members" 
ON public.task_attachments FOR ALL USING (
    public.is_super_admin(auth.uid()) OR
    public.is_task_member(task_id, auth.uid())
);

-- 4.11 Task Activity
CREATE POLICY "Task activity is viewable by project viewers" 
ON public.task_activity FOR SELECT USING (
    public.is_super_admin(auth.uid()) OR
    public.is_task_viewer(task_id, auth.uid())
);

CREATE POLICY "Task activity is manageable by project members" 
ON public.task_activity FOR ALL USING (
    public.is_super_admin(auth.uid()) OR
    public.is_task_member(task_id, auth.uid())
);

-- 4.12 Time Logs
CREATE POLICY "Time logs viewable by project members" 
ON public.time_logs FOR SELECT USING (
    public.is_super_admin(auth.uid()) OR
    public.is_task_member(task_id, auth.uid())
);

CREATE POLICY "Time logs manageable by owner" 
ON public.time_logs FOR ALL USING (
    public.is_super_admin(auth.uid()) OR
    auth.uid() = user_id
);

-- 4.13 Notifications
CREATE POLICY "Notifications owner access only" 
ON public.notifications FOR ALL USING (
    auth.uid() = user_id
);

-- 4.14 Clients
CREATE POLICY "Clients viewable by org members" 
ON public.clients FOR SELECT USING (
    public.is_super_admin(auth.uid()) OR
    public.is_org_member(organization_id, auth.uid())
);

CREATE POLICY "Clients manageable by Org Admins" 
ON public.clients FOR ALL USING (
    public.is_super_admin(auth.uid()) OR
    public.get_user_role_in_org(organization_id, auth.uid()) = 'org_admin'
);

-- ===================================================================
-- 5. RECREATE AUTH SIGNUP TRIGGER TO ENSURE ABSOLUTE ROBUSTNESS
-- ===================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  assigned_role public.org_role;
  org_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Wrap inside an exception block so signup can NEVER abort the transaction
  BEGIN
    -- Defensive Clean: Delete any existing profile/membership with the same email or ID
    -- to prevent unique key / duplicate key violations from orphaned seed records
    DELETE FROM public.organization_members WHERE user_id IN (SELECT id FROM public.profiles WHERE email = new.email);
    DELETE FROM public.profiles WHERE email = new.email;
    DELETE FROM public.profiles WHERE id = new.id;

    -- Ensure default organization exists (Self-Healing)
    IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = org_id) THEN
      INSERT INTO public.organizations (id, name, logo_url, timezone, currency)
      VALUES (
        org_id,
        'Sheikho & Tolvi LLC',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&h=128&fit=crop&auto=format',
        'America/New_York',
        'USD'
      );
    END IF;

    -- Ensure projects exist (Self-Healing)
    IF NOT EXISTS (SELECT 1 FROM public.projects WHERE id = '00000000-0000-0000-0000-000000000002') THEN
      INSERT INTO public.projects (id, organization_id, name, code, description, priority, status)
      VALUES ('00000000-0000-0000-0000-000000000002', org_id, 'Colgate Pakistan Website', 'CPW', 'Design and develop the new high-converting marketing website for Colgate Pakistan.', 'critical', 'active') ON CONFLICT DO NOTHING;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.projects WHERE id = '00000000-0000-0000-0000-000000000003') THEN
      INSERT INTO public.projects (id, organization_id, name, code, description, priority, status)
      VALUES ('00000000-0000-0000-0000-000000000003', org_id, 'Packages Mall Mobile App', 'PMA', 'Develop the new iOS and Android packages mall companion application.', 'high', 'planning') ON CONFLICT DO NOTHING;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.projects WHERE id = '00000000-0000-0000-0000-000000000004') THEN
      INSERT INTO public.projects (id, organization_id, name, code, description, priority, status)
      VALUES ('00000000-0000-0000-0000-000000000004', org_id, 'Lux Website', 'LW', 'Create a luxurious, high-converting digital storefront website for Lux Pakistan.', 'medium', 'completed') ON CONFLICT DO NOTHING;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.projects WHERE id = '00000000-0000-0000-0000-000000000005') THEN
      INSERT INTO public.projects (id, organization_id, name, code, description, priority, status)
      VALUES ('00000000-0000-0000-0000-000000000005', org_id, 'Pak Army Web Portal', 'PAWP', 'Design and implement the high-security portal and intranet directory.', 'critical', 'active') ON CONFLICT DO NOTHING;
    END IF;

    -- Create user profile inside profiles table
    INSERT INTO public.profiles (id, name, email, avatar_url, designation)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
      new.email,
      new.raw_user_meta_data->>'avatar_url',
      COALESCE(new.raw_user_meta_data->>'designation', 'Consultant')
    );

    -- Determine role dynamically based on registration email
    IF new.email = 'naeemtariq451@gmail.com' THEN
      assigned_role := 'super_admin';
    ELSIF new.email IN ('taleem@a7logics.com', 'salman@a7logics.com', 'javaid@a7logics.com') THEN
      assigned_role := 'project_manager';
    ELSIF new.email IN ('zain@a7logics.com', 'bilal@a7logics.com', 'hamza@a7logics.com', 'ali@a7logics.com', 'umar@a7logics.com', 'usman@a7logics.com') THEN
      assigned_role := 'team_member';
    ELSIF new.email IN ('tariq@clientcorp.com', 'faisal@clientcorp.com', 'kamran@clientcorp.com', 'rizwan@clientcorp.com') THEN
      assigned_role := 'client';
    ELSE
      assigned_role := 'team_member'; -- fallback default role
    END IF;

    -- Map member to the organization
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (org_id, new.id, assigned_role)
    ON CONFLICT (organization_id, user_id) DO UPDATE SET role = assigned_role;

    -- Auto-add project managers and team members to their respective projects
    IF assigned_role = 'project_manager' THEN
      -- Taleem Hussain handles Colgate Website (CPW) and Pak Army Web Portal (PAWP)
      IF new.email = 'taleem@a7logics.com' THEN
        INSERT INTO public.project_members (project_id, user_id) VALUES 
          ('00000000-0000-0000-0000-000000000002', new.id),
          ('00000000-0000-0000-0000-000000000005', new.id)
        ON CONFLICT DO NOTHING;
      -- Hafiz Salman handles Packages Mall Mobile App (PMA) and Colgate (CPW)
      ELSIF new.email = 'salman@a7logics.com' THEN
        INSERT INTO public.project_members (project_id, user_id) VALUES 
          ('00000000-0000-0000-0000-000000000002', new.id),
          ('00000000-0000-0000-0000-000000000003', new.id)
        ON CONFLICT DO NOTHING;
      -- Javaid Khadim handles Lux Website (LW)
      ELSIF new.email = 'javaid@a7logics.com' THEN
        INSERT INTO public.project_members (project_id, user_id) VALUES 
          ('00000000-0000-0000-0000-000000000004', new.id)
        ON CONFLICT DO NOTHING;
      END IF;
    
    ELSIF assigned_role = 'team_member' THEN
      -- Zain Ul Abidin handles Colgate (CPW) and Lux Website (LW)
      IF new.email = 'zain@a7logics.com' THEN
        INSERT INTO public.project_members (project_id, user_id) VALUES 
          ('00000000-0000-0000-0000-000000000002', new.id),
          ('00000000-0000-0000-0000-000000000004', new.id)
        ON CONFLICT DO NOTHING;
      -- Muhammad Bilal handles Colgate (CPW), Packages Mall Mobile App (PMA), and Pak Army Portal (PAWP)
      ELSIF new.email = 'bilal@a7logics.com' THEN
        INSERT INTO public.project_members (project_id, user_id) VALUES 
          ('00000000-0000-0000-0000-000000000002', new.id),
          ('00000000-0000-0000-0000-000000000003', new.id),
          ('00000000-0000-0000-0000-000000000005', new.id)
        ON CONFLICT DO NOTHING;
      -- Hamza Abbasi handles Packages Mall (PMA) and Pak Army Portal (PAWP)
      ELSIF new.email = 'hamza@a7logics.com' THEN
        INSERT INTO public.project_members (project_id, user_id) VALUES 
          ('00000000-0000-0000-0000-000000000003', new.id),
          ('00000000-0000-0000-0000-000000000005', new.id)
        ON CONFLICT DO NOTHING;
      -- Ali Raza handles Colgate (CPW) and Lux Website (LW)
      ELSIF new.email = 'ali@a7logics.com' THEN
        INSERT INTO public.project_members (project_id, user_id) VALUES 
          ('00000000-0000-0000-0000-000000000002', new.id),
          ('00000000-0000-0000-0000-000000000004', new.id)
        ON CONFLICT DO NOTHING;
      -- Umar Farooq handles Packages Mall (PMA)
      ELSIF new.email = 'umar@a7logics.com' THEN
        INSERT INTO public.project_members (project_id, user_id) VALUES 
          ('00000000-0000-0000-0000-000000000003', new.id)
        ON CONFLICT DO NOTHING;
      -- Usman Ghani handles Lux Website (LW) and Pak Army Portal (PAWP)
      ELSIF new.email = 'usman@a7logics.com' THEN
        INSERT INTO public.project_members (project_id, user_id) VALUES 
          ('00000000-0000-0000-0000-000000000004', new.id),
          ('00000000-0000-0000-0000-000000000005', new.id)
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;

  EXCEPTION
    WHEN OTHERS THEN
      -- Silently catch and ignore any error inside the trigger function so that
      -- user registration in auth.users is never blocked.
      NULL;
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-bind trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
