import { api } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type {
  CreatePostPayload,
  LikeResult,
  Post,
  PostComment,
} from "@/types/post";

export async function fetchPosts(limit = 50): Promise<Post[]> {
  const { data } = await api.get<ApiResponse<Post[]>>("/posts", {
    params: { limit },
  });
  return data.data;
}

export async function createPost(payload: CreatePostPayload): Promise<Post> {
  const { data } = await api.post<ApiResponse<Post>>("/posts", payload);
  return data.data;
}

export async function togglePostLike(postId: number): Promise<LikeResult> {
  const { data } = await api.post<ApiResponse<LikeResult>>(
    `/posts/${postId}/like`
  );
  return data.data;
}

export async function fetchComments(postId: number): Promise<PostComment[]> {
  const { data } = await api.get<ApiResponse<PostComment[]>>(
    `/posts/${postId}/comments`
  );
  return data.data;
}

export async function addComment(
  postId: number,
  content: string
): Promise<PostComment> {
  const { data } = await api.post<ApiResponse<PostComment>>(
    `/posts/${postId}/comments`,
    { content }
  );
  return data.data;
}
