"use client";

import { useQuery } from "@tanstack/react-query";
import { MessagesSquare } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCard } from "@/features/community/post-card";
import { PostComposer } from "@/features/community/post-composer";
import { useI18n } from "@/hooks/use-i18n";
import { fetchPosts } from "@/services/posts";

export default function CommunityPage() {
  const { t } = useI18n();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["posts"],
    queryFn: () => fetchPosts(50),
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {t("community.title")}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t("community.desc")}
          </p>
        </div>

        <PostComposer />

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              {t("community.loadFail")}
            </CardContent>
          </Card>
        ) : !data || data.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <MessagesSquare className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                {t("community.empty")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {data.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
