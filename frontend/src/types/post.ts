export type PostAuthor = {
  id: number;
  name: string;
  avatar_url: string | null;
  school: string;
  grade: string;
};

export type Post = {
  id: number;
  author_id: number;
  content: string;
  image_url: string | null;
  created_at: string;
  author: PostAuthor;
  like_count: number;
  comment_count: number;
  is_liked: boolean;
  is_author: boolean;
};

export type LikeResult = {
  post_id: number;
  liked: boolean;
  like_count: number;
};

export type PostComment = {
  id: number;
  post_id: number;
  content: string;
  created_at: string;
  author: PostAuthor;
  is_author: boolean;
};

export type CreatePostPayload = {
  content: string;
  image_url?: string | null;
};
