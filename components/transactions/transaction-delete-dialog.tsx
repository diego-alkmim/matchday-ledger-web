import { AlertTriangle, Trash2, X } from "lucide-react";

type TransactionDeleteDialogProps = {
  onCancel: () => void;
  onConfirm: () => void;
};

export function TransactionDeleteDialog({ onCancel, onConfirm }: TransactionDeleteDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-transaction-title">
      <div className="w-full max-w-md rounded-2xl border border-rose-300/20 bg-slate-900 p-5 shadow-2xl shadow-black/50 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-300/10 text-rose-300">
            <AlertTriangle size={21} aria-hidden="true" />
          </span>
          <button onClick={onCancel} aria-label="Fechar confirmação" className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <h3 id="delete-transaction-title" className="mt-5 text-xl font-bold text-white">Excluir lançamento?</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">Esta ação não pode ser desfeita. Confirme apenas se deseja remover essa movimentação do histórico.</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button onClick={onCancel} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white">Manter lançamento</button>
          <button onClick={onConfirm} className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-rose-300">
            <Trash2 size={16} aria-hidden="true" /> Excluir definitivamente
          </button>
        </div>
      </div>
    </div>
  );
}