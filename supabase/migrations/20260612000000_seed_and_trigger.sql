-- ===================================================================
-- 1. SEED DEFAULT ORGANIZATION & PROJECTS
-- ===================================================================

-- Insert Sheikho & Tolvi LLC organization
INSERT INTO public.organizations (id, name, logo_url, timezone, currency)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Sheikho & Tolvi LLC',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&h=128&fit=crop&auto=format',
  'America/New_York',
  'USD'
)
ON CONFLICT (id) DO NOTHING;

-- Seed Colgate Pakistan Website
INSERT INTO public.projects (id, organization_id, name, code, description, priority, status)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Colgate Pakistan Website',
  'CPW',
  'Design and develop the new high-converting marketing website for Colgate Pakistan, complete with product catalogs and consumer resources.',
  'critical',
  'active'
)
ON CONFLICT (organization_id, code) DO NOTHING;

-- Seed Packages Mall Mobile App
INSERT INTO public.projects (id, organization_id, name, code, description, priority, status)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000001',
  'Packages Mall Mobile App',
  'PMA',
  'Develop the new iOS and Android packages mall companion application featuring shopping directories, loyalty tracking, and indoor maps.',
  'high',
  'planning'
)
ON CONFLICT (organization_id, code) DO NOTHING;

-- Seed Lux Website
INSERT INTO public.projects (id, organization_id, name, code, description, priority, status)
VALUES (
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000001',
  'Lux Website',
  'LW',
  'Create a luxurious, high-converting digital storefront website for Lux Pakistan campaign promotion and ambassador listings.',
  'medium',
  'completed'
)
ON CONFLICT (organization_id, code) DO NOTHING;

-- Seed Pak Army Web Portal
INSERT INTO public.projects (id, organization_id, name, code, description, priority, status)
VALUES (
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000001',
  'Pak Army Web Portal',
  'PAWP',
  'Design and implement the high-security portal and intranet directory for public recruitment and news broadcasts.',
  'critical',
  'active'
)
ON CONFLICT (organization_id, code) DO NOTHING;

-- ===================================================================
-- 2. SEED CLIENTS
-- ===================================================================

-- Seed Colgate Client (Tariq Mahmood)
INSERT INTO public.clients (id, organization_id, name, email, company)
VALUES (
  '00000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000001',
  'Tariq Mahmood',
  'tariq@clientcorp.com',
  'Colgate Pakistan Group'
)
ON CONFLICT (id) DO NOTHING;

-- Seed Packages Client (Faisal Qureshi)
INSERT INTO public.clients (id, organization_id, name, email, company)
VALUES (
  '00000000-0000-0000-0000-000000000007',
  '00000000-0000-0000-0000-000000000001',
  'Faisal Qureshi',
  'faisal@clientcorp.com',
  'Packages Group'
)
ON CONFLICT (id) DO NOTHING;

-- Seed Lux Client (Kamran Akmal)
INSERT INTO public.clients (id, organization_id, name, email, company)
VALUES (
  '00000000-0000-0000-0000-000000000008',
  '00000000-0000-0000-0000-000000000001',
  'Kamran Akmal',
  'kamran@clientcorp.com',
  'Unilever Pakistan'
)
ON CONFLICT (id) DO NOTHING;

-- Seed Army Client (Rizwan Ahmed)
INSERT INTO public.clients (id, organization_id, name, email, company)
VALUES (
  '00000000-0000-0000-0000-000000000009',
  '00000000-0000-0000-0000-000000000001',
  'Rizwan Ahmed',
  'rizwan@clientcorp.com',
  'Pak Army IT Division'
)
ON CONFLICT (id) DO NOTHING;

-- ===================================================================
-- 3. LINK CLIENTS TO PROJECTS
-- ===================================================================
INSERT INTO public.project_clients (project_id, client_id)
VALUES 
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000006'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000007'),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000008'),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000009')
ON CONFLICT (project_id, client_id) DO NOTHING;

-- ===================================================================
-- 4. UPDATE handle_new_user TRIGGER FUNCTION FOR RBAC ROLES MAPPING
-- ===================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  assigned_role org_role;
  org_id UUID := '00000000-0000-0000-0000-000000000001';
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

  -- Auto-add project managers and team members to their respective projects (wrapped in EXCEPTION to ensure it never blocks sign-up)
  BEGIN
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
      -- Silently catch and ignore any error during project membership link
      NULL;
  END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-bind the trigger to ensure the new function is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
