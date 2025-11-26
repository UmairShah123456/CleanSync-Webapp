import { redirect } from "next/navigation";
import { getServerSupabaseClient } from "@/lib/db";
import { AuthContainer } from "@/components/layout/AuthContainer";
import { ResetPasswordForm } from "./ResetPasswordForm";

export default async function ResetPasswordPage() {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthContainer
      title="Reset your password"
      subtitle="Enter your email to receive a password reset link"
    >
      <ResetPasswordForm />
    </AuthContainer>
  );
}
