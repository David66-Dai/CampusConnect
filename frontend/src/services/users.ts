import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { RecommendedUser, UserProfile } from "@/types/user";

/** 获取推荐伙伴列表（按共同兴趣排序） */
export async function fetchRecommendedPartners(
  limit = 6
): Promise<RecommendedUser[]> {
  const { data } = await api.get<ApiResponse<RecommendedUser[]>>(
    "/users/recommended",
    { params: { limit } }
  );
  return data.data;
}

/** 浏览他人主页（含近期活动 / 商品 / 帖子） */
export async function fetchUserProfile(userId: number): Promise<UserProfile> {
  const { data } = await api.get<ApiResponse<UserProfile>>(`/users/${userId}`);
  return data.data;
}
