import { PencilLine, Plus } from "lucide-react";
import DatePicker from "react-datepicker";
import type { Dispatch, SetStateAction } from "react";
import type { Game, GameFormState } from "../../app/jogos/types";
import { fieldClassName, FormField, Surface } from "../ui/page-primitives";

type Props = {
  editingId: string | null;
  form: GameFormState;
  selectedDate: Date | null;
  selectedTime: Date | null;
  setForm: Dispatch<SetStateAction<GameFormState>>;
  setSelectedDate: (date: Date | null) => void;
  setSelectedTime: (date: Date | null) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

const datePickerClasses = {
  calendar: "!bg-slate-900 !text-slate-100 !border !border-slate-700",
  popper: "react-datepicker-popper",
  day: "hover:!bg-emerald-500/30 rounded text-slate-100",
};

export function GameForm({
  editingId,
  form,
  selectedDate,
  selectedTime,
  setForm,
  setSelectedDate,
  setSelectedTime,
  onSubmit,
  onCancel,
}: Props) {
  return (
    <Surface>
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-300/10 text-sky-300">
          {editingId ? <PencilLine size={19} /> : <Plus size={19} />}
        </span>
        <div>
          <h2 className="font-bold text-white">{editingId ? "Editar jogo" : "Novo jogo"}</h2>
          <p className="mt-0.5 text-sm text-slate-400">
            O valor por diretor fica registrado no jogo para preservar o histórico.
          </p>
        </div>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
        <FormField label="Data">
          <div className={fieldClassName}>
            <DatePicker
              selected={selectedDate}
              onChange={setSelectedDate}
              dateFormat="dd/MM/yyyy"
              placeholderText="Selecione a data"
              className="w-full bg-transparent text-sm text-slate-100 outline-none"
              calendarClassName={datePickerClasses.calendar}
              dayClassName={() => datePickerClasses.day}
              popperClassName={datePickerClasses.popper}
            />
          </div>
        </FormField>
        <FormField label="Horário">
          <div className={fieldClassName}>
            <DatePicker
              selected={selectedTime}
              onChange={setSelectedTime}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={15}
              timeCaption="Hora"
              dateFormat="HH:mm"
              placeholderText="Horário"
              className="w-full bg-transparent text-sm text-slate-100 outline-none"
              calendarClassName={datePickerClasses.calendar}
              popperClassName={datePickerClasses.popper}
            />
          </div>
        </FormField>
        <FormField label="Adversário">
          <input
            className={fieldClassName}
            placeholder="Nome do adversário"
            value={form.opponent}
            onChange={(event) => setForm({ ...form, opponent: event.target.value })}
          />
        </FormField>
        <FormField label="Local">
          <input
            className={fieldClassName}
            placeholder="Local da partida"
            value={form.location}
            onChange={(event) => setForm({ ...form, location: event.target.value })}
          />
        </FormField>
        <FormField label="Valor esperado por diretor">
          <input
            type="number"
            min="0.01"
            step="0.01"
            className={fieldClassName}
            value={form.expectedContributionPerDirector}
            onChange={(event) =>
              setForm({ ...form, expectedContributionPerDirector: event.target.value })
            }
          />
        </FormField>
        <FormField label="Status financeiro">
          <select
            className={fieldClassName}
            value={form.status}
            onChange={(event) =>
              setForm({ ...form, status: event.target.value as Game["status"] })
            }
          >
            <option value="ABERTO">Aberto para lançamentos</option>
            <option value="FECHADO">Fechado</option>
          </select>
        </FormField>
      </div>
      <div className="flex gap-3 border-t border-white/10 bg-slate-950/20 px-5 py-4">
        <button
          onClick={onSubmit}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-200"
        >
          {editingId ? <PencilLine size={16} /> : <Plus size={16} />}
          {editingId ? "Salvar alterações" : "Cadastrar jogo"}
        </button>
        {editingId && (
          <button onClick={onCancel} className="px-4 text-sm font-semibold text-slate-300">
            Cancelar edição
          </button>
        )}
      </div>
    </Surface>
  );
}
