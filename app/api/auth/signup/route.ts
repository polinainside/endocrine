import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Регистрация через admin API с email_confirm:true — без писем и лимитов
// (подтверждение почты для прототипа не нужно). Триггер БД сразу наполнит
// нового пользователя демо-данными.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Невалидный запрос." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ message: "Введите корректный email." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ message: "Пароль должен быть не короче 6 символов." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    const msg = error.message || "";
    if (/already|exists|registered/i.test(msg)) {
      return NextResponse.json({ message: "Аккаунт с таким email уже существует. Войдите." }, { status: 409 });
    }
    if (/invalid/i.test(msg) && /email/i.test(msg)) {
      return NextResponse.json({ message: "Этот email не принимается. Попробуйте другой." }, { status: 400 });
    }
    console.error("signup error", error);
    return NextResponse.json({ message: "Не удалось создать аккаунт. Попробуйте ещё раз." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, userId: data.user?.id });
}
