export type User = {
  id: number;
  email: string;
  name: string;
  avatar_url: string | null;
  school: string;
  grade: string;
  bio: string | null;
  interests: string[];
  skills: string[];
  goals: string[];
  xp: number;
  level: number;
  created_at: string;
};

export type RecommendedUser = User & {
  common_interests: string[];
};

export type AuthTokenData = {
  access_token: string;
  token_type: string;
  user: User;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  school: string;
  grade: string;
  interests: string[];
};

export type LoginPayload = {
  email: string;
  password: string;
  remember_me?: boolean;
};

export type UpdateProfilePayload = {
  name?: string;
  school?: string;
  grade?: string;
  bio?: string | null;
  avatar_url?: string | null;
  interests?: string[];
  skills?: string[];
  goals?: string[];
};

/** 他人主页（不含邮箱） */
export type UserProfile = {
  id: number;
  name: string;
  avatar_url: string | null;
  school: string;
  grade: string;
  bio: string | null;
  interests: string[];
  skills: string[];
  goals: string[];
  xp: number;
  level: number;
  created_at: string;
  is_self: boolean;
  events: import("@/types/event").CampusEvent[];
  products: import("@/types/product").Product[];
  posts: import("@/types/post").Post[];
};
