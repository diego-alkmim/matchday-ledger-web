"use client";

import { useEffect, useState } from "react";
import { PencilLine, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { ProtectedPage } from "../../components/nav/sidebar";
import { EmptyState, fieldClassName, FormField, PageHeader, Surface } from "../../components/ui/page-primitives";
import { useAuth } from "../../lib/auth";
import api from "../api-client";
import { ApiEnvelope, getApiErrorMessage } from "../../lib/api-types";

interface Director {
  id: string;
  name: string;
  contact?: string;
}

const initialForm = { name: "", contact: "" };

export default function Diretores() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [directors, setDirectors] = useState<Director[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<ApiEnvelope<Director[]>>("/directors");
      setDirectors(data.data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao carregar diretores"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const submit = async () => {
    try {
      if (editingId) {
        await api.put(`/directors/${editingId}`, form);
        toast.success("Diretor atualizado");
      } else {
        await api.post("/directors", form);
        toast.success("Diretor criado");
      }
      resetForm();
      void load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao salvar"));
    }
  };

  const onDelete = async (id: string) => {
    try {
      await api.delete(`/directors/${id}`);
      toast.success("Diretor removido");
      void load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao remover"));
    }
  };

  return (
    <ProtectedPage>
      <div className="space-y-6">
        <PageHeader eyebrow="Cadastros do time" title="Diretores" description="Mantenha os responsáveis financeiros do time sempre organizados." aside={<span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300">{directors.length} cadastrado{directors.length === 1 ? "" : "s"}</span>} />

        {isAdmin && (
          <Surface>
            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-300">{editingId ? <PencilLine size={19} /> : <Plus size={19} />}</span>
              <div><h2 className="font-bold text-white">{editingId ? "Editar diretor" : "Novo diretor"}</h2><p className="mt-0.5 text-sm text-slate-400">Informe os dados de contato do responsável.</p></div>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <FormField label="Nome"><input className={fieldClassName} placeholder="Nome completo" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></FormField>
              <FormField label="Contato"><input className={fieldClassName} placeholder="Telefone, e-mail ou outro contato" value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} /></FormField>
            </div>
            <div className="flex flex-col gap-3 border-t border-white/10 bg-slate-950/20 px-5 py-4 sm:flex-row">
              <button onClick={() => void submit()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-200">{editingId ? <PencilLine size={16} /> : <Plus size={16} />}{editingId ? "Salvar alterações" : "Cadastrar diretor"}</button>
              {editingId && <button onClick={resetForm} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white">Cancelar edição</button>}
            </div>
          </Surface>
        )}

        <Surface>
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-5"><div><h2 className="font-bold text-white">Diretores cadastrados</h2><p className="mt-0.5 text-sm text-slate-400">Responsáveis disponíveis para os lançamentos de entrada.</p></div>{loading && <span className="text-xs font-semibold text-emerald-300">Atualizando...</span>}</div>
          <div className="space-y-3 p-3 sm:p-5">
            {directors.map((director) => <article key={director.id} className="group flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-950/25 p-4 transition hover:border-emerald-300/25 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-300/10 text-sm font-bold text-emerald-200">{director.name.slice(0, 1).toUpperCase()}</span><div className="min-w-0"><h3 className="truncate font-bold text-white">{director.name}</h3><p className="mt-1 truncate text-sm text-slate-400">{director.contact || "Contato não informado"}</p></div></div>{isAdmin && <div className="flex gap-2 sm:opacity-0 sm:transition sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"><button onClick={() => { setEditingId(director.id); setForm({ name: director.name, contact: director.contact || "" }); }} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-sky-300/10 hover:text-sky-100"><PencilLine size={15} />Editar</button><button onClick={() => void onDelete(director.id)} className="inline-flex items-center gap-2 rounded-xl border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-300/20"><Trash2 size={15} />Excluir</button></div>}</article>)}
            {!directors.length && <EmptyState icon={<Users size={30} />} title="Nenhum diretor cadastrado" description="Cadastre os responsáveis para vinculá-los às entradas do time." />}
          </div>
        </Surface>
      </div>
    </ProtectedPage>
  );
}