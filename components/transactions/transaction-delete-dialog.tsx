type TransactionDeleteDialogProps = {
  onCancel: () => void;
  onConfirm: () => void;
};

export function TransactionDeleteDialog({ onCancel, onConfirm }: TransactionDeleteDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md space-y-4 rounded-lg border border-slate-800 bg-slate-900 p-5 shadow-xl">
        <h3 className="text-lg font-semibold text-white">Confirmar exclusão</h3>
        <p className="text-sm text-slate-300">Tem certeza que deseja excluir este lançamento?</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="rounded bg-slate-800 px-4 py-2 text-slate-200 hover:bg-slate-700">Cancelar</button>
          <button onClick={onConfirm} className="rounded bg-rose-600 px-4 py-2 text-white hover:bg-rose-500">Excluir</button>
        </div>
      </div>
    </div>
  );
}

