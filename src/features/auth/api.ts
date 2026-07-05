import { api, type ApiEnvelope } from "@/lib/api";
import type { LoginInput, LoginResponse } from "./types";

export async function login(input: LoginInput): Promise<LoginResponse> {
  const res = await api.post<ApiEnvelope<LoginResponse>>("/auth/login", input);
  return res.data.data;
}
