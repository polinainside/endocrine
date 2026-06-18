import { createClient } from "@supabase/supabase-js";

// Серверный admin-клиент (service_role). НИКОГДА не импортировать в клиентский код.
// Минует RLS — используется только в серверных роутах (например, регистрация).
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
