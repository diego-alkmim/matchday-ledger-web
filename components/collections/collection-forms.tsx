import { FormEvent } from "react";
import { FormField, fieldClassName } from "../ui/page-primitives";
import type { Category, Member, Plan } from "../../app/arrecadacoes/types";

type MemberFormProps = { onSubmit: (data: Record<string, unknown>) => Promise<void> };
export function MemberForm({ onSubmit }: MemberFormProps) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const roles = values.getAll("roles");
    if (roles.length === 0) return window.alert("Selecione ao menos uma função.");
    void onSubmit({
      name: values.get("name"), contact: values.get("contact"), activeFrom: values.get("activeFrom"),
      roles,
    }).then(() => form.reset()).catch(() => undefined);
  };
  return <form onSubmit={submit} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
    <FormField label="Nome"><input required name="name" className={fieldClassName} /></FormField>
    <FormField label="Contato"><input name="contact" className={fieldClassName} /></FormField>
    <FormField label="Ativo desde"><input required type="date" name="activeFrom" className={fieldClassName} /></FormField>
    <fieldset><legend className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Funções</legend><div className="flex h-10 items-center gap-4"><label><input type="checkbox" name="roles" value="PLAYER" /> <span className="ml-1">Jogador</span></label><label><input type="checkbox" name="roles" value="DIRECTOR" /> <span className="ml-1">Diretor</span></label></div></fieldset>
    <button className="rounded-xl bg-emerald-300 px-4 py-2.5 font-bold text-slate-950">Cadastrar participante</button>
  </form>;
}

type PlanFormProps = { categories: Category[]; onSubmit: (data: Record<string, unknown>) => Promise<void> };
export function PlanForm({ categories, onSubmit }: PlanFormProps) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    void onSubmit({
      name: values.get("name"), audienceRole: values.get("audienceRole"), frequency: values.get("frequency"),
      categoryId: values.get("categoryId"), amount: Number(values.get("amount")), priority: values.get("audienceRole") === "DIRECTOR" ? 100 : 50,
      exclusiveGroup: "membership", dueDay: values.get("dueDay") ? Number(values.get("dueDay")) : undefined,
      prorationPolicy: values.get("prorationPolicy"), effectiveFrom: values.get("effectiveFrom"),
    }).then(() => form.reset()).catch(() => undefined);
  };
  return <form onSubmit={submit} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
    <FormField label="Plano"><input required name="name" className={fieldClassName} placeholder="Mensalidade de jogadores" /></FormField>
    <FormField label="Público"><select name="audienceRole" className={fieldClassName}><option value="PLAYER">Jogadores</option><option value="DIRECTOR">Diretores</option></select></FormField>
    <FormField label="Periodicidade"><select name="frequency" className={fieldClassName}><option value="MONTHLY">Mensal</option><option value="PER_GAME">Por jogo</option></select></FormField>
    <FormField label="Categoria"><select required name="categoryId" className={fieldClassName}><option value="">Selecione</option>{categories.filter((item) => item.type === "ENTRADA").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></FormField>
    <FormField label="Valor"><input required min="0.01" step="0.01" type="number" name="amount" className={fieldClassName} /></FormField>
    <FormField label="Vencimento"><input min="1" max="28" type="number" name="dueDay" defaultValue="20" className={fieldClassName} /></FormField>
    <FormField label="Início da vigência"><input required type="date" name="effectiveFrom" className={fieldClassName} /></FormField>
    <FormField label="Entrada no mês"><select name="prorationPolicy" className={fieldClassName}><option value="DUE_DATE_CUTOFF">Até o vencimento paga o mês</option><option value="NEXT_MONTH">Sempre inicia no mês seguinte</option><option value="FULL_AMOUNT">Entrou no mês, paga integral</option></select></FormField>
    <button className="rounded-xl bg-emerald-300 px-4 py-2.5 font-bold text-slate-950">Criar plano</button>
  </form>;
}

type PaymentFormProps = { members: Member[]; plans: Plan[]; onSubmit: (data: Record<string, unknown>) => Promise<void> };
export function PaymentForm({ members, plans, onSubmit }: PaymentFormProps) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    void onSubmit({ memberId: values.get("memberId"), planId: values.get("planId"), amount: Number(values.get("amount")), date: values.get("date"), paymentMethod: values.get("paymentMethod"), notes: values.get("notes") }).then(() => form.reset()).catch(() => undefined);
  };
  return <form onSubmit={submit} className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
    <FormField label="Participante"><select required name="memberId" className={fieldClassName}><option value="">Selecione</option>{members.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></FormField>
    <FormField label="Plano"><select required name="planId" className={fieldClassName}><option value="">Selecione</option>{plans.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></FormField>
    <FormField label="Valor"><input required min="0.01" step="0.01" type="number" name="amount" className={fieldClassName} /></FormField>
    <FormField label="Data"><input required type="date" name="date" className={fieldClassName} /></FormField>
    <FormField label="Forma"><select name="paymentMethod" className={fieldClassName}><option>PIX</option><option>DINHEIRO</option><option>CARTAO</option></select></FormField>
    <FormField label="Observação"><input name="notes" className={fieldClassName} /></FormField>
    <button className="rounded-xl bg-emerald-300 px-4 py-2.5 font-bold text-slate-950">Registrar pagamento</button>
  </form>;
}
