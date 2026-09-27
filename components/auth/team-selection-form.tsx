"use client";

import { ArrowRight, Building2 } from "lucide-react";
import { useState } from "react";
import { TeamSelection, selectTeam } from "../../lib/auth";
import { getApiErrorMessage } from "../../lib/api-types";

export function TeamSelectionForm({
  selection,
  onSuccess,
}: {
  selection: TeamSelection;
  onSuccess: () => void;
}) {
  const [selectedTeamId, setSelectedTeamId] = useState(selection.teams[0]?.id || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!selectedTeamId || loading) return;
    setLoading(true);
    setError("");
    try {
      await selectTeam(selection, selectedTeamId);
      onSuccess();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Não foi possível acessar o time selecionado."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/70 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-7">
      <div className="mb-5 flex items-start gap-3">
        <span className="rounded-xl bg-emerald-300/10 p-2.5 text-emerald-300">
          <Building2 size={20} aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-bold text-white">Escolha o time</h3>
          <p className="mt-1 text-sm leading-5 text-slate-400">
            Você participa de mais de um time. Selecione qual deseja acessar agora.
          </p>
        </div>
      </div>

      <div className="grid gap-2" role="radiogroup" aria-label="Times disponíveis">
        {selection.teams.map((team) => {
          const selected = team.id === selectedTeamId;
          return (
            <button
              key={team.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setSelectedTeamId(team.id)}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                selected
                  ? "border-emerald-300/60 bg-emerald-300/10 text-white"
                  : "border-slate-700 bg-slate-950/40 text-slate-300 hover:border-slate-500"
              }`}
            >
              <span className="font-semibold">{team.name}</span>
              <span className="text-xs uppercase tracking-wider text-emerald-300/80">{team.role}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => void submit()}
        disabled={!selectedTeamId || loading}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-3.5 font-bold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Abrindo time..." : "Acessar time"}
        {!loading && <ArrowRight size={18} aria-hidden="true" />}
      </button>
    </div>
  );
}
