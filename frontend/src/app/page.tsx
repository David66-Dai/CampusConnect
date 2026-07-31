"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  ArrowRight,
  CalendarDays,
  MessageSquare,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import type { MessageKey } from "@/i18n/messages";

const FEATURE_ICONS = [CalendarDays, Users, ShoppingBag, MessageSquare] as const;
const FEATURE_KEYS = [
  { title: "landing.f1t", desc: "landing.f1d" },
  { title: "landing.f2t", desc: "landing.f2d" },
  { title: "landing.f3t", desc: "landing.f3d" },
  { title: "landing.f4t", desc: "landing.f4d" },
] as const satisfies ReadonlyArray<{ title: MessageKey; desc: MessageKey }>;

const STEP_KEYS = [
  { step: "01", title: "landing.s1t", desc: "landing.s1d" },
  { step: "02", title: "landing.s2t", desc: "landing.s2d" },
  { step: "03", title: "landing.s3t", desc: "landing.s3d" },
] as const satisfies ReadonlyArray<{
  step: string;
  title: MessageKey;
  desc: MessageKey;
}>;

export default function LandingPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <BrandLogo />
            Campus<span className="-ml-1 text-primary">Connect</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">{t("auth.login")}</Link>
            </Button>
            <Button asChild>
              <Link href="/register">{t("auth.freeRegister")}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.14),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(56,189,248,0.10),_transparent_45%)]" />
          <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 py-24 text-center sm:py-32">
            <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-sm">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {t("landing.badge")}
            </Badge>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
              {t("landing.hero")}
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              {t("landing.heroDesc")}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/register">
                  {t("landing.explore")}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">{t("landing.hasAccount")}</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              {t("landing.featuresTitle")}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {t("landing.featuresDesc")}
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURE_KEYS.map((feature, index) => {
              const Icon = FEATURE_ICONS[index];
              return (
                <Card
                  key={feature.title}
                  className="border-border/60 transition-shadow hover:shadow-md"
                >
                  <CardHeader>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{t(feature.title)}</CardTitle>
                    <CardDescription className="leading-relaxed">
                      {t(feature.desc)}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="border-y border-border/60 bg-secondary/40">
          <div className="mx-auto w-full max-w-6xl px-6 py-20">
            <h2 className="mb-12 text-center text-3xl font-semibold tracking-tight">
              {t("landing.how")}
            </h2>
            <div className="grid gap-8 sm:grid-cols-3">
              {STEP_KEYS.map((item) => (
                <div key={item.step} className="text-center sm:text-left">
                  <p className="text-4xl font-semibold text-primary/30">
                    {item.step}
                  </p>
                  <h3 className="mt-3 text-lg font-medium">{t(item.title)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t(item.desc)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 py-24 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            {t("landing.ctaTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            {t("landing.ctaDesc")}
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/register">
              {t("auth.freeRegister")}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </section>
      </main>
    </div>
  );
}
