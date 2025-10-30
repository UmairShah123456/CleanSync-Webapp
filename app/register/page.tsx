import { redirect } from "next/navigation";
import { getServerSupabaseClient } from "@/lib/db";
import { AuthContainer } from "@/components/layout/AuthContainer";
import { RegisterForm } from "./RegisterForm";

export default async function RegisterPage() {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthContainer
      title="Create your account"
      subtitle="Connect your properties and schedule automated cleans."
    >
      <RegisterForm />
    </AuthContainer>
  );
}
