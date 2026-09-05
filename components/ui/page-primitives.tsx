import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
};

export const fieldClassName = "w-full rounded-xl border border-slate-700 bg-slate-950/50 px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-50";

export function PageHeader({ eyebrow, title, description, aside }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-slate-400">{description}</p>
      </div>
      {aside}
    </header>
  );
}

export function Surface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-white/10 bg-slate-900/70 shadow-xl shadow-black/10 backdrop-blur-sm ${className}`}>{children}</section>;
}

export function FormField({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return <label className={`block ${className}`}><span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{label}</span>{children}</label>;
}

export function EmptyState({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/20 px-6 text-center">
      <span className="text-slate-500">{icon}</span>
      <p className="mt-3 text-sm font-semibold text-slate-300">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}
