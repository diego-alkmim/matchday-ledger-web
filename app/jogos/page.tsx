"use client";

import { useEffect, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "sonner";
import { ContributionSettingsCard } from "../../components/games/contribution-settings-card";
import { GameForm } from "../../components/games/game-form";
import { GameList } from "../../components/games/game-list";
import { ProtectedPage } from "../../components/nav/sidebar";
import { PageHeader } from "../../components/ui/page-primitives";
import { ApiEnvelope, getApiErrorMessage } from "../../lib/api-types";
import { useAuth } from "../../lib/auth";
import api from "../api-client";
import {
  ContributionSettings,
  Game,
  initialGameForm,
} from "./types";

export default function JogosPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [games, setGames] = useState<Game[]>([]);
  const [settings, setSettings] = useState<ContributionSettings | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<ContributionSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(initialGameForm);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [gamesResponse, settingsResponse] = await Promise.all([
        api.get<ApiEnvelope<Game[]>>("/games"),
        api.get<ApiEnvelope<ContributionSettings>>("/team-settings/contributions"),
      ]);
      const loadedGames = (gamesResponse.data.data || []).map((game) => ({
        ...game,
        expectedContributionPerDirector: Number(game.expectedContributionPerDirector),
      }));
      setGames(
        loadedGames.sort(
          (first, second) => new Date(second.date).getTime() - new Date(first.date).getTime(),
        ),
      );
      setSettings(settingsResponse.data.data);
      setSettingsDraft(settingsResponse.data.data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao carregar jogos"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const resetForm = () => {
    setForm(initialGameForm);
    setSelectedDate(null);
    setSelectedTime(null);
    setEditingId(null);
  };

  const buildIso = (date: Date, time: Date | null) => {
    const result = new Date(date);
    if (time) result.setHours(time.getHours(), time.getMinutes(), 0, 0);
    return result.toISOString();
  };

  const submit = async () => {
    if (!selectedDate) return toast.error("Informe a data do jogo");
    const expectedContributionPerDirector = Number(form.expectedContributionPerDirector);
    if (!Number.isFinite(expectedContributionPerDirector) || expectedContributionPerDirector <= 0) {
      return toast.error("Informe um valor esperado por diretor maior que zero");
    }
    try {
      const payload = {
        date: buildIso(selectedDate, selectedTime),
        location: form.location,
        opponent: form.opponent,
        status: form.status,
        expectedContributionPerDirector,
      };
      if (editingId) {
        await api.put(`/games/${editingId}`, payload);
        toast.success("Jogo atualizado");
      } else {
        await api.post("/games", payload);
        toast.success("Jogo criado");
      }
      resetForm();
      void load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao salvar jogo"));
    }
  };

  const saveSettings = async () => {
    if (!settingsDraft) return;
    if (
      settingsDraft.mode === "MONTHLY" &&
      (!Number.isFinite(settingsDraft.monthlyContributionPerDirector) ||
        settingsDraft.monthlyContributionPerDirector <= 0)
    ) {
      return toast.error("Informe um valor mensal maior que zero");
    }
    setSavingSettings(true);
    try {
      const response = await api.put<ApiEnvelope<ContributionSettings>>(
        "/team-settings/contributions",
        settingsDraft,
      );
      setSettings(response.data.data);
      setSettingsDraft(response.data.data);
      toast.success("Regra de arrecadação atualizada");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao atualizar a regra de arrecadação"));
    } finally {
      setSavingSettings(false);
    }
  };

  const onDelete = async (id: string) => {
    try {
      await api.delete(`/games/${id}`);
      toast.success("Jogo removido");
      void load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao remover"));
    }
  };

  const startEditing = (game: Game) => {
    const date = new Date(game.date);
    setEditingId(game.id);
    setForm({
      location: game.location || "",
      opponent: game.opponent || "",
      status: game.status,
      expectedContributionPerDirector: String(game.expectedContributionPerDirector),
    });
    setSelectedDate(date);
    setSelectedTime(date);
  };

  return (
    <ProtectedPage>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Cadastros do time"
          title="Jogos"
          description="Organize as partidas e defina a regra de contribuição dos diretores."
          aside={
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300">
              {games.filter((game) => game.status === "ABERTO").length} abertos
            </span>
          }
        />
        {settingsDraft && (
          <ContributionSettingsCard
            settings={settingsDraft}
            isAdmin={isAdmin}
            saving={savingSettings}
            onChange={setSettingsDraft}
            onSave={() => void saveSettings()}
          />
        )}
        {isAdmin && (
          <GameForm
            editingId={editingId}
            form={form}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            setForm={setForm}
            setSelectedDate={setSelectedDate}
            setSelectedTime={setSelectedTime}
            onSubmit={() => void submit()}
            onCancel={resetForm}
          />
        )}
        <GameList
          games={games}
          settings={settings}
          loading={loading}
          isAdmin={isAdmin}
          onEdit={startEditing}
          onDelete={(id) => void onDelete(id)}
        />
      </div>
    </ProtectedPage>
  );
}
