import axios, { AxiosError } from "axios";

import type { ApiResponse } from "@/types/api";

export const TOKEN_STORAGE_KEY = "campusconnect_token";

/** 读取 JWT：优先 localStorage（保持登录），其次 sessionStorage */
export function readAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    window.localStorage.getItem(TOKEN_STORAGE_KEY) ??
    window.sessionStorage.getItem(TOKEN_STORAGE_KEY)
  );
}

/** 清除两端 Token */
export function clearAuthToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}

/**
 * 全局 Axios 实例。
 * baseURL 指向 FastAPI 后端，所有业务请求都通过它发出。
 */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15_000,
});

// 请求拦截器：自动附加 JWT；FormData 交给浏览器设置 multipart boundary
api.interceptors.request.use((config) => {
  const token = readAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    if (config.headers && "Content-Type" in config.headers) {
      delete config.headers["Content-Type"];
    }
  }
  return config;
});

// 响应拦截器：401 时清除失效 Token
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearAuthToken();
    }
    return Promise.reject(error);
  }
);

/** 从后端统一响应结构中提取错误信息，便于 UI 展示 */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiResponse<unknown> | undefined;
    if (data?.message) return data.message;
    if (error.code === "ECONNABORTED") return "请求超时，请稍后重试";
    if (!error.response) return "无法连接服务器，请检查后端是否启动";
  }
  return "请求失败，请稍后重试";
}
