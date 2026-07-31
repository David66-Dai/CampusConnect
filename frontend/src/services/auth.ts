import { api, clearAuthToken, readAuthToken, TOKEN_STORAGE_KEY } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type {
  AuthTokenData,
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
  User,
} from "@/types/user";

/**
 * 写入 JWT。
 * remember=true → localStorage（关浏览器仍保留）；
 * remember=false → sessionStorage（关浏览器即失效）。
 */
export function saveToken(token: string, remember = true): void {
  if (typeof window === "undefined") return;
  clearAuthToken();
  const store = remember ? window.localStorage : window.sessionStorage;
  store.setItem(TOKEN_STORAGE_KEY, token);
}

/** 读取本地 JWT */
export function getToken(): string | null {
  return readAuthToken();
}

/** 清除本地 JWT（登出） */
export function clearToken(): void {
  clearAuthToken();
}

export async function register(
  payload: RegisterPayload
): Promise<AuthTokenData> {
  const { data } = await api.post<ApiResponse<AuthTokenData>>(
    "/auth/register",
    payload
  );
  return data.data;
}

export async function login(payload: LoginPayload): Promise<AuthTokenData> {
  const { data } = await api.post<ApiResponse<AuthTokenData>>(
    "/auth/login",
    payload
  );
  return data.data;
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<ApiResponse<User>>("/users/me");
  return data.data;
}

export async function updateMe(payload: UpdateProfilePayload): Promise<User> {
  const { data } = await api.put<ApiResponse<User>>("/users/me", payload);
  return data.data;
}

/** 申请更改邮箱；开发环境可能返回 dev_code */
export async function requestEmailChange(
  newEmail: string,
  password: string
): Promise<{
  dev_code?: string;
  new_email: string;
  expires_in_minutes: number;
} | null> {
  const { data } = await api.post<
    ApiResponse<{
      dev_code?: string;
      new_email: string;
      expires_in_minutes: number;
    } | null>
  >("/users/me/email/request", { new_email: newEmail, password });
  return data.data;
}

/** 提交验证码确认更改邮箱 */
export async function confirmEmailChange(code: string): Promise<User> {
  const { data } = await api.post<ApiResponse<User>>("/users/me/email/confirm", {
    code,
  });
  return data.data;
}

/** 申请密码重置；开发环境后端会返回 reset_token 便于演示 */
export async function forgotPassword(
  email: string
): Promise<{ reset_token: string; reset_url: string } | null> {
  const { data } = await api.post<
    ApiResponse<{ reset_token: string; reset_url: string } | null>
  >("/auth/forgot-password", { email });
  return data.data;
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<void> {
  await api.post("/auth/reset-password", {
    token,
    new_password: newPassword,
  });
}

/** 查看其他用户的公开资料（私信页等轻量场景） */
export async function fetchUserPublic(
  userId: number
): Promise<Omit<User, "email">> {
  const { data } = await api.get<ApiResponse<Omit<User, "email">>>(
    `/users/${userId}`
  );
  return data.data;
}
