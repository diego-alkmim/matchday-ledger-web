"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Banknote, CalendarClock, CircleDollarSign, Settings2, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { MemberForm, PaymentForm, PlanForm } from "../../components/collections/collection-forms";
import { ProtectedPage } from "../../components/nav/sidebar";
import { EmptyState, PageHeader, Surface, fieldClassName } from "../../components/ui/page-primitives";
import { ApiEnvelope, getApiErrorMessage } from "../../lib/api-types";
import { useAuth } from "../../lib/auth";
import api from "../api-client";
import type { Category, CollectionSummary, Member, MemberRole, Payment, Plan } from "./types";

const today = new Date();
const initialFrom = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
const initialTo = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
const money = (value: number) => Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ArrecadacoesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [tab, setTab] = useState<"ledger" | "members" | "plans">("ledger");
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<CollectionSummary | null>(null);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [loading, setLoading] = useState(false);

  const loadSupport = useCallback(async () => {
    try {
      const [memberRes, planRes, categoryRes] = await Promise.all([
        api.get<ApiEnvelope<Member[]>>("/collections/members"),
        api.get<ApiEnvelope<Plan[]>>("/collections/plans"),
        api.get<ApiEnvelope<Category[]>>("/categories"),
      ]);
      setMembers(memberRes.data.data || []);
      setPlans(planRes.data.data || []);
      setCategories(categoryRes.data.data || []);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Não foi possível carregar as configurações."));
    }
  }, []);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<ApiEnvelope<CollectionSummary>>(`/collections/summary?from=${from}&to=${to}`);
      setSummary(response.data.data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Não foi possível carregar as arrecadações."));
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { void loadSupport(); }, [loadSupport]);
  useEffect(() => {
    if (!isAdmin) {
      void loadSummary();
      return;
    }
    void api.post("/collections/generate", { from, to })
      .then(() => loadSummary())
      .catch((error) => toast.error(getApiErrorMessage(error, "Não foi possível atualizar as obrigações.")));
  }, [from, isAdmin, loadSummary, to]);

  const post = async (url: string, data: Record<string, unknown>, success: string) => {
    try {
      await api.post(url, data);
      toast.success(success);
      await Promise.all([loadSupport(), loadSummary()]);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Não foi possível concluir a operação."));
      throw error;
    }
  };

  const generate = async () => {
    try {
      const response = await api.post<ApiEnvelope<{ created: number }>>("/collections/generate", { from, to });
      toast.success(`${response.data.data.created} obrigação(ões) processada(s).`);
      await loadSummary();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Não foi possível gerar as obrigações."));
    }
  };

  const adjust = async (id: string, type: "WAIVER" | "CANCELLATION") => {
    const reason = window.prompt(type === "WAIVER" ? "Motivo da isenção:" : "Motivo do cancelamento:");
    if (!reason) return;
    await post(`/collections/obligations/${id}/adjustments`, { type, reason }, type === "WAIVER" ? "Obrigação isenta." : "Obrigação cancelada.");
  };

  const monetaryAdjust = async (id: string, type: "DISCOUNT" | "SURCHARGE") => {
    const amount = window.prompt(type === "DISCOUNT" ? "Valor do desconto:" : "Valor do acréscimo:");
    if (!amount) return;
    const reason = window.prompt("Motivo do ajuste:");
    if (!reason) return;
    await post(`/collections/obligations/${id}/adjustments`, { type, amount: Number(amount.replace(",", ".")), reason }, "Obrigação ajustada.");
  };

  const reverse = async (payment: Payment) => {
    const reason = window.prompt("Informe o motivo do estorno:");
    if (!reason) return;
    await post(`/collections/payments/${payment.id}/reverse`, { reason }, "Pagamento estornado e saldos recalculados.");
  };

  const deactivate = async (kind: "members" | "plans", id: string) => {
    if (!window.confirm("Deseja encerrar esta vigência? O histórico será preservado.")) return;
    try {
      await api.patch(`/collections/${kind}/${id}/deactivate`, { date: new Date().toISOString().slice(0, 10) });
      toast.success("Vigência encerrada sem apagar o histórico.");
      await loadSupport();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Não foi possível encerrar a vigência."));
    }
  };

  const addRate = async (plan: Plan) => {
    const amount = window.prompt("Novo valor do plano:");
    if (!amount) return;
    const effectiveFrom = window.prompt("Início da vigência (AAAA-MM-DD):", new Date().toISOString().slice(0, 10));
    if (!effectiveFrom) return;
    await post(`/collections/plans/${plan.id}/rates`, { amount: Number(amount.replace(",", ".")), effectiveFrom }, "Novo valor agendado.");
  };

  const changeRole = async (member: Member, role: MemberRole, action: "add" | "end") => {
    const date = window.prompt(action === "add" ? "Início da função (AAAA-MM-DD):" : "Fim da função (AAAA-MM-DD):", new Date().toISOString().slice(0, 10));
    if (!date) return;
    try {
      if (action === "add") await api.post(`/collections/members/${member.id}/roles`, { role, date });
      else await api.patch(`/collections/members/${member.id}/roles/end`, { role, date });
      toast.success(action === "add" ? "Função adicionada." : "Função encerrada sem apagar o histórico.");
      await loadSupport();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Não foi possível alterar a função."));
    }
  };

  return <ProtectedPage><div className="space-y-6">
    <PageHeader eyebrow="Financeiro recorrente" title="Arrecadações" description="Controle obrigações, mensalidades, pagamentos, créditos e estornos sem perder o histórico." />
    <nav className="flex flex-wrap gap-2">{([
      ["ledger", "Painel", CircleDollarSign], ["members", "Participantes", UsersRound], ["plans", "Planos", Settings2],
    ] as const).map(([value, label, Icon]) => <button key={value} onClick={() => setTab(value)} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${tab === value ? "bg-emerald-300 text-slate-950" : "border border-white/10 bg-white/5 text-slate-300"}`}><Icon size={17} />{label}</button>)}</nav>

    {tab === "ledger" && <>
      <Surface><div className="grid gap-3 p-5 md:grid-cols-[1fr_1fr_auto_auto]"><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className={fieldClassName} /><input type="date" value={to} onChange={(event) => setTo(event.target.value)} className={fieldClassName} /><button onClick={() => void loadSummary()} className="rounded-xl border border-white/10 px-4 font-bold">{loading ? "Carregando..." : "Atualizar"}</button>{isAdmin && <button onClick={() => void generate()} className="rounded-xl bg-emerald-300 px-4 font-bold text-slate-950">Gerar obrigações</button>}</div></Surface>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><Metric label="Previsto" value={money(summary?.totals.expected || 0)} /><Metric label="Recebido no período" value={money(summary?.totals.received || 0)} tone="emerald" /><Metric label="Crédito disponível" value={money(summary?.totals.credit || 0)} /><Metric label="Pendente" value={money(summary?.totals.pending || 0)} tone="rose" /></div>
      {isAdmin && <Surface><SectionTitle icon={<Banknote size={18} />} title="Registrar pagamento" text="O valor quita primeiro as obrigações mais antigas; eventual sobra fica como crédito." /><div className="p-5"><PaymentForm members={members} plans={plans} onSubmit={(data) => post("/collections/payments", data, "Pagamento registrado.")} /></div></Surface>}
      <Surface><SectionTitle icon={<CalendarClock size={18} />} title="Obrigações" text="Pendências mensais ou por jogo, com valor preservado pela vigência do plano." /><div className="divide-y divide-white/10">{summary?.obligations.length ? summary.obligations.map((item) => <div key={item.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1.3fr_1fr_1fr_auto] md:items-center"><div><p className="font-bold text-white">{item.member.name}</p><p className="text-xs text-slate-500">{item.plan.name} · {item.game?.opponent || new Date(item.dueDate).toLocaleDateString("pt-BR")}</p></div><div><p className="text-sm text-slate-400">Pago {money(item.allocatedAmount)}</p><p className="font-semibold text-white">de {money(item.expectedAmount)}</p></div><Status status={item.status} />{isAdmin && (item.status === "OPEN" || item.status === "PARTIAL") && <div className="flex flex-wrap gap-2"><button onClick={() => void monetaryAdjust(item.id, "DISCOUNT")} className="text-xs text-sky-200">Desconto</button><button onClick={() => void monetaryAdjust(item.id, "SURCHARGE")} className="text-xs text-emerald-200">Acréscimo</button><button onClick={() => void adjust(item.id, "WAIVER")} className="text-xs text-amber-200">Isentar</button><button onClick={() => void adjust(item.id, "CANCELLATION")} className="text-xs text-rose-300">Cancelar</button></div>}</div>) : <div className="p-5"><EmptyState icon={<CalendarClock />} title="Nenhuma obrigação" description="Gere as obrigações do período após configurar participantes e planos." /></div>}</div></Surface>
      <Surface><SectionTitle icon={<Banknote size={18} />} title="Pagamentos" text="Estornos preservam autoria, motivo e data, e reabrem as obrigações afetadas." /><div className="divide-y divide-white/10">{summary?.payments.map((payment) => { const credit = Number(payment.amount) - payment.allocations.reduce((sum, item) => sum + Number(item.amount), 0); return <div key={payment.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-white">{payment.member.name} · {money(payment.amount)}</p><p className="text-xs text-slate-500">{payment.plan.name} · {new Date(payment.transaction.date).toLocaleDateString("pt-BR")}{credit > 0 ? ` · Crédito disponível ${money(credit)}` : ""}</p></div>{isAdmin && <button onClick={() => void reverse(payment)} className="rounded-lg border border-rose-300/20 px-3 py-1.5 text-xs font-bold text-rose-200">Estornar</button>}</div>; })}</div></Surface>
    </>}

    {tab === "members" && <Surface><SectionTitle icon={<UsersRound size={18} />} title="Participantes" text="Uma única pessoa pode exercer mais de uma função sem gerar cobrança duplicada." />{isAdmin && <div className="border-b border-white/10 p-5"><MemberForm onSubmit={(data) => post("/collections/members", data, "Participante cadastrado.")} /></div>}<div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">{members.map((member) => { const activeRoles = member.roles.filter((role) => !role.endsAt); const isPlayer = activeRoles.some((role) => role.role === "PLAYER"); const isDirector = activeRoles.some((role) => role.role === "DIRECTOR"); return <div key={member.id} className="rounded-xl border border-white/10 bg-slate-950/30 p-4"><div className="flex items-start justify-between"><div><p className="font-bold text-white">{member.name}</p><p className="mt-1 text-xs text-slate-400">{activeRoles.length ? activeRoles.map((role) => role.role === "DIRECTOR" ? "Diretor" : "Jogador").join(" + ") : "Sem função ativa"}</p></div>{isAdmin && member.active && <button onClick={() => void deactivate("members", member.id)} className="text-xs text-rose-300">Desativar</button>}</div>{isAdmin && member.active && <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold">{isPlayer ? <button onClick={() => void changeRole(member, "PLAYER", "end")} className="text-rose-300">Encerrar jogador</button> : <button onClick={() => void changeRole(member, "PLAYER", "add")} className="text-emerald-200">Tornar jogador</button>}{isDirector ? <button onClick={() => void changeRole(member, "DIRECTOR", "end")} className="text-rose-300">Encerrar diretor</button> : <button onClick={() => void changeRole(member, "DIRECTOR", "add")} className="text-emerald-200">Tornar diretor</button>}</div>}</div>; })}</div></Surface>}
    {tab === "plans" && <Surface><SectionTitle icon={<Settings2 size={18} />} title="Planos de arrecadação" text="Prioridades no mesmo grupo garantem que diretor-jogador receba somente a obrigação de diretor." />{isAdmin && <div className="border-b border-white/10 p-5"><PlanForm categories={categories} onSubmit={(data) => post("/collections/plans", data, "Plano criado.")} /></div>}<div className="grid gap-3 p-5 md:grid-cols-2">{plans.map((plan) => <div key={plan.id} className="rounded-xl border border-white/10 bg-slate-950/30 p-4"><div className="flex justify-between"><p className="font-bold text-white">{plan.name}</p><span className="text-xs text-emerald-300">Prioridade {plan.priority}</span></div><p className="mt-2 text-sm text-slate-400">{plan.audienceRole === "DIRECTOR" ? "Diretores" : "Jogadores"} · {plan.frequency === "MONTHLY" ? `Mensal, dia ${plan.dueDay}` : "Por jogo"}</p><p className="mt-1 font-semibold text-white">{money(plan.rates[0]?.amount || 0)}</p>{isAdmin && plan.active && <div className="mt-3 flex gap-3"><button onClick={() => void addRate(plan)} className="text-xs font-bold text-emerald-200">Novo valor</button><button onClick={() => void deactivate("plans", plan.id)} className="text-xs font-bold text-rose-300">Encerrar plano</button></div>}</div>)}</div></Surface>}
  </div></ProtectedPage>;
}

function Metric({ label, value, tone = "white" }: { label: string; value: string; tone?: "white" | "emerald" | "rose" }) {
  const color = tone === "emerald" ? "text-emerald-300" : tone === "rose" ? "text-rose-300" : "text-white";
  return <Surface className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p><p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p></Surface>;
}
function SectionTitle({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4"><span className="text-emerald-300">{icon}</span><div><h2 className="font-bold text-white">{title}</h2><p className="text-xs text-slate-400">{text}</p></div></div>;
}
function Status({ status }: { status: string }) {
  const labels: Record<string, string> = { OPEN: "Em aberto", PARTIAL: "Parcial", PAID: "Pago", WAIVED: "Isento", CANCELLED: "Cancelado" };
  return <span className="w-fit rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold text-slate-300">{labels[status] || status}</span>;
}
