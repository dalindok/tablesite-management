import axiosInstance from "./axios";
import type { LoginPayload } from "../types";

// Matches the actual API response shape
export interface RawUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  avatar_url: string | null;
  gender: string | null;
  role: string; // "ADMIN" | "OWNER" | "CUSTOMER" — uppercase from API
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiLoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: RawUser;
  };
}

export const authApi = {
  login: (payload: LoginPayload) =>
    axiosInstance.post<ApiLoginResponse>("/auth/login", payload),

  logout: () => axiosInstance.post("/auth/logout"),

  me: () => axiosInstance.get<ApiLoginResponse>("/auth/me"),
};
