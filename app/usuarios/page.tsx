"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { KeyRound, ShieldCheck, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import api from "../api-client";
import { ProtectedPage } from "../../components/nav/sidebar";
import { fieldClassName, FormField, PageHeader, Surface } from "../../components/ui/page-primitives";
import { useAuth } from "../../lib/auth";
import { ApiEnvelope, getApiErrorMessage } from "../../lib/api-types";

type Role = "ADMIN" | "DIRETOR";
type Director = { id: string; name: string };

export default function UsuariosPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [directors, setDirectors] = useState<Director[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", role: "DIRETOR" as Role, directorId: "" });
  const canSubmit = useMemo(() => form.email.trim().length > 0 && form.password.trim().length >= 8 && (form.role === "ADMIN" || Boolean(form.directorId)), [form]);

  useEffect(() => {
    if (!isAdmin) return;
    api.get<ApiEnvelope<Director[]>>("/directors").then((response) => setDirectors(response.data.data || [])).catch((error: unknown) => toast.error(getApiErrorMessage(error, "Erro ao carregar diretores")));
  }, [isAdmin]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAdmin || !canSubmit) { toast.error("Preencha os campos obrigatórios e use uma senha com ao menos 8 caracteres."); return; }
    try {
      setLoading(true);
      await api.post("/users", form);
      toast.success("Usuário criado com sucesso");
      setForm({ email: "", password: "", role: "DIRETOR", directorId: "" });
    } catch (error) { toast.error(getApiErrorMessage(error, "Erro ao criar usuário")); }
    finally { setLoading(false); }
  };

  if (!isAdmin) return <ProtectedPage><div className="mx-auto max-w-lg pt-16 text-center"><ShieldCheck size={36} className="mx-auto text-slate-600" /><h1 className="mt-4 text-xl font-bold text-white">Acesso restrito</h1><p className="mt-2 text-sm text-slate-400">Somente administradores podem gerenciar usuários.</p></div></ProtectedPage>;

  return (
    <ProtectedPage>
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader eyebrow="Administração" title="Usuários" description="Crie acessos e vincule diretores ao financeiro do time." aside={<span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">Área administrativa</span>} />
        <Surface>
          <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-300"><UserPlus size={20} /></span><div><h2 className="font-bold text-white">Criar novo acesso</h2><p className="mt-0.5 text-sm text-slate-400">A senha deve ter pelo menos 8 caracteres.</p></div></div>
          <form onSubmit={(event) => void submit(event)}>
            <div className="grid gap-4 p-5 sm:grid-cols-2"><FormField label="E-mail"><input type="email" autoComplete="email" className={fieldClassName} placeholder="nome@time.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></FormField><FormField label="Senha inicial"><div className="relative"><KeyRound size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input type="password" autoComplete="new-password" className={`${fieldClassName} pl-10`} placeholder="Mínimo de 8 caracteres" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></div></FormField><FormField label="Perfil"><select className={fieldClassName} value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Role, directorId: "" })}><option value="DIRETOR">Diretor</option><option value="ADMIN">Administrador</option></select></FormField><FormField label="Diretor vinculado"><select className={fieldClassName} value={form.directorId} onChange={(event) => setForm({ ...form, directorId: event.target.value })} disabled={form.role === "ADMIN"}><option value="">{form.role === "ADMIN" ? "Administradores não vinculam diretor" : "Selecione o diretor"}</option>{directors.map((director) => <option key={director.id} value={director.id}>{director.name}</option>)}</select></FormField></div>
            <div className="flex flex-col gap-3 border-t border-white/10 bg-slate-950/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-2 text-xs text-slate-500"><Users size={14} />Diretores acessam apenas os dados vinculados ao seu perfil.</p><button type="submit" disabled={!canSubmit || loading} className="rounded-xl bg-emerald-300 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:bg-emerald-300/40">{loading ? "Criando acesso..." : "Criar usuário"}</button></div>
          </form>
        </Surface>
      </div>
    </ProtectedPage>
  );
}