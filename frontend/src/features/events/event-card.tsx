"use client";

import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORY_META } from "@/features/events/constants";
import { useI18n } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";
import type { CampusEvent } from "@/types/event";
import { formatEventDate, formatEventTime, isPastDate } from "@/utils/datetime";

/** 活动卡片：标题、分类、日期、地点、人数 */
export function EventCard({ event }: { event: CampusEvent }) {
  const { t } = useI18n();
  const meta = CATEGORY_META[event.category];
  const past = event.status === "ended" || isPastDate(event.date);
  const full = event.member_count >= event.max_participants;

  return (
    <Link href={`/events/${event.id}`} className="block">
      <Card
        className={cn(
          "h-full transition-shadow hover:shadow-md",
          past && "opacity-60"
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Badge className={cn("border-transparent", meta.className)}>
              {t(`category.${event.category}`)}
            </Badge>
            {event.is_joined && <Badge variant="outline">{t("events.joined")}</Badge>}
            {past && <Badge variant="secondary">{t("events.ended")}</Badge>}
            {!past && full && (
              <Badge variant="secondary">{t("events.full")}</Badge>
            )}
          </div>
          <CardTitle className="line-clamp-2 text-lg leading-snug">
            {event.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0" />
            {formatEventDate(event.date)} · {formatEventTime(event.time)}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{event.location}</span>
          </p>
          <p className="flex items-center gap-2">
            <Users className="h-4 w-4 shrink-0" />
            {t("events.people", {
              n: event.member_count,
              max: event.max_participants,
            })}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
