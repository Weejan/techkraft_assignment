import axios, { AxiosError } from "axios";
import {
  AuthResponse,
  Candidate,
  CandidateListResponse,
  ListCandidatesParams,
  Score,
  ScoreCreatePayload,
  AISummary,
} from "../types";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string | Array<{ msg: string }> }>) => {
    let message = "An unexpected error occurred";
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail;
      message =
        typeof detail === "string"
          ? detail
          : detail.map((e) => e.msg).join(", ");
    } else if (error.message) {
      message = error.message;
    }
    return Promise.reject(new Error(message));
  },
);

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/auth/login", {
      email,
      password,
    });
    return data;
  },

  register: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/auth/register", {
      email,
      password,
    });
    return data;
  },
};

export const candidatesApi = {
  getAll: async (
    params: ListCandidatesParams = {},
  ): Promise<CandidateListResponse> => {
    const cleanParams: Record<string, string> = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v !== "" && v !== null && v !== undefined) {
        cleanParams[k] = String(v);
      }
    });
    const { data } = await api.get<CandidateListResponse>("/candidates/", {
      params: cleanParams,
    });
    return data;
  },

  getById: async (id: string): Promise<Candidate> => {
    const { data } = await api.get<Candidate>(`/candidates/${id}`);
    return data;
  },

  create: async (payload: Partial<Candidate>): Promise<Candidate> => {
    const { data } = await api.post<Candidate>("/candidates/", payload);
    return data;
  },

  update: async (
    id: string,
    payload: Partial<Candidate>,
  ): Promise<Candidate> => {
    const { data } = await api.patch<Candidate>(`/candidates/${id}`, payload);
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/candidates/${id}`);
  },

  createScore: async (
    candidateId: string,
    scoreData: ScoreCreatePayload,
  ): Promise<Score> => {
    const { data } = await api.post<Score>(
      `/candidates/${candidateId}/scores`,
      scoreData,
    );
    return data;
  },

  generateSummary: async (candidateId: string): Promise<AISummary> => {
    const { data } = await api.post<AISummary>(
      `/candidates/${candidateId}/summary`,
    );
    return data;
  },
};
