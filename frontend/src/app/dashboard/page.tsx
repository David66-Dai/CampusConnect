"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, CalendarHeart, Sparkles, Trophy, Users } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EventCard } from "@/features/events/event-card";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { fetchEvents } from "@/services/events";
import { fetchRecommendedPartners } from "@/services/users";
import type { RecommendedUser, User } from "@/types/user";
import { getInitials } from "@/utils/avatar";
import {
  getLevelName,
  getLevelProgress,
  getXpToNextLevel,
} from "@/utils/level";

/** 按当前时间返回问候语 */
function getGreeting(t: (key: import("@/i18n/messages").MessageKey) => string): string {
  const hour = new Date().getHours();
  if (hour < 6) return t("greeting.late");
  if (hour < 12) return t("greeting.morning");
  if (hour < 18) return t("greeting.afternoon");
  return t("greeting.evening");
}

function LevelCard({ user }: { user: User }) {
  const { t } = useI18n();
  const progress = getLevelProgress(user.level, user.xp);
  const xpToNext = getXpToNextLevel(user.level, user.xp);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardDescription className="flex items-center gap-1.5">
          <Trophy className="h-4 w-4 text-primary" />
          {t("dashboard.level")}
        </CardDescription>
        <CardTitle className="text-2xl">
          Lv.{user.level} · {getLevelName(user.level)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {user.xp} XP
          {xpToNext !== null
            ? ` · ${t("dashboard.xpToNext", { n: xpToNext })}`
            : ` · ${t("dashboard.maxLevel")}`}
        </p>
      </CardContent>
    </Card>
  );
}

function PartnerCard({ partner }: { partner: RecommendedUser }) {
  const { t } = useI18n();
  return (
    <Link href={`/users/${partner.id}`} className="block">
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-start gap-3 pt-6">
          <Avatar className="h-11 w-11">
            <AvatarImage src={partner.avatar_url ?? undefined} alt={partner.name} />
            <AvatarFallback className="bg-primary/10 text-sm text-primary">
              {getInitials(partner.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{partner.name}</p>
            <p className="truncate text-sm text-muted-foreground">
              {partner.grade}
            </p>
            {partner.common_interests.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {partner.common_interests.slice(0, 3).map((interest) => (
                  <Badge key={interest} variant="secondary" className="text-xs">
                    {interest}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                {t("dashboard.noCommon")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function RecommendedPartners() {
  const { t } = useI18n();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["recommended-partners"],
    queryFn: () => fetchRecommendedPartners(6),
  });

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold tracking-tight">
            {t("dashboard.partners")}
          </h2>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/connect">{t("common.viewAll")}</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t("dashboard.partnersFail")}
          </CardContent>
        </Card>
      ) : !data || data.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              {t("dashboard.partnersEmpty")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} />
          ))}
        </div>
      )}
    </section>
  );
}

function MyEvents() {
  const { t } = useI18n();
  const [tab, setTab] = useState<"created" | "joined">("created");

  const { data, isLoading } = useQuery({
    queryKey: ["events", "mine", tab],
    queryFn: () => fetchEvents({ mine: tab, limit: 6 }),
  });

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarHeart className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold tracking-tight">
            {t("dashboard.myEvents")}
          </h2>
        </div>
        <div className="flex gap-1 rounded-lg bg-secondary p-1">
          {(
            [
              { key: "created" as const, labelKey: "dashboard.created" as const },
              { key: "joined" as const, labelKey: "dashboard.joined" as const },
            ]
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={
                tab === item.key
                  ? "rounded-md bg-background px-3 py-1 text-sm font-medium shadow-sm"
                  : "rounded-md px-3 py-1 text-sm text-muted-foreground hover:text-foreground"
              }
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              {tab === "created"
                ? t("dashboard.noCreated")
                : t("dashboard.noJoined")}
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href={tab === "created" ? "/events/create" : "/events"}>
                {tab === "created"
                  ? t("dashboard.createEvent")
                  : t("dashboard.browseEvents")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  );
}

function UpcomingEvents() {
  const { t } = useI18n();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["events", "upcoming-preview"],
    queryFn: () => fetchEvents({ upcoming: true, limit: 3 }),
  });

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold tracking-tight">
            {t("dashboard.upcoming")}
          </h2>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/events">{t("common.viewAll")}</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t("common.retry")}
          </CardContent>
        </Card>
      ) : !data || data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Sparkles className="h-6 w-6 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {t("dashboard.noUpcoming")}
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/events/create">{t("dashboard.createEvent")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useI18n();

  return (
    <AppShell>
      {user && (
        <div className="space-y-8">
          {/* 欢迎信息 */}
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {getGreeting(t)}，{user.name}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {user.grade} · {t("dashboard.greeting")}
            </p>
          </div>

          {/* 概览卡片 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <LevelCard user={user} />
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {t("dashboard.myInterests")}
                </CardDescription>
                <CardTitle className="text-2xl">
                  {t("dashboard.tagCount", { n: user.interests.length })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user.interests.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {user.interests.map((interest) => (
                      <Badge key={interest} variant="secondary">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("dashboard.noInterests")}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <MyEvents />
          <UpcomingEvents />
          <RecommendedPartners />
        </div>
      )}
    </AppShell>
  );
}
