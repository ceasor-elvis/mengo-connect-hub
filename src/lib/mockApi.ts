import MockAdapter from 'axios-mock-adapter';
import { AxiosInstance } from 'axios';
import { DEFAULT_TREE } from '../hooks/useHierarchy';

// Mock DB
const USERS: Record<string, any> = {
  'adminabsolute': {
    password: 'absolute2026!',
    user: { id: 'usr_admin', username: 'adminabsolute', email: 'admin@mengo.sc' },
    profile: { id: 'prof_admin', user_id: 'usr_admin', full_name: 'Absolute Admin', profile_pic: null, student_class: null },
    roles: ['adminabsolute'],
  },
  'patron': {
    password: 'patron123',
    user: { id: 'usr_patron', username: 'patron', email: 'patron@mengo.sc' },
    profile: { id: 'prof_patron', user_id: 'usr_patron', full_name: 'School Patron', profile_pic: null, student_class: null },
    roles: ['patron'],
  },
  'chairperson': {
    password: 'chairperson123',
    user: { id: 'usr_chair', username: 'chairperson', email: 'chairperson@mengo.sc' },
    profile: { id: 'prof_chair', user_id: 'usr_chair', full_name: 'Chair Person', profile_pic: null, student_class: 'S.5' },
    roles: ['chairperson'],
  },
  'merecouncillor': {
    password: 'merecouncillor123',
    user: { id: 'usr_councillor', username: 'merecouncillor', email: 'mere@mengo.sc' },
    profile: { id: 'prof_councillor', user_id: 'usr_councillor', full_name: 'Mere Councillor', profile_pic: null, student_class: 'S.3' },
    roles: ['councillor'],
  },
  'publicity': {
    password: 'publicity123',
    user: { id: 'usr_pub', username: 'publicity', email: 'publicity@mengo.sc' },
    profile: { id: 'prof_pub', user_id: 'usr_pub', full_name: 'Secretary Publicity', profile_pic: null, student_class: 'S.4' },
    roles: ['secretary_publicity'],
  },
  'disciplinary': {
    password: 'disciplinary123',
    user: { id: 'usr_dc', username: 'disciplinary', email: 'dc@mengo.sc' },
    profile: { id: 'prof_dc', user_id: 'usr_dc', full_name: 'Disciplinary Committee', profile_pic: null, student_class: 'S.5' },
    roles: ['disciplinary_committee'],
  },
  'vicechair': {
    password: 'vicechair123',
    user: { id: 'usr_vc', username: 'vicechair', email: 'vc@mengo.sc' },
    profile: { id: 'prof_vc', user_id: 'usr_vc', full_name: 'Vice Chairperson (DP)', profile_pic: null, student_class: 'S.6' },
    roles: ['vice_chairperson'],
  }
};

let MOCK_APPLICANTS = [
  { id: '1', applicant_name: 'Jane Doe', class: 'S.2', stream: 'North', smart_score: 9, conf_score: 8, qapp_score: 8, average_score: 25, comment: 'Great prospect', gender: 'female', status: 'qualified' },
  { id: '2', applicant_name: 'John Smith', class: 'S.2', stream: 'South', smart_score: 4, conf_score: 5, qapp_score: 3, average_score: 12, comment: 'Needs confidence', gender: 'male', status: 'disqualified' },
];

let MOCK_STREAMS = [
  { id: '1', name: 'EAST' },
  { id: '2', name: 'WEST' },
];

let MOCK_NOTIFICATIONS: any[] = [
  { id: '1', user_id: 'usr_admin', title: 'System Update', message: 'The portal is now active.', type: 'info', read: false, created_at: new Date().toISOString() },
];

let MOCK_ACTIVITY_LOGS: any[] = [
  { id: '1', action: 'Login', module: 'Auth', details: 'User adminabsolute logged in', created_at: new Date().toISOString() },
];

let MOCK_REQUISITIONS: any[] = [
  { id: '1', item: 'Printer Ink', amount: 45000, requested_by: 'usr_pub', status: 'pending', approved_by: null, created_at: new Date().toISOString() },
];

let MOCK_ROTAS: any[] = [
  { id: '1', week: 'Week 14 (Apr 6 – Apr 12)', duties: [{ day: 'Mon', task: 'Main gate duty', assigned: 'Mere Councillor' }], created_by: 'usr_admin' },
];

let MOCK_TREE = [...DEFAULT_TREE];

export function setupMockApi(api: AxiosInstance) {
  const mock = new MockAdapter(api, { delayResponse: 500 });
  
  mock.onPost('/users/login/').reply((config) => {
    const { username, password } = JSON.parse(config.data);
    const userMock = USERS[username.toLowerCase()];
    if (userMock && userMock.password === password) {
      return [200, {
        access: 'mock-access-token-' + username,
        refresh: 'mock-refresh-token-' + username,
        user: userMock.user,
      }];
    }
    return [401, { detail: "No active account found with the given credentials" }];
  });

  mock.onGet('/users/me/profile/').reply((config) => {
    const token = config.headers?.Authorization;
    if (token) {
      const username = token.split('-').pop();
      if (username && USERS[username]) {
        return [200, USERS[username].profile];
      }
    }
    return [401, {}];
  });

  mock.onPatch('/users/me/profile/').reply((config) => {
    const token = config.headers?.Authorization;
    if (token) {
      const username = token.split('-').pop();
      if (username && USERS[username]) {
        const body = JSON.parse(config.data);
        USERS[username].profile = { ...USERS[username].profile, ...body };
        return [200, USERS[username].profile];
      }
    }
    return [401, {}];
  });

  mock.onGet('/users/me/roles/').reply((config) => {
    const token = config.headers?.Authorization;
    if (token) {
      const username = token.split('-').pop();
      if (username && USERS[username]) {
        return [200, { roles: USERS[username].roles }];
      }
    }
    return [401, {}];
  });

  mock.onPost('/users/register/').reply(() => {
    return [201, { message: "Mock user registered" }];
  });

  // Mock Election Endpoints
  mock.onGet('/applications/').reply(() => {
    return [200, { results: MOCK_APPLICANTS }];
  });

  mock.onPost('/applications/').reply((config) => {
    const body = JSON.parse(config.data);
    const newApp = { ...body, class: body.applicant_class || body.class, id: Date.now().toString(), status: 'pending' };
    MOCK_APPLICANTS.push(newApp);
    return [201, newApp];
  });

  mock.onPatch(/\/applications\/\d+\//).reply((config) => {
    const id = config.url?.split('/')[2];
    const body = JSON.parse(config.data);
    const index = MOCK_APPLICANTS.findIndex(a => a.id === id);
    if (index > -1) {
      MOCK_APPLICANTS[index] = { ...MOCK_APPLICANTS[index], ...body };
      return [200, MOCK_APPLICANTS[index]];
    }
    return [404, {}];
  });

  mock.onDelete(/\/applications\/\d+\//).reply((config) => {
    const id = config.url?.split('/')[2];
    const index = MOCK_APPLICANTS.findIndex(a => a.id === id);
    if (index > -1) {
      MOCK_APPLICANTS.splice(index, 1);
      return [204, {}];
    }
    return [404, {}];
  });

  mock.onPost('/applications/auto-screen/').reply((config) => {
    const { min_average } = JSON.parse(config.data);
    MOCK_APPLICANTS = MOCK_APPLICANTS.map(app => {
      if (app.status === 'pending') {
         return { ...app, status: app.average_score >= min_average ? 'qualified' : 'disqualified' };
      }
      return app;
    });
    return [200, { message: 'Screened' }];
  });

  mock.onGet('/streams/').reply(200, { results: MOCK_STREAMS });
  mock.onPost('/streams/').reply((config) => {
    const data = JSON.parse(config.data);
    const newStream = { id: Date.now().toString(), name: data.name };
    MOCK_STREAMS.push(newStream);
    return [201, newStream];
  });

  let MOCK_DOCS: any[] = [
    { id: '100', title: 'Term 1 Report', category: 'Reports', uploaded_by: 'adminabsolute', uploader_role: 'adminabsolute', access_level: 'public', file_url: '#', created_at: new Date().toISOString(), target_office: null },
  ];

  let MOCK_BLOGS: any[] = [
    { id: '1', title: 'Welcome to Mengo Student Hub', content: 'This is the first official blog post regarding our new portal. Watch this space for updates from the Publicity office.', author: 'Publicity Team', media_url: null, media_type: 'none', created_at: new Date().toISOString() }
  ];

  let MOCK_PROGRAMMES: any[] = [
    { id: '1', title: 'Opening Ceremony', description: 'Termly opening assembly for all students.', event_date: new Date().toISOString(), visibility: 'public', created_by: 'adminabsolute', created_at: new Date().toISOString() },
    { id: '2', title: 'Council Strategy Meeting', description: 'Private meeting for incoming strategies.', event_date: new Date(Date.now() + 86400000 * 2).toISOString(), visibility: 'private', created_by: 'chairperson', created_at: new Date().toISOString() }
  ];

  let MOCK_ISSUES: any[] = [
    { id: '1', title: 'Broken Lab Equipment', category: 'Infrastructure', description: 'Form 4 lab is lacking working microscopes.', status: 'Open', priority: 'High', raised_by: 'usr_councillor', reporter_name: 'Mere Councillor', created_at: new Date().toISOString() }
  ];

   let MOCK_GALLERY: any[] = [
     { id: '1', url: 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\08c7024b-0041-495b-92e4-45a85fefbc71\\mengo_campus_overview_1775100183030.png', caption: 'Aerial View of the Historic Mengo Senior School Campus', created_at: new Date().toISOString() },
     { id: '2', url: 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\08c7024b-0041-495b-92e4-45a85fefbc71\\mengo_student_council_meeting_1775100203952.png', caption: 'Student Council Strategic Leadership & Governance Session', created_at: new Date().toISOString() },
     { id: '3', url: 'C:\\Users\\Administrator\\.gemini\\antigravity\\brain\\08c7024b-0041-495b-92e4-45a85fefbc71\\mengo_sports_festival_1775100236898.png', caption: 'Annual Inter-house Sports Day - Competition & Unity', created_at: new Date().toISOString() },
     { id: '4', url: 'https://images.unsplash.com/photo-1577891729319-618bf5d70b4c?auto=format&fit=crop&q=80', caption: 'Main Hall Assembly - Termly Student Induction', created_at: new Date().toISOString() },
     { id: '5', url: 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?auto=format&fit=crop&q=80', caption: 'Advanced Science Laboratory Practical Sessions', created_at: new Date().toISOString() },
     { id: '6', url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80', caption: 'Prefects Induction & Swearing-In Ceremony', created_at: new Date().toISOString() },
     { id: '7', url: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&q=80', caption: 'Sunday Mass & Spiritual Guidance at the Chapel', created_at: new Date().toISOString() },
     { id: '8', url: 'https://images.unsplash.com/photo-1541339907198-e08756eaa539?auto=format&fit=crop&q=80', caption: 'Quiet Study Hour in the Main Library', created_at: new Date().toISOString() },
     { id: '9', url: 'https://images.unsplash.com/photo-1511629091441-ee46146481b6?auto=format&fit=crop&q=80', caption: 'National Debate Championship - Regional Semi-Finals', created_at: new Date().toISOString() },
     { id: '10', url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80', caption: 'Drama & Music Festival - Creative Arts Showcase', created_at: new Date().toISOString() },
     { id: '11', url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80', caption: 'Inter-House Football Finals - Spirit of Mengo', created_at: new Date().toISOString() },
     { id: '12', url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80', caption: 'Peer Mentorship Program - Student Outreach', created_at: new Date().toISOString() }
   ];
 
   let MOCK_STUDENT_VOICES: any[] = [
     { id: '1', title: 'Better Cafeteria Menu', category: 'ideas', description: 'The menu is currently repetitive. Requesting more variety in fruits and snacks for students.', status: 'Pending', submitted_by: 'Musa John', submitted_class: 'S.3', file: null, created_at: new Date().toISOString(), is_forwarded_to_patron: false },
     { id: '2', title: 'Broken Lab Equipment', category: 'complaints', description: 'Form 4 lab is lacking working microscopes. This makes practical sessions difficult.', status: 'Pending', submitted_by: 'Sarah Faith', submitted_class: 'S.4', file: null, created_at: new Date().toISOString(), is_forwarded_to_patron: true },
     { id: '3', title: 'aaaaaaaaaaaaaaa', category: 'ideas', description: 'sdsdsdsdsdsdsdsdsdsd sdsdsdsdsdsdsdsdsd', status: 'Pending', submitted_by: 'Anonymous', submitted_class: 'S.2', file: null, created_at: new Date().toISOString(), is_forwarded_to_patron: false },
     { id: '4', title: 'URGENT: Stolen Phone', category: 'complaints', description: 'Someone stole my phone in the locker room. This is unfair and I want a strike if it is not found!', status: 'Pending', submitted_by: 'Kato Paul', submitted_class: 'S.5', file: null, created_at: new Date().toISOString(), is_forwarded_to_patron: false }
   ];

  const getFilteredVoices = (config: any) => {
    const isPatronMock = config.headers?.["Authorization"]?.includes("patron_token") || false;
    return isPatronMock ? MOCK_STUDENT_VOICES.filter(v => v.is_forwarded_to_patron) : MOCK_STUDENT_VOICES;
  };

  mock.onGet('/dashboard/stats/').reply((config) => {
    const voices = getFilteredVoices(config);
    return [200, {
      stats: {
        voices: voices.length,
        issues: MOCK_ISSUES.length,
        events: 12,
        docs: 45
      },
      recentVoices: voices.slice(0, 3).map(v => ({
        title: v.title,
        category: v.category,
        status: v.status.toLowerCase(),
        date: new Date(v.created_at).toLocaleDateString()
      })),
      recentIssues: MOCK_ISSUES.slice(0, 3).map(c => ({
        title: c.title,
        status: c.status.toLowerCase(),
        raised: new Date(c.created_at).toLocaleDateString()
      })),
      finance: [
        { v: "15.4M", l: "Budget" },
        { v: "8.2M", l: "Spent" },
        { v: "7.2M", l: "Left" }
      ]
    }];
  });

  mock.onGet('/blogs/').reply(200, { results: MOCK_BLOGS });
  mock.onPost('/blogs/').reply((config) => {
    const data = JSON.parse(config.data);
    const newBlog = { ...data, id: Date.now().toString(), created_at: new Date().toISOString() };
    MOCK_BLOGS.unshift(newBlog); // Add to beginning
    return [201, newBlog];
  });

  mock.onGet('/documents/').reply((config) => {
    const token = config.headers?.Authorization;
    let userRole = '';
    if (token) {
      const username = token.split('-').pop();
      if (username && USERS[username]) {
        userRole = USERS[username].roles[0];
      }
    }
    
    // Filter docs based on access level
    const visibleDocs = MOCK_DOCS.filter(doc => {
      if (userRole === 'adminabsolute' || userRole === 'patron') return true;
      if (doc.access_level === 'public') return true;
      if (doc.access_level === 'private' && doc.uploader_role === userRole) return true;
      if (doc.access_level === 'shared' && doc.target_office === userRole) return true;
      if (doc.access_level === 'shared' && doc.uploader_role === userRole) return true; // Sender can also see it
      return false;
    });

    return [200, { results: visibleDocs }];
  });

  mock.onPost('/documents/').reply((config) => {
    const token = config.headers?.Authorization;
    let username = 'unknown';
    let userRole = 'councillor';
    if (token) {
      username = token.split('-').pop() || 'unknown';
      if (USERS[username]) userRole = USERS[username].roles[0];
    }
    
    // Parse simulated FormData structure
    const getFormDataValue = (fd: any, key: string) => {
       if (fd && fd.get) return fd.get(key);
       return '';
    };

    const newDoc = {
      id: Date.now().toString(),
      title: getFormDataValue(config.data, 'title') || 'Uploaded Document',
      category: getFormDataValue(config.data, 'category') || 'Other',
      access_level: getFormDataValue(config.data, 'access_level') || 'public',
      target_office: getFormDataValue(config.data, 'target_office') || null,
      uploaded_by: username,
      uploader_role: userRole,
      file_url: '#',
      created_at: new Date().toISOString(),
    };
    MOCK_DOCS.push(newDoc);
    return [201, newDoc];
  });

  // Mock EC Grants
  mock.onGet('/ec-access-grants/').reply(200, { results: [] });

  let MOCK_ELECTION_LOCKS: any[] = [];

  mock.onGet('/election-locks/').reply(200, { results: MOCK_ELECTION_LOCKS });
  mock.onPost('/election-locks/').reply((config) => {
    const data = JSON.parse(config.data);
    const newLock = { ...data, id: Date.now().toString(), created_at: new Date().toISOString() };
    MOCK_ELECTION_LOCKS.push(newLock);
    return [201, newLock];
  });
  mock.onDelete(/\/election-locks\/\d+\//).reply((config) => {
    const id = config.url?.split('/')[2];
    MOCK_ELECTION_LOCKS = MOCK_ELECTION_LOCKS.filter(l => l.id !== id);
    return [204, {}];
  });

  mock.onGet('/users/all-profiles/').reply(200, { results: Object.values(USERS).map(u => u.profile) });

  mock.onGet('/users/all-roles/').reply((config) => {
    const roles: any[] = [];
    Object.values(USERS).forEach(u => {
      u.roles.forEach((r: string) => {
        roles.push({ role: r, user_id: u.profile.user_id });
      });
    });
    return [200, roles]; // Return array as expected by component
  });

  mock.onPost('/users/upgrade-role/').reply((config) => {
    const { user_id, new_role } = JSON.parse(config.data);
    
    // 1. Clear this role from anyone else who might have it (if it's a leadership role)
    // We only enforce 1-to-1 for non-general roles like 'councillor'
    if (new_role !== 'councillor' && new_role !== 'adminabsolute') {
      Object.keys(USERS).forEach(username => {
        if (USERS[username].roles.includes(new_role)) {
          USERS[username].roles = USERS[username].roles.filter((r: string) => r !== new_role);
          // If they end up with no roles, give them 'councillor'
          if (USERS[username].roles.length === 0) USERS[username].roles = ['councillor'];
        }
      });
    }

    // 2. Assign the new role to the target user
    const userToUpdate = Object.values(USERS).find((u) => u.profile.user_id === user_id);
    if (userToUpdate) {
      if (new_role === 'councillor') {
        userToUpdate.roles = ['councillor'];
      } else {
        // Replace existing roles or specific logic? Let's just set the primary role.
        userToUpdate.roles = [new_role];
      }
      return [200, { message: "Cabinet position updated!" }];
    }
    return [404, { detail: "User not found" }];
  });

  mock.onGet('/users/councillors/').reply(200, { 
    results: Object.values(USERS).map(u => u.profile) 
  });


  mock.onGet('/programmes/').reply((config) => {
    const token = config.headers?.Authorization;
    let userRole = null;
    if (token) {
      const username = token.split('-').pop();
      if (username && USERS[username]) {
        userRole = USERS[username].roles[0];
      }
    }
    
    // Default visibility allows all to council and public to guests
    let visibleProgrammes = MOCK_PROGRAMMES;
    if (!userRole) {
       // Filter down to only public
       visibleProgrammes = MOCK_PROGRAMMES.filter(p => p.visibility === 'public');
    }
    return [200, { results: visibleProgrammes }];
  });

  mock.onPost('/programmes/').reply((config) => {
    const data = JSON.parse(config.data);
    const newProg = { ...data, id: Date.now().toString(), created_at: new Date().toISOString() };
    MOCK_PROGRAMMES.push(newProg);
    return [201, newProg];
  });

  mock.onGet('/issues/').reply((config) => {
    return [200, { results: MOCK_ISSUES }];
  });

  mock.onPost('/issues/').reply((config) => {
    const data = JSON.parse(config.data);
    const newIssue = { ...data, id: Date.now().toString(), status: 'Open', created_at: new Date().toISOString() };
    MOCK_ISSUES.push(newIssue);
    return [201, newIssue];
  });

  mock.onPatch(/\/issues\/\d+\//).reply((config) => {
    const id = config.url?.split('/')[2];
    const data = JSON.parse(config.data);
    const index = MOCK_ISSUES.findIndex(c => c.id === id);
    if (index !== -1) {
      MOCK_ISSUES[index] = { ...MOCK_ISSUES[index], ...data };
      return [200, MOCK_ISSUES[index]];
    }
    return [404, { detail: 'Issue not found' }];
  });

  // Notifications
  mock.onGet('/notifications/').reply(200, { results: MOCK_NOTIFICATIONS });
  mock.onPost('/notifications/').reply((config) => {
    const data = JSON.parse(config.data);
    const newNotify = { ...data, id: Date.now().toString(), read: false, created_at: new Date().toISOString() };
    MOCK_NOTIFICATIONS.unshift(newNotify);
    return [201, newNotify];
  });
  mock.onPost('/notifications/all/').reply((config) => {
    const data = JSON.parse(config.data);
    const newNotify = { ...data, id: Date.now().toString(), user_id: 'all', read: false, created_at: new Date().toISOString() };
    MOCK_NOTIFICATIONS.unshift(newNotify);
    return [201, newNotify];
  });
  mock.onPost('/notifications/mark-all-read/').reply(() => {
    MOCK_NOTIFICATIONS = MOCK_NOTIFICATIONS.map(n => ({ ...n, read: true }));
    return [200, { message: 'All read' }];
  });

  // Activity Logs
  mock.onGet('/activity-logs/').reply(200, { results: MOCK_ACTIVITY_LOGS });
  mock.onPost('/activity-logs/').reply((config) => {
    const data = JSON.parse(config.data);
    const newLog = { ...data, id: Date.now().toString(), created_at: new Date().toISOString() };
    MOCK_ACTIVITY_LOGS.unshift(newLog);
    return [201, newLog];
  });

  // Requisitions
  mock.onGet('/requisitions/').reply(200, { results: MOCK_REQUISITIONS });
  mock.onPost('/requisitions/').reply((config) => {
    const data = JSON.parse(config.data);
    const newReq = { ...data, id: Date.now().toString(), status: 'pending', created_at: new Date().toISOString() };
    MOCK_REQUISITIONS.push(newReq);
    return [201, newReq];
  });
  mock.onPatch(/\/requisitions\/\d+\//).reply((config) => {
    const id = config.url?.split('/')[2];
    const data = JSON.parse(config.data);
    const index = MOCK_REQUISITIONS.findIndex(r => r.id === id);
    if (index !== -1) {
      MOCK_REQUISITIONS[index] = { ...MOCK_REQUISITIONS[index], ...data };
      return [200, MOCK_REQUISITIONS[index]];
    }
    return [404, {}];
  });

  // Rotas
  mock.onGet('/rotas/').reply(200, { results: MOCK_ROTAS });
  mock.onPost('/rotas/').reply((config) => {
    const data = JSON.parse(config.data);
    const newRota = { ...data, id: Date.now().toString(), created_at: new Date().toISOString() };
    MOCK_ROTAS.push(newRota);
    return [201, newRota];
  });
  mock.onPatch(/\/rotas\/\d+\//).reply((config) => {
    const id = config.url?.split('/')[2];
    const data = JSON.parse(config.data);
    const index = MOCK_ROTAS.findIndex(r => r.id === id);
    if (index !== -1) {
      MOCK_ROTAS[index] = { ...MOCK_ROTAS[index], ...data };
      return [200, MOCK_ROTAS[index]];
    }
    return [404, {}];
  });
  mock.onDelete(/\/rotas\/\d+\//).reply((config) => {
    const id = config.url?.split('/')[2];
    MOCK_ROTAS = MOCK_ROTAS.filter(r => r.id !== id);
    return [204, {}];
  });

  mock.onGet('/gallery/').reply(200, { results: MOCK_GALLERY });
  mock.onPost('/gallery/').reply((config) => {
    const data = JSON.parse(config.data);
    const newPhoto = { 
      ...data, 
      id: Date.now().toString(), 
      url: data.url || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80', // Fallback for simulation
      created_at: new Date().toISOString() 
    };
    MOCK_GALLERY.unshift(newPhoto);
    return [201, newPhoto];
  });

   mock.onGet('/student-voices/').reply(200, { results: MOCK_STUDENT_VOICES });
   mock.onPost('/student-voices/').reply((config) => {
     let title = "Voice Sub", description = "", category = "General";
     if (config.data instanceof FormData) {
        title = config.data.get('title') as string;
        description = config.data.get('description') as string;
        category = config.data.get('category') as string;
     } else {
        const body = JSON.parse(config.data);
        title = body.title; description = body.description; category = body.category;
     }
     const newVoice = { id: Date.now().toString(), title, description, category, status: 'Pending', created_at: new Date().toISOString(), is_forwarded_to_patron: false };
     MOCK_STUDENT_VOICES.unshift(newVoice);
     return [201, newVoice];
   });
   mock.onPatch(/\/student-voices\/\d+\//).reply((config) => {
     const id = config.url?.split('/')[2];
     const data = JSON.parse(config.data);
     const index = MOCK_STUDENT_VOICES.findIndex(v => v.id === id);
     if (index !== -1) {
       MOCK_STUDENT_VOICES[index] = { ...MOCK_STUDENT_VOICES[index], ...data };
       return [200, MOCK_STUDENT_VOICES[index]];
     }
     return [404, {}];
   });
   mock.onDelete(/\/student-voices\/\d+\//).reply((config) => {
     const id = config.url?.split('/')[2];
     MOCK_STUDENT_VOICES = MOCK_STUDENT_VOICES.filter(v => v.id !== id);
     return [204, {}];
   });
 
   mock.onGet('/hierarchy-tree/').reply(200, { results: MOCK_TREE });
   mock.onPut('/hierarchy-tree/').reply((config) => {
     try {
       const newTree = JSON.parse(config.data);
       if (Array.isArray(newTree)) {
         MOCK_TREE = newTree;
         return [200, { results: MOCK_TREE, message: "Tree updated successfully" }];
       }
       return [400, { detail: "Invalid tree structure" }];
     } catch (e) {
       return [400, { detail: "Invalid JSON" }];
     }
   });

   mock.onAny().passThrough();
}
