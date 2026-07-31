"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarPlus, CalendarX } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EventCard } from "@/features/events/event-card";
import { useI18n } from "@/hooks/use-i18n";
import { cn } from "@/lib/utils";
import { fetchEvents } from "@/services/events";
import { EVENT_CATEGORIES, type EventCategory } from "@/types/event";

type CategoryFilter = EventCategory | "All";

export default function EventsPage() {
  const { t } = useI18n();
  const [category, setCategory] = useState<CategoryFilter>("All");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["events", category],
    queryFn: () =>
      fetchEvents(category === "All" ? undefined : { category }),
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {t("events.title")}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {t("events.desc")}
            </p>
          </div>
          <Button asChild>
            <Link href="/events/create">
              <CalendarPlus className="mr-1 h-4 w-4" />
              {t("events.create")}
            </Link>
          </Button>
        </div>

        {/* 分类筛选 */}
        <div className="flex flex-wrap gap-2">
          {(["All", ...EVENT_CATEGORIES] as CategoryFilter[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                category === item
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {item === "All" ? t("common.all") : t(`category.${item}`)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              {t("events.loadFail")}
            </CardContent>
          </Card>
        ) : !data || data.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <CalendarX className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                {category === "All"
                  ? t("events.empty")
                  : t("events.emptyCategory")}
              </p>
              <Button asChild variant="outline">
                <Link href="/events/create">{t("events.create")}</Link>
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
      </div>
    </AppShell>
  );
}
