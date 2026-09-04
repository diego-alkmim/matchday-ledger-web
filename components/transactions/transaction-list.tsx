import type { Category, Game, Transaction, TransactionFilters } from "../../app/lancamentos/types";

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
  return (
    <div className="rounded border border-slate-800 bg-slate-900 p-4">
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <h2 className="font-semibold">Lançamentos</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <select className="rounded bg-slate-800 px-3 py-2 text-sm" value={filters.gameId} onChange={(event) => onFiltersChange({ ...filters, gameId: event.target.value })}>
            <option value="">Todos os jogos</option>
            {games.map((game) => <option key={game.id} value={game.id}>{(game.opponent || "Sem adversário") + " - " + new Date(game.date).toLocaleDateString("pt-BR")}</option>)}
          </select>
          <select className="rounded bg-slate-800 px-3 py-2 text-sm" value={filters.categoryId} onChange={(event) => onFiltersChange({ ...filters, categoryId: event.target.value })}>
            <option value="">Todas as categorias</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        {items.map((transaction) => <TransactionCard key={transaction.id} transaction={transaction} isAdmin={isAdmin} onEdit={onEdit} onDeleteRequest={onDeleteRequest} />)}
        {!items.length && <div className="text-sm text-slate-400">Nenhum lançamento encontrado para os filtros informados.</div>}
      </div>
    </div>
  );
}

function TransactionCard({ transaction, isAdmin, onEdit, onDeleteRequest }: { transaction: Transaction; isAdmin: boolean; onEdit: (transaction: Transaction) => void; onDeleteRequest: (id: string) => void }) {
  const isEntry = transaction.type === "ENTRADA";
  return (
    <div className={`flex flex-col rounded border px-3 py-2 md:flex-row md:items-center md:justify-between ${isEntry ? "border-emerald-600/60 bg-emerald-950/40" : "border-rose-600/60 bg-rose-950/30"}`}>
      <div>
        <div className="flex items-center gap-2 font-semibold text-slate-100">
          {transaction.category?.name.toUpperCase() || "SEM CATEGORIA"}
          <span className={`rounded-full border px-2 py-0.5 text-xs ${isEntry ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-200" : "border-rose-500/40 bg-rose-500/20 text-rose-200"}`}>{transaction.type}</span>
        </div>
        <div className="text-sm text-slate-300">R${Number(transaction.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} • {transaction.paymentMethod}</div>
        <div className="text-xs text-slate-500">{transaction.notes ? `• ${transaction.notes}` : ""}</div>
        {transaction.game && <div className="text-xs text-slate-500">Jogo: {transaction.game.opponent || "Sem adversário"} - {new Date(transaction.game.date).toLocaleDateString()}</div>}
      </div>
      {isAdmin && <div className="mt-2 flex gap-2 md:mt-0"><button onClick={() => onEdit(transaction)} className="rounded bg-slate-700 px-3 py-1 text-sm hover:bg-slate-600">Editar</button><button onClick={() => onDeleteRequest(transaction.id)} className="rounded bg-rose-600 px-3 py-1 text-sm text-white hover:bg-rose-500">Excluir</button></div>}
    </div>
  );
}

