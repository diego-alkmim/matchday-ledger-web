import {
  CalendarDays,
  Filter,
  PencilLine,
  Receipt,
  Trash2,
  WalletCards,
} from "lucide-react";
import type {
  Category,
  Game,
  Transaction,
  TransactionFilters,
} from "../../app/lancamentos/types";

type TransactionListProps = {
  items: Transaction[];
  categories: Category[];
  games: Game[];
  filters: TransactionFilters;
  isAdmin: boolean;
  onFiltersChange: (filters: TransactionFilters) => void;
  onEdit: (transaction: Transaction) => void;
  onDeleteRequest: (id: string) => void;
};

const fieldClassName =
  "w-full rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2.5 text-sm text-slate-100 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10";

export function TransactionList({
  items,
  categories,
  games,
  filters,
  isAdmin,
  onFiltersChange,
  onEdit,
  onDeleteRequest,
}: TransactionListProps) {
  const hasActiveFilters = Boolean(filters.gameId || filters.categoryId);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/70 shadow-xl shadow-black/10 backdrop-blur-sm">
      <div className="flex flex-col gap-4 border-b border-white/10 p-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-300/10 text-sky-300">
            <WalletCards size={19} aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-bold text-white">Histórico de lançamentos</h2>
            <p className="mt-0.5 text-sm text-slate-400">
              {items.length} movimentaç{items.length === 1 ? "ão" : "ões"}{" "}
              encontrada{items.length === 1 ? "" : "s"}.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[34rem]">
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              <CalendarDays size={13} aria-hidden="true" /> Jogo
            </span>
            <select
              className={fieldClassName}
              value={filters.gameId}
              onChange={(event) =>
                onFiltersChange({ ...filters, gameId: event.target.value })
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
          </label>
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              <Filter size={13} aria-hidden="true" /> Categoria
            </span>
            <select
              className={fieldClassName}
              value={filters.categoryId}
              onChange={(event) =>
                onFiltersChange({ ...filters, categoryId: event.target.value })
              }
            >
              <option value="">Todas as categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="p-3 sm:p-5">
        {hasActiveFilters && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-sky-300/15 bg-sky-300/[0.06] px-3 py-2 text-xs text-sky-100">
            <Filter size={14} className="text-sky-300" aria-hidden="true" />{" "}
            Filtros ativos aplicados ao histórico.
          </div>
        )}
        <div className="space-y-3">
          {items.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              isAdmin={isAdmin}
              onEdit={onEdit}
              onDeleteRequest={onDeleteRequest}
            />
          ))}
          {!items.length && (
            <EmptyTransactions hasActiveFilters={hasActiveFilters} />
          )}
        </div>
      </div>
    </section>
  );
}

function TransactionCard({
  transaction,
  isAdmin,
  onEdit,
  onDeleteRequest,
}: {
  transaction: Transaction;
  isAdmin: boolean;
  onEdit: (transaction: Transaction) => void;
  onDeleteRequest: (id: string) => void;
}) {
  const isEntry = transaction.type === "ENTRADA";
  const typeLabel = isEntry ? "Entrada" : "Saída";
  const currency = Number(transaction.amount).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const transactionDate = new Date(
    transaction.createdAt || transaction.date,
  ).toLocaleDateString("pt-BR");

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-lg ${isEntry ? "border-emerald-400/25 bg-emerald-500/[0.055] hover:shadow-emerald-950/20" : "border-rose-400/25 bg-rose-500/[0.055] hover:shadow-rose-950/20"}`}
    >
      <span
        className={`absolute inset-y-0 left-0 w-1 ${isEntry ? "bg-emerald-300" : "bg-rose-300"}`}
      />
      <div className="flex flex-col gap-4 pl-2 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-bold ${isEntry ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200" : "border-rose-300/30 bg-rose-300/10 text-rose-200"}`}
            >
              {typeLabel}
            </span>
            <span className="font-bold text-white">
              {transaction.category?.name || "Sem categoria"}
            </span>
            <span className="text-xs text-slate-500">
              Registrado em {transactionDate}
            </span>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-white">
            {currency}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-400">
            <span>{formatPaymentMethod(transaction.paymentMethod)}</span>
            {transaction.game && (
              <span>
                {transaction.game.opponent || "Jogo sem adversário"} ·{" "}
                {new Date(transaction.game.date).toLocaleDateString("pt-BR")}
              </span>
            )}
          </div>
          {transaction.notes && (
            <p className="mt-2 border-l border-white/15 pl-3 text-sm text-slate-300">
              {transaction.notes}
            </p>
          )}
        </div>
        {isAdmin && (
          <div className="flex shrink-0 gap-2 md:opacity-0 md:transition md:group-hover:opacity-100 md:group-focus-within:opacity-100">
            <button
              onClick={() => onEdit(transaction)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-sky-300/30 hover:bg-sky-300/10 hover:text-sky-100"
            >
              <PencilLine size={15} aria-hidden="true" /> Editar
            </button>
            <button
              onClick={() => onDeleteRequest(transaction.id)}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-300/20"
            >
              <Trash2 size={15} aria-hidden="true" /> Excluir
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

function EmptyTransactions({
  hasActiveFilters,
}: {
  hasActiveFilters: boolean;
}) {
  return (
    <div className="flex min-h-60 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/20 px-6 text-center">
      <Receipt size={30} className="text-slate-500" aria-hidden="true" />
      <p className="mt-3 text-sm font-semibold text-slate-300">
        Nenhum lançamento encontrado
      </p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
        {hasActiveFilters
          ? "Ajuste os filtros para ampliar a busca."
          : "Os próximos lançamentos registrados aparecerão aqui."}
      </p>
    </div>
  );
}

function formatPaymentMethod(paymentMethod: Transaction["paymentMethod"]) {
  return paymentMethod === "CARTAO"
    ? "Cartão"
    : paymentMethod.charAt(0) + paymentMethod.slice(1).toLowerCase();
}
