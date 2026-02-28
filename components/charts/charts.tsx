"use client";
import { useEffect, useRef, useState } from "react";
import api from "../../app/api-client";
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

const palette = [
  "#10b981",
  "#f59e0b",
  "#3b82f6",
  "#ef4444",
  "#8b5cf6",
  "#22d3ee",
];

export default function Charts() {
  const [monthly, setMonthly] = useState<any[]>([]);
  const [byCat, setByCat] = useState<any[]>([]);
  const loaded = useRef(false);

  const formatMonth = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
  };

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    (async () => {
      const m = await api.get("/reports/monthly?from=2024-01-01&to=2030-01-01");
      const mapped = (m.data.data || []).map((row: any) => ({
        ...row,
        entradas: Number(row.entradas || 0),
        saidas: Number(row.saidas || 0),
        monthLabel: formatMonth(
          row.month || row.date || row.monthLabel || row.monthly,
        ),
      }));
      setMonthly(mapped);
      const c = await api.get(
        "/reports/by-category?from=2024-01-01&to=2030-01-01",
      );
      const catMapped = (c.data.data || [])
        .map((row: any) => ({
          name: row.name || row.category || "",
          total: Number(row.total || 0),
        }))
        .filter((r: any) => r.total > 0 && r.name);
      setByCat(catMapped);
    })();
  }, []);

  const totals = monthly.reduce(
    (acc, cur) => {
      acc.entradas += Number(cur.entradas || 0);
      acc.saidas += Number(cur.saidas || 0);
      return acc;
    },
    { entradas: 0, saidas: 0 },
  );
  const caixa = totals.entradas - totals.saidas;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 rounded-lg bg-slate-900 p-4 shadow border border-slate-800">
          <p className="text-sm text-slate-300">Caixa</p>
          <p className="text-3xl font-semibold text-emerald-400">
            {caixa.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </p>
        </div>
        <div className="rounded-lg bg-slate-900 p-4 shadow border border-slate-800">
          <p className="text-sm text-slate-300">Receitas</p>
          <p className="text-2xl font-semibold text-emerald-400">
            {totals.entradas.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </p>
        </div>
        <div className="rounded-lg bg-slate-900 p-4 shadow border border-slate-800">
          <p className="text-sm text-slate-300">Despesas</p>
          <p className="text-2xl font-semibold text-rose-400">
            {totals.saidas.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
        <div className="rounded-lg bg-slate-900 p-4 shadow order-1 md:order-none">
          <h3 className="mb-2 font-semibold">Gastos por categoria</h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                <Pie
                  data={byCat}
                  dataKey="total"
                  nameKey="name"
                  startAngle={90}
                  endAngle={-270}
                  innerRadius={45}
                  outerRadius={95}
                  paddingAngle={6}
                  minAngle={8}
                  labelLine={false}
                  label={false}
                >
                  {byCat.map((_, i) => (
                    <Cell key={i} fill={palette[i % palette.length]} />
                  ))}
                  <LabelList
                    position="inside"
                    className="text-xs fill-slate-100"
                    dataKey="total"
                    formatter={(value: number) =>
                      Number(value || 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                        minimumFractionDigits: 0,
                      })
                    }
                  />
                </Pie>
                <Tooltip
                  formatter={(value: number, _name: string, entry: any) => [
                    Number(value || 0).toLocaleString("pt-BR"),
                    entry?.name ?? "",
                  ]}
                />
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{ marginTop: 10, marginBottom: -10 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-lg bg-slate-900 p-4 shadow order-2 md:order-none">
          <h3 className="mb-2 font-semibold">Entradas x Saídas (mensal)</h3>
          <div className="w-full h-64">
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
