import type { AggregatedAnalyticalItem, AnalyticalTransaction } from "../../app/relatorios/report-types";

export const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

export const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function aggregateTransactionsByCategory(
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
    if (new Date(transaction.createdAt).getTime() > new Date(current.latestCreatedAt).getTime()) {
      current.latestCreatedAt = transaction.createdAt;
    }
    if (!current.paymentMethods.includes(transaction.paymentMethod)) {
      current.paymentMethods.push(transaction.paymentMethod);
    }
    if (transaction.notes && !current.notes.includes(transaction.notes)) {
      current.notes.push(transaction.notes);
    }
    if (transaction.director && !current.directors.includes(transaction.director)) {
      current.directors.push(transaction.director);
    }
    grouped.set(key, current);
  }

  return Array.from(grouped.values()).sort((a, b) => b.amount - a.amount);
}
