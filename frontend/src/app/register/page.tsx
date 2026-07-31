"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { getApiErrorMessage } from "@/lib/api";
import { CAMPUS_NAME } from "@/lib/campus";

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  grade: z.string().min(1).max(50),
  interests: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isAuthenticated, isLoading } = useAuth();
  const { t } = useI18n();
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      grade: "",
      interests: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      const interests = (values.interests ?? "")
        .split(/[,，]/)
        .map((item) => item.trim())
        .filter(Boolean);

      await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
        school: CAMPUS_NAME,
        grade: values.grade,
        interests,
      });
      router.push("/dashboard");
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  });

  return (
    <main className="relative flex flex-1 items-center justify-center px-4 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.12),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(16,185,129,0.08),_transparent_45%)]" />
      <Card className="relative z-10 w-full max-w-lg border-border/60 shadow-sm">
        <CardHeader className="space-y-2 text-center">
          <Link href="/" className="text-sm font-medium text-primary">
            CampusConnect
          </Link>
          <CardTitle className="text-2xl tracking-tight">
            {t("auth.registerTitle")}
          </CardTitle>
          <CardDescription>{t("auth.registerDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{t("auth.name")}</Label>
                <Input id="name" placeholder="Alex" {...register("name")} />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">{t("auth.grade")}</Label>
                <Input
                  id="grade"
                  placeholder={t("auth.gradePlaceholder")}
                  {...register("grade")}
                />
                {errors.grade && (
                  <p className="text-sm text-destructive">
                    {errors.grade.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@school.edu"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder={t("auth.passwordHint")}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="interests">{t("auth.interests")}</Label>
              <Input
                id="interests"
                placeholder={t("auth.interestsPlaceholder")}
                {...register("interests")}
              />
              <p className="text-xs text-muted-foreground">
                {t("auth.interestsHint")}
              </p>
            </div>

            {serverError && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {serverError}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t("auth.registering") : t("auth.registerCta")}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          {t("auth.hasAccount")}
          <Link href="/login" className="ml-1 font-medium text-primary">
            {t("auth.goLogin")}
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
