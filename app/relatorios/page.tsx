"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ProtectedPage } from "../../components/nav/sidebar";
import { AnalyticalGameReport } from "../../components/reports/analytical-game-report";
import { ConsolidatedDirectorReport } from "../../components/reports/consolidated-director-report";
import { ReportControls } from "../../components/reports/report-controls";
import api from "../api-client";
import { ApiEnvelope, getApiErrorMessage } from "../../lib/api-types";
import type { AnalyticalGame, ConsolidatedResponse, GameOption, ReportFilters, ReportType } from "./report-types";

const initialFilters: ReportFilters = { from: "", to: "", gameId: "", expectedPerGame: "70" };

export default function RelatoriosPage() {
  const [games, setGames] = useState<GameOption[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [reportLoaded, setReportLoaded] = useState<Record<ReportType, boolean>>({ analytical: false, consolidated: false });
  const [loading, setLoading] = useState(false);
  const [analytical, setAnalytical] = useState<AnalyticalGame[]>([]);
  const [consolidated, setConsolidated] = useState<ConsolidatedResponse | null>(null);
  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    const loadGames = async () => {
      try {
        setGamesLoading(true);
        const response = await api.get<ApiEnvelope<GameOption[]>>("/games");
        setGames(response.data.data || []);
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Erro ao carregar jogos"));
      } finally {
        setGamesLoading(false);
      }
    };
    void loadGames();
  }, []);

  const buildQuery = (includeGame: boolean) => {
    const params = new URLSearchParams();
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (includeGame && filters.gameId) params.set("gameId", filters.gameId);
    if (!includeGame) params.set("expectedPerGame", String(Number(filters.expectedPerGame || "70") || 70));
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
        const query = buildQuery(true);
        const response = await api.get<ApiEnvelope<AnalyticalGame[]>>(`/reports/analytical-by-game${query ? `?${query}` : ""}`);
        setAnalytical(response.data.data || []);
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
        {showAnalytical && !reportLoaded.analytical && !loading && <EmptyState>Selecione os filtros e clique em aplicar para carregar o analítico.</EmptyState>}
      </div>
    </ProtectedPage>
  );
}

function EmptyState({ children }: { children: string }) {
  return <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-6 text-sm text-slate-400">{children}</div>;
}
