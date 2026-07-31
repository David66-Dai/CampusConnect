"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EventForm } from "@/features/events/event-form";
import { useI18n } from "@/hooks/use-i18n";
import { fetchEventDetail, updateEvent } from "@/services/events";

export default function EditEventPage() {
  const params = useParams<{ id: string }>();
  const eventId = Number(params.id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  const { data: event, isLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => fetchEventDetail(eventId),
    enabled: Number.isFinite(eventId),
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href={`/events/${eventId}`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t("events.backDetail")}
          </Link>
        </Button>

        {isLoading || !event ? (
          <Skeleton className="h-96 w-full" />
        ) : !event.is_creator ? (
          <Card>
            <CardContent className="py-16 text-center text-sm text-muted-foreground">
              {t("events.editForbidden")}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{t("events.edit")}</CardTitle>
              <CardDescription>{t("events.editDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <EventForm
                defaultValues={{
                  title: event.title,
                  description: event.description,
                  category: event.category,
                  location: event.location,
                  date: event.date,
                  time: event.time.slice(0, 5),
                  max_participants: event.max_participants,
                }}
                submitLabel={t("events.save")}
                submittingLabel={t("events.saving")}
                onSubmit={async (values) => {
                  const updated = await updateEvent(eventId, values);
                  queryClient.setQueryData(["event", eventId], updated);
                  await queryClient.invalidateQueries({ queryKey: ["events"] });
                  router.push(`/events/${eventId}`);
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
