-- ===================================================================
-- SEED DUMMY USERS INTO AUTH.USERS
-- ===================================================================
-- This SQL query inserts the predefined Team Members, Project Managers, and Clients
-- into the auth.users table. Their corresponding profiles, organization memberships,
-- and project assignments will be automatically created via the public.handle_new_user() trigger!
-- Predefined passwords are: Name + 123 (e.g. Taleem123, Salman123, etc.)

-- 1. Project Managers
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, role, aud, created_at, updated_at
)
VALUES 
  (
    '00000000-0000-0000-0000-000000000011', 'taleem@a7logics.com', 
    extensions.crypt('Taleem123', extensions.gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb, 
    '{"name": "Taleem Hussain", "designation": "Project Manager", "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"}'::jsonb,
    'authenticated', 'authenticated', now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000012', 'salman@a7logics.com', 
    extensions.crypt('Salman123', extensions.gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb, 
    '{"name": "Hafiz Salman", "designation": "Project Manager", "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"}'::jsonb,
    'authenticated', 'authenticated', now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000013', 'javaid@a7logics.com', 
    extensions.crypt('Javaid123', extensions.gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb, 
    '{"name": "Javaid Khadim", "designation": "Project Manager", "avatar_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"}'::jsonb,
    'authenticated', 'authenticated', now(), now()
  )
ON CONFLICT (email) DO UPDATE SET 
  encrypted_password = excluded.encrypted_password,
  raw_user_meta_data = excluded.raw_user_meta_data;

-- 2. Team Members
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, role, aud, created_at, updated_at
)
VALUES 
  (
    '00000000-0000-0000-0000-000000000014', 'zain@a7logics.com', 
    extensions.crypt('Zain123', extensions.gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb, 
    '{"name": "Zain Ul Abidin", "designation": "Senior Full-Stack Engineer", "avatar_url": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150"}'::jsonb,
    'authenticated', 'authenticated', now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000015', 'bilal@a7logics.com', 
    extensions.crypt('Bilal123', extensions.gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb, 
    '{"name": "Muhammad Bilal", "designation": "React UI Developer", "avatar_url": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150"}'::jsonb,
    'authenticated', 'authenticated', now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000016', 'hamza@a7logics.com', 
    extensions.crypt('Hamza123', extensions.gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb, 
    '{"name": "Hamza Abbasi", "designation": "QA Engineer", "avatar_url": "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150"}'::jsonb,
    'authenticated', 'authenticated', now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000017', 'ali@a7logics.com', 
    extensions.crypt('Ali123', extensions.gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb, 
    '{"name": "Ali Raza", "designation": "Backend Engineer", "avatar_url": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150"}'::jsonb,
    'authenticated', 'authenticated', now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000018', 'umar@a7logics.com', 
    extensions.crypt('Umar123', extensions.gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb, 
    '{"name": "Umar Farooq", "designation": "Mobile Engineer", "avatar_url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150"}'::jsonb,
    'authenticated', 'authenticated', now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000019', 'usman@a7logics.com', 
    extensions.crypt('Usman123', extensions.gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb, 
    '{"name": "Usman Ghani", "designation": "DevOps Engineer", "avatar_url": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150"}'::jsonb,
    'authenticated', 'authenticated', now(), now()
  )
ON CONFLICT (email) DO UPDATE SET 
  encrypted_password = excluded.encrypted_password,
  raw_user_meta_data = excluded.raw_user_meta_data;

-- 3. Clients
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at, 
  raw_app_meta_data, raw_user_meta_data, role, aud, created_at, updated_at
)
VALUES 
  (
    '00000000-0000-0000-0000-000000000020', 'tariq@clientcorp.com', 
    extensions.crypt('Tariq123', extensions.gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb, 
    '{"name": "Tariq Mahmood", "designation": "Client Liaison", "avatar_url": "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150"}'::jsonb,
    'authenticated', 'authenticated', now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000021', 'faisal@clientcorp.com', 
    extensions.crypt('Faisal123', extensions.gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb, 
    '{"name": "Faisal Qureshi", "designation": "Product Owner", "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}'::jsonb,
    'authenticated', 'authenticated', now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000022', 'kamran@clientcorp.com', 
    extensions.crypt('Kamran123', extensions.gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb, 
    '{"name": "Kamran Akmal", "designation": "Campaign Director", "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"}'::jsonb,
    'authenticated', 'authenticated', now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000023', 'rizwan@clientcorp.com', 
    extensions.crypt('Rizwan123', extensions.gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb, 
    '{"name": "Rizwan Ahmed", "designation": "IT Coordinator", "avatar_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150"}'::jsonb,
    'authenticated', 'authenticated', now(), now()
  )
ON CONFLICT (email) DO UPDATE SET 
  encrypted_password = excluded.encrypted_password,
  raw_user_meta_data = excluded.raw_user_meta_data;
