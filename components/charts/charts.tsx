"use client";

import { useEffect, useRef, useState } from "react";
import api from "../../app/api-client";
import { ApiEnvelope } from "../../lib/api-types";
import { ArrowDownRight, ArrowUpRight, BarChart3, WalletCards } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    const loadCharts = async () => {
      try {
        const [monthlyResponse, categoryResponse] = await Promise.all([
          api.get<ApiEnvelope<MonthlyApiRow[]>>(
            "/reports/monthly?from=2024-01-01&to=2030-01-01",
          ),
          api.get<ApiEnvelope<CategoryApiRow[]>>(
            "/reports/by-category?from=2024-01-01&to=2030-01-01",
          ),
        ]);
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
        setByCat(
          (categoryResponse.data.data || [])
            .map((row) => ({
              name: row.name || row.category || "",
              total: Number(row.total || 0),
            }))
            .filter((row) => row.total > 0 && Boolean(row.name)),
        );
      } catch {
        setLoadError(true);
      } finally {
        setLoading(false);
      }
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
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Central financeira</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Visão geral</h1>
          <p className="mt-2 text-sm text-slate-400">Acompanhe o caixa e o ritmo financeiro do time.</p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Dados consolidados
        </div>
      </header>

      {loadError ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-5 text-sm text-rose-100">
          Não foi possível carregar os indicadores do dashboard. Tente atualizar a página.
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <MetricCard label="Caixa atual" value={formatCurrency(caixa)} icon={WalletCards} tone="emerald" loading={loading} />
            <MetricCard label="Entradas" value={formatCurrency(totals.entradas)} icon={ArrowUpRight} tone="sky" loading={loading} />
            <MetricCard label="Saídas" value={formatCurrency(totals.saidas)} icon={ArrowDownRight} tone="rose" loading={loading} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-6">
            <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/10 backdrop-blur-sm">
              <ChartHeader title="Gastos por categoria" description="Distribuição das saídas registradas." />
              <div className="h-72 w-full">
                {byCat.length ? (
            <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                <Pie data={byCat} dataKey="total" nameKey="name" startAngle={90} endAngle={-270} innerRadius={45} outerRadius={95} paddingAngle={6} minAngle={8} labelLine={false} label={false}>
                  {byCat.map((category, index) => (
                    <Cell key={category.name} fill={palette[index % palette.length]} />
                  ))}
                  <LabelList position="inside" className="fill-slate-100 text-xs" dataKey="total" formatter={(value: number | string) => formatCurrency(Number(value || 0), 0)} />
                </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(value: number | string, name: string) => [formatCurrency(Number(value || 0)), name]} />
                <Legend verticalAlign="bottom" wrapperStyle={{ marginTop: 10, marginBottom: -10 }} />
              </PieChart>
            </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </div>
            </section>
            <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/10 backdrop-blur-sm">
              <ChartHeader title="Entradas x saídas" description="Evolução mensal dos lançamentos." />
              <div className="h-72 w-full">
                {monthly.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="monthLabel" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={tooltipStyle} formatter={(value: number | string) => formatCurrency(Number(value || 0))} />
                <Bar dataKey="entradas" stackId="a" fill="#10b981" />
                <Bar dataKey="saidas" stackId="a" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: "#0f172a",
  border: "1px solid rgba(148, 163, 184, 0.25)",
  borderRadius: "12px",
  color: "#e2e8f0",
};

function MetricCard({
  label,
  value,
  icon: Icon,
  tone,
  loading,
}: {
  label: string;
  value: string;
  icon: typeof WalletCards;
  tone: "emerald" | "sky" | "rose";
  loading: boolean;
}) {
  const tones = {
    emerald: "bg-emerald-300/10 text-emerald-300",
    sky: "bg-sky-300/10 text-sky-300",
    rose: "bg-rose-300/10 text-rose-300",
  };

  return (
    <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-black/10">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-slate-400">{label}</p>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon size={19} aria-hidden="true" />
        </span>
      </div>
      {loading ? <div className="mt-5 h-9 w-40 animate-pulse rounded-lg bg-slate-800" /> : <p className="mt-5 text-2xl font-bold tracking-tight text-white">{value}</p>}
    </article>
  );
}

function ChartHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-base font-bold text-white">{title}</h2>
      <p className="mt-1 text-sm text-slate-400">{description}</p>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-700/80 bg-slate-950/20 px-6 text-center">
      <BarChart3 size={28} className="text-slate-500" aria-hidden="true" />
      <p className="mt-3 text-sm font-semibold text-slate-300">Ainda não há dados para exibir</p>
      <p className="mt-1 text-xs text-slate-500">Os gráficos serão atualizados após os próximos lançamentos.</p>
    </div>
  );
}
