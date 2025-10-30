"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useState } from "react";

export function Topbar({ email }: { email?: string | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <header className="flex items-center justify-between border-b border-[#124559]/30 bg-[#01161E] px-4 lg:px-5 py-4">
      <div>
        <h1 className="text-lg font-semibold text-[#EFF6E0]">CleanSync</h1>
        <p className="text-sm text-[#EFF6E0]/70">
          Automated turnovers for your rentals
        </p>
      </div>
      <div className="flex items-center gap-3 text-sm text-[#EFF6E0]/70">
        {email ? (
          <span className="hidden text-[#EFF6E0]/70 md:block">{email}</span>
        ) : null}
        <Button
          variant="ghost"
          onClick={handleSignOut}
          disabled={loading}
          className="text-[#EFF6E0]/70 hover:text-[#EFF6E0]"
        >
          {loading ? "Signing out..." : "Sign out"}
        </Button>
      </div>
    </header>
  );
}
