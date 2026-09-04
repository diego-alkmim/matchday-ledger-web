"use client";

import { useEffect, useRef, useState } from "react";
import api from "../../app/api-client";
import { ApiEnvelope } from "../../lib/api-types";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  LabelList,
} from "recharts";

type MonthlyApiRow = {
  entradas?: number | string;
  saidas?: number | string;
  month_label?: string;
  month?: string;
  date?: string;
  monthLabel?: string;
  monthly?: string;
};

type MonthlyPoint = {
  entradas: number;
  saidas: number;
  monthLabel: string;
};

type CategoryApiRow = {
  name?: string;
  category?: string;
  total?: number | string;
};

type CategoryPoint = {
  name: string;
  total: number;
};

const palette = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#22d3ee"];

const formatCurrency = (value: number, minimumFractionDigits = 2) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits,
  });

const formatMonth = (value: string) => {
  if (/^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, 1));
    return date.toLocaleDateString("pt-BR", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    });
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
};

export default function Charts() {
  const [monthly, setMonthly] = useState<MonthlyPoint[]>([]);
  const [byCat, setByCat] = useState<CategoryPoint[]>([]);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    const loadCharts = async () => {
      const monthlyResponse = await api.get<ApiEnvelope<MonthlyApiRow[]>>(
        "/reports/monthly?from=2024-01-01&to=2030-01-01",
      );
      const monthlyRows = monthlyResponse.data.data || [];
      setMonthly(
        monthlyRows.map((row) => ({
          entradas: Number(row.entradas || 0),
          saidas: Number(row.saidas || 0),
          monthLabel: formatMonth(
            row.month_label || row.month || row.date || row.monthLabel || row.monthly || "",
          ),
        })),
      );

      const categoryResponse = await api.get<ApiEnvelope<CategoryApiRow[]>>(
        "/reports/by-category?from=2024-01-01&to=2030-01-01",
      );
      setByCat(
        (categoryResponse.data.data || [])
          .map((row) => ({
            name: row.name || row.category || "",
            total: Number(row.total || 0),
          }))
          .filter((row) => row.total > 0 && Boolean(row.name)),
      );
    };

    void loadCharts();
  }, []);

  const totals = monthly.reduce(
    (accumulator, current) => ({
      entradas: accumulator.entradas + current.entradas,
      saidas: accumulator.saidas + current.saidas,
    }),
    { entradas: 0, saidas: 0 },
  );
  const caixa = totals.entradas - totals.saidas;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 rounded-lg border border-slate-800 bg-slate-900 p-4 shadow">
          <p className="text-sm text-slate-300">Caixa</p>
          <p className="text-3xl font-semibold text-emerald-400">{formatCurrency(caixa)}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 shadow">
          <p className="text-sm text-slate-300">Receitas</p>
          <p className="text-2xl font-semibold text-emerald-400">{formatCurrency(totals.entradas)}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 shadow">
          <p className="text-sm text-slate-300">Despesas</p>
          <p className="text-2xl font-semibold text-rose-400">{formatCurrency(totals.saidas)}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <div className="order-1 rounded-lg bg-slate-900 p-4 shadow md:order-none">
          <h3 className="mb-2 font-semibold">Gastos por categoria</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                <Pie data={byCat} dataKey="total" nameKey="name" startAngle={90} endAngle={-270} innerRadius={45} outerRadius={95} paddingAngle={6} minAngle={8} labelLine={false} label={false}>
                  {byCat.map((category, index) => (
                    <Cell key={category.name} fill={palette[index % palette.length]} />
                  ))}
                  <LabelList position="inside" className="fill-slate-100 text-xs" dataKey="total" formatter={(value: number | string) => formatCurrency(Number(value || 0), 0)} />
                </Pie>
                <Tooltip formatter={(value: number | string, name: string) => [formatCurrency(Number(value || 0)), name]} />
                <Legend verticalAlign="bottom" wrapperStyle={{ marginTop: 10, marginBottom: -10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="order-2 rounded-lg bg-slate-900 p-4 shadow md:order-none">
          <h3 className="mb-2 font-semibold">Entradas x Saídas (mensal)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="monthLabel" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="entradas" stackId="a" fill="#10b981" />
                <Bar dataKey="saidas" stackId="a" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
