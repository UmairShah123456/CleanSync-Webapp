"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import clsx from "clsx";
import { Sidebar } from "@/components/layout/Sidebar";
import { Bars3Icon } from "@heroicons/react/24/outline";

export function AppShell({
  children,
  email,
}: {
  children: ReactNode;
  email?: string | null;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleToggleMenu = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#01161E]">
      <div className="flex h-screen flex-col md:flex-row">
        {/* Mobile Menu Button */}
        <button
          onClick={handleToggleMenu}
          className="fixed top-4 right-4 z-[100] md:hidden rounded-lg bg-[#124559]/60 p-2 text-[#EFF6E0] hover:bg-[#124559]/80 active:bg-[#124559]/90 transition-colors shadow-lg cursor-pointer"
          aria-label="Open menu"
          aria-expanded={isMobileMenuOpen}
          type="button"
        >
          <Bars3Icon className="h-6 w-6 pointer-events-none" />
        </button>

        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-[90] bg-black/50 md:hidden"
            onClick={closeMobileMenu}
          />
        )}

        {/* Sidebar */}
        <aside
          className={clsx(
            "fixed inset-y-0 left-0 w-64 transform transition-transform duration-300 ease-in-out",
            "md:relative md:translate-x-0",
            isMobileMenuOpen
              ? "z-[95] translate-x-0"
              : "z-[95] -translate-x-full md:translate-x-0"
          )}
          aria-hidden={!isMobileMenuOpen}
        >
          <Sidebar email={email} onClose={closeMobileMenu} />
        </aside>

        {/* Main Content */}
        <div className="flex flex-1 flex-col">
          <main className="flex-1 overflow-y-auto bg-[#01161E] p-6 md:p-8">
            <div className="space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
