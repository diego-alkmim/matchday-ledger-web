"use client";
import { useEffect, useState } from "react";
import { ProtectedPage } from "../../components/nav/sidebar";
import api from "../api-client";
import { useAuth } from "../../lib/auth";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  active: boolean;
  type?: "ENTRADA" | "SAIDA"; // opcional para exibir rótulo
}

export default function CategoriasPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", active: true, type: "SAIDA" as "ENTRADA" | "SAIDA" });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/categories");
      setCategories(data.data || []);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Erro ao carregar categorias");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    try {
      if (!form.name.trim()) {
        toast.error("Informe o nome da categoria");
        return;
      }
      const payload = { name: form.name.trim(), active: form.active, type: form.type };
      if (editingId) {
        await api.put(`/categories/${editingId}`, payload);
        toast.success("Categoria atualizada");
      } else {
        await api.post("/categories", payload);
        toast.success("Categoria criada");
      }
      setForm({ name: "", active: true, type: "SAIDA" });
      setEditingId(null);
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Erro ao salvar categoria");
    }
  };

  const onEdit = (c: Category) => {
    setEditingId(c.id);
    setForm({ name: c.name, active: c.active, type: c.type || "SAIDA" });
  };

  const onDelete = async (id: string) => {
    try {
      await api.delete(`/categories/${id}`);
      toast.success("Categoria removida");
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Erro ao remover");
    }
  };

  return (
    <ProtectedPage>
      <div className="space-y-6">
        {isAdmin && (
          <div className="rounded-lg bg-slate-900 p-4 shadow border border-slate-800">
            <h2 className="text-lg font-semibold mb-3">{editingId ? "Editar categoria" : "Nova categoria"}</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <input
                className="rounded bg-slate-800 px-3 py-2"
                placeholder="Nome"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <label className="flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
                Ativa
              </label>
              {/* Campo type apenas para exibição futura; no backend atual não grava type. */}
              <select
                className="rounded bg-slate-800 px-3 py-2"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as "ENTRADA" | "SAIDA" })}
              >
                <option value="SAIDA">Saída</option>
                <option value="ENTRADA">Entrada</option>
              </select>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={submit}
                className="rounded bg-emerald-500 px-4 py-2 font-semibold text-slate-900 hover:bg-emerald-400"
              >
                {editingId ? "Salvar alterações" : "Cadastrar"}
              </button>
              {editingId && (
                <button
                  onClick={() => { setEditingId(null); setForm({ name: "", active: true, type: "SAIDA" }); }}
                  className="rounded bg-slate-800 px-4 py-2 text-slate-200 hover:bg-slate-700"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        )}

        <div className="rounded-lg bg-slate-900 p-4 shadow border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Categorias</h2>
            {loading && <span className="text-xs text-slate-400">Carregando...</span>}
          </div>
          <div className="space-y-2">
            {categories.map((c) => (
              <div key={c.id} className="flex flex-col md:flex-row md:items-center md:justify-between rounded bg-slate-800 px-3 py-2">
                <div>
                  <div className="font-semibold text-slate-100">{c.name}</div>
                  <div className="text-xs text-slate-500">{c.active ? 'Ativa' : 'Inativa'}{c.type ? ` • ${c.type}` : ''}</div>
                </div>
                {isAdmin && (
                  <div className="flex gap-2 mt-2 md:mt-0">
                    <button onClick={() => onEdit(c)} className="rounded bg-slate-700 px-3 py-1 text-sm hover:bg-slate-600">Editar</button>
                    <button onClick={() => onDelete(c.id)} className="rounded bg-rose-600 px-3 py-1 text-sm text-white hover:bg-rose-500">Excluir</button>
                  </div>
                )}
              </div>
            ))}
            {!categories.length && <div className="text-sm text-slate-400">Nenhuma categoria cadastrada.</div>}
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}
