"use client";

import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, PencilLine, Plus, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ProtectedPage } from "../../components/nav/sidebar";
import { EmptyState, fieldClassName, FormField, PageHeader, Surface } from "../../components/ui/page-primitives";
import { useAuth } from "../../lib/auth";
import api from "../api-client";
import { ApiEnvelope, getApiErrorMessage } from "../../lib/api-types";

interface Category { id: string; name: string; active: boolean; type?: "ENTRADA" | "SAIDA"; }
const initialForm = { name: "", active: true, type: "SAIDA" as "ENTRADA" | "SAIDA" };

export default function CategoriasPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get<ApiEnvelope<Category[]>>("/categories"); setCategories(data.data || []); }
    catch (error) { toast.error(getApiErrorMessage(error, "Erro ao carregar categorias")); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const resetForm = () => { setForm(initialForm); setEditingId(null); };
  const submit = async () => {
    if (!form.name.trim()) { toast.error("Informe o nome da categoria"); return; }
    try {
      const payload = { name: form.name.trim(), active: form.active, type: form.type };
      if (editingId) { await api.put(`/categories/${editingId}`, payload); toast.success("Categoria atualizada"); }
      else { await api.post("/categories", payload); toast.success("Categoria criada"); }
      resetForm(); void load();
    } catch (error) { toast.error(getApiErrorMessage(error, "Erro ao salvar categoria")); }
  };
  const onDelete = async (id: string) => {
    try { await api.delete(`/categories/${id}`); toast.success("Categoria removida"); void load(); }
    catch (error) { toast.error(getApiErrorMessage(error, "Erro ao remover")); }
  };

  return (
    <ProtectedPage>
      <div className="space-y-6">
        <PageHeader eyebrow="Cadastros do time" title="Categorias" description="Defina como cada movimentação será classificada no caixa." aside={<span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300">{categories.length} categoria{categories.length === 1 ? "" : "s"}</span>} />
        {isAdmin && <Surface>
          <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300/10 text-amber-300">{editingId ? <PencilLine size={19} /> : <Plus size={19} />}</span><div><h2 className="font-bold text-white">{editingId ? "Editar categoria" : "Nova categoria"}</h2><p className="mt-0.5 text-sm text-slate-400">Escolha o tipo que será aplicado aos próximos lançamentos.</p></div></div>
          <div className="grid gap-4 p-5 sm:grid-cols-[1fr_12rem_auto]"><FormField label="Nome"><input className={fieldClassName} placeholder="Ex.: Arbitragem, Diretoria ou Uber" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></FormField><FormField label="Tipo"><select className={fieldClassName} value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as Category["type"] || "SAIDA" })}><option value="SAIDA">Saída</option><option value="ENTRADA">Entrada</option></select></FormField><label className="flex items-end gap-3 pb-2 text-sm font-semibold text-slate-300"><input type="checkbox" className="h-4 w-4 accent-emerald-300" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />Categoria ativa</label></div>
          <div className="flex flex-col gap-3 border-t border-white/10 bg-slate-950/20 px-5 py-4 sm:flex-row"><button onClick={() => void submit()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-200">{editingId ? <PencilLine size={16} /> : <Plus size={16} />}{editingId ? "Salvar alterações" : "Cadastrar categoria"}</button>{editingId && <button onClick={resetForm} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white">Cancelar edição</button>}</div>
        </Surface>}
        <Surface>
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-5"><div><h2 className="font-bold text-white">Categorias cadastradas</h2><p className="mt-0.5 text-sm text-slate-400">Organize o plano de contas do time.</p></div>{loading && <span className="text-xs font-semibold text-emerald-300">Atualizando...</span>}</div>
          <div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">{categories.map((category) => { const isEntry = category.type === "ENTRADA"; return <article key={category.id} className="group rounded-2xl border border-white/10 bg-slate-950/25 p-4 transition hover:border-amber-300/30"><div className="flex items-start justify-between gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${isEntry ? "bg-emerald-300/10 text-emerald-300" : "bg-rose-300/10 text-rose-300"}`}>{isEntry ? <ArrowUpRight size={19} /> : <ArrowDownRight size={19} />}</span><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${category.active ? "bg-emerald-300/10 text-emerald-200" : "bg-slate-700/70 text-slate-300"}`}>{category.active ? "Ativa" : "Inativa"}</span></div><h3 className="mt-5 font-bold text-white">{category.name}</h3><p className="mt-1 text-sm text-slate-400">{isEntry ? "Entrada" : "Saída"}</p>{isAdmin && <div className="mt-5 flex gap-2 border-t border-white/10 pt-3"><button onClick={() => { setEditingId(category.id); setForm({ name: category.name, active: category.active, type: category.type || "SAIDA" }); }} className="inline-flex items-center gap-2 text-sm font-semibold text-sky-200 transition hover:text-sky-100"><PencilLine size={15} />Editar</button><button onClick={() => void onDelete(category.id)} className="inline-flex items-center gap-2 text-sm font-semibold text-rose-200 transition hover:text-rose-100"><Trash2 size={15} />Excluir</button></div>}</article>; })}{!categories.length && <div className="sm:col-span-2 xl:col-span-3"><EmptyState icon={<Tags size={30} />} title="Nenhuma categoria cadastrada" description="Crie categorias para classificar entradas e saídas do caixa." /></div>}</div>
        </Surface>
      </div>
    </ProtectedPage>
  );
}