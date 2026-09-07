import { ShieldCheck, Sparkles } from "lucide-react";

export function LoginPitch() {
  return (
    <div className="relative hidden overflow-hidden border-r border-white/10 px-12 py-12 lg:flex lg:flex-col">
      <div className="flex items-center gap-3 text-sm font-semibold tracking-[0.2em] text-emerald-300">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/30 bg-emerald-300/10">
          <Sparkles size={19} aria-hidden="true" />
        </span>
        MATCHDAY LEDGER
      </div>

      <div className="relative z-10 my-auto max-w-xl py-16">
        <p className="mb-5 text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">
          O caixa também joga junto
        </p>
        <h1 className="login-display text-6xl leading-[0.94] text-white xl:text-7xl">
          Controle o jogo
          <span className="block text-emerald-300">
            fora das quatro linhas.
          </span>
        </h1>
        <p className="mt-7 max-w-md text-lg leading-8 text-slate-300">
          Entradas, saídas e prestação de contas em uma única visão para o seu
          time.
        </p>

        <div className="mt-10 flex flex-wrap gap-3 text-sm text-slate-200">
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
            Caixa por jogo
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
            Relatórios claros
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
            Acesso protegido
          </div>
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-3 text-sm text-slate-400">
        <ShieldCheck className="text-emerald-300" size={20} aria-hidden="true" />
        Dados financeiros protegidos e centralizados.
      </div>

      <div className="login-pitch pointer-events-none absolute -bottom-32 -right-24 h-[32rem] w-[32rem] rounded-full border border-emerald-200/20" />
      <div className="login-pitch pointer-events-none absolute -bottom-8 -right-4 h-72 w-72 rounded-full border border-emerald-200/15" />
      <div className="pointer-events-none absolute bottom-0 right-[8.8rem] h-56 w-px bg-emerald-200/20" />
      <div className="pointer-events-none absolute bottom-28 right-0 h-px w-80 bg-emerald-200/20" />
    </div>
  );
}
