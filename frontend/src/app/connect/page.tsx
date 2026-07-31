"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Sparkles, UserRoundSearch } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreRing } from "@/features/matches/score-ring";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { fetchMatches } from "@/services/matches";
import type { MatchResult } from "@/types/match";
import { getInitials } from "@/utils/avatar";

function CommonTags({
  label,
  tags,
}: {
  label: string;
  tags: string[];
}) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary" className="text-xs">
          {tag}
        </Badge>
      ))}
    </div>
  );
}

function MatchCard({ match }: { match: MatchResult }) {
  const { t } = useI18n();
  const { user, score } = match;
  const hasCommon =
    match.common_interests.length > 0 ||
    match.common_skills.length > 0 ||
    match.common_goals.length > 0;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex gap-4 pt-6">
        <ScoreRing score={score} />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2.5">
            <Link
              href={`/users/${user.id}`}
              className="flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-80"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.avatar_url ?? undefined} alt={user.name} />
                <AvatarFallback className="bg-primary/10 text-xs text-primary">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.grade}
                </p>
              </div>
            </Link>
          </div>

          {user.bio && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {user.bio}
            </p>
          )}

          {hasCommon ? (
            <div className="space-y-1.5">
              <CommonTags
                label={t("connect.commonInterests")}
                tags={match.common_interests}
              />
              <CommonTags
                label={t("connect.commonSkills")}
                tags={match.common_skills}
              />
              <CommonTags
                label={t("connect.commonGoals")}
                tags={match.common_goals}
              />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {t("connect.noOverlap")}
            </p>
          )}

          <Button variant="outline" size="sm" asChild>
            <Link href={`/messages?user=${user.id}`}>
              <MessageCircle className="mr-1 h-4 w-4" />
              {t("connect.message")}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ConnectPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["matches"],
    queryFn: () => fetchMatches(20),
  });

  const profileIncomplete =
    user &&
    user.interests.length === 0 &&
    user.skills.length === 0 &&
    user.goals.length === 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {t("connect.title")}
            </h1>
            <p className="mt-1 text-muted-foreground">{t("connect.desc")}</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/profile">
              <Sparkles className="mr-1 h-4 w-4" />
              {t("connect.editTags")}
            </Link>
          </Button>
        </div>

        {profileIncomplete && (
          <Card className="border-primary/30 bg-accent/50">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
              <p className="text-sm">{t("connect.incomplete")}</p>
              <Button size="sm" asChild>
                <Link href="/profile">{t("connect.goProfile")}</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              {t("connect.loadFail")}
            </CardContent>
          </Card>
        ) : !data || data.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <UserRoundSearch className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-muted-foreground">{t("connect.empty")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.map((match) => (
              <MatchCard key={match.user.id} match={match} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
