import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let serviceClient: SupabaseClient | null = null;

const ensureEnv = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL or anon key not configured.");
  }
};

export const getServerSupabaseClient = async (): Promise<SupabaseClient> => {
  ensureEnv();

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
    },
  });
};

export const getServiceSupabaseClient = (): SupabaseClient => {
  ensureEnv();

  if (!serviceRoleKey) {
    throw new Error("Supabase service role key is not defined.");
  }

  if (!serviceClient) {
    serviceClient = createClient(supabaseUrl!, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return serviceClient;
};
