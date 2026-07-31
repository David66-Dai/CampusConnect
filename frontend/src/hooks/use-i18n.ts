"use client";

import { useCallback } from "react";

import { usePreferences } from "@/hooks/use-preferences";
import { translate, type MessageKey } from "@/i18n/messages";

export function useI18n() {
  const { locale } = usePreferences();

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) =>
      translate(locale, key, vars),
    [locale]
  );

  return { t, locale };
}
