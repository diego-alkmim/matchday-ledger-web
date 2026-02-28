"use client";
import { useEffect, useState } from "react";
import { ProtectedPage } from "../../components/nav/sidebar";
import api from "../api-client";
import { useAuth } from "../../lib/auth";
import { toast } from "sonner";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Game {
  id: string;
  date: string;
  location?: string | null;
  opponent?: string | null;
  status: "ABERTO" | "FECHADO";
}

const datePickerClasses = {
  calendar: "!bg-slate-900 !text-slate-100 !border !border-slate-700",
  popper: "react-datepicker-popper",
  day: "hover:!bg-emerald-500/30 rounded text-slate-100",
};

export default function JogosPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    location: "",
    opponent: "",
    status: "ABERTO" as Game["status"],
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/games");
      const list: Game[] = data.data || [];
      // ordena por data desc
      list.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      setGames(list);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Erro ao carregar jogos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const buildIso = (date: Date | null, time: Date | null) => {
    if (!date) return "";
    const base = new Date(date);
    const d = new Date(base.toISOString());
    if (time) {
      d.setHours(time.getHours(), time.getMinutes(), 0, 0);
    }
    return d.toISOString();
  };

  const submit = async () => {
    try {
      if (!selectedDate) {
        toast.error("Informe a data do jogo");
        return;
      }
      const payload = {
        date: buildIso(selectedDate, selectedTime),
        location: form.location,
        opponent: form.opponent,
        status: form.status,
      };
      if (editingId) {
        await api.put(`/games/${editingId}`, payload);
        toast.success("Jogo atualizado");
      } else {
        await api.post("/games", payload);
        toast.success("Jogo criado");
      }
      setForm({ location: "", opponent: "", status: "ABERTO" });
      setSelectedDate(null);
      setSelectedTime(null);
      setEditingId(null);
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Erro ao salvar jogo");
    }
  };

  const onEdit = (g: Game) => {
    const dt = new Date(g.date);
    setEditingId(g.id);
    setForm({
      location: g.location || "",
      opponent: g.opponent || "",
      status: g.status,
    });
    setSelectedDate(dt);
    setSelectedTime(dt);
  };

  const onDelete = async (id: string) => {
    try {
      await api.delete(`/games/${id}`);
      toast.success("Jogo removido");
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Erro ao remover");
    }
  };

  return (
    <ProtectedPage>
      <div className="space-y-6">
        {isAdmin && (
          <div className="rounded-lg bg-slate-900 p-4 shadow border border-slate-800">
            <h2 className="text-lg font-semibold mb-3">
              {editingId ? "Editar jogo" : "Novo jogo"}
            </h2>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded bg-slate-800 px-3 py-2">
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Data"
                  className="w-full bg-transparent focus:outline-none text-slate-100"
                  calendarClassName={datePickerClasses.calendar}
                  dayClassName={() => datePickerClasses.day}
                  popperClassName={datePickerClasses.popper}
                />
              </div>
              <div className="rounded bg-slate-800 px-3 py-2">
                <DatePicker
                  selected={selectedTime}
                  onChange={(date) => setSelectedTime(date)}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={15}
                  timeCaption="Hora"
                  dateFormat="HH:mm"
                  placeholderText="Hora"
                  className="w-full bg-transparent focus:outline-none text-slate-100"
                  calendarClassName={datePickerClasses.calendar + " !p-2 "}
                  timeClassName={() => "text-slate-100"}
                  popperClassName={datePickerClasses.popper}
                />
              </div>
              <input
                className="rounded bg-slate-800 px-3 py-2"
                placeholder="Adversário"
                value={form.opponent}
                onChange={(e) => setForm({ ...form, opponent: e.target.value })}
              />
              <input
                className="rounded bg-slate-800 px-3 py-2"
                placeholder="Local"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
              <select
                className="rounded bg-slate-800 px-3 py-2"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as Game["status"] })
                }
              >
                <option value="ABERTO">Aberto</option>
                <option value="FECHADO">Fechado</option>
              </select>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={submit}
                className="rounded bg-emerald-500 px-4 py-2 font-semibold text-slate-900 hover:bg-emerald-400"
              >
                {editingId ? "Salvar alterações" : "Cadastrar"}
              </button>
              {editingId && (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setForm({ location: "", opponent: "", status: "ABERTO" });
                    setSelectedDate(null);
                    setSelectedTime(null);
                  }}
                  className="rounded bg-slate-800 px-4 py-2 text-slate-200 hover:bg-slate-700"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        )}

        <div className="rounded-lg bg-slate-900 p-4 shadow border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Jogos</h2>
            {loading && (
              <span className="text-xs text-slate-400">Carregando...</span>
            )}
          </div>
          <div className="space-y-2">
            {games.map((g) => (
              <div
                key={g.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between rounded bg-slate-800 px-3 py-2"
              >
                <div>
                  <div className="font-semibold text-slate-100">
                    {g.opponent || "Sem adversário definido"}
                  </div>
                  <div className="text-sm text-slate-400">
                    {new Date(g.date).toLocaleString()}{" "}
                    {g.location ? `• ${g.location}` : ""}
                  </div>
                  <div className="text-xs text-slate-500">
                    Status: {g.status}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-2 mt-2 md:mt-0">
                    <button
                      onClick={() => onEdit(g)}
                      className="rounded bg-slate-700 px-3 py-1 text-sm hover:bg-slate-600"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onDelete(g.id)}
                      className="rounded bg-rose-600 px-3 py-1 text-sm text-white hover:bg-rose-500"
                    >
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            ))}
            {!games.length && (
              <div className="text-sm text-slate-400">
                Nenhum jogo cadastrado.
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}
