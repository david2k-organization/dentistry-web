export type LoginInput = {
  userName: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
};

export type OtpType = "REGISTER" | "FORGOT_PASSWORD";

export type SendOtpInput = {
  email: string;
  type: OtpType;
};

export type ForgetPasswordInput = {
  email: string;
  code: string;
  newPassword: string;
  confirmNewPassword: string;
};

export type RegisterInput = {
  userName: string;
  fullName: string;
  password: string;
  confirmPassword: string;
  email: string;
  code: string;
  phone?: string;
  roleId?: number;
};

export type RegisterResponse = {
  id: string;
  userName: string;
  fullName: string;
  roleId: number;
  phone: string | null;
  email: string;
  avatar: string | null;
  createdAt: string;
};
