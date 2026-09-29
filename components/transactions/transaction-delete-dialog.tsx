"use client";

import { AlertTriangle, Trash2, X } from "lucide-react";
import { useState } from "react";

type TransactionDeleteDialogProps = {
  onCancel: () => void;
  onConfirm: (reason: string) => void;
};

export function TransactionDeleteDialog({ onCancel, onConfirm }: TransactionDeleteDialogProps) {
  const [reason, setReason] = useState("");
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
        <h3 id="delete-transaction-title" className="mt-5 text-xl font-bold text-white">Estornar lançamento?</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">O lançamento deixará de compor os totais, mas continuará no histórico para auditoria.</p>
        <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Informe o motivo do estorno" className="mt-4 min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950/50 p-3 text-sm text-white outline-none focus:border-rose-300" />
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button onClick={onCancel} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white">Manter lançamento</button>
          <button disabled={!reason.trim()} onClick={() => onConfirm(reason.trim())} className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-rose-300 disabled:cursor-not-allowed disabled:opacity-40">
            <Trash2 size={16} aria-hidden="true" /> Confirmar estorno
          </button>
        </div>
      </div>
    </div>
  );
}
