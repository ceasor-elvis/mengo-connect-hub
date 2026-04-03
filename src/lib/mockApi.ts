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

  let MOCK_DC_CASES: any[] = [
    { 
      id: '1', 
      offender_name: 'Student A', 
      category: 'Insubordination', 
      description: 'Refusal to follow head prefect instructions during assembly.', 
      status: 'Pending', 
      reported_by: 'merecouncillor', 
      assigned_to_id: null,
      assigned_to_name: null,
      forwarded_to_office: null,
      created_at: new Date().toISOString() 
    }
  ];

  let MOCK_DC_DOCS: any[] = [
    { id: '1', title: 'Disciplinary Procedures 2026', category: 'Official Guidelines', file_url: '#', created_at: new Date().toISOString() },
    { id: '2', title: 'Summon Template Official', category: 'Template', file_url: '#', created_at: new Date().toISOString() }
  ];

  let MOCK_GALLERY: any[] = [
     { id: '1', url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80', caption: 'Aerial View of the Historic Mengo Senior School Campus', created_at: new Date().toISOString() },
     { id: '2', url: 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?auto=format&fit=crop&q=80', caption: 'Student Council Strategic Leadership & Governance Session', created_at: new Date().toISOString() },
     { id: '3', url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80', caption: 'Annual Inter-house Sports Day - Competition & Unity', created_at: new Date().toISOString() },
     { id: '4', url: 'https://images.unsplash.com/photo-1577891729319-618bf5d70b4c?auto=format&fit=crop&q=80', caption: 'Main Hall Assembly - Termly Student Induction', created_at: new Date().toISOString() }
  ];

  let MOCK_TIMELINE: any[] = [
    { id: "1", date: "May 22, 2026", status: "Completed", title: "Leadership Handover", description: "The official handover ceremony where the outgoing prefects pass on their responsibilities to the newly elected council.", location: "Main Hall" },
    { id: "2", date: "June 15, 2026", status: "Completed", title: "First Council Meeting", description: "Inaugural meeting of the new cabinet to discuss the term's agenda, allocate duties, and swear in deputies.", location: "Board Room" },
    { id: "3", date: "July 20, 2026", status: "In Progress", title: "Inter-Class Debates", description: "Annual debate tournament focusing on current affairs, encouraging public speaking and critical thinking among students.", location: "Library" },
    { id: "4", date: "August 05, 2026", status: "Upcoming", title: "Sports Gala Registration", description: "Houses open registration for athletes for the termly intra-school sports competition.", location: "Online Portal" },
    { id: "5", date: "September 12, 2026", status: "Upcoming", title: "Academic Fair", description: "Showcasing student projects across sciences and arts to parents and the public.", location: "School Quadrangle" }
  ];
 
  let MOCK_STUDENT_VOICES: any[] = [
     { id: '1', title: 'Better Cafeteria Menu', category: 'ideas', description: 'The menu is currently repetitive. Requesting more variety in fruits and snacks for students.', status: 'Pending', submitted_by: 'Musa John', submitted_class: 'S.3', file: null, created_at: new Date().toISOString(), is_forwarded_to_patron: false },
     { id: '2', title: 'Broken Lab Equipment', category: 'complaints', description: 'Form 4 lab is lacking working microscopes. This makes practical sessions difficult.', status: 'Pending', submitted_by: 'Sarah Faith', submitted_class: 'S.4', file: null, created_at: new Date().toISOString(), is_forwarded_to_patron: true },
     { id: '3', title: 'New Science Kits', category: 'ideas', description: 'We need more kits for the chemistry lab.', status: 'Pending', submitted_by: 'Anonymous', submitted_class: 'S.2', file: null, created_at: new Date().toISOString(), is_forwarded_to_patron: false },
     { id: '4', title: 'URGENT: Locker Security', category: 'complaints', description: 'Someone broke into a locker. We need better security.', status: 'Pending', submitted_by: 'Kato Paul', submitted_class: 'S.5', file: null, created_at: new Date().toISOString(), is_forwarded_to_patron: false }
  ];

  let MOCK_NOTIFICATIONS: any[] = [
    { id: '1', title: 'Welcome to MCH', message: 'The Mengo Connect Hub portal is now fully functional.', type: 'info', read: false, created_at: new Date().toISOString() },
    { id: '2', title: 'New Document Uploaded', message: 'The Term 1 Council Report has been added to the archive.', type: 'success', read: false, created_at: new Date().toISOString() }
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
        issues: MOCK_DC_CASES.length,
        events: 12,
        docs: 45
      },
      recentVoices: voices.slice(0, 3).map(v => ({
        title: v.title,
        category: v.category,
        status: v.status.toLowerCase(),
        date: new Date(v.created_at).toLocaleDateString()
      })),
      recentIssues: MOCK_DC_CASES.slice(0, 3).map(c => ({
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
    
    // Trigger notification
    MOCK_NOTIFICATIONS.unshift({
        id: Date.now().toString(),
        title: 'Document Uploaded',
        message: `"${newDoc.title}" has been uploaded by ${username}.`,
        type: 'success',
        read: false,
        created_at: new Date().toISOString()
    });

    return [201, newDoc];
  });

  // Mock DC Docs
  mock.onGet('/dc-docs/').reply(200, { results: MOCK_DC_DOCS });
  mock.onPost('/dc-docs/').reply((config) => {
    const data = JSON.parse(config.data);
    const newDoc = { ...data, id: Date.now().toString(), created_at: new Date().toISOString() };
    MOCK_DC_DOCS.push(newDoc);
    
    // Trigger notification
    MOCK_NOTIFICATIONS.unshift({
        id: Date.now().toString(),
        title: 'New DC Resource',
        message: `New official resource: "${newDoc.title}" has been published.`,
        type: 'info',
        read: false,
        created_at: new Date().toISOString()
    });

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
    
    // 1. CLEAR role from PREVIOUS holder (if it's a leadership role)
    // The requirement is that they lose all rights of that role and become a mere councillor
    if (new_role !== 'councillor' && new_role !== 'adminabsolute') {
      Object.keys(USERS).forEach(username => {
        if (USERS[username].roles.includes(new_role)) {
          // Absolute demotion: strip all roles and set to mere 'councillor'
          USERS[username].roles = ['councillor'];
        }
      });
    }

    // 2. Assign the new role to the target user
    const userToUpdate = Object.values(USERS).find((u) => u.profile.user_id === user_id);
    if (userToUpdate) {
      if (new_role === 'councillor') {
        userToUpdate.roles = ['councillor'];
      } else {
        // Upgrade them to the new role
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

  mock.onGet('/dc-cases/').reply((config) => {
    return [200, { results: MOCK_DC_CASES }];
  });

  mock.onPost('/dc-cases/').reply((config) => {
    const data = JSON.parse(config.data);
    const newCase = { 
      ...data, 
      id: Date.now().toString(), 
      status: 'Pending', 
      assigned_to_id: null,
      assigned_to_name: null,
      forwarded_to_office: null,
      created_at: new Date().toISOString() 
    };
    MOCK_DC_CASES.push(newCase);

    // Trigger notification
    MOCK_NOTIFICATIONS.unshift({
        id: Date.now().toString(),
        title: 'New Disciplinary Case',
        message: `A new case against "${newCase.offender_name}" has been filed.`,
        type: 'warning',
        read: false,
        created_at: new Date().toISOString()
    });

    return [201, newCase];
  });

  mock.onPatch(/\/dc-cases\/\d+\//).reply((config) => {
    const id = config.url?.split('/')[2];
    const data = JSON.parse(config.data);
    const caseIndex = MOCK_DC_CASES.findIndex(c => c.id === id);
    if (caseIndex !== -1) {
      MOCK_DC_CASES[caseIndex] = { ...MOCK_DC_CASES[caseIndex], ...data };
      return [200, MOCK_DC_CASES[caseIndex]];
    }
    return [404, { detail: 'Case not found' }];
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

  mock.onGet('/timeline/').reply(200, { results: MOCK_TIMELINE });
  mock.onPost('/timeline/').reply((config) => {
    const data = JSON.parse(config.data);
    const newEvent = { ...data, id: Date.now().toString() };
    MOCK_TIMELINE.push(newEvent);
    return [201, newEvent];
  });
  mock.onDelete(/\/timeline\/\d+/).reply((config) => {
    const id = config.url?.split('/').pop();
    MOCK_TIMELINE = MOCK_TIMELINE.filter(e => e.id !== id);
    return [204, {}];
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

     // Trigger notification
     MOCK_NOTIFICATIONS.unshift({
         id: Date.now().toString(),
         title: 'New Student Voice',
         message: `A new idea/complaint regarding "${newVoice.title}" has been submitted.`,
         type: 'info',
         read: false,
         created_at: new Date().toISOString()
     });

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

   // Notifications Endpoints
   mock.onGet('/notifications/').reply(200, { results: MOCK_NOTIFICATIONS });
   mock.onPost('/notifications/all/').reply((config) => {
       const data = JSON.parse(config.data);
       const newNotif = { ...data, id: Date.now().toString(), read: false, created_at: new Date().toISOString() };
       MOCK_NOTIFICATIONS.unshift(newNotif);
       return [201, newNotif];
   });
   mock.onPatch(/\/notifications\/\d+\//).reply((config) => {
       const id = config.url?.split('/')[2];
       const index = MOCK_NOTIFICATIONS.findIndex(n => n.id === id);
       if (index !== -1) {
           MOCK_NOTIFICATIONS[index].read = true;
           return [200, MOCK_NOTIFICATIONS[index]];
       }
       return [404, {}];
   });

   mock.onAny().passThrough();
}
