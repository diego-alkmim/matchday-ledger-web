import type { AnalyticalGame } from "../../app/relatorios/report-types";
import { aggregateTransactionsByCategory, formatCurrency, formatDate, formatDateTime } from "./report-utils";

export function AnalyticalGameReport({ data }: { data: AnalyticalGame[] }) {
  if (!data.length) {
    return <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">Nenhum jogo encontrado para os filtros informados.</div>;
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Analítico por jogo</h2>
        <p className="text-sm text-slate-400">Entradas e saídas detalhadas, incluindo observação, categoria e destino/responsável.</p>
      </div>
      {data.map((entry) => <AnalyticalGameCard key={entry.game.id} entry={entry} />)}
    </section>
  );
}

function AnalyticalGameCard({ entry }: { entry: AnalyticalGame }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">{entry.game.opponent || "Jogo sem adversário"}</h3>
          <p className="text-sm text-slate-400">{formatDate(entry.game.date)}{entry.game.location ? ` - ${entry.game.location}` : ""}{entry.game.status ? ` - ${entry.game.status}` : ""}</p>
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          <MetricCard label="Entradas" value={formatCurrency(entry.totals.entradas)} tone="emerald" />
          <MetricCard label="Saídas" value={formatCurrency(entry.totals.saidas)} tone="rose" />
          <MetricCard label="Saldo" value={formatCurrency(entry.totals.saldo)} tone={entry.totals.saldo >= 0 ? "sky" : "amber"} />
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {aggregateTransactionsByCategory(entry.transactions).map((transaction) => {
          const targetLabel = transaction.type === "ENTRADA"
            ? transaction.directors.join(", ") || transaction.notes.join(", ") || "Não informado"
            : transaction.notes.join(", ") || transaction.directors.join(", ") || "Não informado";
          return (
            <div key={transaction.key} className={`rounded-lg border px-3 py-3 ${transaction.type === "ENTRADA" ? "border-emerald-700/50 bg-emerald-950/20" : "border-rose-700/50 bg-rose-950/20"}`}>
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-white">{transaction.category || "Sem categoria"}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${transaction.type === "ENTRADA" ? "bg-emerald-500/20 text-emerald-200" : "bg-rose-500/20 text-rose-200"}`}>{transaction.type}</span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{transaction.count} lançamento{transaction.count > 1 ? "s" : ""}</span>
                  </div>
                  <p className="text-sm text-slate-300">{transaction.type === "ENTRADA" ? "Quem pagou" : "Destino"}: {targetLabel}</p>
                  <p className="text-xs text-slate-400">Último lançamento em {formatDateTime(transaction.latestCreatedAt)} - {transaction.paymentMethods.join(", ")}</p>
                </div>
                <p className="text-lg font-semibold text-white">{formatCurrency(transaction.amount)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: "emerald" | "rose" | "sky" | "amber" }) {
  const toneClass = tone === "emerald" ? "text-emerald-400" : tone === "rose" ? "text-rose-400" : tone === "sky" ? "text-sky-400" : "text-amber-400";
  return <div className="rounded-lg border border-slate-800 bg-slate-800/70 px-3 py-2"><p className="text-xs uppercase tracking-wide text-slate-400">{label}</p><p className={`text-sm font-semibold ${toneClass}`}>{value}</p></div>;
}

