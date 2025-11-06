"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { Language } from "@/lib/translations/cleanerPortal";
import {
  getTranslations,
  type Translations,
} from "@/lib/translations/cleanerPortal";

const LANGUAGE_STORAGE_KEY = "cleaner-portal-language";

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Translations;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") {
      return "en";
    }
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && ["en", "es", "ro", "pt-BR", "hi"].includes(stored)) {
      return stored as Language;
    }
    return "en";
  });

  const setLanguage = useCallback((newLanguage: Language) => {
    setLanguageState(newLanguage);
    if (typeof window !== "undefined") {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
    }
  }, []);

  const t = getTranslations(language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
