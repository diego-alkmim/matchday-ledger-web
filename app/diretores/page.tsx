"use client";
import { useEffect, useState } from "react";
import { ProtectedPage } from "../../components/nav/sidebar";
import api from "../api-client";
import { useAuth } from "../../lib/auth";
import { toast } from "sonner";

interface Director {
  id: string;
  name: string;
  contact?: string;
}

export default function Diretores() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [directors, setDirectors] = useState<Director[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", contact: "" });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/directors");
      setDirectors(data.data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Erro ao carregar diretores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    try {
      if (editingId) {
        await api.put(`/directors/${editingId}`, form);
        toast.success("Diretor atualizado");
      } else {
        await api.post("/directors", form);
        toast.success("Diretor criado");
      }
      setForm({ name: "", contact: "" });
      setEditingId(null);
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Erro ao salvar");
    }
  };

  const onEdit = (d: Director) => {
    setEditingId(d.id);
    setForm({ name: d.name, contact: d.contact || "" });
  };

  const onDelete = async (id: string) => {
    try {
      await api.delete(`/directors/${id}`);
      toast.success("Diretor removido");
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
            <h2 className="text-lg font-semibold mb-3">
              {editingId ? "Editar diretor" : "Novo diretor"}
            </h2>
            <div className="grid gap-3 md:grid-cols-3">
              <input
                className="rounded bg-slate-800 px-3 py-2"
                placeholder="Nome"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                className="rounded bg-slate-800 px-3 py-2"
                placeholder="Contato"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
              />
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
                  onClick={() => {
                    setEditingId(null);
                    setForm({ name: "", contact: "" });
                  }}
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
            <h2 className="text-lg font-semibold">Diretores</h2>
            {loading && (
              <span className="text-xs text-slate-400">Carregando...</span>
            )}
          </div>
          <div className="space-y-2">
            {directors.map((d) => (
              <div
                key={d.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between rounded bg-slate-800 px-3 py-2"
              >
                <div>
                  <div className="font-semibold text-slate-100">{d.name}</div>
                  <div className="text-sm text-slate-400">
                    {d.contact || "Sem contato"}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-2 mt-2 md:mt-0">
                    <button
                      onClick={() => onEdit(d)}
                      className="rounded bg-slate-700 px-3 py-1 text-sm hover:bg-slate-600"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onDelete(d.id)}
                      className="rounded bg-rose-600 px-3 py-1 text-sm text-white hover:bg-rose-500"
                    >
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            ))}
            {!directors.length && (
              <div className="text-sm text-slate-400">
                Nenhum diretor cadastrado.
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}
