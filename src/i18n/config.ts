export const locales = ["km", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "km";

export const localeNames: Record<Locale, string> = {
  km: "ភាសាខ្មែរ",
  en: "English",
};
