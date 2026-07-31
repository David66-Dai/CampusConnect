"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  CircleStop,
  Crown,
  MapPin,
  MessageCircle,
  Pencil,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORY_META } from "@/features/events/constants";
import { useAuth } from "@/hooks/use-auth";
import { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  deleteEvent,
  endEvent,
  fetchEventDetail,
  joinEvent,
  leaveEvent,
} from "@/services/events";
import { getInitials } from "@/utils/avatar";
import { formatEventDate, formatEventTime, isPastDate } from "@/utils/datetime";

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const eventId = Number(params.id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => fetchEventDetail(eventId),
    enabled: Number.isFinite(eventId),
  });

  const mutation = useMutation({
    mutationFn: (action: "join" | "leave") =>
      action === "join" ? joinEvent(eventId) : leaveEvent(eventId),
    onSuccess: async (updated) => {
      setActionError(null);
      queryClient.setQueryData(["event", eventId], updated);
      await queryClient.invalidateQueries({ queryKey: ["events"] });
      await refreshUser(); // 同步 XP
    },
    onError: (error) => setActionError(getApiErrorMessage(error)),
  });

  const endMutation = useMutation({
    mutationFn: () => endEvent(eventId),
    onSuccess: async (updated) => {
      setActionError(null);
      queryClient.setQueryData(["event", eventId], updated);
      await queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (error) => setActionError(getApiErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteEvent(eventId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["events"] });
      router.push("/events");
    },
    onError: (error) => setActionError(getApiErrorMessage(error)),
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppShell>
    );
  }

  if (isError || !event) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-muted-foreground">活动不存在或加载失败</p>
              <Button asChild variant="outline">
                <Link href="/events">返回活动列表</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  const meta = CATEGORY_META[event.category];
  const ended = event.status === "ended" || isPastDate(event.date);
  const full = event.member_count >= event.max_participants;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/events">
            <ArrowLeft className="mr-1 h-4 w-4" />
            返回活动列表
          </Link>
        </Button>

        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn("border-transparent", meta.className)}>
                {meta.label}
              </Badge>
              {event.is_creator && (
                <Badge variant="outline" className="gap-1">
                  <Crown className="h-3 w-3" />
                  我创建的
                </Badge>
              )}
              {ended && <Badge variant="secondary">已结束</Badge>}
            </div>
            <CardTitle className="text-2xl leading-snug sm:text-3xl">
              {event.title}
            </CardTitle>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                {formatEventDate(event.date)} · {formatEventTime(event.time)}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {event.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {event.member_count} / {event.max_participants} 人
              </span>
              <span className="flex items-center gap-1.5">
                <UserRound className="h-4 w-4" />
                发起人：{event.creator.name}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
              {event.description}
            </p>

            {actionError && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {actionError}
              </p>
            )}

            {event.is_creator ? (
              // 发起人管理操作
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/events/${event.id}/edit`}>
                    <Pencil className="mr-1 h-4 w-4" />
                    编辑活动
                  </Link>
                </Button>
                {event.status !== "ended" && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={endMutation.isPending}
                    onClick={() => {
                      if (window.confirm("确定结束活动吗？结束后将不再接受新成员报名。")) {
                        endMutation.mutate();
                      }
                    }}
                  >
                    <CircleStop className="mr-1 h-4 w-4" />
                    {endMutation.isPending ? "处理中…" : "结束活动"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (window.confirm("确定删除活动吗？此操作不可恢复，成员记录会一并删除。")) {
                      deleteMutation.mutate();
                    }
                  }}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  {deleteMutation.isPending ? "删除中…" : "删除活动"}
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button
                  className="w-full sm:w-auto"
                  variant={event.is_joined ? "outline" : "default"}
                  disabled={
                    mutation.isPending || ended || (!event.is_joined && full)
                  }
                  onClick={() =>
                    mutation.mutate(event.is_joined ? "leave" : "join")
                  }
                >
                  {mutation.isPending
                    ? "处理中…"
                    : event.is_joined
                      ? "退出活动"
                      : ended
                        ? "活动已结束"
                        : full
                          ? "人数已满"
                          : "加入活动（+10 XP）"}
                </Button>
                <Button variant="outline" className="w-full sm:w-auto" asChild>
                  <Link href={`/messages?user=${event.creator_id}`}>
                    <MessageCircle className="mr-1 h-4 w-4" />
                    联系发起人
                  </Link>
                </Button>
              </div>
            )}

            <Separator />

            <div>
              <h2 className="mb-4 font-medium">
                成员（{event.member_count}）
              </h2>
              <ul className="space-y-3">
                {event.members.map((member) => (
                  <li key={member.id}>
                    <Link
                      href={`/users/${member.id}`}
                      className="flex items-center gap-3 rounded-md py-1 transition-opacity hover:opacity-80"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={member.avatar_url ?? undefined}
                          alt={member.name}
                        />
                        <AvatarFallback className="bg-primary/10 text-xs text-primary">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-sm font-medium">
                          {member.name}
                          {member.id === event.creator_id && (
                            <Crown className="h-3.5 w-3.5 text-amber-500" />
                          )}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {member.grade}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
