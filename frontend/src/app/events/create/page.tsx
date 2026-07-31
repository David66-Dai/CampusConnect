"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
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
import { EventForm } from "@/features/events/event-form";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { createEvent } from "@/services/events";

export default function CreateEventPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  const { t } = useI18n();

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/events">
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t("events.backList")}
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t("events.create")}</CardTitle>
            <CardDescription>{t("events.createDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <EventForm
              submitLabel={t("events.create")}
              submittingLabel={t("events.creating")}
              onSubmit={async (values) => {
                const event = await createEvent(values);
                await queryClient.invalidateQueries({ queryKey: ["events"] });
                await refreshUser();
                router.push(`/events/${event.id}`);
              }}
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
