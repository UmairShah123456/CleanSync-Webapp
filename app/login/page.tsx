import { redirect } from "next/navigation";
import { getServerSupabaseClient } from "@/lib/db";
import { AuthContainer } from "@/components/layout/AuthContainer";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthContainer
      title="Welcome back"
      subtitle="Sign in to keep your turnovers in sync"
    >
      <LoginForm />
    </AuthContainer>
  );
}
