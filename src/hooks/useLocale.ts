"use client";

import { useCallback, useTransition } from "react";
import { useLocale as useNextIntlLocale } from "next-intl";
import { locales, type Locale } from "@/i18n/config";

export function useLocale() {
  const locale = useNextIntlLocale() as Locale;
  const [isPending, startTransition] = useTransition();

  const setLocale = useCallback((newLocale: Locale) => {
    startTransition(() => {
      // Set the cookie
      document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;
      // Reload to apply the new locale
      window.location.reload();
    });
  }, []);

  const toggleLocale = useCallback(() => {
    const currentIndex = locales.indexOf(locale);
    const nextIndex = (currentIndex + 1) % locales.length;
    setLocale(locales[nextIndex]);
  }, [locale, setLocale]);

  return {
    locale,
    locales,
    setLocale,
    toggleLocale,
    isPending,
  };
}
