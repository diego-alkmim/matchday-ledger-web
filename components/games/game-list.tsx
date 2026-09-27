import { CalendarDays, Clock3, Coins, MapPin, PencilLine, ShieldCheck, Trash2 } from "lucide-react";
import type { ContributionSettings, Game } from "../../app/jogos/types";
import { EmptyState, Surface } from "../ui/page-primitives";

type Props = {
  games: Game[];
  settings: ContributionSettings | null;
  loading: boolean;
  isAdmin: boolean;
  onEdit: (game: Game) => void;
  onDelete: (id: string) => void;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function GameList({ games, settings, loading, isAdmin, onEdit, onDelete }: Props) {
  return (
    <Surface>
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
        <div>
          <h2 className="font-bold text-white">Agenda de jogos</h2>
          <p className="mt-0.5 text-sm text-slate-400">
            {settings?.mode === "MONTHLY"
              ? "O consolidado usa uma obrigação por mês com jogo."
              : "O consolidado usa o valor esperado registrado em cada jogo."}
          </p>
        </div>
        {loading && <span className="text-xs text-emerald-300">Atualizando...</span>}
      </div>
      <div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
        {games.map((game) => {
          const open = game.status === "ABERTO";
          const date = new Date(game.date);
          return (
            <article
              key={game.id}
              className="rounded-2xl border border-white/10 bg-slate-950/25 p-4 transition hover:border-sky-300/30"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-300/10 text-sky-300">
                  <CalendarDays size={19} />
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${open ? "bg-emerald-300/10 text-emerald-200" : "bg-slate-700/70 text-slate-300"}`}
                >
                  {open ? "Aberto" : "Fechado"}
                </span>
              </div>
              <h3 className="mt-5 font-bold text-white">
                {game.opponent || "Adversário não informado"}
              </h3>
              <div className="mt-2 space-y-1 text-sm text-slate-400">
                <p className="flex items-center gap-2">
                  <Clock3 size={14} />
                  {date.toLocaleDateString("pt-BR")} às{" "}
                  {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
                {game.location && (
                  <p className="flex items-center gap-2"><MapPin size={14} /> {game.location}</p>
                )}
                <p className="flex items-center gap-2 text-emerald-200">
                  <Coins size={14} /> {formatCurrency(game.expectedContributionPerDirector)} por diretor
                </p>
              </div>
              {isAdmin && (
                <div className="mt-5 flex gap-4 border-t border-white/10 pt-3">
                  <button
                    onClick={() => onEdit(game)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-sky-200"
                  >
                    <PencilLine size={15} /> Editar
                  </button>
                  <button
                    onClick={() => onDelete(game.id)}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-rose-200"
                  >
                    <Trash2 size={15} /> Excluir
                  </button>
                </div>
              )}
            </article>
          );
        })}
        {!games.length && (
          <div className="sm:col-span-2 xl:col-span-3">
            <EmptyState
              icon={<ShieldCheck size={30} />}
              title="Nenhum jogo cadastrado"
              description="Cadastre a primeira partida para começar a registrar o caixa."
            />
          </div>
        )}
      </div>
    </Surface>
  );
}
