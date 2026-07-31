"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Heart, MessageCircle, SendHorizontal } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  addComment,
  fetchComments,
  togglePostLike,
} from "@/services/posts";
import type { LikeResult, Post, PostComment } from "@/types/post";
import { getInitials } from "@/utils/avatar";
import { formatRelativeTime } from "@/utils/datetime";

/** 更新信息流缓存中的单条帖子 */
function patchPostInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  postId: number,
  patch: (post: Post) => Post
) {
  queryClient.setQueriesData<Post[]>({ queryKey: ["posts"] }, (old) =>
    old?.map((p) => (p.id === postId ? patch(p) : p))
  );
}

function CommentsSection({ postId }: { postId: number }) {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  const [draft, setDraft] = useState("");

  const { data: comments, isLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => fetchComments(postId),
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => addComment(postId, content),
    onSuccess: async (newComment: PostComment) => {
      setDraft("");
      queryClient.setQueryData<PostComment[]>(["comments", postId], (old) => [
        ...(old ?? []),
        newComment,
      ]);
      patchPostInCache(queryClient, postId, (p) => ({
        ...p,
        comment_count: p.comment_count + 1,
      }));
      await refreshUser(); // 评论 +5 XP
    },
  });

  return (
    <div className="space-y-3 pt-1">
      {isLoading ? (
        <Skeleton className="h-12 w-full" />
      ) : !comments || comments.length === 0 ? (
        <p className="py-1 text-center text-xs text-muted-foreground">
          还没有评论，说点什么吧（+5 XP）
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-2.5">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage
                  src={comment.author.avatar_url ?? undefined}
                  alt={comment.author.name}
                />
                <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                  {getInitials(comment.author.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 rounded-lg bg-secondary/70 px-3 py-2">
                <p className="text-xs">
                  <span className="font-medium">{comment.author.name}</span>
                  <span className="ml-2 text-muted-foreground">
                    {formatRelativeTime(comment.created_at)}
                  </span>
                </p>
                <p className="mt-0.5 whitespace-pre-wrap text-sm">
                  {comment.content}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = draft.trim();
          if (trimmed && !commentMutation.isPending) {
            commentMutation.mutate(trimmed);
          }
        }}
      >
        <Input
          value={draft}
          maxLength={2000}
          placeholder="写下你的评论…"
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button
          type="submit"
          size="icon"
          aria-label="发送评论"
          disabled={!draft.trim() || commentMutation.isPending}
        >
          <SendHorizontal className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

/** 信息流帖子卡片：作者、内容、图片、点赞、评论 */
export function PostCard({ post }: { post: Post }) {
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);

  const likeMutation = useMutation({
    mutationFn: () => togglePostLike(post.id),
    onSuccess: (result: LikeResult) => {
      patchPostInCache(queryClient, post.id, (p) => ({
        ...p,
        is_liked: result.liked,
        like_count: result.like_count,
      }));
    },
  });

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        {/* 作者信息 */}
        <Link
          href={`/users/${post.author.id}`}
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={post.author.avatar_url ?? undefined}
              alt={post.author.name}
            />
            <AvatarFallback className="bg-primary/10 text-sm text-primary">
              {getInitials(post.author.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium">{post.author.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {post.author.grade} ·{" "}
              {formatRelativeTime(post.created_at)}
            </p>
          </div>
        </Link>

        {/* 内容 */}
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
          {post.content}
        </p>
        {post.image_url && (
          <div className="relative aspect-video max-w-lg overflow-hidden rounded-lg border">
            <Image
              src={post.image_url}
              alt="帖子图片"
              fill
              sizes="(max-width: 640px) 100vw, 512px"
              className="object-cover"
            />
          </div>
        )}

        {/* 操作栏 */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "gap-1.5 text-muted-foreground",
              post.is_liked && "text-rose-500 hover:text-rose-500"
            )}
            disabled={likeMutation.isPending}
            onClick={() => likeMutation.mutate()}
          >
            <Heart className={cn("h-4 w-4", post.is_liked && "fill-current")} />
            {post.like_count > 0 ? post.like_count : "点赞"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={() => setShowComments((v) => !v)}
          >
            <MessageCircle className="h-4 w-4" />
            {post.comment_count > 0 ? post.comment_count : "评论"}
          </Button>
        </div>

        {showComments && (
          <>
            <Separator />
            <CommentsSection postId={post.id} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
