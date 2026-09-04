"use client";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import { AuthProvider, initAuth } from "../lib/auth";
import { useEffect } from "react";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    void initAuth();
  }, []);

  return (
    <AuthProvider>
      {children}
      <Toaster position="top-right" />
    </AuthProvider>
  );
}
