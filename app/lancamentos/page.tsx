"use client";
import { useEffect, useMemo, useState } from "react";
import api from "../api-client";
import { ProtectedPage } from "../../components/nav/sidebar";
import { toast } from "sonner";
import { useAuth } from "../../lib/auth";

interface Transaction {
  id: string;
  type: "ENTRADA" | "SAIDA";
  amount: number;
  date: string;
  createdAt?: string;
  paymentMethod: "PIX" | "DINHEIRO" | "CARTAO";
  notes?: string;
  game?: { id: string; opponent?: string | null; date: string };
  category?: { id: string; name: string; type?: "ENTRADA" | "SAIDA" };
  director?: { id: string; name: string };
}
interface Category {
  id: string;
  name: string;
  type?: "ENTRADA" | "SAIDA";
}
interface Game {
  id: string;
  opponent?: string | null;
  date: string;
  location?: string | null;
  status?: "ABERTO" | "FECHADO";
}
interface Director {
  id: string;
  name: string;
}

const formatCurrency = (value: string) => {
  const numeric = Number(value.replace(/[^0-9]/g, "")) / 100;
  if (Number.isNaN(numeric)) return { display: "", numeric: 0 };
  return {
    display: numeric.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    }),
    numeric,
  };
};

export default function LancamentosPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [items, setItems] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [directors, setDirectors] = useState<Director[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    gameId: "",
    categoryId: "",
  });

  const [form, setForm] = useState({
    amountDisplay: "",
    amount: 0,
    categoryId: "",
    gameId: "",
    paymentMethod: "PIX",
    date: "",
    notes: "",
    directorId: "",
  });

  const load = async () => {
    try {
      const [txRes, catRes, gameRes, directorRes] = await Promise.all([
        api.get("/transactions"),
        api.get("/categories"),
        api.get("/games"),
        api.get("/directors"),
      ]);
      const tx = (txRes.data.data || [])
        .slice()
        .sort((a: Transaction, b: Transaction) => {
          const da = a.createdAt ? new Date(a.createdAt) : new Date(a.date);
          const db = b.createdAt ? new Date(b.createdAt) : new Date(b.date);
          return db.getTime() - da.getTime();
        });
      setItems(tx);
      setCategories(catRes.data.data || []);
      setGames(gameRes.data.data || []);
      setDirectors(directorRes.data.data || []);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Erro ao carregar lançamentos");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === form.categoryId),
    [categories, form.categoryId],
  );

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesGame = !filters.gameId || item.game?.id === filters.gameId;
      const matchesCategory =
        !filters.categoryId || item.category?.id === filters.categoryId;
      return matchesGame && matchesCategory;
    });
  }, [items, filters]);

  const openGames = useMemo(
    () => games.filter((game) => game.status === "ABERTO"),
    [games],
  );

  const resetForm = () => {
    setForm({
      amountDisplay: "",
      amount: 0,
      categoryId: "",
      gameId: "",
      paymentMethod: "PIX",
      date: "",
      notes: "",
      directorId: "",
    });
    setEditingId(null);
  };

  const submit = async () => {
    if (!isAdmin) return;
    try {
      if (!form.categoryId) return toast.error("Selecione a categoria");
      if (!form.gameId) return toast.error("Selecione o jogo");
      if (!form.date) return toast.error("Informe a data");
      if (!form.amount) return toast.error("Informe o valor");

      const catType = selectedCategory?.type || "ENTRADA";
      if (catType === "ENTRADA" && !form.directorId) {
        return toast.error("Selecione o diretor responsável pela entrada");
      }
      const payload = {
        type: catType,
        amount: form.amount,
        date: form.date,
        paymentMethod: form.paymentMethod,
        notes: form.notes,
        gameId: form.gameId,
        categoryId: form.categoryId,
        directorId: catType === "ENTRADA" ? form.directorId : null,
      };

      if (editingId) {
        await api.put(`/transactions/${editingId}`, payload);
        toast.success("Lançamento atualizado");
      } else {
        await api.post("/transactions", payload);
        toast.success("Lançado");
      }
      resetForm();
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Erro");
    }
  };

  const onAmountChange = (v: string) => {
    const { display, numeric } = formatCurrency(v);
    setForm((f) => ({ ...f, amountDisplay: display, amount: numeric }));
  };

  const onEdit = (t: Transaction) => {
    if (!isAdmin) return;
    const catId = t.category?.id || "";
    setEditingId(t.id);
    setForm({
      amountDisplay: Number(t.amount).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
      amount: Number(t.amount),
      categoryId: catId,
      gameId: t.game?.id || "",
      paymentMethod: t.paymentMethod,
      date: t.date.slice(0, 10),
      notes: t.notes || "",
      directorId: (t as any).director?.id || "",
    });
  };

  const onDelete = async (id: string) => {
    if (!isAdmin) return;
    try {
      await api.delete(`/transactions/${id}`);
      toast.success("Lançamento removido");
      if (editingId === id) resetForm();
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Erro ao remover");
    } finally {
      setPendingDeleteId(null);
    }
  };

  return (
    <ProtectedPage>
      <div className="space-y-6">
        {isAdmin && (
          <div className="mb-6 rounded bg-slate-900 p-4 border border-slate-800">
            <h2 className="font-semibold mb-3">
              {editingId ? "Editar lançamento" : "Novo lançamento"}
            </h2>
            <div className="grid gap-3 md:grid-cols-3">
              <input
                className="rounded bg-slate-800 px-3 py-2"
                placeholder="R$ 0,00"
                value={form.amountDisplay}
                onChange={(e) => onAmountChange(e.target.value)}
              />
              <select
                className="rounded bg-slate-800 px-3 py-2"
                value={form.categoryId}
                onChange={(e) =>
                  setForm({ ...form, categoryId: e.target.value })
                }
              >
                <option value="">Categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.type ? `(${c.type})` : ""}
                  </option>
                ))}
              </select>
              <select
                className="rounded bg-slate-800 px-3 py-2"
                value={form.gameId}
                onChange={(e) => setForm({ ...form, gameId: e.target.value })}
              >
                <option value="">Jogo</option>
                {openGames.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.opponent || "Sem adversário"} -{" "}
                    {new Date(g.date).toLocaleDateString()}
                  </option>
                ))}
              </select>
              <select
                className="rounded bg-slate-800 px-3 py-2"
                value={form.paymentMethod}
                onChange={(e) =>
                  setForm({ ...form, paymentMethod: e.target.value })
                }
              >
                <option>PIX</option>
                <option>DINHEIRO</option>
                <option>CARTAO</option>
              </select>
              <input
                type="date"
                className="rounded bg-slate-800 px-3 py-2"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
              <input
                className="rounded bg-slate-800 px-3 py-2"
                placeholder="Observação"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
              {selectedCategory?.type === "ENTRADA" && (
                <select
                  className="rounded bg-slate-800 px-3 py-2"
                  value={form.directorId}
                  onChange={(e) =>
                    setForm({ ...form, directorId: e.target.value })
                  }
                >
                  <option value="">Diretor pagante</option>
                  {directors.map((director) => (
                    <option key={director.id} value={director.id}>
                      {director.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={submit}
                className="rounded bg-emerald-500 px-4 py-2 font-semibold text-slate-900 hover:bg-emerald-400"
              >
                {editingId ? "Salvar alterações" : "Salvar"}
              </button>
              {editingId && (
                <button
                  onClick={resetForm}
                  className="rounded bg-slate-800 px-4 py-2 text-slate-200 hover:bg-slate-700"
                >
                  Cancelar
                </button>
              )}
              <div className="text-sm text-slate-400 flex items-center gap-2">
                {selectedCategory && (
                  <span>
                    Tipo da categoria:{" "}
                    <strong>{selectedCategory.type || "ENTRADA"}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="rounded bg-slate-900 p-4 border border-slate-800">
          <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <h2 className="font-semibold">Lançamentos</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <select
                className="rounded bg-slate-800 px-3 py-2 text-sm"
                value={filters.gameId}
                onChange={(e) =>
                  setFilters((current) => ({
                    ...current,
                    gameId: e.target.value,
                  }))
                }
              >
                <option value="">Todos os jogos</option>
                {games.map((game) => (
                  <option key={game.id} value={game.id}>
                    {(game.opponent || "Sem adversário") +
                      " - " +
                      new Date(game.date).toLocaleDateString("pt-BR")}
                  </option>
                ))}
              </select>
              <select
                className="rounded bg-slate-800 px-3 py-2 text-sm"
                value={filters.categoryId}
                onChange={(e) =>
                  setFilters((current) => ({
                    ...current,
                    categoryId: e.target.value,
                  }))
                }
              >
                <option value="">Todas as categorias</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            {filteredItems.map((t) => (
              <div
                key={t.id}
                className={`flex flex-col md:flex-row md:items-center md:justify-between rounded px-3 py-2 border ${
                  t.type === "ENTRADA"
                    ? "bg-emerald-950/40 border-emerald-600/60"
                    : "bg-rose-950/30 border-rose-600/60"
                }`}
              >
                <div>
                  <div className="font-semibold text-slate-100 flex items-center gap-2">
                    {t.category?.name.toUpperCase() || "SEM CATEGORIA"}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        t.type === "ENTRADA"
                          ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/40"
                          : "bg-rose-500/20 text-rose-200 border border-rose-500/40"
                      }`}
                    >
                      {t.type}
                    </span>
                  </div>
                  <div className="text-sm text-slate-300">
                    R$
                    {Number(t.amount).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    • {t.paymentMethod}
                  </div>
                  <div className="text-xs text-slate-500">
                    {t.notes ? `• ${t.notes}` : ""}
                  </div>
                  {t.game && (
                    <div className="text-xs text-slate-500">
                      Jogo: {t.game.opponent || "Sem adversário"} -{" "}
                      {new Date(t.game.date).toLocaleDateString()}
                    </div>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex gap-2 mt-2 md:mt-0">
                    <button
                      onClick={() => onEdit(t)}
                      className="rounded bg-slate-700 px-3 py-1 text-sm hover:bg-slate-600"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setPendingDeleteId(t.id)}
                      className="rounded bg-rose-600 px-3 py-1 text-sm text-white hover:bg-rose-500"
                    >
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            ))}
            {!filteredItems.length && (
              <div className="text-sm text-slate-400">
                Nenhum lançamento encontrado para os filtros informados.
              </div>
            )}
          </div>
        </div>
      </div>

      {isAdmin && pendingDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-lg bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-xl">
            <h3 className="text-lg font-semibold text-white">
              Confirmar exclusão
            </h3>
            <p className="text-sm text-slate-300">
              Tem certeza que deseja excluir este lançamento?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPendingDeleteId(null)}
                className="rounded bg-slate-800 px-4 py-2 text-slate-200 hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => onDelete(pendingDeleteId)}
                className="rounded bg-rose-600 px-4 py-2 text-white hover:bg-rose-500"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedPage>
  );
}
