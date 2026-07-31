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

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  remember_me: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
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
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember_me: true },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await login({
        email: values.email,
        password: values.password,
        remember_me: values.remember_me,
      });
      router.push("/dashboard");
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  });

  if (isLoading || isAuthenticated) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        {t("common.loading")}
      </main>
    );
  }

  return (
    <main className="relative flex flex-1 items-center justify-center px-4 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.12),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(56,189,248,0.08),_transparent_45%)]" />
      <Card className="relative z-10 w-full max-w-md border-border/60 shadow-sm">
        <CardHeader className="space-y-2 text-center">
          <Link href="/" className="text-sm font-medium text-primary">
            CampusConnect
          </Link>
          <CardTitle className="text-2xl tracking-tight">
            {t("auth.welcomeBack")}
          </CardTitle>
          <CardDescription>{t("auth.loginDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit} noValidate>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-primary"
                >
                  {t("auth.forgot")}
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-input accent-primary"
                {...register("remember_me")}
              />
              {t("auth.remember")}
            </label>
            {serverError && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {serverError}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t("auth.loggingIn") : t("auth.login")}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          {t("auth.noAccount")}
          <Link href="/register" className="ml-1 font-medium text-primary">
            {t("auth.signUpNow")}
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
