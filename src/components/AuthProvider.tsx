"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { useEffect } from "react";

interface AuthProviderProps {
  children: React.ReactNode;
  session?: Session | null;
}

export function AuthProvider({ children, session }: AuthProviderProps) {
  useEffect(() => {
    // Dynamic JS Challenge: Update token every 2 seconds
    // This ensures that static curl requests will expire quickly
    const updateToken = () => {
      const token = btoa(Date.now().toString());
      document.cookie = `kn-client-token=${token}; path=/; max-age=86400; SameSite=Lax`;
    };

    updateToken(); // Initial set
    const interval = setInterval(updateToken, 2000);

    return () => clearInterval(interval);
  }, []);

  return <SessionProvider session={session}>{children}</SessionProvider>;
}
