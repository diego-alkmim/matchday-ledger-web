import type { ConsolidatedResponse } from "../../app/relatorios/report-types";
import { formatCurrency } from "./report-utils";

const statusTone = {
  EM_DIA: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  ACIMA: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  PENDENTE: "bg-rose-500/15 text-rose-300 border-rose-500/30",
} as const;

const statusLabel = {
  EM_DIA: "Em dia",
  ACIMA: "Acima do esperado",
  PENDENTE: "Pendente",
} as const;

export function ConsolidatedDirectorReport({ data }: { data: ConsolidatedResponse }) {
  const delinquentDirectors = data.directors.filter((entry) => entry.status === "PENDENTE");
  const compliantDirectors = data.directors.filter((entry) => entry.status !== "PENDENTE");
  const totalOutstanding = delinquentDirectors.reduce(
    (sum, entry) =>
      sum +
      entry.missingObligations.reduce(
        (directorSum, obligation) => directorSum + obligation.missingAmount,
        0,
      ),
    0,
  );
  const modeLabel = data.summary.mode === "PER_GAME" ? "Por jogo" : data.summary.mode === "MONTHLY" ? "Por mês" : "Misto";

  return (
    <>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Metric label="Jogos no período" value={String(data.summary.gamesCount)} tone="white" />
        <Metric label="Regra" value={modeLabel} tone="emerald" />
        <Metric
          label="Obrigações no período"
          value={String(data.summary.obligationsCount)}
          tone="white"
        />
        <Metric
          label="Esperado no período"
          value={formatCurrency(data.summary.expectedTotalPerDirector)}
          tone="sky"
        />
        <Metric label="Diretores em dia" value={String(compliantDirectors.length)} tone="emerald" />
        <Metric label="Em aberto" value={formatCurrency(totalOutstanding)} tone="rose" />
      </div>
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Consolidado por diretor</h2>
          <p className="text-sm text-slate-400">
            Valores calculados pelas obrigações e pagamentos registrados no módulo de arrecadações.
          </p>
        </div>
        {data.directors.length ? (
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-900/80 text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Diretor</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Pago</th>
                  <th className="px-4 py-3 text-right font-medium">Esperado</th>
                  <th className="px-4 py-3 text-right font-medium">Diferença</th>
                  <th className="px-4 py-3 text-center font-medium">Obrigações</th>
                  <th className="px-4 py-3 text-left font-medium">Pendências</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data.directors.map((entry) => (
                  <tr key={entry.director.id} className="align-top">
                    <td className="px-4 py-3 text-white">
                      <div className="font-medium">{entry.director.name}</div>
                      {entry.director.contact && (
                        <div className="text-xs text-slate-500">{entry.director.contact}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${statusTone[entry.status]}`}
                      >
                        {statusLabel[entry.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-400">
                      {formatCurrency(entry.totals.totalPaid)}
                    </td>
                    <td className="px-4 py-3 text-right text-sky-400">
                      {formatCurrency(entry.totals.expectedTotal)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right ${entry.totals.delta >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                    >
                      {formatCurrency(entry.totals.delta)}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-300">
                      {entry.totals.settledObligationsCount}/{entry.totals.obligationsCount}
                    </td>
                    <td className="px-4 py-3">
                      {entry.missingObligations.length ? (
                        <div className="flex flex-wrap gap-2">
                          {entry.missingObligations.map((status) => (
                            <span
                              key={status.obligation.id}
                              className="rounded-full border border-rose-500/25 bg-rose-500/10 px-2 py-1 text-xs text-rose-200"
                            >
                              {status.obligation.label} - falta {formatCurrency(status.missingAmount)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-300">Nenhuma</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">
            Nenhum diretor encontrado.
          </div>
        )}
      </section>
    </>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "white" | "emerald" | "sky" | "rose";
}) {
  const toneClass =
    tone === "white"
      ? "text-white"
      : tone === "emerald"
        ? "text-emerald-400"
        : tone === "sky"
          ? "text-sky-400"
          : "text-rose-400";
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`text-xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
