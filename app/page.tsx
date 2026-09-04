"use client";

import Background from "@/components/Background";
import Onboarding from "@/components/Onboarding";
import Browse from "@/components/Browse";
import { AuthProvider, useAuth } from "@/lib/auth";

function Shell() {
  const { token } = useAuth();
  return (
    <>
      <Background />
      {token ? <Browse /> : <Onboarding />}
    </>
  );
}

export default function HomePage() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}