export const projects = [
  {
    id: 'p1',
    role: 'admin',
    name: 'Website Redesign',
    description: 'Redesign the company website with new branding.',
    deadline: '2026-10-15',
    tasks: [
      { id: 't1', title: 'Design landing page', status: 'completed' },
      { id: 't2', title: 'Create navigation menu', status: 'in-progress' },
      { id: 't3', title: 'Develop frontend', status: 'todo' },
      { id: 't4', title: 'Integrate backend API', status: 'todo' },
      { id: 't5', title: 'Test and deploy', status: 'completed' },
    ],
  },
  {
    id: 'p2',
    role: 'collaborator',
    name: 'Mobile App',
    description: 'Build and launch the mobile app MVP.',
    deadline: '2026-11-10',
    tasks: [
      { id: 't6', title: 'Plan screens', status: 'completed' },
      { id: 't7', title: 'Build login', status: 'in-progress' },
      { id: 't8', title: 'Build dashboard', status: 'todo' },
      { id: 't9', title: 'Publish', status: 'todo' },
    ],
  },
  {
    id: 'p3',
    role: 'admin',
    name: 'Marketing Campaign',
    description: 'Plan and execute the Q4 marketing campaign.',
    deadline: '2026-10-30',
    tasks: [
      { id: 't10', title: 'Write plan', status: 'completed' },
      { id: 't11', title: 'Design posters', status: 'completed' },
      { id: 't12', title: 'Launch', status: 'in-progress' },
    ],
  },
]