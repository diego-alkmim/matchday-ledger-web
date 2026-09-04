import type { GameOption, ReportFilters, ReportType } from "../../app/relatorios/report-types";
import { formatDate } from "./report-utils";

type ReportControlsProps = {
  selectedReport: ReportType | null;
  filters: ReportFilters;
  games: GameOption[];
  gamesLoading: boolean;
  loading: boolean;
  onSelect: (report: ReportType) => void;
  onFiltersChange: (filters: ReportFilters) => void;
  onApply: () => void;
};

const reportOptions: Array<{ id: ReportType; title: string; description: string }> = [
  {
    id: "analytical",
    title: "Analítico por jogo",
    description: "Detalha entradas e saídas por jogo, com agrupamento por categoria.",
  },
  {
    id: "consolidated",
    title: "Consolidado por diretor",
    description: "Mostra adimplência dos diretores considerando apenas a categoria Diretoria.",
  },
];

export function ReportControls({
  selectedReport,
  filters,
  games,
  gamesLoading,
  loading,
  onSelect,
  onFiltersChange,
  onApply,
}: ReportControlsProps) {
  const updateFilter = (name: keyof ReportFilters, value: string) => {
    onFiltersChange({ ...filters, [name]: value });
  };

  return (
    <>
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 md:p-5">
        <h1 className="text-xl font-semibold text-white">{"Relatórios"}</h1>
        <p className="text-sm text-slate-400">
          Selecione o relatório que deseja consultar e carregue os dados sob demanda.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {reportOptions.map((option) => {
            const active = selectedReport === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelect(option.id)}
                className={`rounded-xl border p-4 text-left transition ${
                  active
                    ? "border-emerald-500/60 bg-emerald-500/10"
                    : "border-slate-800 bg-slate-900 hover:border-slate-700 hover:bg-slate-800/70"
                }`}
              >
                <p className="text-base font-semibold text-white">{option.title}</p>
                <p className="mt-1 text-sm text-slate-400">{option.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 md:p-5">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-white">Filtros</h2>
          <p className="text-sm text-slate-400">
            Os dados só são carregados depois de selecionar o relatório e aplicar os filtros.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <input type="date" className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100" value={filters.from} onChange={(event) => updateFilter("from", event.target.value)} />
          <input type="date" className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100" value={filters.to} onChange={(event) => updateFilter("to", event.target.value)} />
          {selectedReport === "analytical" ? (
            <select className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100" value={filters.gameId} onChange={(event) => updateFilter("gameId", event.target.value)} disabled={gamesLoading}>
              <option value="">Todos os jogos</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {(game.opponent || "Sem adversário") + " - " + formatDate(game.date)}
                </option>
              ))}
            </select>
          ) : (
            <input type="number" min="0" step="0.01" className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100" value={filters.expectedPerGame} onChange={(event) => updateFilter("expectedPerGame", event.target.value)} placeholder="Valor esperado por jogo" />
          )}
          <button onClick={onApply} disabled={loading || !selectedReport} className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "Carregando..." : "Aplicar filtros"}
          </button>
        </div>
      </div>
    </>
  );
}

