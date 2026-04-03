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
    category: 'Digital', steps: [{ id: '1-1', text: 'Finalize portal', status: 'completed' }],
    start_date: new Date().toISOString(), target_date: new Date(Date.now() + 86400000 * 30).toISOString(),
    responsible_role: 'general_secretary', status: 'in_progress', progress: 33, created_by: 'usr_admin', created_at: new Date().toISOString()
  }
];

let MOCK_STREAMS = [{ id: '1', name: 'EAST' }, { id: '2', name: 'WEST' }];
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
  { id: '1', title: 'Opening Ceremony', description: 'Assembly.', event_date: new Date().toISOString(), visibility: 'public', is_big_event: true, created_by: 'adminabsolute', created_at: new Date().toISOString() }
];

let MOCK_DOCS: any[] = [
  { id: '100', title: 'Term 1 Report', category: 'Reports', uploaded_by: 'adminabsolute', access_level: 'public', created_at: new Date().toISOString() }
];

let MOCK_APPLICANTS: any[] = [
  { id: '1', applicant_name: 'Jane Doe', class: 'S.2', stream: 'North', average_score: 25, status: 'qualified', gender: 'female' }
];

// ── Setup Function ──
export function setupMockApi(api: AxiosInstance) {
  const mock = new MockAdapter(api, { delayResponse: 500 });

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

  mock.onPost('/users/register/').reply(() => [201, { message: "Registered" }]);

  // Issues
  mock.onGet('/issues/').reply(() => [200, { results: MOCK_ISSUES }]);
  mock.onPost('/issues/').reply((config) => {
    const data = JSON.parse(config.data);
    const issue = { id: Date.now().toString(), ...data, status: 'open', created_at: new Date().toISOString() };
    MOCK_ISSUES.push(issue);
    return [201, issue];
  });
  mock.onPatch(/\/issues\/\d+\//).reply((config) => {
    const id = config.url?.split('/')[2];
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
  mock.onGet('/users/hierarchy-tree/').reply(() => [200, { results: MOCK_TREE }]);
  mock.onPost('/users/update-hierarchy/').reply((config) => {
    MOCK_TREE = JSON.parse(config.data);
    return [200, { results: MOCK_TREE }];
  });

  // Others
  mock.onGet('/documents/').reply(() => [200, { results: MOCK_DOCS }]);
  mock.onPost('/documents/').reply(() => [201, {}]);
  mock.onPatch(/\/documents\/[\w-]+\//).reply(() => [200, {}]);
  
  mock.onGet('/programmes/').reply(() => [200, { results: MOCK_PROGRAMMES }]);
  mock.onGet('/blogs/').reply(() => [200, { results: MOCK_BLOGS }]);
  mock.onGet('/streams/').reply(() => [200, { results: MOCK_STREAMS }]);
  
  mock.onPost('/notifications/').reply(201, {});
  mock.onPost('/notifications/all/').reply(201, {});
  mock.onPost('/activity-logs/').reply(201, {});

  // Pass through anything else
  mock.onAny().passThrough();
}
