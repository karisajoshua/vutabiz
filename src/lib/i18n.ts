import { useState, useEffect } from "react";
import { translations, type Language, type TranslationKey } from "./translations";

const STORAGE_KEY = "sokonyumbani_lang";

export function useLanguage() {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (stored === "en" || stored === "sw") {
        setLangState(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  const setLanguage = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      document.documentElement.lang = newLang;
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent("languagechange", { detail: newLang }));
  };

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<Language>;
      if (custom.detail) setLangState(custom.detail);
    };
    window.addEventListener("languagechange", handler);
    return () => window.removeEventListener("languagechange", handler);
  }, []);

  const t = (key: TranslationKey): string => {
    return (translations[lang] as Record<string, string>)?.[key] ?? (translations.en as Record<string, string>)[key] ?? key;
  };

  return { lang, setLanguage, t };
}
