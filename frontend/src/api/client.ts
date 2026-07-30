import axios, { AxiosError } from "axios";
import { AuthResponse } from "../types";

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
