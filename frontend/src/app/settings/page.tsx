"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/hooks/use-i18n";
import {
  usePreferences,
  type FontSize,
  type Locale,
  type ThemeMode,
} from "@/hooks/use-preferences";
import { cn } from "@/lib/utils";

function OptionGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={value === option.value ? "default" : "outline"}
            className={cn(value === option.value && "pointer-events-none")}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { t } = useI18n();
  const {
    theme,
    locale,
    fontSize,
    setTheme,
    setLocale,
    setFontSize,
  } = usePreferences();

  return (
    <AppShell>
      <div className="mx-auto max-w-xl space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t("settings.title")}
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>{t("settings.appearance")}</CardTitle>
            <CardDescription>{t("settings.appearanceDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <OptionGroup<ThemeMode>
              label={t("settings.theme")}
              value={theme}
              onChange={setTheme}
              options={[
                { value: "light", label: t("settings.themeLight") },
                { value: "dark", label: t("settings.themeDark") },
              ]}
            />

            <OptionGroup<FontSize>
              label={t("settings.fontSize")}
              value={fontSize}
              onChange={setFontSize}
              options={[
                { value: "sm", label: t("settings.fontSm") },
                { value: "md", label: t("settings.fontMd") },
                { value: "lg", label: t("settings.fontLg") },
              ]}
            />

            <OptionGroup<Locale>
              label={t("settings.language")}
              value={locale}
              onChange={setLocale}
              options={[
                { value: "zh", label: t("settings.langZh") },
                { value: "en", label: t("settings.langEn") },
              ]}
            />

            <p className="text-xs text-muted-foreground">{t("settings.hint")}</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
