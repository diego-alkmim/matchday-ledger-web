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

type DirectorGameStatus = {
  game: { id: string; date: string; opponent?: string | null; location?: string | null };
  expectedAmount: number;
  paidAmount: number;
  appliedOwnGameAmount: number;
  appliedFromFutureExcess: number;
  appliedTotal: number;
  missingAmount: number;
  settled: boolean;
  coveredByFutureExcess: boolean;
};

export type ConsolidatedDirector = {
  director: { id: string; name: string; contact?: string | null };
  totals: {
    gamesCount: number;
    paidGamesCount: number;
    expectedPerGame: number;
    expectedTotal: number;
    totalPaid: number;
    delta: number;
  };
  status: "EM_DIA" | "ACIMA" | "PENDENTE";
  gameStatuses: DirectorGameStatus[];
  missingGames: DirectorGameStatus[];
};

export type ConsolidatedResponse = {
  summary: { gamesCount: number; expectedPerGame: number; expectedTotalPerDirector: number };
  games: GameOption[];
  directors: ConsolidatedDirector[];
};

export type ReportType = "analytical" | "consolidated";

export type ReportFilters = {
  from: string;
  to: string;
  gameId: string;
  expectedPerGame: string;
};
