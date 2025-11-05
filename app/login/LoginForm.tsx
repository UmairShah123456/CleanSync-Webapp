"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export function LoginForm() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.replace("/dashboard");
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label
          className="text-sm font-medium text-[#EFF6E0]/80"
          htmlFor="email"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
          suppressHydrationWarning
          className="w-full rounded-lg border border-[#124559]/50 bg-[#124559]/60 px-4 py-2.5 text-sm text-[#EFF6E0] placeholder:text-[#EFF6E0]/50 focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392] transition-colors duration-200"
        />
      </div>
      <div className="space-y-2">
        <label
          className="text-sm font-medium text-[#EFF6E0]/80"
          htmlFor="password"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          required
          suppressHydrationWarning
          className="w-full rounded-lg border border-[#124559]/50 bg-[#124559]/60 px-4 py-2.5 text-sm text-[#EFF6E0] placeholder:text-[#EFF6E0]/50 focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392] transition-colors duration-200"
        />
      </div>
      {error ? (
        <div className="rounded-lg bg-red-500/20 border border-red-500/50 p-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}
      <button
        type="submit"
        className="w-full rounded-lg bg-gradient-to-r from-[#124559] to-[#598392] px-4 py-2.5 text-sm font-medium text-[#EFF6E0] shadow-md transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        disabled={loading}
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
      <p className="text-sm text-center text-[#EFF6E0]/70">
        Need an account?{" "}
        <a
          className="font-medium text-[#598392] hover:text-[#598392]/80 transition-colors duration-200"
          href="/register"
        >
          Sign up
        </a>
      </p>
    </form>
  );
}
