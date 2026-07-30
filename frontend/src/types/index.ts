export interface User {
  id?: string;
  email: string;
  role: "admin" | "reviewer";
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: "admin" | "reviewer";
}
export interface Score {
  id: string;
  candidate_id: string;
  category: string;
  score: number;
  reviewer_id: string;
  note?: string | null;
  created_at: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  role_applied: string;
  status: "new" | "reviewed" | "hired" | "rejected";
  skills: string[];
  internal_notes?: string | null;
  created_at: string;
  scores: Score[];
}

export interface CandidateListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: Candidate[];
}

export interface ScoreCreatePayload {
  category: string;
  score: number;
  note?: string;
}

export interface AISummary {
  candidate_id: string;
  summary: string;
  generated_at: string;
}

export interface ListCandidatesParams {
  status?: string;
  role_applied?: string;
  skill?: string;
  keyword?: string;
  page?: number;
  page_size?: number;
}
