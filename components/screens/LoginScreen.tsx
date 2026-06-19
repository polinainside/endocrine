"use client";

import { useState } from "react";
import { Activity, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export function LoginScreen() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Берём реальные значения из формы (надёжнее на мобильных, чем только state).
    const fd = new FormData(e.currentTarget);
    const em = (String(fd.get("email") ?? "") || email).trim().toLowerCase();
    const pw = String(fd.get("password") ?? "") || password;

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) {
      setError("Введите корректный email, например anna@gmail.com");
      return;
    }
    if (pw.length < 6) {
      setError("Пароль должен быть не короче 6 символов.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      if (mode === "signup") {
        // Регистрация через серверный роут (admin, без письма), затем вход.
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: em, password: pw }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(body?.message || "Не удалось зарегистрироваться.");
          setBusy(false);
          return;
        }
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: em, password: pw });
      if (signInError) {
        setError(
          /invalid login/i.test(signInError.message)
            ? "Неверный email или пароль."
            : signInError.message,
        );
        setBusy(false);
      }
      // успех → AuthGate сам переключится на приложение
    } catch {
      setError("Нет связи с сервером. Попробуйте ещё раз.");
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col justify-center px-6">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-[20px] bg-brand text-white">
          <Activity className="h-8 w-8" strokeWidth={2.4} />
        </div>
        <h1 className="text-[22px] font-semibold text-ink">Дневник пациента</h1>
        <p className="mt-1 text-[14px] text-muted">
          {mode === "signin" ? "Войдите в свой аккаунт" : "Создайте аккаунт"}
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          type="text"
          name="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 rounded-btn border border-border bg-surface px-4 text-[15px] text-ink outline-none placeholder:text-muted focus:border-brand"
        />
        <input
          type="password"
          name="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-12 rounded-btn border border-border bg-surface px-4 text-[15px] text-ink outline-none placeholder:text-muted focus:border-brand"
        />

        {error && <p className="rounded-btn bg-alarm-soft px-3 py-2 text-[13px] text-alarm">{error}</p>}

        <Button type="submit" disabled={busy} className="mt-1 w-full">
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : mode === "signin" ? (
            "Войти"
          ) : (
            "Зарегистрироваться"
          )}
        </Button>
      </form>

      <button
        onClick={() => {
          setMode((m) => (m === "signin" ? "signup" : "signin"));
          setError("");
        }}
        className="mt-5 text-center text-[14px] text-muted"
      >
        {mode === "signin" ? (
          <>
            Нет аккаунта? <span className="font-medium text-brand-ink">Зарегистрироваться</span>
          </>
        ) : (
          <>
            Уже есть аккаунт? <span className="font-medium text-brand-ink">Войти</span>
          </>
        )}
      </button>

      <p className="mt-6 text-center text-[11px] leading-relaxed text-muted">
        Демо-прототип. После регистрации аккаунт наполнится примерными данными пациента.
      </p>
    </div>
  );
}
