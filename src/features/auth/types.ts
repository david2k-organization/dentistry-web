export type LoginInput = {
  userName: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
};
