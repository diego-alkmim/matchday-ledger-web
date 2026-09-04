export type PaymentMethod = "PIX" | "DINHEIRO" | "CARTAO";

export interface Transaction {
  id: string;
  type: "ENTRADA" | "SAIDA";
  amount: number;
  date: string;
  createdAt?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  game?: { id: string; opponent?: string | null; date: string };
  category?: { id: string; name: string; type?: "ENTRADA" | "SAIDA" };
  director?: { id: string; name: string };
}

export interface Category {
  id: string;
  name: string;
  type?: "ENTRADA" | "SAIDA";
}

export interface Game {
  id: string;
  opponent?: string | null;
  date: string;
  location?: string | null;
  status?: "ABERTO" | "FECHADO";
}

export interface Director {
  id: string;
  name: string;
}

export type TransactionFilters = { gameId: string; categoryId: string };

export type TransactionFormData = {
  amountDisplay: string;
  amount: number;
  categoryId: string;
  gameId: string;
  paymentMethod: PaymentMethod;
  date: string;
  notes: string;
  directorId: string;
};
