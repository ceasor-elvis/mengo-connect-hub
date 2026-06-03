/**
 * API Service Layer for Django Backend
 * 
 * Replace the BASE_URL with your Django server URL.
 * All functions return promises and handle JWT auth automatically.
 * 
 * When the backend is ready, swap the in-memory appStore calls 
 * in each page with these API functions.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws";

// ─── Token Management ────────────────────────────────────

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    sessionStorage.setItem("authToken", token);
    // Notify any listeners (e.g. ElectionSocketProvider) that a token is now available
    window.dispatchEvent(new Event("auth-token-set"));
  } else {
    sessionStorage.removeItem("authToken");
  }
}

export function getAuthToken(): string | null {
  if (!authToken) authToken = sessionStorage.getItem("authToken");
  return authToken;
}

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...options.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.detail || body.message || res.statusText, body);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: any) {
    super(message);
  }
}

// ─── Authentication ──────────────────────────────────────

export interface AdminLoginResponse {
  token: string;
  role: "full_admin" | "viewer";
  username: string;
}

export interface VoterValidateResponse {
  valid: boolean;
  already_used: boolean;
  voting_type_id?: string;
  class_name?: string;
  stream?: string;
  confirm_required?: boolean;
  voting_type_name?: string;
}

export interface VoterVerifyResponse {
  student: {
    id: string;
    name: string;
    registration_number: string;
    class_name: string;
    photo: string;
  };
  token: string;
}

export const authApi = {
  adminLogin: (username: string, password: string) =>
    request<AdminLoginResponse>("/auth/admin/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  validateVotingCode: (voting_code: string) =>
    request<VoterValidateResponse>("/auth/voter/validate-code", {
      method: "POST",
      body: JSON.stringify({ voting_code }),
    }),

  verifyVoter: (voting_code: string, registration_number: string) =>
    request<VoterVerifyResponse>("/auth/voter/verify", {
      method: "POST",
      body: JSON.stringify({ voting_code, registration_number }),
    }),
};

// ─── Election Control ────────────────────────────────────

export interface ElectionStatus {
  state: "live" | "paused" | "ended" | "scheduled";
  start_time: string;
  end_time: string;
  candidate_timer_seconds: number;
  vote_confirm_enabled: boolean;
  total_voters: number;
  votes_cast: number;
  turnout_percent: number;
}

export const electionApi = {
  getStatus: () =>
    request<ElectionStatus>("/election/status"),

  setState: (state: "live" | "paused" | "ended" | "scheduled") =>
    request<{ state: string }>("/election/state", {
      method: "PUT",
      body: JSON.stringify({ state }),
    }),

  setSchedule: (start_time: string, end_time: string) =>
    request<{ start_time: string; end_time: string }>("/election/schedule", {
      method: "PUT",
      body: JSON.stringify({ start_time, end_time }),
    }),

  setCandidateTimer: (seconds: number) =>
    request<{ candidate_timer_seconds: number }>("/election/candidate-timer", {
      method: "PUT",
      body: JSON.stringify({ candidate_timer_seconds: seconds }),
    }),

  setVoteConfirmEnabled: (enabled: boolean) =>
    request<{ vote_confirm_enabled: boolean }>("/election/vote-confirm", {
      method: "PUT",
      body: JSON.stringify({ vote_confirm_enabled: enabled }),
    }),
};

// ─── Voting Types ────────────────────────────────────────

export interface VotingType {
  id: string;
  name: string;
  description: string;
  active: boolean;
  confirm_page_enabled: boolean;
  org_name?: string;
  motto?: string;
}

export const votingTypeApi = {
  list: () => request<VotingType[]>("/voting-types"),

  create: (data: Omit<VotingType, "id">) =>
    request<VotingType>("/voting-types", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<VotingType>) =>
    request<VotingType>(`/voting-types/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/voting-types/${id}`, { method: "DELETE" }),
};

// ─── Categories ──────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  description: string;
  order: number;
  voting_type_id: string;
  gender?: "male" | "female";
}

export const categoryApi = {
  list: (voting_type_id?: string) =>
    request<Category[]>(`/categories${voting_type_id ? `?voting_type_id=${voting_type_id}` : ""}`),

  create: (data: Omit<Category, "id">) =>
    request<Category>("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Category>) =>
    request<Category>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/categories/${id}`, { method: "DELETE" }),
};

// ─── Candidates ──────────────────────────────────────────

export interface Candidate {
  id: string;
  name: string;
  photo: string;
  category_id: string;
  motto: string;
  votes: number;
  class_level?: string;
  stream?: string;
}

export const candidateApi = {
  list: (params?: { category_id?: string; voting_type_id?: string }) => {
    const query = new URLSearchParams();
    if (params?.category_id) query.set("category_id", params.category_id);
    if (params?.voting_type_id) query.set("voting_type_id", params.voting_type_id);
    const qs = query.toString();
    return request<Candidate[]>(`/candidates${qs ? `?${qs}` : ""}`);
  },

  create: (data: FormData) =>
    fetch(`${BASE_URL}/candidates`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getAuthToken()}` },
      body: data,
    }).then((r) => r.json() as Promise<Candidate>),

  update: (id: string, data: FormData) =>
    fetch(`${BASE_URL}/candidates/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${getAuthToken()}` },
      body: data,
    }).then((r) => r.json() as Promise<Candidate>),

  delete: (id: string) =>
    request<void>(`/candidates/${id}`, { method: "DELETE" }),
};

// ─── Voting Codes ────────────────────────────────────────

export interface VotingCode {
  id: string;
  code: string;
  voting_type_id: string;
  class_name: string;
  stream: string;
  used: boolean;
  created_at: string;
}

export interface GenerateCodesRequest {
  voting_type_id: string;
  class_name: string;
  stream: string;
  count: number;
}

export interface GenerateCodesResponse {
  codes: VotingCode[];
  count: number;
}

export interface CodeStats {
  class_name: string;
  stream: string;
  total: number;
  used: number;
}

export const votingCodeApi = {
  list: (params?: { class_name?: string; stream?: string; voting_type_id?: string; used?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.class_name) query.set("class_name", params.class_name);
    if (params?.stream) query.set("stream", params.stream);
    if (params?.voting_type_id) query.set("voting_type_id", params.voting_type_id);
    if (params?.used !== undefined) query.set("used", String(params.used));
    const qs = query.toString();
    return request<VotingCode[]>(`/voting-codes${qs ? `?${qs}` : ""}`);
  },

  generate: (data: GenerateCodesRequest) =>
    request<GenerateCodesResponse>("/voting-codes/generate", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  delete: (ids: string[]) =>
    request<void>("/voting-codes/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ ids }),
    }),

  stats: () =>
    request<CodeStats[]>("/voting-codes/stats"),

  export: (params?: { class_name?: string; stream?: string; voting_type_id?: string; used?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.class_name) query.set("class_name", params.class_name);
    if (params?.stream) query.set("stream", params.stream);
    if (params?.voting_type_id) query.set("voting_type_id", params.voting_type_id);
    if (params?.used !== undefined) query.set("used", String(params.used));
    const qs = query.toString();
    return `${BASE_URL}/voting-codes/export${qs ? `?${qs}` : ""}`;
  },
};

// ─── Votes ───────────────────────────────────────────────

export interface VoteSubmission {
  voting_code: string;
  selections: Record<string, string>; // category_id -> candidate_id
}

export interface VoteResults {
  categories: Array<{
    category: Category;
    candidates: Array<{
      candidate: Candidate;
      votes: number;
      percentage: number;
    }>;
    total_votes: number;
  }>;
}

export const voteApi = {
  submit: (data: VoteSubmission) =>
    request<{ success: true }>("/votes", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  results: (voting_type_id?: string) =>
    request<VoteResults>(`/votes/results${voting_type_id ? `?voting_type_id=${voting_type_id}` : ""}`),
};

// ─── Streams & Config ────────────────────────────────────

export const configApi = {
  getStreams: () =>
    request<string[]>("/config/streams"),

  addStream: (name: string) =>
    request<{ streams: string[] }>("/config/streams", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  removeStream: (name: string) =>
    request<void>(`/config/streams/${name}`, { method: "DELETE" }),

  getClassLevels: () =>
    request<string[]>("/config/class-levels"),

  getMediaConfig: () =>
    request<{ backend: string; cloud_name: string; api_key: string; api_secret: string }>("/config/media"),

  updateMediaConfig: (data: { backend: string; cloud_name?: string; api_key?: string; api_secret?: string }) =>
    request<{ backend: string; cloud_name: string; api_key: string; api_secret: string }>("/config/media", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// ─── WebSocket ───────────────────────────────────────────

export type WsEventType =
  | "election_state_changed"
  | "vote_cast"
  | "schedule_updated"
  | "voting_type_updated"
  | "codes_generated"
  | "code_used";

export interface WsMessage {
  type: WsEventType;
  data: any;
}

export function connectElectionSocket(
  onMessage: (msg: WsMessage) => void,
  onClose?: () => void
): WebSocket {
  const token = getAuthToken();
  const url = `${WS_URL}/election${token ? `?token=${token}` : ""}`;
  const ws = new WebSocket(url);

  ws.onmessage = (event) => {
    try {
      const raw = JSON.parse(event.data);
      // The backend sends { type: 'election.event', event_type: '...', data: '...' }
      // The frontend expects { type: '...', data: '...' }
      if (raw.type === "election.event" && raw.event_type) {
        onMessage({ type: raw.event_type, data: raw.data });
      } else {
        onMessage(raw);
      }
    } catch {
      // ignore malformed messages
    }
  };

  ws.onclose = () => onClose?.();

  return ws;
}
