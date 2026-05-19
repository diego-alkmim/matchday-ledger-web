"use client";

import { useEffect, useMemo, useState } from "react";
import api from "../api-client";
import { ProtectedPage } from "../../components/nav/sidebar";
import { toast } from "sonner";

type GameOption = {
  id: string;
  opponent?: string | null;
  location?: string | null;
  date: string;
};

type AnalyticalTransaction = {
  id: string;
  type: "ENTRADA" | "SAIDA";
  amount: number;
  paymentMethod: string;
  notes?: string | null;
  createdAt: string;
  date: string;
  category?: string | null;
  categoryType?: "ENTRADA" | "SAIDA" | null;
  director?: string | null;
};

type AnalyticalGame = {
  game: {
    id: string;
    date: string;
    opponent?: string | null;
    location?: string | null;
    status: string;
  };
  totals: {
    entradas: number;
    saidas: number;
    saldo: number;
  };
  transactions: AnalyticalTransaction[];
};

type AggregatedAnalyticalItem = {
  key: string;
  type: "ENTRADA" | "SAIDA";
  category: string;
  categoryType?: "ENTRADA" | "SAIDA" | null;
  amount: number;
  count: number;
  latestCreatedAt: string;
  paymentMethods: string[];
  notes: string[];
  directors: string[];
};

type ConsolidatedPayment = {
  id: string;
  amount: number;
  createdAt: string;
  date: string;
  notes?: string | null;
  paymentMethod: string;
  game?: {
    id: string;
    date: string;
    opponent?: string | null;
    location?: string | null;
  } | null;
  category?: string | null;
};

type ConsolidatedDirector = {
  director: {
    id: string;
    name: string;
    contact?: string | null;
  };
  totals: {
    gamesCount: number;
    paidGamesCount: number;
    expectedPerGame: number;
    expectedTotal: number;
    totalPaid: number;
    delta: number;
  };
  status: "EM_DIA" | "ACIMA" | "PENDENTE";
  gameStatuses: Array<{
    game: {
      id: string;
      date: string;
      opponent?: string | null;
      location?: string | null;
    };
    expectedAmount: number;
    paidAmount: number;
    appliedOwnGameAmount: number;
    appliedFromFutureExcess: number;
    appliedTotal: number;
    missingAmount: number;
    settled: boolean;
    coveredByFutureExcess: boolean;
  }>;
  missingGames: Array<{
    game: {
      id: string;
      date: string;
      opponent?: string | null;
      location?: string | null;
    };
    expectedAmount: number;
    paidAmount: number;
    appliedOwnGameAmount: number;
    appliedFromFutureExcess: number;
    appliedTotal: number;
    missingAmount: number;
    settled: boolean;
    coveredByFutureExcess: boolean;
  }>;
  payments: ConsolidatedPayment[];
};

type ConsolidatedResponse = {
  summary: {
    gamesCount: number;
    expectedPerGame: number;
    expectedTotalPerDirector: number;
  };
  games: Array<{
    id: string;
    date: string;
    opponent?: string | null;
    location?: string | null;
  }>;
  directors: ConsolidatedDirector[];
};

type ReportType = "analytical" | "consolidated";

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function aggregateTransactionsByCategory(
  transactions: AnalyticalTransaction[],
): AggregatedAnalyticalItem[] {
  const grouped = new Map<string, AggregatedAnalyticalItem>();

  for (const transaction of transactions) {
    const category = transaction.category || "Sem categoria";
    const key = `${transaction.type}::${category}`;
    const current = grouped.get(key) ?? {
      key,
      type: transaction.type,
      category,
      categoryType: transaction.categoryType,
      amount: 0,
      count: 0,
      latestCreatedAt: transaction.createdAt,
      paymentMethods: [],
      notes: [],
      directors: [],
    };

    current.amount += transaction.amount;
    current.count += 1;

    if (
      new Date(transaction.createdAt).getTime() >
      new Date(current.latestCreatedAt).getTime()
    ) {
      current.latestCreatedAt = transaction.createdAt;
    }

    if (!current.paymentMethods.includes(transaction.paymentMethod)) {
      current.paymentMethods.push(transaction.paymentMethod);
    }

    if (transaction.notes && !current.notes.includes(transaction.notes)) {
      current.notes.push(transaction.notes);
    }

    if (
      transaction.director &&
      !current.directors.includes(transaction.director)
    ) {
      current.directors.push(transaction.director);
    }

    grouped.set(key, current);
  }

  return Array.from(grouped.values()).sort((a, b) => b.amount - a.amount);
}

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

const reportOptions: Array<{
  id: ReportType;
  title: string;
  description: string;
}> = [
  {
    id: "analytical",
    title: "Analítico por jogo",
    description:
      "Detalha entradas e saídas por jogo, com agrupamento por categoria.",
  },
  {
    id: "consolidated",
    title: "Consolidado por diretor",
    description:
      "Mostra adimplência dos diretores considerando apenas a categoria Diretoria.",
  },
];

export default function RelatoriosPage() {
  const [games, setGames] = useState<GameOption[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [reportLoaded, setReportLoaded] = useState<Record<ReportType, boolean>>(
    {
      analytical: false,
      consolidated: false,
    },
  );
  const [loading, setLoading] = useState(false);
  const [analytical, setAnalytical] = useState<AnalyticalGame[]>([]);
  const [consolidated, setConsolidated] = useState<ConsolidatedResponse | null>(
    null,
  );
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    gameId: "",
    expectedPerGame: "70",
  });

  useEffect(() => {
    const loadGames = async () => {
      try {
        setGamesLoading(true);
        const response = await api.get("/games");
        setGames(response.data.data || []);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Erro ao carregar jogos");
      } finally {
        setGamesLoading(false);
      }
    };

    loadGames();
  }, []);

  const buildAnalyticalQuery = () => {
    const params = new URLSearchParams();
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (filters.gameId) params.set("gameId", filters.gameId);
    return params.toString();
  };

  const buildConsolidatedQuery = () => {
    const params = new URLSearchParams();
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    params.set(
      "expectedPerGame",
      String(Number(filters.expectedPerGame || "70") || 70),
    );
    return params.toString();
  };

  const loadSelectedReport = async () => {
    if (!selectedReport) {
      toast.error("Selecione um relatório antes de aplicar os filtros");
      return;
    }

    try {
      setLoading(true);

      if (selectedReport === "analytical") {
        const query = buildAnalyticalQuery();
        const response = await api.get(
          `/reports/analytical-by-game${query ? `?${query}` : ""}`,
        );
        setAnalytical(response.data.data || []);
        setReportLoaded((current) => ({ ...current, analytical: true }));
        return;
      }

      const response = await api.get(
        `/reports/consolidated-by-director?${buildConsolidatedQuery()}`,
      );
      setConsolidated(response.data.data || null);
      setReportLoaded((current) => ({ ...current, consolidated: true }));
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Erro ao carregar relatório",
      );
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    await loadSelectedReport();
  };

  const delinquentDirectors = useMemo(
    () =>
      consolidated?.directors.filter((entry) => entry.status === "PENDENTE") ??
      [],
    [consolidated],
  );

  const compliantDirectors = useMemo(
    () =>
      consolidated?.directors.filter((entry) => entry.status !== "PENDENTE") ??
      [],
    [consolidated],
  );

  const totalOutstanding = useMemo(
    () =>
      delinquentDirectors.reduce(
        (sum, entry) =>
          sum +
          entry.missingGames.reduce(
            (directorSum, game) => directorSum + game.missingAmount,
            0,
          ),
        0,
      ),
    [delinquentDirectors],
  );

  const showAnalytical = selectedReport === "analytical";
  const showConsolidated = selectedReport === "consolidated";

  return (
    <ProtectedPage>
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-white">Relatórios</h1>
              <p className="text-sm text-slate-400">
                Selecione o relatório que deseja consultar e carregue os dados
                sob demanda.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {reportOptions.map((option) => {
              const active = selectedReport === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedReport(option.id)}
                  className={`rounded-xl border p-4 text-left transition ${
                    active
                      ? "border-emerald-500/60 bg-emerald-500/10"
                      : "border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-800/70"
                  }`}
                >
                  <p className="text-base font-semibold text-white">
                    {option.title}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 md:p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-white">Filtros</h2>
            <p className="text-sm text-slate-400">
              Os dados só são carregados depois de selecionar o relatório e
              aplicar os filtros.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <input
              type="date"
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
              value={filters.from}
              onChange={(e) =>
                setFilters((current) => ({ ...current, from: e.target.value }))
              }
            />
            <input
              type="date"
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
              value={filters.to}
              onChange={(e) =>
                setFilters((current) => ({ ...current, to: e.target.value }))
              }
            />

            {showAnalytical ? (
              <select
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                value={filters.gameId}
                onChange={(e) =>
                  setFilters((current) => ({
                    ...current,
                    gameId: e.target.value,
                  }))
                }
                disabled={gamesLoading}
              >
                <option value="">Todos os jogos</option>
                {games.map((game) => (
                  <option key={game.id} value={game.id}>
                    {(game.opponent || "Sem advers?rio") +
                      " - " +
                      formatDate(game.date)}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                min="0"
                step="0.01"
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                value={filters.expectedPerGame}
                onChange={(e) =>
                  setFilters((current) => ({
                    ...current,
                    expectedPerGame: e.target.value,
                  }))
                }
                placeholder="Valor esperado por jogo"
              />
            )}

            <button
              onClick={applyFilters}
              disabled={loading || !selectedReport}
              className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Carregando..." : "Aplicar filtros"}
            </button>
          </div>
        </div>

        {!selectedReport && (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-6 text-sm text-slate-400">
            Escolha um relatório para carregar os dados.
          </div>
        )}

        {showConsolidated && reportLoaded.consolidated && consolidated && (
          <>
            <div className="grid gap-3 md:grid-cols-5">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-sm text-slate-400">Jogos no período</p>
                <p className="text-2xl font-semibold text-white">
                  {consolidated.summary.gamesCount}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-sm text-slate-400">
                  Valor esperado por jogo
                </p>
                <p className="text-2xl font-semibold text-emerald-400">
                  {formatCurrency(consolidated.summary.expectedPerGame)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-sm text-slate-400">
                  Esperado por diretor no período
                </p>
                <p className="text-2xl font-semibold text-sky-400">
                  {formatCurrency(
                    consolidated.summary.expectedTotalPerDirector,
                  )}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-sm text-slate-400">Diretores em dia</p>
                <p className="text-2xl font-semibold text-emerald-400">
                  {compliantDirectors.length}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-sm text-slate-400">Em aberto</p>
                <p className="text-2xl font-semibold text-rose-400">
                  {formatCurrency(totalOutstanding)}
                </p>
              </div>
            </div>

            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Consolidado por diretor
                </h2>
                <p className="text-sm text-slate-400">
                  Visão de adimplência considerando apenas entradas da categoria
                  Diretoria.
                </p>
              </div>

              {!!consolidated.directors.length && (
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
                  <table className="min-w-full divide-y divide-slate-800 text-sm">
                    <thead className="bg-slate-900/80 text-slate-400">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">
                          Diretor
                        </th>
                        <th className="px-4 py-3 text-left font-medium">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          Pago
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          Esperado
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          Diferença
                        </th>
                        <th className="px-4 py-3 text-center font-medium">
                          Jogos
                        </th>
                        <th className="px-4 py-3 text-left font-medium">
                          Pend?ncias
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {consolidated.directors.map((entry) => (
                        <tr key={entry.director.id} className="align-top">
                          <td className="px-4 py-3 text-white">
                            <div className="font-medium">
                              {entry.director.name}
                            </div>
                            {entry.director.contact && (
                              <div className="text-xs text-slate-500">
                                {entry.director.contact}
                              </div>
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
                            className={`px-4 py-3 text-right ${
                              entry.totals.delta >= 0
                                ? "text-emerald-400"
                                : "text-rose-400"
                            }`}
                          >
                            {formatCurrency(entry.totals.delta)}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-300">
                            {entry.totals.paidGamesCount}/
                            {entry.totals.gamesCount}
                          </td>
                          <td className="px-4 py-3">
                            {entry.missingGames.length ? (
                              <div className="flex flex-wrap gap-2">
                                {entry.missingGames.map((game) => (
                                  <span
                                    key={game.game.id}
                                    className="rounded-full border border-rose-500/25 bg-rose-500/10 px-2 py-1 text-xs text-rose-200"
                                  >
                                    {(game.game.opponent || "Sem advers?rio") +
                                      " - falta " +
                                      formatCurrency(game.missingAmount)}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-emerald-300">
                                Nenhuma
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!consolidated.directors.length && (
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">
                  Nenhum diretor encontrado.
                </div>
              )}
            </section>
          </>
        )}

        {showConsolidated && !reportLoaded.consolidated && !loading && (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-6 text-sm text-slate-400">
            Selecione os filtros e clique em aplicar para carregar o
            consolidado.
          </div>
        )}

        {showAnalytical && reportLoaded.analytical && (
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Analítico por jogo
              </h2>
              <p className="text-sm text-slate-400">
                Entradas e saídas detalhadas, incluindo observação, categoria e
                destino/responsável.
              </p>
            </div>

            {!analytical.length && !loading && (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">
                Nenhum jogo encontrado para os filtros informados.
              </div>
            )}

            {analytical.map((entry) => (
              <div
                key={entry.game.id}
                className="rounded-xl border border-slate-800 bg-slate-900 p-4"
              >
                <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      {entry.game.opponent || "Jogo sem advers?rio"}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {formatDate(entry.game.date)}
                      {entry.game.location ? ` - ${entry.game.location}` : ""}
                      {entry.game.status ? ` - ${entry.game.status}` : ""}
                    </p>
                  </div>
                  <div className="grid gap-2 md:grid-cols-3">
                    <MetricCard
                      label="Entradas"
                      value={formatCurrency(entry.totals.entradas)}
                      tone="emerald"
                    />
                    <MetricCard
                      label="Saídas"
                      value={formatCurrency(entry.totals.saidas)}
                      tone="rose"
                    />
                    <MetricCard
                      label="Saldo"
                      value={formatCurrency(entry.totals.saldo)}
                      tone={entry.totals.saldo >= 0 ? "sky" : "amber"}
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {entry.transactions.length ? (
                    aggregateTransactionsByCategory(entry.transactions).map(
                      (transaction) => {
                        const targetLabel =
                          transaction.type === "ENTRADA"
                            ? transaction.directors.join(", ") ||
                              transaction.notes.join(", ") ||
                              "Não informado"
                            : transaction.notes.join(", ") ||
                              transaction.directors.join(", ") ||
                              "Não informado";

                        return (
                          <div
                            key={transaction.key}
                            className={`rounded-lg border px-3 py-3 ${
                              transaction.type === "ENTRADA"
                                ? "border-emerald-700/50 bg-emerald-950/20"
                                : "border-rose-700/50 bg-rose-950/20"
                            }`}
                          >
                            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-semibold text-white">
                                    {transaction.category || "Sem categoria"}
                                  </span>
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                      transaction.type === "ENTRADA"
                                        ? "bg-emerald-500/20 text-emerald-200"
                                        : "bg-rose-500/20 text-rose-200"
                                    }`}
                                  >
                                    {transaction.type}
                                  </span>
                                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                                    {transaction.count} lançamento
                                    {transaction.count > 1 ? "s" : ""}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-300">
                                  {transaction.type === "ENTRADA"
                                    ? "Quem pagou"
                                    : "Destino"}{" "}
                                  : {targetLabel}
                                </p>
                                <p className="text-xs text-slate-400">
                                  Último lançamento em{" "}
                                  {formatDateTime(transaction.latestCreatedAt)}{" "}
                                  - {transaction.paymentMethods.join(", ")}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold text-white">
                                  {formatCurrency(transaction.amount)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      },
                    )
                  ) : (
                    <div className="text-sm text-slate-400">
                      Nenhum lançamento neste jogo.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {showAnalytical && !reportLoaded.analytical && !loading && (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-6 text-sm text-slate-400">
            Selecione os filtros e clique em aplicar para carregar o analítico.
          </div>
        )}
      </div>
    </ProtectedPage>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "rose" | "sky" | "amber";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-400"
      : tone === "rose"
        ? "text-rose-400"
        : tone === "sky"
          ? "text-sky-400"
          : "text-amber-400";

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-800/70 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`text-sm font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
