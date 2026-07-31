import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { MatchResult } from "@/types/match";

/** 获取匹配推荐（后端实时计算并落库） */
export async function fetchMatches(limit = 20): Promise<MatchResult[]> {
  const { data } = await api.get<ApiResponse<MatchResult[]>>("/matches", {
    params: { limit },
  });
  return data.data;
}
