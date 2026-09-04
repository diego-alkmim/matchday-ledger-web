"use client";
import { useEffect, useMemo, useState } from "react";
import api from "../api-client";
import { ProtectedPage } from "../../components/nav/sidebar";
import { toast } from "sonner";
import { useAuth } from "../../lib/auth";
import { ApiEnvelope, getApiErrorMessage } from "../../lib/api-types";

type Role = "ADMIN" | "DIRETOR";
type Director = { id: string; name: string };

export default function UsuariosPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [directors, setDirectors] = useState<Director[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "DIRETOR" as Role,
    directorId: "",
  });

  const canSubmit = useMemo(
    () => form.email.trim().length > 0 && form.password.trim().length >= 8,
    [form.email, form.password],
  );

  useEffect(() => {
    if (!isAdmin) return;
    api
      .get<ApiEnvelope<Director[]>>("/directors")
      .then((resp) => setDirectors(resp.data.data || []))
      .catch(() => toast.error("Erro ao carregar diretores"));
  }, [isAdmin]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!canSubmit) {
      toast.error("Preencha e-mail e senha (mÃ­nimo 8 caracteres)");
      return;
    }
    try {
      setLoading(true);
      await api.post("/users", form);
      toast.success("UsuÃ¡rio criado com sucesso");
      setForm({ email: "", password: "", role: "DIRETOR", directorId: "" });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao criar usuário"));
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <ProtectedPage>
        <div className="text-slate-200">Acesso restrito a administradores.</div>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <div className="max-w-xl rounded bg-slate-900 border border-slate-800 p-4 space-y-4">
        <h1 className="text-xl font-semibold text-white">Criar usuÃ¡rio</h1>
        <form className="space-y-3" onSubmit={(event) => void submit(event)}>
          <input
            className="w-full rounded bg-slate-800 px-3 py-2 text-slate-100"
            placeholder="E-mail"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            type="email"
          />
          <input
            className="w-full rounded bg-slate-800 px-3 py-2 text-slate-100"
            placeholder="Senha (mÃ­n. 8 caracteres)"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select
              className="rounded bg-slate-800 px-3 py-2 text-slate-100"
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as Role })
              }
            >
              <option value="DIRETOR">DIRETOR</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <select
              className="rounded bg-slate-800 px-3 py-2 text-slate-100"
              value={form.directorId}
              onChange={(e) => setForm({ ...form, directorId: e.target.value })}
              disabled={form.role === "ADMIN"}
            >
              <option value="">
                {form.role === "ADMIN"
                  ? "Admin nÃ£o vincula diretor"
                  : "Vincular a diretor"}
              </option>
              {directors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full rounded bg-emerald-500 py-2 font-semibold text-slate-900 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Criando..." : "Criar usuÃ¡rio"}
          </button>
          <p className="text-xs text-slate-400">
            * UsuÃ¡rios ADMIN nÃ£o precisam de diretor vinculado.
          </p>
        </form>
      </div>
    </ProtectedPage>
  );
}
