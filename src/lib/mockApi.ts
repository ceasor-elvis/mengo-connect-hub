import MockAdapter from 'axios-mock-adapter';
import { AxiosInstance } from 'axios';
import { DEFAULT_TREE } from '../hooks/useHierarchy';

// ── Persistent Mock Database ──
const USERS: Record<string, any> = {
  'adminabsolute': {
    password: 'absolute2026!',
    user: { id: 'usr_admin', username: 'adminabsolute', email: 'admin@mengo.sc' },
    profile: { id: 'prof_admin', user_id: 'usr_admin', full_name: 'Absolute Admin', profile_pic: null, student_class: null, gender: 'male' },
    roles: ['adminabsolute'],
  },
  'patron': {
    password: 'patron123',
    user: { id: 'usr_patron', username: 'patron', email: 'patron@mengo.sc' },
    profile: { id: 'prof_patron', user_id: 'usr_patron', full_name: 'Mr. Kabuye Robert', profile_pic: null, student_class: null, gender: 'male' },
    roles: ['patron'],
  },
  'chairperson': {
    password: 'chairperson123',
    user: { id: 'usr_chair', username: 'chairperson', email: 'chairperson@mengo.sc' },
    profile: { id: 'prof_chair', user_id: 'usr_chair', full_name: 'Ssekandi Brian', profile_pic: null, student_class: 'S.6 Arts', gender: 'male' },
    roles: ['chairperson'],
  },
  'merecouncillor': {
    password: 'merecouncillor123',
    user: { id: 'usr_councillor', username: 'merecouncillor', email: 'mere@mengo.sc' },
    profile: { id: 'prof_councillor', user_id: 'usr_councillor', full_name: 'Mugisha David', profile_pic: null, student_class: 'S.5 Arts', gender: 'male' },
    roles: ['councillor'],
  },
  'publicity': {
    password: 'publicity123',
    user: { id: 'usr_pub', username: 'publicity', email: 'publicity@mengo.sc' },
    profile: { id: 'prof_pub', user_id: 'usr_pub', full_name: 'Lubega Isaac', profile_pic: null, student_class: 'S.4 Blue', gender: 'male' },
    roles: ['secretary_publicity'],
  },
  'disciplinary': {
    password: 'disciplinary123',
    user: { id: 'usr_dc', username: 'disciplinary', email: 'dc@mengo.sc' },
    profile: { id: 'prof_dc', user_id: 'usr_dc', full_name: 'Kigozi Emmanuel', profile_pic: null, student_class: 'S.5 Science', gender: 'male' },
    roles: ['disciplinary_committee'],
  },
  'vicechair': {
    password: 'vicechair123',
    user: { id: 'usr_vc', username: 'vicechair', email: 'vc@mengo.sc' },
    profile: { id: 'prof_vc', user_id: 'usr_vc', full_name: 'Nalubega Grace', profile_pic: null, student_class: 'S.6 Science', gender: 'female' },
    roles: ['vice_chairperson'],
  },
  'gensec': {
    password: 'gensec123',
    user: { id: 'usr_gs', username: 'gensec', email: 'gensec@mengo.sc' },
    profile: { id: 'prof_gs', user_id: 'usr_gs', full_name: 'Okello James', profile_pic: null, student_class: 'S.5 Arts', gender: 'male' },
    roles: ['general_secretary'],
  },
  'asstgensec': {
    password: 'asstgensec123',
    user: { id: 'usr_ags', username: 'asstgensec', email: 'ags@mengo.sc' },
    profile: { id: 'prof_ags', user_id: 'usr_ags', full_name: 'Atim Patricia', profile_pic: null, student_class: 'S.4 Blue', gender: 'female' },
    roles: ['assistant_general_secretary'],
  },
  'secfinance': {
    password: 'secfinance123',
    user: { id: 'usr_sf', username: 'secfinance', email: 'finance@mengo.sc' },
    profile: { id: 'prof_sf', user_id: 'usr_sf', full_name: 'Tumusiime Allan', profile_pic: null, student_class: 'S.5 Science', gender: 'male' },
    roles: ['secretary_finance'],
  }
};

let MOCK_ACTION_PLANS: any[] = [
  {
    id: '1', title: 'Digitalize Council Records', objective: 'Move all manual paper-based council records to the digital hub.',
    category: 'Digital', steps: [{ id: '1-1', text: 'Finalize portal', status: 'completed' }, { id: '1-2', text: 'Train members', status: 'pending' }],
    start_date: new Date().toISOString(), target_date: new Date(Date.now() + 86400000 * 30).toISOString(),
    responsible_role: 'general_secretary', status: 'in_progress', progress: 50, created_by: 'usr_admin', created_at: new Date().toISOString()
  }
];

let MOCK_STREAMS = [{ id: '1', name: 'NORTH' }, { id: '2', name: 'SOUTH' }, { id: '3', name: 'EAST' }, { id: '4', name: 'WEST' }];
let MOCK_TREE = [...DEFAULT_TREE];

let MOCK_ISSUES: any[] = [
  { id: '1', title: 'Broken Lab Equipment', description: 'The chemistry lab lacks functioning burners.', status: 'open', raised_by: 'usr_chair', reporter_name: 'Ssekandi Brian', category: 'Infrastructure', priority: 'High', created_at: new Date().toISOString() }
];

let MOCK_STUDENT_VOICES: any[] = [
  { id: '1', title: 'Better Cafeteria Menu', category: 'ideas', description: 'Variety in fruits.', status: 'Pending', submitted_by: 'Musa John', submitted_class: 'S.3', file: null, created_at: new Date().toISOString(), is_forwarded_to_patron: false },
  { id: '2', title: 'Lab Supplies', category: 'complaints', description: 'Working microscopes.', status: 'Pending', submitted_by: 'Sarah Faith', submitted_class: 'S.4', file: null, created_at: new Date().toISOString(), is_forwarded_to_patron: true }
];

let MOCK_REQUISITIONS: any[] = [
  { id: 'req-1', item: 'Office Stationery', amount: 50000, requested_by: 'gen_sec', status: 'pending', created_at: new Date(Date.now() - 86400000).toISOString(), approved_by: null },
  { id: 'req-2', item: 'Ballroom Hall Rental', amount: 300000, requested_by: 'chairperson', status: 'approved', created_at: new Date(Date.now() - 172800000).toISOString(), approved_by: 'patron' }
];

let MOCK_DC_CASES: any[] = [
  { id: '1', offender_name: 'Student A', category: 'Insubordination', description: 'Refusal to follow head prefect.', status: 'Pending', reported_by: 'merecouncillor', created_at: new Date().toISOString() }
];

let MOCK_PROGRAMMES: any[] = [
  { id: '1', title: 'Opening Ceremony', description: 'Annual assembly.', event_date: new Date().toISOString(), visibility: 'public', is_big_event: true, created_by: 'adminabsolute', created_at: new Date().toISOString() }
];

let MOCK_BLOGS: any[] = [
  { id: '1', title: 'Welcome to Mengo Student Hub', content: 'This is the first official blog post regarding our new portal.', author: 'Publicity Team', media_url: null, media_type: 'none', created_at: new Date().toISOString() }
];

let MOCK_DOCS: any[] = [
  { id: '100', title: 'Term 1 Report', category: 'Reports', uploaded_by: 'adminabsolute', access_level: 'public', created_at: new Date().toISOString() }
];

let MOCK_APPLICANTS: any[] = [
  { id: '1', applicant_name: 'Jane Doe', class: 'S.2', stream: 'North', average_score: 25, status: 'qualified', gender: 'female', smart_score: 8, conf_score: 9, qapp_score: 8, comment: "Excellent" }
];

let MOCK_NOTIFICATIONS: any[] = [
  { id: '1', title: 'Welcome!', message: 'Welcome to the new portal.', type: 'info', read: false, created_at: new Date().toISOString(), sender_id: 'usr_admin', feedback: null },
  {
    id: "99",
    user_id: "usr_admin",
    sender_id: "usr_chair",
    title: "Password Reset Request",
    message: "User Ssekandi Brian (chairperson) has requested a password reset. Please provide a new temporary password.",
    type: "urgent_alert",
    created_at: new Date().toISOString(),
    read: false,
    target_username: "chairperson",
    target_user_id: "usr_chair"
  },
];

let MOCK_ROTAS: any[] = [];
let MOCK_EC_GRANTS: any[] = [];
let MOCK_ELECTION_LOCKS: any[] = [];
let MOCK_SUBSCRIPTIONS: Record<string, boolean> = {
  'usr_chair': true,
  'usr_gs': true,
  'usr_sf': false,
  'usr_councillor': false
};

// ── Setup Function ──
export function setupMockApi(api: AxiosInstance) {
  const mock = new MockAdapter(api, { delayResponse: 500 });

  // Dashboard Stats
  mock.onGet('/dashboard/stats/').reply(() => [200, {
    stats: { voices: MOCK_STUDENT_VOICES.length, issues: MOCK_ISSUES.length, events: MOCK_PROGRAMMES.length, docs: MOCK_DOCS.length },
    recentVoices: MOCK_STUDENT_VOICES.slice(-3).map(v => ({ title: v.title, category: v.category, status: v.status, date: 'Today' })),
    recentIssues: MOCK_ISSUES.slice(-3).map(i => ({ title: i.title, status: i.status, raised: i.reporter_name })),
    finance: [{ v: 'UGX 2M', l: 'Budget' }, { v: 'UGX 500K', l: 'Spent' }, { v: 'UGX 1.5M', l: 'Left' }]
  }]);

  // Auth
  mock.onPost('/users/login/').reply((config) => {
    const { username, password } = JSON.parse(config.data);
    const u = USERS[username.toLowerCase()];
    if (u && u.password === password) {
      return [200, { access: 'token-' + username, refresh: 'ref-' + username, user: u.user }];
    }
    return [401, { detail: "Invalid credentials" }];
  });

  mock.onGet('/users/me/profile/').reply((config) => {
    const token = config.headers?.Authorization;
    const username = token?.split('-').pop();
    if (username && USERS[username]) return [200, USERS[username].profile];
    return [401, {}];
  });

  mock.onPatch('/users/me/profile/').reply((config) => {
    const token = config.headers?.Authorization;
    const username = token?.split('-').pop();
    if (username && USERS[username]) {
      const body = JSON.parse(config.data);
      USERS[username].profile = { ...USERS[username].profile, ...body };
      return [200, USERS[username].profile];
    }
    return [401, {}];
  });

  mock.onGet('/users/me/roles/').reply((config) => {
    const token = config.headers?.Authorization;
    const username = token?.split('-').pop();
    if (username && USERS[username]) return [200, { roles: USERS[username].roles }];
    return [401, {}];
  });

  mock.onGet('/users/all-profiles/').reply(() => [200, Object.values(USERS).map(u => u.profile)]);
  mock.onGet('/users/all-roles/').reply(() => [200, Object.values(USERS).map(u => ({ user_id: u.user.id, role: u.roles[0] }))]);

  mock.onPost('/users/register/').reply(() => [201, { message: "Registered" }]);
  
  mock.onPost('/users/upgrade-role/').reply((config) => {
    const { user_id, new_role } = JSON.parse(config.data);
    
    // Automatic stripping logic for leadership roles
    if (new_role !== "councillor" && new_role !== "adminabsolute") {
      Object.values(USERS).forEach((u: any) => {
        if (u.roles && u.roles.includes(new_role) && u.user.id !== user_id) {
          // demote old holder to councillor
          u.roles = ["councillor"];
        }
      });
    }

    // Update target user
    const targetUser = Object.values(USERS).find((u: any) => u.user.id === user_id);
    if (targetUser) {
      targetUser.roles = [new_role];
      return [200, { message: "User role updated successfully", user: targetUser.user, roles: targetUser.roles }];
    }
    
    return [404, { detail: "User not found" }];
  });

  mock.onPost('/users/change-password/').reply((config) => {
    const token = config.headers?.Authorization;
    const username = token?.split('-').pop();
    const { current_password, new_password } = JSON.parse(config.data);
    
    if (username && USERS[username]) {
      if (USERS[username].password !== current_password) {
        return [400, { detail: "Current password incorrect" }];
      }
      USERS[username].password = new_password;
      return [200, { message: "Password updated successfully" }];
    }
    return [401, {}];
  });

  mock.onPost("/users/admin-reset-password/").reply((config) => {
    const { user_id, new_password } = JSON.parse(config.data);
    const user = Object.values(USERS).find((u) => u.user.id === user_id);
    if (!user) return [404, { detail: "User not found" }];
    user.password = new_password;
    const notif = MOCK_NOTIFICATIONS.find(n => n.user_id === user_id && n.title === "Password Reset Request" && !n.read);
    if (notif) notif.read = true;
    return [200, { detail: "Password reset successful" }];
  });

  mock.onPatch(/\/users\/[\w-]+\/profile\/admin\//).reply((config) => {
    const userId = config.url?.split('/')[2];
    const { full_name, username, student_class, gender, role } = JSON.parse(config.data);
    const user = Object.values(USERS).find((u) => u.user.id === userId);
    if (!user) return [404, { detail: "User not found" }];

    if (full_name) user.profile.full_name = full_name;
    if (username) user.user.username = username;
    if (student_class) user.profile.student_class = student_class;
    if (gender) user.profile.gender = gender;

    if (role && !user.roles.includes(role)) {
      if (role !== "councillor") {
        Object.values(USERS).forEach(u => {
          if (u.roles.includes(role) && u.user.id !== userId) u.roles = ["councillor"];
        });
      }
      user.roles = [role];
    }
    return [200, { detail: "Profile updated successfully", user }];
  });

  mock.onPost('/users/forgot-password/').reply((config) => {
    const { username } = JSON.parse(config.data);
    const u = USERS[username.toLowerCase()];
    if (!u) return [404, { detail: "User not found" }];

    // Create notification for admin and patron
    const adminNotif = {
      id: Math.random().toString(36).substr(2, 9),
      title: "Password Reset Request",
      message: `User ${u.profile.full_name} (${username}) has requested a password reset. Please provide a new temporary password.`,
      type: "urgent_alert",
      read: false,
      created_at: new Date().toISOString(),
      user_id: "usr_admin" // Direct to admin
    };
    const patronNotif = { ...adminNotif, id: Math.random().toString(36).substr(2, 9), user_id: "usr_patron" };
    
    MOCK_NOTIFICATIONS.push(adminNotif, patronNotif);
    return [200, { message: "Reset request sent to Administration" }];
  });

  mock.onGet(/\/users\/councillors\/?$/).reply(() => {
    return [200, { results: Object.values(USERS).map(u => ({ ...u.profile, roles: u.roles })) }];
  });

  // Action Plans
  mock.onGet('/action-plans/').reply(() => [200, { results: MOCK_ACTION_PLANS }]);
  mock.onPost('/action-plans/').reply((config) => {
    const data = JSON.parse(config.data);
    MOCK_ACTION_PLANS.push(data);
    return [201, data];
  });
  mock.onPatch(/\/action-plans\/[\w-]+\//).reply((config) => {
    const id = config.url?.split('/').slice(-2, -1)[0];
    const data = JSON.parse(config.data);
    const idx = MOCK_ACTION_PLANS.findIndex(p => p.id === id);
    if (idx !== -1) { MOCK_ACTION_PLANS[idx] = { ...MOCK_ACTION_PLANS[idx], ...data }; return [200, MOCK_ACTION_PLANS[idx]]; }
    return [404, {}];
  });
  mock.onDelete(/\/action-plans\/[\w-]+\//).reply((config) => {
    const id = config.url?.split('/').slice(-2, -1)[0];
    const idx = MOCK_ACTION_PLANS.findIndex(p => p.id === id);
    if (idx !== -1) { MOCK_ACTION_PLANS.splice(idx, 1); return [204, {}]; }
    return [404, {}];
  });

  // Elections
  mock.onGet('/applications/').reply(() => [200, { results: MOCK_APPLICANTS }]);
  mock.onPost('/applications/').reply((config) => {
    const data = JSON.parse(config.data);
    const app = { id: Date.now().toString(), ...data };
    MOCK_APPLICANTS.push(app);
    return [201, app];
  });
  mock.onPatch(/\/applications\/[\w-]+\//).reply((config) => {
    const id = config.url?.split('/').slice(-2, -1)[0];
    const data = JSON.parse(config.data);
    const idx = MOCK_APPLICANTS.findIndex(a => a.id === id);
    if (idx !== -1) { MOCK_APPLICANTS[idx] = { ...MOCK_APPLICANTS[idx], ...data }; return [200, MOCK_APPLICANTS[idx]]; }
    return [404, {}];
  });
  mock.onDelete(/\/applications\/[\w-]+\//).reply((config) => {
    const id = config.url?.split('/').slice(-2, -1)[0];
    const idx = MOCK_APPLICANTS.findIndex(a => a.id === id);
    if (idx !== -1) { MOCK_APPLICANTS.splice(idx, 1); return [204, {}]; }
    return [404, {}];
  });
  mock.onPost('/applications/auto-screen/').reply((config) => {
    const { min_average } = JSON.parse(config.data);
    MOCK_APPLICANTS.forEach(a => {
      a.status = a.average_score >= min_average ? 'qualified' : 'disqualified';
    });
    return [200, { message: "Auto-screening completed" }];
  });

  mock.onGet('/ec-access-grants/').reply(() => [200, { results: MOCK_EC_GRANTS }]);
  mock.onPost('/ec-access-grants/').reply((config) => {
    const data = JSON.parse(config.data);
    const g = { id: Date.now().toString(), ...data };
    MOCK_EC_GRANTS.push(g);
    return [201, g];
  });
  mock.onDelete(/\/ec-access-grants\/[\w-]+\//).reply((config) => {
    const id = config.url?.split('/').slice(-2, -1)[0];
    const idx = MOCK_EC_GRANTS.findIndex(g => g.id === id);
    if (idx !== -1) { MOCK_EC_GRANTS.splice(idx, 1); return [204, {}]; }
    return [404, {}];
  });

  mock.onGet('/election-locks/').reply(() => [200, { results: MOCK_ELECTION_LOCKS }]);
  mock.onPost('/election-locks/').reply((config) => {
    const data = JSON.parse(config.data);
    const l = { id: Date.now().toString(), ...data };
    MOCK_ELECTION_LOCKS.push(l);
    return [201, l];
  });
  mock.onDelete(/\/election-locks\/[\w-]+\//).reply((config) => {
    const id = config.url?.split('/').slice(-2, -1)[0];
    const idx = MOCK_ELECTION_LOCKS.findIndex(l => l.id === id);
    if (idx !== -1) { MOCK_ELECTION_LOCKS.splice(idx, 1); return [204, {}]; }
    return [404, {}];
  });

  mock.onPost('/streams/').reply((config) => {
    const data = JSON.parse(config.data);
    const s = { id: Date.now().toString(), ...data };
    MOCK_STREAMS.push(s);
    return [201, s];
  });

  // Issues
  mock.onGet('/issues/').reply(() => [200, { results: MOCK_ISSUES }]);
  mock.onPost('/issues/').reply((config) => {
    const data = JSON.parse(config.data);
    const issue = { id: Date.now().toString(), ...data, status: 'open', created_at: new Date().toISOString() };
    MOCK_ISSUES.push(issue);
    return [201, issue];
  });
  mock.onPatch(/\/issues\/\d+\//).reply((config) => {
    const id = config.url?.split('/').slice(-2, -1)[0];
    const data = JSON.parse(config.data);
    const idx = MOCK_ISSUES.findIndex(i => i.id === id);
    if (idx !== -1) { MOCK_ISSUES[idx] = { ...MOCK_ISSUES[idx], ...data }; return [200, MOCK_ISSUES[idx]]; }
    return [404, {}];
  });

  // Voices
  mock.onGet('/student-voices/').reply(() => [200, { results: MOCK_STUDENT_VOICES }]);
  mock.onPatch(/\/student-voices\/[\w-]+\//).reply((config) => {
    const id = config.url?.match(/\/student-voices\/([\w-]+)\//)?.[1];
    const data = JSON.parse(config.data);
    const idx = MOCK_STUDENT_VOICES.findIndex(v => v.id === id);
    if (idx !== -1) { MOCK_STUDENT_VOICES[idx] = { ...MOCK_STUDENT_VOICES[idx], ...data }; return [200, MOCK_STUDENT_VOICES[idx]]; }
    return [404, {}];
  });

  // Requisitions
  mock.onGet('/requisitions/').reply(() => [200, { results: MOCK_REQUISITIONS }]);
  mock.onPost('/requisitions/').reply((config) => {
    const data = JSON.parse(config.data || '{}');
    const r = { id: `req-${Date.now()}`, ...data, status: 'pending', created_at: new Date().toISOString() };
    MOCK_REQUISITIONS.push(r);
    return [201, r];
  });
  mock.onPatch(/\/requisitions\/[\w-]+\//).reply((config) => {
    const id = config.url?.match(/\/requisitions\/([\w-]+)\//)?.[1];
    const data = JSON.parse(config.data || '{}');
    const idx = MOCK_REQUISITIONS.findIndex(r => r.id === id);
    if (idx !== -1) { MOCK_REQUISITIONS[idx] = { ...MOCK_REQUISITIONS[idx], ...data }; return [200, MOCK_REQUISITIONS[idx]]; }
    return [404, {}];
  });

  // DC Cases
  mock.onGet('/dc-cases/').reply(() => [200, { results: MOCK_DC_CASES }]);
  mock.onPost('/dc-cases/').reply((config) => {
    const data = JSON.parse(config.data || '{}');
    const c = { id: `dc-${Date.now()}`, ...data, status: 'Pending', created_at: new Date().toISOString() };
    MOCK_DC_CASES.push(c);
    return [201, c];
  });
  mock.onPatch(/\/dc-cases\/[\w-]+\//).reply((config) => {
    const id = config.url?.match(/\/dc-cases\/([\w-]+)\//)?.[1];
    const data = JSON.parse(config.data || '{}');
    const idx = MOCK_DC_CASES.findIndex(c => c.id === id);
    if (idx !== -1) { MOCK_DC_CASES[idx] = { ...MOCK_DC_CASES[idx], ...data }; return [200, MOCK_DC_CASES[idx]]; }
    return [404, {}];
  });

  // Hierarchy
  mock.onGet(/\/users\/hierarchy-tree\/|^\/hierarchy-tree\//).reply(() => [200, { results: MOCK_TREE }]);
  mock.onPut(/\/users\/hierarchy-tree\/|^\/hierarchy-tree\//).reply((config) => {
      MOCK_TREE = JSON.parse(config.data);
      return [200, { results: MOCK_TREE }];
  });
  mock.onPost('/users/update-hierarchy/').reply((config) => {
    MOCK_TREE = JSON.parse(config.data);
    return [200, { results: MOCK_TREE }];
  });

  // Rotas
  mock.onGet(/\/rotas\/?$/).reply(() => [200, { results: MOCK_ROTAS }]);
  mock.onPost(/\/rotas\/?$/).reply((config) => {
    const data = JSON.parse(config.data);
    const rota = { id: Date.now().toString(), ...data };
    MOCK_ROTAS.push(rota);
    return [201, rota];
  });
  mock.onPatch(/\/rotas\/[\w-]+\//).reply((config) => {
    const id = config.url?.split('/').slice(-2, -1)[0];
    const data = JSON.parse(config.data);
    const idx = MOCK_ROTAS.findIndex(r => r.id === id);
    if (idx !== -1) { MOCK_ROTAS[idx] = { ...MOCK_ROTAS[idx], ...data }; return [200, MOCK_ROTAS[idx]]; }
    return [404, {}];
  });
  mock.onDelete(/\/rotas\/[\w-]+\//).reply((config) => {
    const id = config.url?.split('/').slice(-2, -1)[0];
    const idx = MOCK_ROTAS.findIndex(r => r.id === id);
    if (idx !== -1) { MOCK_ROTAS.splice(idx, 1); return [204, {}]; }
    return [404, {}];
  });

  // Others
  mock.onGet('/documents/').reply(() => [200, { results: MOCK_DOCS }]);
  
  mock.onPost('/documents/').reply((config) => {
    const token = config.headers?.Authorization;
    const username = token?.split('-').pop() || 'anonymous';
    const newDoc = {
      id: `doc-${Date.now()}`,
      title: "New Uploaded Document",
      category: "Other",
      uploaded_by: username,
      access_level: "public",
      created_at: new Date().toISOString(),
      file_url: "#"
    };
    MOCK_DOCS.push(newDoc);
    return [201, newDoc];
  });

  mock.onPatch(/\/documents\/[\w-]+\//).reply((config) => {
    const id = config.url?.match(/\/documents\/([\w-]+)\//)?.[1];
    const data = JSON.parse(config.data || '{}');
    const idx = MOCK_DOCS.findIndex(d => d.id === id);
    if (idx !== -1) { MOCK_DOCS[idx] = { ...MOCK_DOCS[idx], ...data }; return [200, MOCK_DOCS[idx]]; }
    return [404, {}];
  });

  mock.onDelete(/\/documents\/[\w-]+\//).reply((config) => {
    const id = config.url?.match(/\/documents\/([\w-]+)\//)?.[1];
    const idx = MOCK_DOCS.findIndex(d => d.id === id);
    if (idx !== -1) { MOCK_DOCS.splice(idx, 1); return [204, {}]; }
    return [404, {}];
  });
  
  mock.onGet('/programmes/').reply(() => [200, { results: MOCK_PROGRAMMES }]);
  mock.onGet('/blogs/').reply(() => [200, { results: MOCK_BLOGS }]);
  mock.onGet('/streams/').reply(() => [200, { results: MOCK_STREAMS }]);
  
  mock.onGet('/notifications/').reply((config) => {
    const token = config.headers?.Authorization;
    const username = token?.split('-').pop();
    const user = Object.values(USERS).find(u => u.user.username === username);
    if (!user) return [200, MOCK_NOTIFICATIONS];
    // filter for user_id if present in MOCK_NOTIFICATIONS, else return all for simplicity
    const filtered = MOCK_NOTIFICATIONS.filter(n => !n.user_id || n.user_id === user.user.id);
    return [200, filtered];
  });
  mock.onPost('/notifications/mark-all-read/').reply(() => {
    MOCK_NOTIFICATIONS.forEach(n => n.read = true);
    return [200, {}];
  });
  
  mock.onPost('/notifications/').reply((config) => {
    const data = JSON.parse(config.data || '{}');
    const newNotif = {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      read: false,
      created_at: new Date().toISOString()
    };
    MOCK_NOTIFICATIONS.push(newNotif);
    return [201, newNotif];
  });
  mock.onPatch(/\/notifications\/[\w-]+\//).reply((config) => {
    const id = config.url?.split('/').slice(-2, -1)[0];
    const data = JSON.parse(config.data || '{}');
    const idx = MOCK_NOTIFICATIONS.findIndex(n => n.id === id);
    if (idx !== -1) {
      MOCK_NOTIFICATIONS[idx] = { ...MOCK_NOTIFICATIONS[idx], ...data };
      return [200, MOCK_NOTIFICATIONS[idx]];
    }
    return [404, {}];
  });
  mock.onPost('/notifications/all/').reply(201, {});
  mock.onPost('/activity-logs/').reply(201, {});
  mock.onGet('/activity-logs/').reply(() => [200, { results: [] }]);

  // Subscriptions
  mock.onGet('/subscriptions/').reply(() => [200, { results: MOCK_SUBSCRIPTIONS }]);
  mock.onPost('/subscriptions/toggle/').reply((config) => {
    const { user_id, paid } = JSON.parse(config.data);
    MOCK_SUBSCRIPTIONS[user_id] = paid;
    return [200, { user_id, paid }];
  });

  // Pass through anything else
  mock.onAny().passThrough();
}
