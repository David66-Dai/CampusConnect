"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark";
export type Locale = "zh" | "en";
export type FontSize = "sm" | "md" | "lg";

type Preferences = {
  theme: ThemeMode;
  locale: Locale;
  fontSize: FontSize;
};

type PreferencesContextValue = Preferences & {
  setTheme: (theme: ThemeMode) => void;
  setLocale: (locale: Locale) => void;
  setFontSize: (size: FontSize) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = "campusconnect_preferences";

const DEFAULTS: Preferences = {
  theme: "light",
  locale: "zh",
  fontSize: "md",
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function readStored(): Preferences {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      theme: parsed.theme === "dark" ? "dark" : "light",
      locale: parsed.locale === "en" ? "en" : "zh",
      fontSize:
        parsed.fontSize === "sm" || parsed.fontSize === "lg"
          ? parsed.fontSize
          : "md",
    };
  } catch {
    return DEFAULTS;
  }
}

function applyDom(prefs: Preferences) {
  const root = document.documentElement;
  root.classList.toggle("dark", prefs.theme === "dark");
  root.lang = prefs.locale === "en" ? "en" : "zh-CN";
  root.dataset.fontSize = prefs.fontSize;
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStored();
    setPrefs(stored);
    applyDom(stored);
    setReady(true);
  }, []);

  const update = useCallback((patch: Partial<Preferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      applyDom(next);
      return next;
    });
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      ...prefs,
      setTheme: (theme) => update({ theme }),
      setLocale: (locale) => update({ locale }),
      setFontSize: (fontSize) => update({ fontSize }),
      toggleTheme: () =>
        update({ theme: prefs.theme === "dark" ? "light" : "dark" }),
    }),
    [prefs, update]
  );

  // 避免 hydration 闪烁：未就绪时仍渲染，DOM 类在 effect 后同步
  if (!ready) {
    return (
      <PreferencesContext.Provider value={value}>
        {children}
      </PreferencesContext.Provider>
    );
  }

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return ctx;
}
