"use client";

import { useI18n } from "@/hooks/use-i18n";

/** 全站页脚版权 */
export function SiteFooter() {
  const { t } = useI18n();

  return (
    <footer className="mt-auto border-t border-border/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <p>{t("common.copyright")}</p>
        <p>{t("landing.footer")}</p>
      </div>
    </footer>
  );
}
