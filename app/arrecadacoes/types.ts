export type MemberRole = "DIRECTOR" | "PLAYER";
export type CollectionFrequency = "PER_GAME" | "MONTHLY";
export type PaymentMethod = "PIX" | "DINHEIRO" | "CARTAO";

export type Member = {
  id: string;
  name: string;
  contact?: string;
  active: boolean;
  roles: Array<{ role: MemberRole; startsAt: string; endsAt?: string }>;
};

export type Plan = {
  id: string;
  name: string;
  audienceRole: MemberRole;
  frequency: CollectionFrequency;
  priority: number;
  dueDay?: number;
  active: boolean;
  category: { id: string; name: string };
  rates: Array<{ amount: number; effectiveFrom: string }>;
};

export type Obligation = {
  id: string;
  dueDate: string;
  competence?: string;
  status: "OPEN" | "PARTIAL" | "PAID" | "WAIVED" | "CANCELLED";
  expectedAmount: number;
  allocatedAmount: number;
  member: { id: string; name: string };
  plan: { id: string; name: string };
  game?: { opponent?: string; date: string };
};

export type Payment = {
  id: string;
  amount: number;
  createdAt: string;
  member: { name: string };
  plan: { name: string };
  transaction: { date: string; paymentMethod: PaymentMethod };
  allocations: Array<{ amount: number }>;
};

export type CollectionSummary = {
  obligations: Obligation[];
  payments: Payment[];
  totals: { expected: number; received: number; allocated: number; credit: number; pending: number };
};

export type Category = { id: string; name: string; type: "ENTRADA" | "SAIDA" };
export type Game = { id: string; opponent?: string; date: string; status: "ABERTO" | "FECHADO" };
