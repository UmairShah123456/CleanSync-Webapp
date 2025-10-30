import { redirect } from "next/navigation";
import { getServerSupabaseClient } from "@/lib/db";

export default async function Home() {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  redirect("/login");
}
