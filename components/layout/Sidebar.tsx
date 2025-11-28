"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { useState, useEffect } from "react";
import Image from "next/image";
import {
  HomeIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/schedule", label: "Schedule", icon: CalendarIcon },
  { href: "/properties", label: "Properties", icon: BuildingOfficeIcon },
  { href: "/cleaners", label: "Cleaners", icon: UserGroupIcon },
  { href: "/logs", label: "Logs", icon: ChartBarIcon },
  // { href: "/settings", label: "Settings", icon: Cog6ToothIcon }, // Temporarily hidden
];

export function Sidebar({
  email,
  userName,
  onClose,
}: {
  email?: string | null;
  userName?: string | null;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    if (onClose) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside className="h-full w-64 flex-shrink-0 bg-gradient-to-b from-[#01161E] to-[#124559] p-6 flex flex-col md:relative">
      {/* Mobile Close Button */}
      <button
        onClick={onClose}
        className="mb-6 md:hidden self-end rounded-lg p-2 text-[#EFF6E0]/70 hover:bg-[#124559]/40 hover:text-[#EFF6E0] transition-colors"
        aria-label="Close menu"
      >
        <XMarkIcon className="h-6 w-6" />
      </button>
      {/* Logo Section */}
      <div className="mb-8 flex items-end gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#124559]/50">
          <Image
            src="/staysync-logo.svg"
            alt="CleanSync logo"
            width={26}
            height={26}
          />
        </div>
        <Image src="/CleanSync.svg" alt="CleanSync" width={143} height={29} />
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const active = pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className={clsx(
                "group flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-all duration-200",
                active
                  ? "bg-[#124559]/70 text-[#EFF6E0]"
                  : "text-[#EFF6E0]/70 hover:bg-[#124559]/40 hover:text-[#EFF6E0]"
              )}
            >
              <Icon
                className={clsx(
                  "h-6 w-6 transition-transform duration-200 group-hover:scale-110",
                  active ? "text-[#EFF6E0]" : "text-[#EFF6E0]/70"
                )}
              />
              <span
                className={clsx(
                  active
                    ? "text-[#EFF6E0]"
                    : "text-[#EFF6E0]/70 group-hover:text-[#EFF6E0]"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Items */}
      <div className="mt-auto space-y-1">
        {/* Demo Widget */}
        <button
          onClick={() => window.open("https://app.storylane.io/share/07jkbpodtmxn", "_blank", "noopener,noreferrer")}
          className="w-full mb-4 rounded-lg border-2 border-[#598392]/40 bg-gradient-to-r from-[#124559]/60 to-[#598392]/40 px-4 py-3 text-center font-semibold text-[#EFF6E0] shadow-md transition-all duration-200 hover:border-[#598392]/60 hover:shadow-lg hover:scale-[1.02] active:scale-95"
        >
          Demo
        </button>
        {/* User Avatar Section */}
        <div className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-[#598392] flex items-center justify-center text-sm font-semibold text-[#EFF6E0]">
            {userName ? userName.charAt(0).toUpperCase() : email ? email.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[#EFF6E0]">
              {userName || email?.split("@")[0] || "User"}
            </span>
            <span className="text-xs text-[#EFF6E0]/70">Manager</span>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="mt-2 w-full rounded-lg px-4 py-3 text-left text-base font-medium text-[#EFF6E0]/70 transition-colors duration-200 hover:bg-[#124559]/40 hover:text-[#EFF6E0] disabled:opacity-50 flex items-center gap-3"
        >
          <ArrowRightOnRectangleIcon className="h-6 w-6" />
          {signingOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </aside>
  );
}
