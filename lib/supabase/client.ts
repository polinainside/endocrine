import { createClient } from "@supabase/supabase-js";

// Браузерный клиент (anon-ключ + пользовательская сессия). Все запросы идут под
// RLS — пользователь видит только свои строки. Сессия хранится в localStorage.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } },
);
