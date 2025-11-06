"use client";

import { useLanguage } from "@/lib/contexts/LanguageContext";
import { languageNames, type Language } from "@/lib/translations/cleanerPortal";
import { GlobeAltIcon } from "@heroicons/react/24/outline";
import { useState, useRef, useEffect } from "react";

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages: Language[] = ["en", "es", "ro", "pt-BR", "hi"];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-[#124559]/60 bg-[#01161E]/60 px-4 py-2 text-sm text-[#EFF6E0] transition-colors hover:bg-[#124559]/40 focus:outline-none focus:ring-2 focus:ring-[#598392]"
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <GlobeAltIcon className="h-4 w-4" />
        <span className="hidden sm:inline">{languageNames[language]}</span>
        <span className="sm:hidden">{language.toUpperCase()}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-[#124559]/60 bg-[#01161E] shadow-xl">
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => {
                  setLanguage(lang);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                  language === lang
                    ? "bg-[#124559]/60 text-[#EFF6E0]"
                    : "text-[#EFF6E0]/80 hover:bg-[#124559]/40"
                }`}
              >
                {languageNames[lang]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
