"use client";

import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/hooks/use-i18n";
import { getApiErrorMessage } from "@/lib/api";
import { EVENT_CATEGORIES } from "@/types/event";

export type EventFormValues = {
  title: string;
  description: string;
  category: (typeof EVENT_CATEGORIES)[number];
  location: string;
  date: string;
  time: string;
  max_participants: number;
};

type EventFormProps = {
  defaultValues?: Partial<EventFormValues>;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (values: EventFormValues) => Promise<void>;
};

/** 活动表单：创建与编辑页共用 */
export function EventForm({
  defaultValues,
  submitLabel,
  submittingLabel,
  onSubmit,
}: EventFormProps) {
  const { t } = useI18n();
  const [serverError, setServerError] = useState<string | null>(null);

  const eventSchema = useMemo(
    () =>
      z.object({
        title: z.string().min(1, t("events.form.errTitle")).max(200),
        description: z.string().min(1, t("events.form.errDesc")).max(5000),
        category: z.enum(EVENT_CATEGORIES, {
          message: t("events.form.errCategory"),
        }),
        location: z.string().min(1, t("events.form.errLocation")).max(200),
        date: z.string().min(1, t("events.form.errDate")),
        time: z.string().min(1, t("events.form.errTime")),
        max_participants: z
          .number({ message: t("events.form.errMax") })
          .int(t("events.form.errInt"))
          .min(2, t("events.form.errMin"))
          .max(10000, t("events.form.errMaxTooMany")),
      }),
    [t]
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      date: "",
      time: "",
      ...defaultValues,
    },
  });

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  });

  return (
    <form className="space-y-5" onSubmit={submit} noValidate>
      <div className="space-y-2">
        <Label htmlFor="title">{t("events.form.title")}</Label>
        <Input
          id="title"
          placeholder={t("events.form.titlePh")}
          {...register("title")}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("events.form.desc")}</Label>
        <Textarea
          id="description"
          rows={5}
          placeholder={t("events.form.descPh")}
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("events.form.category")}</Label>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t("events.form.categoryPh")} />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_CATEGORIES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {t(`category.${item}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.category && (
            <p className="text-sm text-destructive">{errors.category.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_participants">{t("events.form.max")}</Label>
          <Input
            id="max_participants"
            type="number"
            min={2}
            placeholder={t("events.form.maxPh")}
            {...register("max_participants", { valueAsNumber: true })}
          />
          {errors.max_participants && (
            <p className="text-sm text-destructive">
              {errors.max_participants.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">{t("events.form.location")}</Label>
        <Input
          id="location"
          placeholder={t("events.form.locationPh")}
          {...register("location")}
        />
        {errors.location && (
          <p className="text-sm text-destructive">{errors.location.message}</p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">{t("events.form.date")}</Label>
          <Input id="date" type="date" {...register("date")} />
          {errors.date && (
            <p className="text-sm text-destructive">{errors.date.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">{t("events.form.time")}</Label>
          <Input id="time" type="time" {...register("time")} />
          {errors.time && (
            <p className="text-sm text-destructive">{errors.time.message}</p>
          )}
        </div>
      </div>

      {serverError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? submittingLabel : submitLabel}
      </Button>
    </form>
  );
}
