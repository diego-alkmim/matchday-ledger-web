"use client";
import React from "react";
import { create } from "zustand";
import api from "../app/api-client";
import { toast } from "sonner";
import { ApiEnvelope } from "./api-types";

export type TeamAccess = {
  id: string;
  name: string;
  slug: string;
  role: "ADMIN" | "DIRETOR";
};

export type User = {
  id: string;
  email: string;
  role: "ADMIN" | "DIRETOR";
  directorId?: string | null;
  team: Omit<TeamAccess, "role">;
  teams: TeamAccess[];
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

type AuthSession = {
  user: User;
  accessToken: string;
  csrfToken?: string;
};

export type TeamSelection = {
  requiresTeamSelection: true;
  teamSelectionToken: string;
  teams: TeamAccess[];
};

type LoginResponse = AuthSession | TeamSelection;

const store = create<State>((set) => ({
  hydrated: false,
  setSession: (user, token, csrf) =>
    set({ user, accessToken: token, csrfToken: csrf, hydrated: true }),
  clear: () =>
    set({ user: undefined, accessToken: undefined, csrfToken: undefined, hydrated: true }),
  setHydrated: (v) => set({ hydrated: v }),
  setCsrf: (v) => set({ csrfToken: v }),
}));

export const getAccessToken = () => store.getState().accessToken;
export const getCsrfToken = () => store.getState().csrfToken;

function applySession(session: AuthSession) {
  const csrf = session.csrfToken || "";
  if (csrf) sessionStorage.setItem("csrf_token", csrf);
  store.getState().setSession(session.user, session.accessToken, csrf);
}

export async function login(email: string, password: string, turnstileToken: string) {
  const response = await api.post<ApiEnvelope<LoginResponse>>("/auth/login", {
    email,
    password,
    turnstileToken,
  });
  const result = response.data.data;
  if ("teamSelectionToken" in result) return result;

  applySession(result);
  toast.success("Bem-vindo(a) de volta!");
  return null;
}

export async function selectTeam(selection: TeamSelection, teamId: string) {
  const response = await api.post<ApiEnvelope<AuthSession>>("/auth/select-team", {
    teamId,
    teamSelectionToken: selection.teamSelectionToken,
  });
  applySession(response.data.data);
  toast.success(`Time ${response.data.data.user.team.name} selecionado.`);
}

export async function switchTeam(teamId: string) {
  const response = await api.post<ApiEnvelope<AuthSession>>("/auth/switch-team", { teamId });
  applySession(response.data.data);
}

export async function refreshSession() {
  const csrf = store.getState().csrfToken || sessionStorage.getItem("csrf_token") || "";
  if (!csrf) throw new Error("Missing CSRF for refresh");
  const response = await api.post<ApiEnvelope<AuthSession>>(
    "/auth/refresh",
    { csrfToken: csrf },
    { headers: { "x-csrf-token": csrf } },
  );
  const session = response.data.data;
  applySession({ ...session, csrfToken: session.csrfToken || csrf });
}

export async function logout(
  { notifyOnNetworkError = true }: { notifyOnNetworkError?: boolean } = {},
) {
  try {
    await api.post("/auth/logout");
  } catch {
    if (notifyOnNetworkError) {
      toast.warning("Conexão indisponível. Sessão encerrada apenas no dispositivo.");
    }
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
