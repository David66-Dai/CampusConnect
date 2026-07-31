"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  MessageCircle,
  Pencil,
  ShoppingBag,
  Trophy,
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EventCard } from "@/features/events/event-card";
import { ProductCard } from "@/features/marketplace/product-card";
import { fetchUserProfile } from "@/services/users";
import { getInitials } from "@/utils/avatar";
import { formatRelativeTime } from "@/utils/datetime";
import { getLevelName } from "@/utils/level";

function TagList({ label, tags }: { label: string; tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export default function UserProfilePage() {
  const params = useParams<{ id: string }>();
  const userId = Number(params.id);
  const router = useRouter();

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: () => fetchUserProfile(userId),
    enabled: Number.isFinite(userId),
  });

  useEffect(() => {
    if (profile?.is_self) router.replace("/profile");
  }, [profile?.is_self, router]);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-8">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/dashboard">
            <ArrowLeft className="mr-1 h-4 w-4" />
            返回
          </Link>
        </Button>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : isError || !profile ? (
          <Card>
            <CardContent className="py-16 text-center text-sm text-muted-foreground">
              用户不存在或加载失败
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 头部资料 */}
            <Card>
              <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start">
                <Avatar className="h-20 w-20 border">
                  <AvatarImage
                    src={profile.avatar_url ?? undefined}
                    alt={profile.name}
                  />
                  <AvatarFallback className="bg-primary/10 text-xl text-primary">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                      {profile.name}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {profile.grade}
                    </p>
                    <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <Trophy className="h-4 w-4 text-primary" />
                      Lv.{profile.level} · {getLevelName(profile.level)}
                      <Badge variant="secondary">{profile.xp} XP</Badge>
                    </p>
                  </div>

                  {profile.bio && (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {profile.bio}
                    </p>
                  )}

                  <div className="grid gap-3 sm:grid-cols-3">
                    <TagList label="兴趣" tags={profile.interests} />
                    <TagList label="目标" tags={profile.goals} />
                    <TagList label="技能" tags={profile.skills} />
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  {profile.is_self ? (
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/profile">
                        <Pencil className="mr-1 h-4 w-4" />
                        编辑资料
                      </Link>
                    </Button>
                  ) : (
                    <Button size="sm" asChild>
                      <Link href={`/messages?user=${profile.id}`}>
                        <MessageCircle className="mr-1 h-4 w-4" />
                        发私信
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 发布的活动 */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold tracking-tight">
                  发布的活动
                </h2>
                <Badge variant="secondary">{profile.events.length}</Badge>
              </div>
              {profile.events.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无发布活动</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {profile.events.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </section>

            {/* 在售 / 已售商品 */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold tracking-tight">
                  发布的商品
                </h2>
                <Badge variant="secondary">{profile.products.length}</Badge>
              </div>
              {profile.products.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无发布商品</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {profile.products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </section>

            {/* 近期动态 */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight">近期动态</h2>
              {profile.posts.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无动态</p>
              ) : (
                <div className="space-y-3">
                  {profile.posts.map((post) => (
                    <Card key={post.id}>
                      <CardContent className="space-y-2 p-4">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {post.content}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(post.created_at)} · ❤️{" "}
                          {post.like_count} · 💬 {post.comment_count}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
