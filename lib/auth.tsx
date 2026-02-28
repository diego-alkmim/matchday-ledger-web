"use client";
import React from "react";
import { create } from "zustand";
import api from "../app/api-client";
import { toast } from "sonner";

type User = {
  id: string;
  email: string;
  role: "ADMIN" | "DIRETOR";
  directorId?: string;
};
type State = {
  user?: User;
  accessToken?: string;
  csrfToken?: string;
  hydrated: boolean;
  setSession: (u: User, t: string, csrf: string) => void;
  clear: () => void;
  setHydrated: (v: boolean) => void;
  setCsrf: (v?: string) => void;
};

const store = create<State>((set) => ({
  hydrated: false,
  setSession: (user, token, csrf) =>
    set({ user, accessToken: token, csrfToken: csrf, hydrated: true }),
  clear: () =>
    set({
      user: undefined,
      accessToken: undefined,
      csrfToken: undefined,
      hydrated: true,
    }),
  setHydrated: (v) => set({ hydrated: v }),
  setCsrf: (v) => set({ csrfToken: v }),
}));

export const getAccessToken = () => store.getState().accessToken;
export const getCsrfToken = () => store.getState().csrfToken;

export async function login(email: string, password: string) {
  try {
    const resp = await api.post("/auth/login", { email, password });
    const csrf = resp.data.data?.csrfToken as string | undefined;
    if (csrf) sessionStorage.setItem("csrf_token", csrf);
    store
      .getState()
      .setSession(resp.data.data.user, resp.data.data.accessToken, csrf || "");
    toast.success("Bem-vindo(a) de volta!");
  } catch (e: any) {
    const msg = e?.response?.data?.message || "Credenciais inválidas";
    toast.error(msg);
    throw e;
  }
}

export async function refreshSession() {
  const csrf =
    store.getState().csrfToken || sessionStorage.getItem("csrf_token") || "";
  if (!csrf) throw new Error("Missing CSRF for refresh");
  const resp = await api.post(
    "/auth/refresh",
    { csrfToken: csrf },
    { headers: { "x-csrf-token": csrf } },
  );
  const newCsrf = resp.data.data?.csrfToken as string | undefined;
  if (newCsrf) sessionStorage.setItem("csrf_token", newCsrf);
  store
    .getState()
    .setSession(
      resp.data.data.user,
      resp.data.data.accessToken,
      newCsrf || csrf,
    );
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } catch (e: any) {
    // Se a API estiver offline, ainda encerramos a sessão localmente
    toast.warning("Conexão indisponível. Sessão encerrada apenas no dispositivo.");
  } finally {
    store.getState().clear();
    sessionStorage.removeItem("csrf_token");
  }
}

export const useAuth = store;

export async function initAuth() {
  const { hydrated, setHydrated } = store.getState();
  if (hydrated) return;
  const storedCsrf = sessionStorage.getItem("csrf_token") || undefined;
  if (storedCsrf) store.getState().setCsrf(storedCsrf);
  try {
    await refreshSession();
  } catch {
    store.getState().clear();
  } finally {
    setHydrated(true);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
