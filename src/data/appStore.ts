/**
 * Unified reactive application store.
 * All mutable state lives here so every page sees the same data in real-time.
 */

// ─── Types ───────────────────────────────────────────────

export type ElectionState = "live" | "paused" | "ended" | "scheduled";

export interface VotingType {
  id: string;
  name: string;
  description: string;
  active: boolean;
  confirmPageEnabled: boolean;
  orgName?: string;  // e.g. "THE VINE STUDENTS COUNCIL BODY"
  motto?: string;    // shown as footer on printed reports
}


export interface Student {
  id: string;
  name: string;
  registrationNumber: string;
  className: string;
  photo: string;
}

export interface VotingCode {
  id: string;
  code: string;
  votingTypeId: string;
  className: string;   // e.g. "S4"
  stream: string;      // e.g. "A"
  used: boolean;
  createdAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  photo: string;
  categoryId: string;
  motto?: string;
  votes: number;
  classLevel?: string;
  stream?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  order: number;
  votingTypeId: string;
  gender?: "male" | "female";
}

// ─── Pub/Sub ─────────────────────────────────────────────

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ─── Rate Limiting ───────────────────────────────────────

const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000; // 1 minute

export function checkRateLimit(ip: string = "session"): { allowed: boolean; remainingSeconds: number } {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (entry && entry.lockedUntil > now) {
    return { allowed: false, remainingSeconds: Math.ceil((entry.lockedUntil - now) / 1000) };
  }
  return { allowed: true, remainingSeconds: 0 };
}

export function recordLoginAttempt(ip: string = "session", success: boolean) {
  const now = Date.now();
  if (success) {
    loginAttempts.delete(ip);
    return;
  }
  const entry = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_MS;
    entry.count = 0;
  }
  loginAttempts.set(ip, entry);
}

// ─── Code Generation ────────────────────────────────────

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I,O,0,1 to avoid confusion

function randomCode(length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return result;
}

/** Parse a voting code like "S4A-8K2P9" into { classLevel, stream } */
export function parseCodePrefix(code: string): { classLevel: string; stream: string } | null {
  const match = code.match(/^(S\d)([A-Z])-/i);
  if (!match) return null;
  return { classLevel: match[1].toUpperCase(), stream: match[2].toUpperCase() };
}

export function generateVotingCodes(
  votingTypeId: string,
  classLevel: string,
  stream: string,
  count: number
): VotingCode[] {
  const prefix = `${classLevel}${stream}`;
  const existingCodes = new Set(appStore.votingCodes.map((c) => c.code));
  const generated: VotingCode[] = [];
  let attempts = 0;
  const maxAttempts = count * 10;

  while (generated.length < count && attempts < maxAttempts) {
    attempts++;
    const code = `${prefix}-${randomCode(5)}`;
    if (!existingCodes.has(code)) {
      existingCodes.add(code);
      generated.push({
        id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
        code,
        votingTypeId,
        className: classLevel,
        stream,
        used: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  appStore.votingCodes.push(...generated);
  notify();
  return generated;
}

export function deleteVotingCodes(codes: string[]) {
  const codeSet = new Set(codes);
  appStore.votingCodes = appStore.votingCodes.filter((c) => !codeSet.has(c.code));
  notify();
}

// ─── Store Object ────────────────────────────────────────

export const appStore = {
  state: "paused" as ElectionState,
  startTime: new Date().toISOString(),
  endTime: new Date().toISOString(),

  candidateTimerSeconds: 180,
  voteConfirmEnabled: true,

  votingTypes: [] as VotingType[],
  categories: [] as Category[],
  candidates: [] as Candidate[],
  students: [] as Student[],
  votingCodes: [] as VotingCode[],

  classLevels: ["S1", "S2", "S3", "S4", "S5", "S6"] as string[],
  streams: [] as string[],

  totalVoters: 0,
  initialFetchDone: false,
};

// ─── Computed helpers ────────────────────────────────────

export function getVotesCast() {
  return appStore.votingCodes.filter((c) => c.used).length;
}

export function getVotesCastByType(votingTypeId: string) {
  return appStore.votingCodes.filter((c) => c.votingTypeId === votingTypeId && c.used).length;
}

export function getTurnout() {
  const totalCodes = appStore.votingCodes.length;
  if (totalCodes === 0) return 0;
  return Math.round((getVotesCast() / totalCodes) * 100);
}

export function getCodeStatsByClass() {
  const stats: Record<string, { total: number; used: number; className: string; stream: string }> = {};
  appStore.votingCodes.forEach((c) => {
    const key = `${c.className}-${c.stream}`;
    if (!stats[key]) stats[key] = { total: 0, used: 0, className: c.className, stream: c.stream };
    stats[key].total++;
    if (c.used) stats[key].used++;
  });
  return Object.values(stats);
}

export function parseStudentClass(className: string): { classLevel: string; stream: string } {
  const parts = className.split(/\s*-\s*/);
  return {
    classLevel: parts[0]?.trim() || "",
    stream: parts[1]?.trim() || "",
  };
}

// ─── Mutators ────────────────────────────────────────────

export function setElectionInfo(data: {
  state?: ElectionState;
  startTime?: string;
  endTime?: string;
  candidateTimerSeconds?: number;
  voteConfirmEnabled?: boolean;
  totalVoters?: number;
}) {
  if (data.state !== undefined) appStore.state = data.state;
  if (data.startTime !== undefined) appStore.startTime = data.startTime;
  if (data.endTime !== undefined) appStore.endTime = data.endTime;
  if (data.candidateTimerSeconds !== undefined) appStore.candidateTimerSeconds = data.candidateTimerSeconds;
  if (data.voteConfirmEnabled !== undefined) appStore.voteConfirmEnabled = data.voteConfirmEnabled;
  if (data.totalVoters !== undefined) appStore.totalVoters = data.totalVoters;
  appStore.initialFetchDone = true;
  notify();
}

export function setElectionState(state: ElectionState) {
  appStore.state = state;
  notify();
}

export function setElectionSchedule(start: string, end: string) {
  appStore.startTime = start;
  appStore.endTime = end;
  notify();
}

export function setCandidateTimer(seconds: number) {
  appStore.candidateTimerSeconds = seconds;
  notify();
}

export function setVoteConfirmEnabled(enabled: boolean) {
  appStore.voteConfirmEnabled = enabled;
  notify();
}

// Voting types
export function addVotingType(vt: VotingType) {
  appStore.votingTypes.push(vt);
  notify();
}

export function updateVotingType(id: string, data: Partial<VotingType>) {
  const vt = appStore.votingTypes.find((v) => v.id === id);
  if (vt) Object.assign(vt, data);
  notify();
}

export function deleteVotingType(id: string) {
  appStore.votingTypes = appStore.votingTypes.filter((v) => v.id !== id);
  const catIds = appStore.categories.filter((c) => c.votingTypeId === id).map((c) => c.id);
  appStore.categories = appStore.categories.filter((c) => c.votingTypeId !== id);
  appStore.candidates = appStore.candidates.filter((c) => !catIds.includes(c.categoryId));
  appStore.votingCodes = appStore.votingCodes.filter((c) => c.votingTypeId !== id);
  notify();
}

// Categories
export function addCategory(cat: Category) {
  appStore.categories.push(cat);
  notify();
}

export function updateCategory(id: string, data: Partial<Category>) {
  const cat = appStore.categories.find((c) => c.id === id);
  if (cat) Object.assign(cat, data);
  notify();
}

export function deleteCategory(id: string) {
  appStore.categories = appStore.categories.filter((c) => c.id !== id);
  appStore.candidates = appStore.candidates.filter((c) => c.categoryId !== id);
  notify();
}

// Candidates
export function addCandidate(cand: Candidate) {
  appStore.candidates.push(cand);
  notify();
}

export function updateCandidate(id: string, data: Partial<Candidate>) {
  const cand = appStore.candidates.find((c) => c.id === id);
  if (cand) Object.assign(cand, data);
  notify();
}

export function deleteCandidate(id: string) {
  appStore.candidates = appStore.candidates.filter((c) => c.id !== id);
  notify();
}

// Streams
export function addStream(name: string) {
  if (!appStore.streams.includes(name)) {
    appStore.streams.push(name);
    notify();
  }
}

export function removeStream(name: string) {
  appStore.streams = appStore.streams.filter((s) => s !== name);
  notify();
}

// Voting code validation (new format)
export function validateVotingCode(code: string): { votingCode: VotingCode } | null {
  const vc = appStore.votingCodes.find((c) => c.code === code);
  if (!vc) return null;
  const vt = appStore.votingTypes.find((v) => v.id === vc.votingTypeId);
  if (!vt || !vt.active) return null;
  return { votingCode: vc };
}

export function hasCodeBeenUsed(code: string): boolean {
  const vc = appStore.votingCodes.find((c) => c.code === code);
  return vc?.used ?? false;
}

export function validateStudentByCode(code: string, regNumber: string): { votingCode: VotingCode; student: Student } | null {
  const vc = appStore.votingCodes.find((c) => c.code === code);
  if (!vc) return null;
  // For ID verification, find student by reg number matching the code's class
  const student = appStore.students.find((s) => {
    if (s.registrationNumber !== regNumber) return false;
    const parsed = parseStudentClass(s.className);
    return parsed.classLevel === vc.className && parsed.stream === vc.stream;
  });
  if (!student) return null;
  return { votingCode: vc, student };
}

export function castVotes(code: string, selections: Record<string, string>) {
  const vc = appStore.votingCodes.find((c) => c.code === code);
  if (vc) vc.used = true;

  Object.values(selections).forEach((candidateId) => {
    const cand = appStore.candidates.find((c) => c.id === candidateId);
    if (cand) cand.votes += 1;
  });

  notify();
}

// Students
export function addStudent(student: Student) {
  appStore.students.push(student);
  notify();
}

export function addVotingCode(vc: VotingCode) {
  appStore.votingCodes.push(vc);
  notify();
}

// Bulk Setters (for API sync)
export function setVotingTypes(types: VotingType[]) {
  appStore.votingTypes = types;
  notify();
}

export function setCategories(categories: Category[]) {
  appStore.categories = categories;
  notify();
}

export function setCandidates(candidates: Candidate[]) {
  appStore.candidates = candidates;
  notify();
}

export function setStudents(students: Student[]) {
  appStore.students = students;
  notify();
}

export function setVotingCodes(codes: VotingCode[]) {
  appStore.votingCodes = codes;
  notify();
}

export function setStreams(streams: string[]) {
  appStore.streams = streams;
  notify();
}

// ─── Auto-end check ──────────────────────────────────────

setInterval(() => {
  const now = Date.now();
  const end = new Date(appStore.endTime).getTime();
  if (now >= end && appStore.state === "live") {
    appStore.state = "ended";
    notify();
  }
}, 1000);
