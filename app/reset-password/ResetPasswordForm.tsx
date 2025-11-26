"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

export function ResetPasswordForm() {
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      setLoading(false);

      if (error) {
        console.error("Password reset error:", error);
        setError(error.message);
        return;
      }

      console.log("Password reset email sent successfully", data);
      setSuccess(true);
      setEmail("");
    } catch (err) {
      setLoading(false);
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {success ? (
        <div className="rounded-lg bg-green-500/20 border border-green-500/50 p-4 text-sm text-green-300">
          <p className="font-medium mb-1">Check your email</p>
          <p>
            We've sent you a password reset link. Please check your inbox and
            follow the instructions to reset your password.
          </p>
        </div>
      ) : (
        <>
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
            <p className="text-xs text-[#EFF6E0]/60 mt-1">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
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
            {loading ? "Sending reset link..." : "Send reset link"}
          </button>
        </>
      )}
      <p className="text-sm text-center text-[#EFF6E0]/70">
        Remember your password?{" "}
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
