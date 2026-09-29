"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ProtectedPage } from "../../components/nav/sidebar";
import { AnalyticalGameReport } from "../../components/reports/analytical-game-report";
import { ConsolidatedDirectorReport } from "../../components/reports/consolidated-director-report";
import { ReportControls } from "../../components/reports/report-controls";
import api from "../api-client";
import { ApiEnvelope, getApiErrorMessage } from "../../lib/api-types";
import type { AnalyticalGame, ConsolidatedResponse, GameOption, PaginatedAnalyticalResponse, ReportFilters, ReportPagination, ReportType } from "./report-types";

const now = new Date();
const currentYear = now.getFullYear();
const initialFilters: ReportFilters = {
  from: `${currentYear}-01-01`,
  to: `${currentYear}-12-31`,
  gameId: "",
};
const initialAnalyticalPagination: ReportPagination = { page: 1, pageSize: 20, total: 0, totalPages: 0 };

export default function RelatoriosPage() {
  const [games, setGames] = useState<GameOption[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [reportLoaded, setReportLoaded] = useState<Record<ReportType, boolean>>({ analytical: false, consolidated: false });
  const [loading, setLoading] = useState(false);
  const [analytical, setAnalytical] = useState<AnalyticalGame[]>([]);
  const [analyticalPagination, setAnalyticalPagination] = useState<ReportPagination>(initialAnalyticalPagination);
  const [consolidated, setConsolidated] = useState<ConsolidatedResponse | null>(null);
  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    const loadGames = async () => {
      try {
        setGamesLoading(true);
        const params = new URLSearchParams({ compact: "true" });
        if (filters.from) params.set("from", filters.from);
        if (filters.to) params.set("to", filters.to);
        const response = await api.get<ApiEnvelope<GameOption[]>>(`/games?${params.toString()}`);
        setGames(response.data.data || []);
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Erro ao carregar jogos"));
      } finally {
        setGamesLoading(false);
      }
    };
    void loadGames();
  }, [filters.from, filters.to]);

  const buildQuery = (includeGame: boolean) => {
    const params = new URLSearchParams();
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (includeGame && filters.gameId) params.set("gameId", filters.gameId);
    return params.toString();
  };

  const loadSelectedReport = async (page = 1) => {
    if (!selectedReport) {
      toast.error("Selecione um relatório antes de aplicar os filtros");
      return;
    }
    if (!filters.from || !filters.to) {
      toast.error("Informe as datas inicial e final do período");
      return;
    }
    try {
      setLoading(true);
      if (selectedReport === "analytical") {
        const query = buildQuery(true);
        const params = new URLSearchParams(query);
        params.set("page", String(page));
        params.set("pageSize", "20");
        const response = await api.get<ApiEnvelope<PaginatedAnalyticalResponse | AnalyticalGame[]>>(`/reports/analytical-by-game?${params.toString()}`);
        const data = response.data.data;
        if (Array.isArray(data)) {
          setAnalytical(data);
          setAnalyticalPagination({
            page: 1,
            pageSize: data.length,
            total: data.length,
            totalPages: 1,
          });
        } else {
          setAnalytical(data?.items || []);
          setAnalyticalPagination(data?.pagination || initialAnalyticalPagination);
        }
        setReportLoaded((current) => ({ ...current, analytical: true }));
        return;
      }
      const response = await api.get<ApiEnvelope<ConsolidatedResponse>>(`/reports/consolidated-by-director?${buildQuery(false)}`);
      setConsolidated(response.data.data || null);
      setReportLoaded((current) => ({ ...current, consolidated: true }));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao carregar relatório"));
    } finally {
      setLoading(false);
    }
  };

  const showAnalytical = selectedReport === "analytical";
  const showConsolidated = selectedReport === "consolidated";

  return (
    <ProtectedPage>
      <div className="space-y-6">
        <ReportControls selectedReport={selectedReport} filters={filters} games={games} gamesLoading={gamesLoading} loading={loading} onSelect={setSelectedReport} onFiltersChange={setFilters} onApply={() => void loadSelectedReport()} />
        {!selectedReport && <EmptyState>Escolha um relatório para carregar os dados.</EmptyState>}
        {showConsolidated && reportLoaded.consolidated && consolidated && <ConsolidatedDirectorReport data={consolidated} />}
        {showConsolidated && !reportLoaded.consolidated && !loading && <EmptyState>Selecione os filtros e clique em aplicar para carregar o consolidado.</EmptyState>}
        {showAnalytical && reportLoaded.analytical && <AnalyticalGameReport data={analytical} />}
        {showAnalytical && reportLoaded.analytical && analyticalPagination.totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm">
            <button type="button" onClick={() => void loadSelectedReport(analyticalPagination.page - 1)} disabled={loading || analyticalPagination.page === 1} className="rounded-lg border border-white/10 px-3 py-2 font-semibold text-slate-200 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40">Anterior</button>
            <span className="text-slate-400">P&aacute;gina {analyticalPagination.page} de {analyticalPagination.totalPages}</span>
            <button type="button" onClick={() => void loadSelectedReport(analyticalPagination.page + 1)} disabled={loading || analyticalPagination.page === analyticalPagination.totalPages} className="rounded-lg border border-white/10 px-3 py-2 font-semibold text-slate-200 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40">Pr&oacute;xima</button>
          </div>
        )}
        {showAnalytical && !reportLoaded.analytical && !loading && <EmptyState>Selecione os filtros e clique em aplicar para carregar o analítico.</EmptyState>}
      </div>
    </ProtectedPage>
  );
}

function EmptyState({ children }: { children: string }) {
  return <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-6 text-sm text-slate-400">{children}</div>;
}
