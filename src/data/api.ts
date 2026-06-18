/**
 * Unified Data Access Layer
 * 
 * Strictly interacts with the Django backend.
 * All pages should import from this file.
 */

import {
  authApi, electionApi, votingTypeApi, categoryApi, candidateApi,
  votingCodeApi, voteApi, configApi, setAuthToken,
  connectElectionSocket, type WsMessage,
} from "./apiService";

import {
  appStore, subscribe,
  parseCodePrefix,
  checkRateLimit,
  recordLoginAttempt,
  setElectionInfo,
  setElectionState as setElectionStateLocal,
  setElectionSchedule as setElectionScheduleLocal,
  setCandidateTimer as setCandidateTimerLocal,
  setVoteConfirmEnabled as setVoteConfirmEnabledLocal,
  setVotingTypes, setCategories, setCandidates, setVotingCodes, setStreams,
  addVotingType as addVotingTypeLocal,
  updateVotingType as updateVotingTypeLocal,
  deleteVotingType as deleteVotingTypeLocal,
  addCategory as addCategoryLocal,
  updateCategory as updateCategoryLocal,
  deleteCategory as deleteCategoryLocal,
  addCandidate as addCandidateLocal,
  updateCandidate as updateCandidateLocal,
  deleteCandidate as deleteCandidateLocal,
  addStream as addStreamLocal,
  removeStream as removeStreamLocal,
  type VotingType, type Category, type Candidate, type VotingCode, type Student,
  type ElectionState,
} from "./appStore";

// ─── Mode Detection ─────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL;
export const isBackendMode = !!API_URL;

if (!isBackendMode) {
  console.warn("[api] VITE_API_URL is not set. API calls will fail.");
}

// ─── Re-exports ─────────────────────────────────────────

export { parseCodePrefix, checkRateLimit, recordLoginAttempt, subscribe };
export type { VotingType, Category, Candidate, VotingCode, Student, ElectionState, WsMessage };

// ─── Auth ───────────────────────────────────────────────

export async function adminLogin(username: string, password: string): Promise<{
  token: string;
  role: "full_admin" | "viewer";
  username: string;
}> {
  const res = await authApi.adminLogin(username, password);
  setAuthToken(res.token);
  return res;
}

export async function validateVotingCode(code: string): Promise<{
  valid: boolean;
  already_used: boolean;
  voting_type_id?: string;
  voting_type_name?: string;
  class_name?: string;
  stream?: string;
  confirm_required?: boolean;
}> {
  try {
    return await authApi.validateVotingCode(code);
  } catch (err: any) {
    if (err instanceof TypeError || (err.message && err.message.toLowerCase().includes("fetch"))) {
      throw err;
    }
    return { valid: false, already_used: false };
  }
}

export async function verifyVoter(votingCode: string, registrationNumber: string): Promise<{
  student: Student;
  token: string;
} | null> {
  try {
    const res = await authApi.verifyVoter(votingCode, registrationNumber);
    setAuthToken(res.token);
    return {
      student: {
        id: res.student.id,
        name: res.student.name,
        registrationNumber: res.student.registration_number,
        className: res.student.class_name,
        photo: res.student.photo,
      },
      token: res.token,
    };
  } catch (err: any) {
    if (err instanceof TypeError || (err.message && err.message.toLowerCase().includes("fetch"))) {
      throw err;
    }
    return null;
  }
}

// ─── Election Control ───────────────────────────────────

export async function getElectionStatus(): Promise<{
  state: ElectionState;
  startTime: string;
  endTime: string;
  candidateTimerSeconds: number;
  voteConfirmEnabled: boolean;
  totalVoters: number;
  votesCast: number;
  turnoutPercent: number;
}> {
  const res = await electionApi.getStatus();
  const info = {
    state: res.state,
    startTime: res.start_time,
    endTime: res.end_time,
    candidateTimerSeconds: res.candidate_timer_seconds,
    voteConfirmEnabled: res.vote_confirm_enabled,
    totalVoters: res.total_voters,
    votesCast: res.votes_cast,
    turnoutPercent: res.turnout_percent,
  };
  setElectionInfo(info);
  return info;
}

export async function setElectionState(state: ElectionState) {
  await electionApi.setState(state);
  setElectionStateLocal(state);
}

export async function setElectionSchedule(start: string, end: string) {
  await electionApi.setSchedule(start, end);
  setElectionScheduleLocal(start, end);
}

export async function setCandidateTimer(seconds: number) {
  await electionApi.setCandidateTimer(seconds);
  setCandidateTimerLocal(seconds);
}

export async function setVoteConfirmEnabled(enabled: boolean) {
  await electionApi.setVoteConfirmEnabled(enabled);
  setVoteConfirmEnabledLocal(enabled);
}

// ─── Voting Types ───────────────────────────────────────

export async function fetchVotingTypes(): Promise<VotingType[]> {
  const res = await votingTypeApi.list();
  const mapped = res.map((v) => ({
    id: v.id,
    name: v.name,
    description: v.description,
    active: v.active,
    confirmPageEnabled: v.confirm_page_enabled,
    orgName: v.org_name ?? "",
    motto: v.motto ?? "",
  }));
  setVotingTypes(mapped);
  return mapped;
}

export async function createVotingType(data: Omit<VotingType, "id">): Promise<VotingType> {
  const res = await votingTypeApi.create({
    name: data.name,
    description: data.description,
    active: data.active,
    confirm_page_enabled: data.confirmPageEnabled,
    org_name: data.orgName ?? "",
    motto: data.motto ?? "",
  });
  const vt: VotingType = {
    id: res.id, name: res.name, description: res.description,
    active: res.active, confirmPageEnabled: res.confirm_page_enabled,
    orgName: res.org_name ?? "", motto: res.motto ?? "",
  };
  addVotingTypeLocal(vt);
  return vt;
}

export async function updateVotingType(id: string, data: Partial<VotingType>) {
  const apiData: any = {};
  if (data.name !== undefined) apiData.name = data.name;
  if (data.description !== undefined) apiData.description = data.description;
  if (data.active !== undefined) apiData.active = data.active;
  if (data.confirmPageEnabled !== undefined) apiData.confirm_page_enabled = data.confirmPageEnabled;
  if (data.orgName !== undefined) apiData.org_name = data.orgName;
  if (data.motto !== undefined) apiData.motto = data.motto;
  await votingTypeApi.update(id, apiData);
  updateVotingTypeLocal(id, data);
}

export async function deleteVotingType(id: string) {
  await votingTypeApi.delete(id);
  deleteVotingTypeLocal(id);
}

// ─── Categories ─────────────────────────────────────────

export async function fetchCategories(votingTypeId?: string): Promise<Category[]> {
  const res = await categoryApi.list(votingTypeId);
  const mapped = res.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    order: c.order,
    votingTypeId: c.voting_type_id,
    gender: c.gender,
  }));
  setCategories(mapped);
  return mapped;
}

export async function createCategory(data: Omit<Category, "id">): Promise<Category> {
  const res = await categoryApi.create({
    name: data.name,
    description: data.description,
    order: data.order,
    voting_type_id: data.votingTypeId,
    gender: data.gender,
  });
  const cat = { id: res.id, name: res.name, description: res.description, order: res.order, votingTypeId: res.voting_type_id, gender: res.gender };
  addCategoryLocal(cat);
  return cat;
}

export async function updateCategory(id: string, data: Partial<Category>) {
  const apiData: any = {};
  if (data.name !== undefined) apiData.name = data.name;
  if (data.description !== undefined) apiData.description = data.description;
  if (data.order !== undefined) apiData.order = data.order;
  if (data.votingTypeId !== undefined) apiData.voting_type_id = data.votingTypeId;
  if (data.gender !== undefined) apiData.gender = data.gender;
  await categoryApi.update(id, apiData);
  updateCategoryLocal(id, data);
}

export async function deleteCategory(id: string) {
  await categoryApi.delete(id);
  deleteCategoryLocal(id);
}

// ─── Candidates ─────────────────────────────────────────

export async function fetchCandidates(params?: { categoryId?: string; votingTypeId?: string }): Promise<Candidate[]> {
  const res = await candidateApi.list({
    category_id: params?.categoryId,
    voting_type_id: params?.votingTypeId,
  });
  const mapped = res.map((c) => ({
    id: c.id,
    name: c.name,
    photo: c.photo,
    categoryId: c.category_id,
    motto: c.motto,
    votes: c.votes,
    classLevel: c.class_level,
    stream: c.stream,
  }));
  setCandidates(mapped);
  return mapped;
}

export async function createCandidate(data: FormData): Promise<Candidate> {
  const res = await candidateApi.create(data);
  const candidate: Candidate = {
    id: res.id, name: res.name, photo: res.photo, categoryId: res.category_id,
    motto: res.motto, votes: res.votes, classLevel: res.class_level, stream: res.stream,
  };
  // Optimistic update: add immediately so UI reflects without waiting for a full fetch
  addCandidateLocal(candidate);
  // Background sync to ensure full consistency (e.g. if other admin added candidates)
  fetchCandidates().catch(() => {});
  return candidate;
}

export async function updateCandidateApi(id: string, data: FormData | Partial<Candidate>) {
  let updated;
  if (data instanceof FormData) {
    updated = await candidateApi.update(id, data);
  } else {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v !== undefined) fd.append(k, String(v)); });
    updated = await candidateApi.update(id, fd);
  }
  
  if (updated) {
    const candidate: Candidate = {
      id: updated.id, name: updated.name, photo: updated.photo, categoryId: updated.category_id,
      motto: updated.motto, votes: updated.votes, classLevel: updated.class_level, stream: updated.stream,
    };
    updateCandidateLocal(id, candidate);
  }

  // Refresh candidates to pick up the updated photo URL and any server-side changes
  fetchCandidates().catch(() => {});
}

export async function deleteCandidate(id: string) {
  await candidateApi.delete(id);
  deleteCandidateLocal(id);
}

// ─── Voting Codes ───────────────────────────────────────

export async function fetchVotingCodes(params?: {
  className?: string; stream?: string; votingTypeId?: string; used?: boolean;
}): Promise<VotingCode[]> {
  const res = await votingCodeApi.list({
    class_name: params?.className,
    stream: params?.stream,
    voting_type_id: params?.votingTypeId,
    used: params?.used,
  });
  const mapped = res.map((c) => ({
    id: c.id,
    code: c.code,
    votingTypeId: c.voting_type_id,
    className: c.class_name,
    stream: c.stream,
    used: c.used,
    createdAt: c.created_at,
  }));
  setVotingCodes(mapped);
  return mapped;
}

export async function generateCodes(
  votingTypeId: string, className: string, stream: string, count: number
): Promise<VotingCode[]> {
  const res = await votingCodeApi.generate({
    voting_type_id: votingTypeId,
    class_name: className,
    stream,
    count,
  });
  return res.codes.map((c) => ({
    id: c.id,
    code: c.code,
    votingTypeId: c.voting_type_id,
    className: c.class_name,
    stream: c.stream,
    used: c.used,
    createdAt: c.created_at,
  }));
}

export async function deleteCodes(codes: string[]) {
  // Backend expects IDs, but we pass codes — backend should handle both
  await votingCodeApi.delete(codes);
}

export async function getCodeStats(): Promise<{ className: string; stream: string; total: number; used: number }[]> {
  const res = await votingCodeApi.stats();
  return res.map((s) => ({
    className: s.class_name,
    stream: s.stream,
    total: s.total,
    used: s.used,
  }));
}

export function getCodeExportUrl(params?: {
  className?: string; stream?: string; votingTypeId?: string; used?: boolean;
}): string {
  return votingCodeApi.export({
    class_name: params?.className,
    stream: params?.stream,
    voting_type_id: params?.votingTypeId,
    used: params?.used,
  });
}

// ─── Votes ──────────────────────────────────────────────

export async function submitVotes(votingCode: string, selections: Record<string, string>) {
  await voteApi.submit({ voting_code: votingCode, selections });
}

export async function fetchResults(votingTypeId?: string) {
  return await voteApi.results(votingTypeId);
}

// ─── Config ─────────────────────────────────────────────

export async function fetchStreams(): Promise<string[]> {
  const res = await configApi.getStreams();
  setStreams(res);
  return res;
}

export async function addStream(name: string) {
  await configApi.addStream(name);
  addStreamLocal(name);
}

export async function removeStream(name: string) {
  await configApi.removeStream(name);
  removeStreamLocal(name);
}

export async function fetchClassLevels(): Promise<string[]> {
  return await configApi.getClassLevels();
}

export interface MediaConfig {
  backend: "local" | "cloudinary";
  cloud_name: string;
  api_key: string;
  api_secret: string;
}

export async function fetchMediaConfig(): Promise<MediaConfig> {
  const res = await configApi.getMediaConfig();
  return res as MediaConfig;
}

export async function saveMediaConfig(data: Partial<MediaConfig>): Promise<MediaConfig> {
  const res = await configApi.updateMediaConfig(data as any);
  return res as MediaConfig;
}

// ─── WebSocket ──────────────────────────────────────────

export function connectSocket(
  onMessage: (msg: WsMessage) => void,
  onClose?: () => void
): WebSocket | null {
  if (!isBackendMode) return null;
  return connectElectionSocket(onMessage, onClose);
}
