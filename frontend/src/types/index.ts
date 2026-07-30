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
