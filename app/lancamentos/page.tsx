"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, CalendarDays, PencilLine, Plus, Receipt, WalletCards } from "lucide-react";
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
  const selectedType = selectedCategory?.type;

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
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Movimentação financeira</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Lançamentos</h1>
            <p className="mt-2 text-sm text-slate-400">Registre e acompanhe todas as entradas e saídas por jogo.</p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300">
            <CalendarDays size={14} className="text-emerald-300" aria-hidden="true" />
            Apenas jogos abertos recebem lançamentos
          </div>
        </header>

        {isAdmin && (
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 shadow-xl shadow-black/10 backdrop-blur-sm">
            <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  selectedType === "SAIDA" ? "bg-rose-400/10 text-rose-300" : "bg-emerald-300/10 text-emerald-300"
                }`}>
                  {editingId ? <PencilLine size={20} aria-hidden="true" /> : <Receipt size={20} aria-hidden="true" />}
                </span>
                <div>
                  <h2 className="font-bold text-white">{editingId ? "Editar lançamento" : "Novo lançamento"}</h2>
                  <p className="mt-0.5 text-sm text-slate-400">{editingId ? "Revise os dados antes de salvar." : "Preencha os dados para registrar a movimentação."}</p>
                </div>
              </div>
              {selectedType && <TypeIndicator type={selectedType} />}
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[1fr_17rem]">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <FormField label="Valor">
                  <input className={fieldClassName} inputMode="decimal" placeholder="R$ 0,00" value={form.amountDisplay} onChange={(event) => onAmountChange(event.target.value)} />
                </FormField>
                <FormField label="Categoria">
                  <select className={fieldClassName} value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value, directorId: "" })}>
                    <option value="">Selecione a categoria</option>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name} {category.type ? `(${category.type})` : ""}</option>)}
                  </select>
                </FormField>
                <FormField label="Jogo">
                  <select className={fieldClassName} value={form.gameId} onChange={(event) => setForm({ ...form, gameId: event.target.value })}>
                    <option value="">Selecione o jogo</option>
                    {openGames.map((game) => <option key={game.id} value={game.id}>{game.opponent || "Sem adversário"} - {new Date(game.date).toLocaleDateString("pt-BR")}</option>)}
                  </select>
                </FormField>
                <FormField label="Forma de pagamento">
                  <select className={fieldClassName} value={form.paymentMethod} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value as TransactionFormData["paymentMethod"] })}>
                    <option>PIX</option><option>DINHEIRO</option><option>CARTAO</option>
                  </select>
                </FormField>
                <FormField label="Data do lançamento">
                  <input type="date" className={fieldClassName} value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
                </FormField>
                {selectedType === "ENTRADA" && (
                  <FormField label="Diretor responsável">
                    <select className={fieldClassName} value={form.directorId} onChange={(event) => setForm({ ...form, directorId: event.target.value })}>
                      <option value="">Selecione o diretor</option>
                      {directors.map((director) => <option key={director.id} value={director.id}>{director.name}</option>)}
                    </select>
                  </FormField>
                )}
                <FormField label="Observação" className="sm:col-span-2 xl:col-span-3">
                  <input className={fieldClassName} placeholder={selectedType === "ENTRADA" ? "Ex.: nome de quem realizou o pagamento" : "Ex.: destino ou responsável pela saída"} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
                </FormField>
              </div>

              <aside className={`rounded-2xl border p-4 ${selectedType === "SAIDA" ? "border-rose-400/20 bg-rose-500/[0.06]" : "border-emerald-300/20 bg-emerald-300/[0.06]"}`}>
                <WalletCards size={21} className={selectedType === "SAIDA" ? "text-rose-300" : "text-emerald-300"} aria-hidden="true" />
                <p className="mt-4 text-sm font-bold text-white">Resumo do lançamento</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  A categoria define automaticamente se a movimentação será uma entrada ou uma saída.
                </p>
                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500">Tipo atual</p>
                  {selectedType ? <TypeIndicator type={selectedType} compact /> : <p className="mt-1 text-sm text-slate-300">Aguardando categoria</p>}
                </div>
              </aside>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 bg-slate-950/20 px-5 py-4 sm:flex-row sm:items-center">
              <button onClick={() => void submit()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-200">
                {editingId ? <PencilLine size={17} aria-hidden="true" /> : <Plus size={17} aria-hidden="true" />}
                {editingId ? "Salvar alterações" : "Registrar lançamento"}
              </button>
              {editingId && <button onClick={resetForm} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white">Cancelar edição</button>}
            </div>
          </section>
        )}
        <TransactionList items={filteredItems} categories={categories} games={games} filters={filters} isAdmin={isAdmin} onFiltersChange={setFilters} onEdit={onEdit} onDeleteRequest={setPendingDeleteId} />
      </div>
      {isAdmin && pendingDeleteId && <TransactionDeleteDialog onCancel={() => setPendingDeleteId(null)} onConfirm={() => void onDelete(pendingDeleteId)} />}
    </ProtectedPage>
  );
}

const fieldClassName = "w-full rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10";

function FormField({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return <label className={`block ${className}`}><span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</span>{children}</label>;
}

function TypeIndicator({ type, compact = false }: { type: "ENTRADA" | "SAIDA"; compact?: boolean }) {
  const isEntry = type === "ENTRADA";
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${isEntry ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200" : "border-rose-300/30 bg-rose-300/10 text-rose-200"}`}>
    {isEntry ? <ArrowUpRight size={compact ? 14 : 15} aria-hidden="true" /> : <ArrowDownRight size={compact ? 14 : 15} aria-hidden="true" />}
    {isEntry ? "Entrada" : "Saída"}
  </span>;
}
