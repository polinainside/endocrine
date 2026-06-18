"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { DataProvider } from "@/components/data/DataProvider";
import { LoginScreen } from "@/components/screens/LoginScreen";

type State = { kind: "loading" } | { kind: "out" } | { kind: "in"; userId: string };

// Решает: показать вход или приложение. Слушает изменения сессии Supabase.
export function AuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setState(data.session ? { kind: "in", userId: data.session.user.id } : { kind: "out" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(session ? { kind: "in", userId: session.user.id } : { kind: "out" });
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (state.kind === "loading") {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  if (state.kind === "out") return <LoginScreen />;

  return <DataProvider userId={state.userId}>{children}</DataProvider>;
}
