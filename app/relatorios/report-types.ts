export type GameOption = {
  id: string;
  opponent?: string | null;
  location?: string | null;
  date: string;
};

export type AnalyticalTransaction = {
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

export type AnalyticalGame = {
  game: {
    id: string;
    date: string;
    opponent?: string | null;
    location?: string | null;
    status: string;
  };
  totals: { entradas: number; saidas: number; saldo: number };
  transactions: AnalyticalTransaction[];
};

export type ReportPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginatedAnalyticalResponse = {
  items: AnalyticalGame[];
  pagination: ReportPagination;
};

export type AggregatedAnalyticalItem = {
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

type ContributionObligation = {
  id: string;
  type: "GAME" | "MONTH";
  date: string;
  label: string;
  gameId?: string | null;
  opponent?: string | null;
  location?: string | null;
  expectedAmount: number;
};

type DirectorObligationStatus = {
  obligation: ContributionObligation;
  expectedAmount: number;
  paidAmount: number;
  appliedOwnObligationAmount: number;
  appliedFromFutureExcess: number;
  appliedTotal: number;
  missingAmount: number;
  settled: boolean;
  coveredByFutureExcess: boolean;
};

export type ConsolidatedDirector = {
  director: { id: string; name: string; contact?: string | null };
  totals: {
    obligationsCount: number;
    settledObligationsCount: number;
    expectedTotal: number;
    totalPaid: number;
    delta: number;
  };
  status: "EM_DIA" | "ACIMA" | "PENDENTE";
  obligationStatuses: DirectorObligationStatus[];
  missingObligations: DirectorObligationStatus[];
};

export type ConsolidatedResponse = {
  summary: {
    mode: "PER_GAME" | "MONTHLY";
    gamesCount: number;
    obligationsCount: number;
    monthlyContributionPerDirector?: number | null;
    expectedTotalPerDirector: number;
  };
  games: GameOption[];
  obligations: ContributionObligation[];
  directors: ConsolidatedDirector[];
};

export type ReportType = "analytical" | "consolidated";

export type ReportFilters = {
  from: string;
  to: string;
  gameId: string;
};
