import { Coins } from "lucide-react";
import type {
  ContributionMode,
  ContributionSettings,
} from "../../app/jogos/types";
import { fieldClassName, FormField, Surface } from "../ui/page-primitives";

type Props = {
  settings: ContributionSettings;
  isAdmin: boolean;
  saving: boolean;
  onChange: (settings: ContributionSettings) => void;
  onSave: () => void;
};

export function ContributionSettingsCard({
  settings,
  isAdmin,
  saving,
  onChange,
  onSave,
}: Props) {
  return (
    <Surface>
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-300">
          <Coins size={19} />
        </span>
        <div>
          <h2 className="font-bold text-white">Regra de arrecadação</h2>
          <p className="mt-0.5 text-sm text-slate-400">
            Escolha se cada diretor contribui por partida ou uma vez por mês com jogos.
          </p>
        </div>
      </div>
      <div className="grid gap-4 p-5 md:grid-cols-2">
        <FormField label="Periodicidade">
          <select
            className={fieldClassName}
            value={settings.mode}
            disabled={!isAdmin}
            onChange={(event) =>
              onChange({ ...settings, mode: event.target.value as ContributionMode })
            }
          >
            <option value="PER_GAME">Por jogo</option>
            <option value="MONTHLY">Por mês com jogo</option>
          </select>
        </FormField>
        {settings.mode === "MONTHLY" && (
          <FormField label="Valor mensal por diretor">
            <input
              type="number"
              min="0.01"
              step="0.01"
              className={fieldClassName}
              disabled={!isAdmin}
              value={settings.monthlyContributionPerDirector}
              onChange={(event) =>
                onChange({
                  ...settings,
                  monthlyContributionPerDirector: Number(event.target.value),
                })
              }
            />
          </FormField>
        )}
      </div>
      {isAdmin && (
        <div className="border-t border-white/10 bg-slate-950/20 px-5 py-4">
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-xl bg-emerald-300 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-200 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar regra"}
          </button>
        </div>
      )}
    </Surface>
  );
}
