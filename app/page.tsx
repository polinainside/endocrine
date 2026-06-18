"use client";

import { PhoneFrame } from "@/components/PhoneFrame";
import { AuthGate } from "@/components/auth/AuthGate";
import { AppShell } from "@/components/AppShell";

export default function Page() {
  return (
    <PhoneFrame>
      <AuthGate>
        <AppShell />
      </AuthGate>
    </PhoneFrame>
  );
}
