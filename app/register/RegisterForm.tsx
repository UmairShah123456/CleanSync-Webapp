"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export function RegisterForm() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Check your inbox to confirm your email.");
    setTimeout(() => router.replace("/login"), 2000);
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2" suppressHydrationWarning>
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
      <div className="space-y-2" suppressHydrationWarning>
        <label
          className="text-sm font-medium text-[#EFF6E0]/80"
          htmlFor="password"
        >
          Password
        </label>
        <div className="relative" suppressHydrationWarning>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 6 characters"
            required
            suppressHydrationWarning
            className="w-full rounded-lg border border-[#124559]/50 bg-[#124559]/60 px-4 py-2.5 pr-10 text-sm text-[#EFF6E0] placeholder:text-[#EFF6E0]/50 focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392] transition-colors duration-200"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#EFF6E0]/70 hover:text-[#EFF6E0] transition-colors duration-200"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
      <div className="space-y-2" suppressHydrationWarning>
        <label
          className="text-sm font-medium text-[#EFF6E0]/80"
          htmlFor="confirm-password"
        >
          Confirm Password
        </label>
        <div className="relative" suppressHydrationWarning>
          <input
            id="confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm your password"
            required
            suppressHydrationWarning
            className="w-full rounded-lg border border-[#124559]/50 bg-[#124559]/60 px-4 py-2.5 pr-10 text-sm text-[#EFF6E0] placeholder:text-[#EFF6E0]/50 focus:border-[#598392] focus:outline-none focus:ring-2 focus:ring-[#598392] transition-colors duration-200"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#EFF6E0]/70 hover:text-[#EFF6E0] transition-colors duration-200"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
      {error ? (
        <div className="rounded-lg bg-red-500/20 border border-red-500/50 p-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/50 p-3 text-sm text-emerald-300">
          {message}
        </div>
      ) : null}
      <button
        type="submit"
        className="w-full rounded-lg bg-gradient-to-r from-[#124559] to-[#598392] px-4 py-2.5 text-sm font-medium text-[#EFF6E0] shadow-md transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        disabled={loading}
      >
        {loading ? "Signing up..." : "Create account"}
      </button>
      <p className="text-sm text-center text-[#EFF6E0]/70">
        Already have an account?{" "}
        <a
          className="font-medium text-[#598392] hover:text-[#598392]/80 transition-colors duration-200"
          href="/login"
        >
          Sign in
        </a>
      </p>
    </form>
  );
}
