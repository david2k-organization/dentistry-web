import { api, type ApiEnvelope } from "@/lib/api";
import type {
  ForgetPasswordInput,
  LoginInput,
  LoginResponse,
  RegisterInput,
  RegisterResponse,
  SendOtpInput,
} from "./types";

export async function login(input: LoginInput): Promise<LoginResponse> {
  const res = await api.post<ApiEnvelope<LoginResponse>>("/auth/login", input);
  return res.data.data;
}

export async function sendOtp(input: SendOtpInput): Promise<void> {
  await api.post("/auth/send-otp", input);
}

export async function register(input: RegisterInput): Promise<RegisterResponse> {
  const res = await api.post<ApiEnvelope<RegisterResponse>>("/auth/register", input);
  return res.data.data;
}

export async function forgetPassword(input: ForgetPasswordInput): Promise<void> {
  await api.put("/auth/forget-password", input);
}
