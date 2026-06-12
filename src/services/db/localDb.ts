import { 
  UserProfile, Organization, OrganizationMember, Project, ProjectMember,
  Sprint, Task, TaskComment, TaskAttachment, TaskActivity, TimeLog,
  Notification, Client, ProjectClient, UserRole
} from '@/types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'pmsa7_mock_database';

interface MockDatabaseSchema {
  profiles: UserProfile[];
  organizations: Organization[];
  organization_members: OrganizationMember[];
  projects: Project[];
  project_members: ProjectMember[];
  sprints: Sprint[];
  tasks: Task[];
  task_comments: TaskComment[];
  task_attachments: TaskAttachment[];
  task_activity: TaskActivity[];
  time_logs: TimeLog[];
  notifications: Notification[];
  clients: Client[];
  project_clients: ProjectClient[];
}

// Helper to seed initial data
const createInitialMockData = (): MockDatabaseSchema => {
  const orgId = 'org-1';
  
  const org: Organization = {
    id: orgId,
    name: 'Acme Software Labs',
    logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&h=128&fit=crop&auto=format',
    timezone: 'America/New_York',
    currency: 'USD',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const users: UserProfile[] = [
    {
      id: 'usr-super-admin',
      name: 'Naeem Tariq',
      email: 'naeemtariq451@gmail.com',
      designation: 'CEO & Founder',
      avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&auto=format',
      phone: '+92 (300) 123-4567',
      skills: ['Strategic Leadership', 'Corporate Governance', 'Product Strategy'],
      department: 'Executive',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'usr-org-admin',
      name: 'Taleem Hussain',
      email: 'taleem@a7logics.com',
      designation: 'Senior Project Manager',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&auto=format',
      phone: '+92 (312) 456-7890',
      skills: ['Agile Leadership', 'Portfolio Delivery', 'SaaS Architecture'],
      department: 'Project Management',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'usr-project-manager',
      name: 'Hafiz Salman',
      email: 'salman@a7logics.com',
      designation: 'Technical Project Manager',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&auto=format',
      phone: '+92 (321) 765-4321',
      skills: ['Scrum Framework', 'API Integration', 'Risk Management'],
      department: 'Project Management',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'usr-pm-javaid',
      name: 'Javaid Khadim',
      email: 'javaid@a7logics.com',
      designation: 'Agile Delivery Lead',
      avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&auto=format',
      phone: '+92 (333) 987-6543',
      skills: ['Sprint Planning', 'Client Relations', 'Process Optimization'],
      department: 'Project Management',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'usr-team-member-1',
      name: 'Zain Ul Abidin',
      email: 'zain@a7logics.com',
      designation: 'Senior Frontend Engineer',
      avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&auto=format',
      phone: '+92 (315) 555-1234',
      skills: ['Next.js', 'React', 'Tailwind CSS', 'TypeScript'],
      department: 'Frontend Engineering',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'usr-team-member-2',
      name: 'Muhammad Bilal',
      email: 'bilal@a7logics.com',
      designation: 'Full Stack Engineer',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&auto=format',
      phone: '+92 (345) 999-8888',
      skills: ['Node.js', 'PostgreSQL', 'Express', 'GraphQL'],
      department: 'Engineering',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'usr-tm-hamza',
      name: 'Hamza Abbasi',
      email: 'hamza@a7logics.com',
      designation: 'DevOps Specialist',
      avatar_url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&h=150&fit=crop&auto=format',
      phone: '+92 (322) 111-2222',
      skills: ['Docker', 'AWS', 'Kubernetes', 'CI/CD Pipelines'],
      department: 'DevOps & Infrastructure',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'usr-tm-ali',
      name: 'Ali Raza',
      email: 'ali@a7logics.com',
      designation: 'UI/UX Designer',
      avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop&auto=format',
      phone: '+92 (336) 444-5555',
      skills: ['Figma', 'Prototyping', 'User Research', 'Design Systems'],
      department: 'Product Design',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'usr-tm-umar',
      name: 'Umar Farooq',
      email: 'umar@a7logics.com',
      designation: 'QA Engineer',
      avatar_url: 'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=150&h=150&fit=crop&auto=format',
      phone: '+92 (300) 888-7777',
      skills: ['Jest', 'Cypress', 'Playwright', 'API Automation'],
      department: 'Quality Assurance',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'usr-tm-usman',
      name: 'Usman Ghani',
      email: 'usman@a7logics.com',
      designation: 'Backend Engineer',
      avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&h=150&fit=crop&auto=format',
      phone: '+92 (310) 666-5555',
      skills: ['Python', 'FastAPI', 'Redis', 'Microservices'],
      department: 'Backend Engineering',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'usr-client',
      name: 'Tariq Mahmood',
      email: 'tariq@clientcorp.com',
      designation: 'Product Owner (Colgate)',
      avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&auto=format',
      phone: '+92 (301) 444-2222',
      skills: ['Business Requirements', 'UAT Acceptance'],
      department: 'External Colgate Group',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'usr-client-faisal',
      name: 'Faisal Qureshi',
      email: 'faisal@clientcorp.com',
      designation: 'IT Director (Packages Mall)',
      avatar_url: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=150&h=150&fit=crop&auto=format',
      phone: '+92 (302) 111-3333',
      skills: ['Retail Digitalization', 'Mobile Marketing'],
      department: 'External Packages Group',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'usr-client-kamran',
      name: 'Kamran Akmal',
      email: 'kamran@clientcorp.com',
      designation: 'Marketing VP (Lux)',
      avatar_url: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&auto=format',
      phone: '+92 (303) 999-6666',
      skills: ['Brand Strategy', 'Product Placement'],
      department: 'External Unilever Pakistan',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'usr-client-rizwan',
      name: 'Rizwan Ahmed',
      email: 'rizwan@clientcorp.com',
      designation: 'Program Manager (Army Portal)',
      avatar_url: 'https://images.unsplash.com/photo-1489980508314-941910ded1f4?w=150&h=150&fit=crop&auto=format',
      phone: '+92 (304) 777-1111',
      skills: ['Government Portals', 'Network Security'],
      department: 'External IT Wing',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const orgMembers: OrganizationMember[] = [
    { id: 'om-1', organization_id: orgId, user_id: 'usr-super-admin', role: 'super_admin', created_at: new Date().toISOString() },
    { id: 'om-2', organization_id: orgId, user_id: 'usr-org-admin', role: 'project_manager', created_at: new Date().toISOString() },
    { id: 'om-3', organization_id: orgId, user_id: 'usr-project-manager', role: 'project_manager', created_at: new Date().toISOString() },
    { id: 'om-3b', organization_id: orgId, user_id: 'usr-pm-javaid', role: 'project_manager', created_at: new Date().toISOString() },
    { id: 'om-4', organization_id: orgId, user_id: 'usr-team-member-1', role: 'team_member', created_at: new Date().toISOString() },
    { id: 'om-5', organization_id: orgId, user_id: 'usr-team-member-2', role: 'team_member', created_at: new Date().toISOString() },
    { id: 'om-7', organization_id: orgId, user_id: 'usr-tm-hamza', role: 'team_member', created_at: new Date().toISOString() },
    { id: 'om-8', organization_id: orgId, user_id: 'usr-tm-ali', role: 'team_member', created_at: new Date().toISOString() },
    { id: 'om-9', organization_id: orgId, user_id: 'usr-tm-umar', role: 'team_member', created_at: new Date().toISOString() },
    { id: 'om-10', organization_id: orgId, user_id: 'usr-tm-usman', role: 'team_member', created_at: new Date().toISOString() },
    { id: 'om-11', organization_id: orgId, user_id: 'usr-client', role: 'client', created_at: new Date().toISOString() },
    { id: 'om-12', organization_id: orgId, user_id: 'usr-client-faisal', role: 'client', created_at: new Date().toISOString() },
    { id: 'om-13', organization_id: orgId, user_id: 'usr-client-kamran', role: 'client', created_at: new Date().toISOString() },
    { id: 'om-14', organization_id: orgId, user_id: 'usr-client-rizwan', role: 'client', created_at: new Date().toISOString() }
  ];

  const projects: Project[] = [
    {
      id: 'proj-pmsa7',
      organization_id: orgId,
      name: 'Colgate Pakistan Website',
      code: 'CPW',
      description: 'Design and develop the new high-converting marketing website for Colgate Pakistan, complete with product catalogs and consumer resources.',
      start_date: '2026-05-01T00:00:00Z',
      end_date: '2026-08-31T00:00:00Z',
      priority: 'critical',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'usr-org-admin'
    },
    {
      id: 'proj-mobile',
      organization_id: orgId,
      name: 'Packages Mall Mobile App',
      code: 'PMA',
      description: 'Develop the new iOS and Android packages mall companion application featuring shopping directories, loyalty tracking, and indoor maps.',
      start_date: '2026-06-15T00:00:00Z',
      end_date: '2026-10-15T00:00:00Z',
      priority: 'high',
      status: 'planning',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'usr-project-manager'
    },
    {
      id: 'proj-landing',
      organization_id: orgId,
      name: 'Lux Website',
      code: 'LW',
      description: 'Create a luxurious, high-converting digital storefront website for Lux Pakistan campaign promotion and ambassador listings.',
      start_date: '2026-04-10T00:00:00Z',
      end_date: '2026-05-20T00:00:00Z',
      priority: 'medium',
      status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'usr-pm-javaid'
    },
    {
      id: 'proj-pakarmy',
      organization_id: orgId,
      name: 'Pak Army Web Portal',
      code: 'PAWP',
      description: 'Design and implement the high-security portal and intranet directory for public recruitment and news broadcasts.',
      start_date: '2026-05-15T00:00:00Z',
      end_date: '2026-09-30T00:00:00Z',
      priority: 'critical',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'usr-org-admin'
    }
  ];

  const projectMembers: ProjectMember[] = [
    // Colgate Pakistan Website (CPW)
    { id: 'pm-1', project_id: 'proj-pmsa7', user_id: 'usr-org-admin', created_at: new Date().toISOString() },
    { id: 'pm-2', project_id: 'proj-pmsa7', user_id: 'usr-project-manager', created_at: new Date().toISOString() },
    { id: 'pm-3', project_id: 'proj-pmsa7', user_id: 'usr-team-member-1', created_at: new Date().toISOString() },
    { id: 'pm-4', project_id: 'proj-pmsa7', user_id: 'usr-team-member-2', created_at: new Date().toISOString() },
    { id: 'pm-5', project_id: 'proj-pmsa7', user_id: 'usr-tm-ali', created_at: new Date().toISOString() },
    { id: 'pm-6', project_id: 'proj-pmsa7', user_id: 'usr-client', created_at: new Date().toISOString() },
    
    // Packages Mall Mobile App (PMA)
    { id: 'pm-7', project_id: 'proj-mobile', user_id: 'usr-project-manager', created_at: new Date().toISOString() },
    { id: 'pm-8', project_id: 'proj-mobile', user_id: 'usr-team-member-2', created_at: new Date().toISOString() },
    { id: 'pm-9', project_id: 'proj-mobile', user_id: 'usr-tm-umar', created_at: new Date().toISOString() },
    { id: 'pm-10', project_id: 'proj-mobile', user_id: 'usr-tm-hamza', created_at: new Date().toISOString() },
    { id: 'pm-11', project_id: 'proj-mobile', user_id: 'usr-client-faisal', created_at: new Date().toISOString() },

    // Lux Website (LW)
    { id: 'pm-12', project_id: 'proj-landing', user_id: 'usr-pm-javaid', created_at: new Date().toISOString() },
    { id: 'pm-13', project_id: 'proj-landing', user_id: 'usr-team-member-1', created_at: new Date().toISOString() },
    { id: 'pm-14', project_id: 'proj-landing', user_id: 'usr-tm-usman', created_at: new Date().toISOString() },
    { id: 'pm-15', project_id: 'proj-landing', user_id: 'usr-tm-ali', created_at: new Date().toISOString() },
    { id: 'pm-16', project_id: 'proj-landing', user_id: 'usr-client-kamran', created_at: new Date().toISOString() },

    // Pak Army Web Portal (PAWP)
    { id: 'pm-17', project_id: 'proj-pakarmy', user_id: 'usr-org-admin', created_at: new Date().toISOString() },
    { id: 'pm-18', project_id: 'proj-pakarmy', user_id: 'usr-team-member-2', created_at: new Date().toISOString() },
    { id: 'pm-19', project_id: 'proj-pakarmy', user_id: 'usr-tm-hamza', created_at: new Date().toISOString() },
    { id: 'pm-20', project_id: 'proj-pakarmy', user_id: 'usr-tm-usman', created_at: new Date().toISOString() },
    { id: 'pm-21', project_id: 'proj-pakarmy', user_id: 'usr-client-rizwan', created_at: new Date().toISOString() }
  ];

  const sprints: Sprint[] = [
    {
      id: 'sprint-1',
      project_id: 'proj-pmsa7',
      name: 'Sprint 1: Schema Design & Setup',
      goal: 'Define data models, establish Next.js boilerplate, configure local db interfaces, and build baseline theme components.',
      status: 'completed',
      start_date: '2026-05-01T08:00:00Z',
      end_date: '2026-05-15T18:00:00Z',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'sprint-2',
      project_id: 'proj-pmsa7',
      name: 'Sprint 2: Core SaaS Features',
      goal: 'Deliver Kanban board drag-drop columns, full sprint burndown logging, real-time timer tracker, and interactive reporting charts.',
      status: 'active',
      start_date: '2026-05-16T08:00:00Z',
      end_date: '2026-06-16T18:00:00Z',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'sprint-3',
      project_id: 'proj-pmsa7',
      name: 'Sprint 3: Enterprise Integration',
      goal: 'Integrate client portal workflows, enable file storage attachment system, and polish responsiveness/dark-mode details.',
      status: 'upcoming',
      start_date: '2026-06-17T08:00:00Z',
      end_date: '2026-07-01T18:00:00Z',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const tasks: Task[] = [
    // Sprint 1 (Completed Done Tasks)
    {
      id: 'task-1',
      project_id: 'proj-pmsa7',
      sprint_id: 'sprint-1',
      title: 'Define DB Migration SQL schema',
      description: 'Write PostgreSQL tables, relations, and row-level security (RLS) policies to handle multi-tenant SaaS structures.',
      priority: 'high',
      status: 'done',
      assignee_id: 'usr-team-member-2',
      reporter_id: 'usr-project-manager',
      due_date: '2026-05-10T17:00:00Z',
      labels: ['Backend', 'Database'],
      estimated_hours: 8,
      actual_hours: 9,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'task-2',
      project_id: 'proj-pmsa7',
      sprint_id: 'sprint-1',
      title: 'Initialize Next.js project template',
      description: 'Setup app router structure, configure Tailwind configuration, and install core libraries.',
      priority: 'medium',
      status: 'done',
      assignee_id: 'usr-team-member-1',
      reporter_id: 'usr-project-manager',
      due_date: '2026-05-05T17:00:00Z',
      labels: ['Frontend', 'Setup'],
      estimated_hours: 4,
      actual_hours: 3.5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    
    // Sprint 2 (Active Sprints - various states)
    {
      id: 'task-3',
      project_id: 'proj-pmsa7',
      sprint_id: 'sprint-2',
      title: 'Implement Interactive Kanban Board',
      description: 'Develop multi-column card board layout with drag and drop capabilities, task summaries, quick search, and filter queries.',
      priority: 'critical',
      status: 'in_progress',
      assignee_id: 'usr-team-member-1',
      reporter_id: 'usr-project-manager',
      due_date: '2026-06-10T17:00:00Z',
      labels: ['Frontend', 'Kanban', 'UI'],
      estimated_hours: 16,
      actual_hours: 12,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'task-4',
      project_id: 'proj-pmsa7',
      sprint_id: 'sprint-2',
      title: 'Build Time Tracking Dashboard & Floating Timer',
      description: 'Create a stopwatch style time tracker that allows live start/stop/resume options, with full reporting pages.',
      priority: 'medium',
      status: 'in_progress',
      assignee_id: 'usr-team-member-2',
      reporter_id: 'usr-project-manager',
      due_date: '2026-06-12T17:00:00Z',
      labels: ['Frontend', 'Backend', 'Analytics'],
      estimated_hours: 12,
      actual_hours: 6,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'task-5',
      project_id: 'proj-pmsa7',
      sprint_id: 'sprint-2',
      title: 'Create Dashboard Charts & Productivity Metrics',
      description: 'Add progress charts (using Recharts or HTML SVGs) showing sprint burndowns, status breakdowns, and team workload logs.',
      priority: 'high',
      status: 'review',
      assignee_id: 'usr-team-member-1',
      reporter_id: 'usr-project-manager',
      due_date: '2026-06-08T17:00:00Z',
      labels: ['Frontend', 'Analytics'],
      estimated_hours: 10,
      actual_hours: 10,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'task-6',
      project_id: 'proj-pmsa7',
      sprint_id: 'sprint-2',
      title: 'Add comment notifications and @mentions',
      description: 'Allow team members to comment on tasks. Implement simple parsing to identify @username tags and spawn alerts.',
      priority: 'medium',
      status: 'todo',
      assignee_id: 'usr-team-member-2',
      reporter_id: 'usr-project-manager',
      due_date: '2026-06-14T17:00:00Z',
      labels: ['Backend', 'Collaboration'],
      estimated_hours: 8,
      actual_hours: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },

    // Backlog tasks (Sprint unassigned or Sprint 3)
    {
      id: 'task-7',
      project_id: 'proj-pmsa7',
      sprint_id: 'sprint-3',
      title: 'Build Restricted Client Portal Interface',
      description: 'Design a dashboard screen tailored for client profiles. Restrict read-only elements and disable internal logs/sprints.',
      priority: 'high',
      status: 'backlog',
      assignee_id: 'usr-team-member-1',
      reporter_id: 'usr-project-manager',
      due_date: '2026-06-25T17:00:00Z',
      labels: ['Portal', 'Security'],
      estimated_hours: 12,
      actual_hours: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'task-8',
      project_id: 'proj-pmsa7',
      sprint_id: undefined,
      title: 'Implement file attachments in discussions',
      description: 'Setup Supabase Storage buckets or local mocks for drag-and-drop file additions inside task details panels.',
      priority: 'low',
      status: 'backlog',
      assignee_id: undefined,
      reporter_id: 'usr-project-manager',
      due_date: undefined,
      labels: ['Storage', 'Files'],
      estimated_hours: 6,
      actual_hours: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const comments: TaskComment[] = [
    {
      id: 'c-1',
      task_id: 'task-3',
      author_id: 'usr-project-manager',
      content: 'Hey @Zain Ul Abidin, how is the drag and drop interaction coming? We want to make sure it feels extremely smooth.',
      created_at: new Date(Date.now() - 3600000 * 5).toISOString() // 5 hours ago
    },
    {
      id: 'c-2',
      task_id: 'task-3',
      author_id: 'usr-team-member-1',
      content: 'Going great! Implementing using vanilla elements. It is running at 60fps.',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString() // 2 hours ago
    },
    {
      id: 'c-3',
      task_id: 'task-5',
      author_id: 'usr-client',
      content: 'This metrics display looks fantastic! I can see the completion ratios clearly.',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString() // 1 day ago
    }
  ];

  const attachments: TaskAttachment[] = [
    {
      id: 'att-1',
      task_id: 'task-3',
      name: 'kanban_board_wireframe.png',
      url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&h=300&fit=crop&auto=format',
      size: 142800,
      type: 'image/png',
      uploaded_by: 'usr-project-manager',
      created_at: new Date(Date.now() - 3600000 * 48).toISOString()
    }
  ];

  const activities: TaskActivity[] = [
    {
      id: 'act-1',
      task_id: 'task-3',
      user_id: 'usr-project-manager',
      field: 'status',
      old_value: 'todo',
      new_value: 'in_progress',
      created_at: new Date(Date.now() - 3600000 * 6).toISOString()
    },
    {
      id: 'act-2',
      task_id: 'task-5',
      user_id: 'usr-team-member-1',
      field: 'status',
      old_value: 'in_progress',
      new_value: 'review',
      created_at: new Date(Date.now() - 3600000 * 12).toISOString()
    }
  ];

  const timeLogs: TimeLog[] = [
    {
      id: 'tl-1',
      task_id: 'task-1',
      user_id: 'usr-team-member-2',
      hours: 5,
      description: 'Initial schemas definitions & trigger configs',
      logged_date: '2026-05-08',
      created_at: new Date().toISOString()
    },
    {
      id: 'tl-2',
      task_id: 'task-1',
      user_id: 'usr-team-member-2',
      hours: 4,
      description: 'Setup RLS rules & test local mappings',
      logged_date: '2026-05-09',
      created_at: new Date().toISOString()
    },
    {
      id: 'tl-3',
      task_id: 'task-3',
      user_id: 'usr-team-member-1',
      hours: 8,
      description: 'Build board skeleton columns & card layout styles',
      logged_date: '2026-06-08',
      created_at: new Date().toISOString()
    },
    {
      id: 'tl-4',
      task_id: 'task-3',
      user_id: 'usr-team-member-1',
      hours: 4,
      description: 'Add drag and drop handlers and status update bindings',
      logged_date: '2026-06-09',
      created_at: new Date().toISOString()
    }
  ];

  const notifications: Notification[] = [
    {
      id: 'n-1',
      user_id: 'usr-team-member-1',
      title: 'New Task Assigned',
      content: 'Hafiz Salman assigned you task: "Implement Interactive Kanban Board"',
      link: '/projects/proj-pmsa7/board',
      is_read: false,
      created_at: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    {
      id: 'n-2',
      user_id: 'usr-team-member-1',
      title: 'New Comment',
      content: 'Hafiz Salman mentioned you in task "Implement Interactive Kanban Board"',
      link: '/projects/proj-pmsa7/board',
      is_read: false,
      created_at: new Date(Date.now() - 3600000 * 3).toISOString()
    }
  ];

  const clients: Client[] = [
    {
      id: 'cl-1',
      organization_id: orgId,
      name: 'Tariq Mahmood',
      email: 'tariq@clientcorp.com',
      company: 'Colgate Pakistan Group',
      created_at: new Date().toISOString()
    },
    {
      id: 'cl-2',
      organization_id: orgId,
      name: 'Faisal Qureshi',
      email: 'faisal@clientcorp.com',
      company: 'Packages Group',
      created_at: new Date().toISOString()
    },
    {
      id: 'cl-3',
      organization_id: orgId,
      name: 'Kamran Akmal',
      email: 'kamran@clientcorp.com',
      company: 'Unilever Pakistan',
      created_at: new Date().toISOString()
    },
    {
      id: 'cl-4',
      organization_id: orgId,
      name: 'Rizwan Ahmed',
      email: 'rizwan@clientcorp.com',
      company: 'Pak Army IT Division',
      created_at: new Date().toISOString()
    }
  ];

  const projectClients: ProjectClient[] = [
    {
      id: 'pc-1',
      project_id: 'proj-pmsa7',
      client_id: 'cl-1'
    },
    {
      id: 'pc-2',
      project_id: 'proj-mobile',
      client_id: 'cl-2'
    },
    {
      id: 'pc-3',
      project_id: 'proj-landing',
      client_id: 'cl-3'
    },
    {
      id: 'pc-4',
      project_id: 'proj-pakarmy',
      client_id: 'cl-4'
    }
  ];

  return {
    profiles: users,
    organizations: [org],
    organization_members: orgMembers,
    projects,
    project_members: projectMembers,
    sprints,
    tasks,
    task_comments: comments,
    task_attachments: attachments,
    task_activity: activities,
    time_logs: timeLogs,
    notifications,
    clients,
    project_clients: projectClients
  };
};

// Local storage reader/writer helpers
const getDb = (): MockDatabaseSchema => {
  if (typeof window === 'undefined') {
    return createInitialMockData();
  }
  const data = localStorage.getItem(STORAGE_KEY);
  let parsed = null;
  if (data) {
    try {
      parsed = JSON.parse(data);
      // Auto-migrate if Jane Doe (old seed admin) is still present
      const hasOldAdmin = parsed.profiles?.some((p: any) => p.email === 'jane.doe@acme.com');
      if (hasOldAdmin) {
        parsed = null; // force re-seed
      }
    } catch (e) {
      parsed = null;
    }
  }
  if (!parsed) {
    const seed = createInitialMockData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  return parsed;
};

const saveDb = (db: MockDatabaseSchema) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }
};

// ----------------------------------------------------
// Mock DB Async API Service
// ----------------------------------------------------

export const localDb = {
  // Profiles
  getProfiles: async (): Promise<UserProfile[]> => {
    return getDb().profiles;
  },
  
  getProfile: async (id: string): Promise<UserProfile | null> => {
    const user = getDb().profiles.find(u => u.id === id);
    return user || null;
  },

  updateProfile: async (id: string, updates: Partial<UserProfile>): Promise<UserProfile> => {
    const db = getDb();
    const idx = db.profiles.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found');
    db.profiles[idx] = { ...db.profiles[idx], ...updates, updated_at: new Date().toISOString() };
    saveDb(db);
    return db.profiles[idx];
  },

  // Organizations
  getOrganizations: async (): Promise<Organization[]> => {
    return getDb().organizations;
  },

  getOrganization: async (id: string): Promise<Organization | null> => {
    const org = getDb().organizations.find(o => o.id === id);
    return org || null;
  },

  updateOrganization: async (id: string, updates: Partial<Organization>): Promise<Organization> => {
    const db = getDb();
    const idx = db.organizations.findIndex(o => o.id === id);
    if (idx === -1) throw new Error('Organization not found');
    db.organizations[idx] = { ...db.organizations[idx], ...updates, updated_at: new Date().toISOString() };
    saveDb(db);
    return db.organizations[idx];
  },

  // Organization Members
  getOrgMembers: async (orgId: string): Promise<(OrganizationMember & { profile: UserProfile })[]> => {
    const db = getDb();
    const members = db.organization_members.filter(m => m.organization_id === orgId);
    return members.map(m => ({
      ...m,
      profile: db.profiles.find(u => u.id === m.user_id)!
    })).filter(m => !!m.profile);
  },

  inviteOrgMember: async (orgId: string, email: string, name: string, role: UserRole, designation?: string): Promise<OrganizationMember> => {
    const db = getDb();
    
    // Check if user profile already exists, otherwise create new
    let user = db.profiles.find(u => u.email === email);
    if (!user) {
      user = {
        id: 'usr-' + uuidv4().substring(0, 8),
        name,
        email,
        designation: designation || 'Consultant',
        skills: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      db.profiles.push(user);
    }

    // Check if member map exists
    let member = db.organization_members.find(m => m.organization_id === orgId && m.user_id === user.id);
    if (!member) {
      member = {
        id: 'om-' + uuidv4().substring(0, 8),
        organization_id: orgId,
        user_id: user.id,
        role,
        created_at: new Date().toISOString()
      };
      db.organization_members.push(member);
    } else {
      member.role = role;
    }
    
    saveDb(db);
    return member;
  },

  updateMemberRole: async (memberId: string, role: UserRole): Promise<OrganizationMember> => {
    const db = getDb();
    const idx = db.organization_members.findIndex(m => m.id === memberId);
    if (idx === -1) throw new Error('Org member not found');
    db.organization_members[idx].role = role;
    saveDb(db);
    return db.organization_members[idx];
  },

  // Projects
  getProjects: async (orgId: string): Promise<Project[]> => {
    return getDb().projects.filter(p => p.organization_id === orgId);
  },

  getProject: async (id: string): Promise<Project | null> => {
    return getDb().projects.find(p => p.id === id) || null;
  },

  createProject: async (orgId: string, project: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'organization_id'>): Promise<Project> => {
    const db = getDb();
    const newProj: Project = {
      ...project,
      id: 'proj-' + uuidv4().substring(0, 8),
      organization_id: orgId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.projects.push(newProj);
    
    // Auto add creator as project member
    if (project.created_by) {
      db.project_members.push({
        id: 'pm-' + uuidv4().substring(0, 8),
        project_id: newProj.id,
        user_id: project.created_by,
        created_at: new Date().toISOString()
      });
    }

    saveDb(db);
    return newProj;
  },

  updateProject: async (id: string, updates: Partial<Project>): Promise<Project> => {
    const db = getDb();
    const idx = db.projects.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Project not found');
    db.projects[idx] = { ...db.projects[idx], ...updates, updated_at: new Date().toISOString() };
    saveDb(db);
    return db.projects[idx];
  },

  deleteProject: async (id: string): Promise<boolean> => {
    const db = getDb();
    db.projects = db.projects.filter(p => p.id !== id);
    db.project_members = db.project_members.filter(pm => pm.project_id !== id);
    db.tasks = db.tasks.filter(t => t.project_id !== id);
    db.sprints = db.sprints.filter(s => s.project_id !== id);
    saveDb(db);
    return true;
  },

  // Project Members
  getProjectMembers: async (projectId: string): Promise<(ProjectMember & { profile: UserProfile })[]> => {
    const db = getDb();
    const members = db.project_members.filter(pm => pm.project_id === projectId);
    return members.map(m => ({
      ...m,
      profile: db.profiles.find(u => u.id === m.user_id)!
    })).filter(m => !!m.profile);
  },

  addProjectMember: async (projectId: string, userId: string): Promise<ProjectMember> => {
    const db = getDb();
    const exists = db.project_members.find(pm => pm.project_id === projectId && pm.user_id === userId);
    if (exists) return exists;
    
    const newPm: ProjectMember = {
      id: 'pm-' + uuidv4().substring(0, 8),
      project_id: projectId,
      user_id: userId,
      created_at: new Date().toISOString()
    };
    db.project_members.push(newPm);
    saveDb(db);
    return newPm;
  },

  removeProjectMember: async (projectId: string, userId: string): Promise<boolean> => {
    const db = getDb();
    db.project_members = db.project_members.filter(pm => !(pm.project_id === projectId && pm.user_id === userId));
    saveDb(db);
    return true;
  },

  // Sprints
  getSprints: async (projectId: string): Promise<Sprint[]> => {
    return getDb().sprints.filter(s => s.project_id === projectId);
  },

  createSprint: async (projectId: string, sprint: Omit<Sprint, 'id' | 'created_at' | 'updated_at' | 'project_id'>): Promise<Sprint> => {
    const db = getDb();
    const newSprint: Sprint = {
      ...sprint,
      id: 'sprint-' + uuidv4().substring(0, 8),
      project_id: projectId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.sprints.push(newSprint);
    saveDb(db);
    return newSprint;
  },

  updateSprint: async (id: string, updates: Partial<Sprint>): Promise<Sprint> => {
    const db = getDb();
    const idx = db.sprints.findIndex(s => s.id === id);
    if (idx === -1) throw new Error('Sprint not found');
    
    // If starting a sprint, other sprints might need to be verified (normally only one active sprint per project)
    if (updates.status === 'active') {
      const projId = db.sprints[idx].project_id;
      db.sprints.forEach(s => {
        if (s.project_id === projId && s.id !== id && s.status === 'active') {
          s.status = 'completed';
          s.updated_at = new Date().toISOString();
        }
      });
    }

    db.sprints[idx] = { ...db.sprints[idx], ...updates, updated_at: new Date().toISOString() };
    saveDb(db);
    return db.sprints[idx];
  },

  // Tasks
  getTasks: async (projectId: string): Promise<Task[]> => {
    return getDb().tasks.filter(t => t.project_id === projectId);
  },

  createTask: async (projectId: string, task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'project_id' | 'actual_hours'>): Promise<Task> => {
    const db = getDb();
    const newTask: Task = {
      ...task,
      id: 'task-' + uuidv4().substring(0, 8),
      project_id: projectId,
      actual_hours: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.tasks.push(newTask);

    // Add activity log
    db.task_activity.push({
      id: 'act-' + uuidv4().substring(0, 8),
      task_id: newTask.id,
      user_id: task.created_by || 'usr-project-manager',
      field: 'created',
      new_value: task.title,
      created_at: new Date().toISOString()
    });

    saveDb(db);
    return newTask;
  },

  updateTask: async (id: string, updates: Partial<Task>, modifierUserId?: string): Promise<Task> => {
    const db = getDb();
    const idx = db.tasks.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Task not found');
    
    const oldTask = db.tasks[idx];
    const updatedTask = { ...oldTask, ...updates, updated_at: new Date().toISOString() };
    db.tasks[idx] = updatedTask;

    // Log activities for changed fields
    const fieldsToLog: (keyof Task)[] = ['status', 'priority', 'assignee_id', 'sprint_id'];
    fieldsToLog.forEach(field => {
      if (updates[field] !== undefined && updates[field] !== oldTask[field]) {
        db.task_activity.push({
          id: 'act-' + uuidv4().substring(0, 8),
          task_id: id,
          user_id: modifierUserId || 'usr-project-manager',
          field: field as string,
          old_value: String(oldTask[field] || ''),
          new_value: String(updates[field] || ''),
          created_at: new Date().toISOString()
        });
      }
    });

    saveDb(db);
    return updatedTask;
  },

  deleteTask: async (id: string): Promise<boolean> => {
    const db = getDb();
    db.tasks = db.tasks.filter(t => t.id !== id);
    db.task_comments = db.task_comments.filter(c => c.task_id !== id);
    db.task_attachments = db.task_attachments.filter(a => a.task_id !== id);
    db.task_activity = db.task_activity.filter(ac => ac.task_id !== id);
    db.time_logs = db.time_logs.filter(tl => tl.task_id !== id);
    saveDb(db);
    return true;
  },

  // Comments
  getComments: async (taskId: string): Promise<(TaskComment & { author: UserProfile })[]> => {
    const db = getDb();
    const taskComments = db.task_comments.filter(c => c.task_id === taskId);
    return taskComments.map(c => ({
      ...c,
      author: db.profiles.find(u => u.id === c.author_id)!
    })).filter(c => !!c.author);
  },

  createComment: async (taskId: string, authorId: string, content: string): Promise<TaskComment> => {
    const db = getDb();
    const newComment: TaskComment = {
      id: 'c-' + uuidv4().substring(0, 8),
      task_id: taskId,
      author_id: authorId,
      content,
      created_at: new Date().toISOString()
    };
    db.task_comments.push(newComment);

    // Check for mentions and trigger mock notifications
    const mentionRegex = /@([a-zA-Z0-9.\s]+)/g;
    let match;
    const task = db.tasks.find(t => t.id === taskId);
    
    while ((match = mentionRegex.exec(content)) !== null) {
      const username = match[1].trim().toLowerCase();
      const mentionedUser = db.profiles.find(p => p.name.toLowerCase().includes(username) || p.email.toLowerCase().startsWith(username));
      
      if (mentionedUser && mentionedUser.id !== authorId) {
        db.notifications.push({
          id: 'n-' + uuidv4().substring(0, 8),
          user_id: mentionedUser.id,
          title: 'You were mentioned',
          content: `${db.profiles.find(p => p.id === authorId)?.name} mentioned you in task: "${task?.title}"`,
          link: `/projects/${task?.project_id}/board`,
          is_read: false,
          created_at: new Date().toISOString()
        });
      }
    }

    saveDb(db);
    return newComment;
  },

  // Attachments
  getAttachments: async (taskId: string): Promise<TaskAttachment[]> => {
    return getDb().task_attachments.filter(a => a.task_id === taskId);
  },

  createAttachment: async (taskId: string, attachment: Omit<TaskAttachment, 'id' | 'created_at' | 'task_id'>): Promise<TaskAttachment> => {
    const db = getDb();
    const newAtt: TaskAttachment = {
      ...attachment,
      task_id: taskId,
      id: 'att-' + uuidv4().substring(0, 8),
      created_at: new Date().toISOString()
    };
    db.task_attachments.push(newAtt);
    saveDb(db);
    return newAtt;
  },

  deleteAttachment: async (id: string): Promise<boolean> => {
    const db = getDb();
    db.task_attachments = db.task_attachments.filter(a => a.id !== id);
    saveDb(db);
    return true;
  },

  // Time Logs
  getTimeLogs: async (projectId: string): Promise<(TimeLog & { taskTitle: string, userProfile: UserProfile })[]> => {
    const db = getDb();
    const projectTasks = db.tasks.filter(t => t.project_id === projectId);
    const taskIds = projectTasks.map(t => t.id);
    const logs = db.time_logs.filter(tl => taskIds.includes(tl.task_id));
    
    return logs.map(l => {
      const task = projectTasks.find(t => t.id === l.task_id)!;
      const user = db.profiles.find(u => u.id === l.user_id)!;
      return {
        ...l,
        taskTitle: task?.title || 'Unknown Task',
        userProfile: user
      };
    });
  },

  createTimeLog: async (taskId: string, userId: string, hours: number, description: string, loggedDate: string): Promise<TimeLog> => {
    const db = getDb();
    const newLog: TimeLog = {
      id: 'tl-' + uuidv4().substring(0, 8),
      task_id: taskId,
      user_id: userId,
      hours,
      description,
      logged_date: loggedDate,
      created_at: new Date().toISOString()
    };
    db.time_logs.push(newLog);

    // Update actual hours in the task
    const taskIdx = db.tasks.findIndex(t => t.id === taskId);
    if (taskIdx !== -1) {
      db.tasks[taskIdx].actual_hours = Number(db.tasks[taskIdx].actual_hours || 0) + Number(hours);
    }

    saveDb(db);
    return newLog;
  },

  // Notifications
  getNotifications: async (userId: string): Promise<Notification[]> => {
    return getDb().notifications.filter(n => n.user_id === userId).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  markNotificationRead: async (id: string): Promise<boolean> => {
    const db = getDb();
    const idx = db.notifications.findIndex(n => n.id === id);
    if (idx !== -1) {
      db.notifications[idx].is_read = true;
      saveDb(db);
      return true;
    }
    return false;
  },

  markAllNotificationsRead: async (userId: string): Promise<boolean> => {
    const db = getDb();
    db.notifications.forEach(n => {
      if (n.user_id === userId) n.is_read = true;
    });
    saveDb(db);
    return true;
  },

  createNotification: async (userId: string, title: string, content: string, link?: string): Promise<Notification> => {
    const db = getDb();
    const newNotif: Notification = {
      id: 'n-' + uuidv4().substring(0, 8),
      user_id: userId,
      title,
      content,
      link,
      is_read: false,
      created_at: new Date().toISOString()
    };
    db.notifications.push(newNotif);
    saveDb(db);
    return newNotif;
  },

  // Clients
  getClients: async (orgId: string): Promise<Client[]> => {
    return getDb().clients.filter(c => c.organization_id === orgId);
  },

  createClient: async (orgId: string, client: Omit<Client, 'id' | 'created_at'>): Promise<Client> => {
    const db = getDb();
    const newClient: Client = {
      ...client,
      id: 'cl-' + uuidv4().substring(0, 8),
      organization_id: orgId,
      created_at: new Date().toISOString()
    };
    db.clients.push(newClient);

    // Also auto-create a profile for the client user so they can login and use switcher
    const exists = db.profiles.find(p => p.email === client.email);
    if (!exists) {
      db.profiles.push({
        id: 'usr-client', // Let's keep it fixed for switching convenience, or assign a random one if usr-client is busy
        name: client.name,
        email: client.email,
        designation: 'Client Contact',
        skills: [],
        department: client.company || 'External Client',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    saveDb(db);
    return newClient;
  },

  getProjectClients: async (projectId: string): Promise<Client[]> => {
    const db = getDb();
    const clientIds = db.project_clients.filter(pc => pc.project_id === projectId).map(pc => pc.client_id);
    return db.clients.filter(c => clientIds.includes(c.id));
  },

  associateClientToProject: async (projectId: string, clientId: string): Promise<ProjectClient> => {
    const db = getDb();
    const exists = db.project_clients.find(pc => pc.project_id === projectId && pc.client_id === clientId);
    if (exists) return exists;

    const newPc: ProjectClient = {
      id: 'pc-' + uuidv4().substring(0, 8),
      project_id: projectId,
      client_id: clientId
    };
    db.project_clients.push(newPc);
    saveDb(db);
    return newPc;
  },

  // Task Activity Logs
  getActivityLogs: async (taskId: string): Promise<(TaskActivity & { user: UserProfile })[]> => {
    const db = getDb();
    const activity = db.task_activity.filter(a => a.task_id === taskId).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return activity.map(a => ({
      ...a,
      user: db.profiles.find(u => u.id === a.user_id) || {
        id: 'unknown',
        name: 'System',
        email: 'system@pmsa7.com',
        skills: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }));
  }
};
