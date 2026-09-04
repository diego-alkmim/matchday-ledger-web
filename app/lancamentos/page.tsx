"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ProtectedPage } from "../../components/nav/sidebar";
import { TransactionDeleteDialog } from "../../components/transactions/transaction-delete-dialog";
import { TransactionList } from "../../components/transactions/transaction-list";
import { useAuth } from "../../lib/auth";
import api from "../api-client";
import { ApiEnvelope, getApiErrorMessage } from "../../lib/api-types";
import type { Category, Director, Game, Transaction, TransactionFilters, TransactionFormData } from "./types";

const initialForm: TransactionFormData = {
  amountDisplay: "", amount: 0, categoryId: "", gameId: "", paymentMethod: "PIX", date: "", notes: "", directorId: "",
};

const formatCurrency = (value: string) => {
  const numeric = Number(value.replace(/[^0-9]/g, "")) / 100;
  if (Number.isNaN(numeric)) return { display: "", numeric: 0 };
  return { display: numeric.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), numeric };
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
  const [filters, setFilters] = useState<TransactionFilters>({ gameId: "", categoryId: "" });
  const [form, setForm] = useState<TransactionFormData>(initialForm);

  const load = async () => {
    try {
      const [txRes, catRes, gameRes, directorRes] = await Promise.all([
        api.get<ApiEnvelope<Transaction[]>>("/transactions"),
        api.get<ApiEnvelope<Category[]>>("/categories"),
        api.get<ApiEnvelope<Game[]>>("/games"),
        api.get<ApiEnvelope<Director[]>>("/directors"),
      ]);
      const transactions = (txRes.data.data || []).slice().sort((a: Transaction, b: Transaction) => {
        const firstDate = a.createdAt ? new Date(a.createdAt) : new Date(a.date);
        const secondDate = b.createdAt ? new Date(b.createdAt) : new Date(b.date);
        return secondDate.getTime() - firstDate.getTime();
      });
      setItems(transactions);
      setCategories(catRes.data.data || []);
      setGames(gameRes.data.data || []);
      setDirectors(directorRes.data.data || []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao carregar lançamentos"));
    }
  };

  useEffect(() => { void load(); }, []);

  const selectedCategory = useMemo(() => categories.find((category) => category.id === form.categoryId), [categories, form.categoryId]);
  const filteredItems = useMemo(() => items.filter((item) => (!filters.gameId || item.game?.id === filters.gameId) && (!filters.categoryId || item.category?.id === filters.categoryId)), [items, filters]);
  const openGames = useMemo(() => games.filter((game) => game.status === "ABERTO"), [games]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const submit = async () => {
    if (!isAdmin) return;
    if (!form.categoryId) return toast.error("Selecione a categoria");
    if (!form.gameId) return toast.error("Selecione o jogo");
    if (!form.date) return toast.error("Informe a data");
    if (!form.amount) return toast.error("Informe o valor");
    const categoryType = selectedCategory?.type || "ENTRADA";
    if (categoryType === "ENTRADA" && !form.directorId) return toast.error("Selecione o diretor responsável pela entrada");
    const payload = { type: categoryType, amount: form.amount, date: form.date, paymentMethod: form.paymentMethod, notes: form.notes, gameId: form.gameId, categoryId: form.categoryId, directorId: categoryType === "ENTRADA" ? form.directorId : null };
    try {
      if (editingId) {
        await api.put(`/transactions/${editingId}`, payload);
        toast.success("Lançamento atualizado");
      } else {
        await api.post("/transactions", payload);
        toast.success("Lançado");
      }
      resetForm();
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro"));
    }
  };

  const onAmountChange = (value: string) => {
    const { display, numeric } = formatCurrency(value);
    setForm((current) => ({ ...current, amountDisplay: display, amount: numeric }));
  };

  const onEdit = (transaction: Transaction) => {
    if (!isAdmin) return;
    setEditingId(transaction.id);
    setForm({
      amountDisplay: Number(transaction.amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      amount: Number(transaction.amount), categoryId: transaction.category?.id || "", gameId: transaction.game?.id || "", paymentMethod: transaction.paymentMethod,
      date: transaction.date.slice(0, 10), notes: transaction.notes || "", directorId: transaction.director?.id || "",
    });
  };

  const onDelete = async (id: string) => {
    if (!isAdmin) return;
    try {
      await api.delete(`/transactions/${id}`);
      toast.success("Lançamento removido");
      if (editingId === id) resetForm();
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao remover"));
    } finally {
      setPendingDeleteId(null);
    }
  };

  return (
    <ProtectedPage>
      <div className="space-y-6">
        {isAdmin && <div className="mb-6 rounded border border-slate-800 bg-slate-900 p-4">
          <h2 className="mb-3 font-semibold">{editingId ? "Editar lançamento" : "Novo lançamento"}</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <input className="rounded bg-slate-800 px-3 py-2" placeholder="R$ 0,00" value={form.amountDisplay} onChange={(event) => onAmountChange(event.target.value)} />
            <select className="rounded bg-slate-800 px-3 py-2" value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}><option value="">Categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name} {category.type ? `(${category.type})` : ""}</option>)}</select>
            <select className="rounded bg-slate-800 px-3 py-2" value={form.gameId} onChange={(event) => setForm({ ...form, gameId: event.target.value })}><option value="">Jogo</option>{openGames.map((game) => <option key={game.id} value={game.id}>{game.opponent || "Sem adversário"} - {new Date(game.date).toLocaleDateString()}</option>)}</select>
            <select className="rounded bg-slate-800 px-3 py-2" value={form.paymentMethod} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value as TransactionFormData["paymentMethod"] })}><option>PIX</option><option>DINHEIRO</option><option>CARTAO</option></select>
            <input type="date" className="rounded bg-slate-800 px-3 py-2" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
            <input className="rounded bg-slate-800 px-3 py-2" placeholder="Observação" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            {selectedCategory?.type === "ENTRADA" && <select className="rounded bg-slate-800 px-3 py-2" value={form.directorId} onChange={(event) => setForm({ ...form, directorId: event.target.value })}><option value="">Diretor pagante</option>{directors.map((director) => <option key={director.id} value={director.id}>{director.name}</option>)}</select>}
          </div>
          <div className="mt-3 flex gap-2"><button onClick={() => void submit()} className="rounded bg-emerald-500 px-4 py-2 font-semibold text-slate-900 hover:bg-emerald-400">{editingId ? "Salvar alterações" : "Salvar"}</button>{editingId && <button onClick={resetForm} className="rounded bg-slate-800 px-4 py-2 text-slate-200 hover:bg-slate-700">Cancelar</button>}{selectedCategory && <div className="flex items-center gap-2 text-sm text-slate-400"><span>Tipo da categoria: <strong>{selectedCategory.type || "ENTRADA"}</strong></span></div>}</div>
        </div>}
        <TransactionList items={filteredItems} categories={categories} games={games} filters={filters} isAdmin={isAdmin} onFiltersChange={setFilters} onEdit={onEdit} onDeleteRequest={setPendingDeleteId} />
      </div>
      {isAdmin && pendingDeleteId && <TransactionDeleteDialog onCancel={() => setPendingDeleteId(null)} onConfirm={() => void onDelete(pendingDeleteId)} />}
    </ProtectedPage>
  );
}
