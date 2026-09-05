"use client";
import Link from "next/link";
import { useAuth } from "../../lib/auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  ScrollText,
  Tags,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { logout } from "../../lib/auth";

export function ProtectedPage({ children }: { children: React.ReactNode }) {
  const { user, hydrated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login");
    } else {
      setIsChecking(false);
    }
  }, [user, router, hydrated]);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
    setOpen(false);
  };

  if (!hydrated || isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020817] text-emerald-200">
        <div className="flex items-center gap-3 text-sm font-semibold tracking-[0.18em]">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-300/30 border-t-emerald-300" />
          CARREGANDO O MATCHDAY
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020817] text-slate-100 md:flex">
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur md:hidden">
        <button
          aria-label="Abrir menu"
          onClick={() => setOpen((v) => !v)}
          className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-100 transition hover:border-emerald-300/40 hover:text-emerald-200"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
        <Brand compact />
        <span className="w-9" aria-hidden="true" />
      </div>

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/10 bg-[#050d1d]/95 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl transition-transform duration-300 ease-out md:static md:w-64 md:translate-x-0 md:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="mb-8 flex items-center justify-between px-2 pt-1">
          <Brand />
          <button
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mb-3 px-3 text-[0.67rem] font-bold uppercase tracking-[0.2em] text-slate-500">Central do time</p>
        <nav className="grid gap-1">
          <NavItem href="/dashboard" label="Visão geral" icon={LayoutDashboard} active={pathname === "/dashboard"} onNavigate={() => setOpen(false)} />
          <NavItem href="/lancamentos" label="Lançamentos" icon={Receipt} active={pathname === "/lancamentos"} onNavigate={() => setOpen(false)} />
          <NavItem href="/relatorios" label="Relatórios" icon={BarChart3} active={pathname === "/relatorios"} onNavigate={() => setOpen(false)} />
        </nav>

        <p className="mb-3 mt-8 px-3 text-[0.67rem] font-bold uppercase tracking-[0.2em] text-slate-500">Cadastros</p>
        <nav className="grid gap-1">
          <NavItem href="/diretores" label="Diretores" icon={UsersRound} active={pathname === "/diretores"} onNavigate={() => setOpen(false)} />
          <NavItem href="/jogos" label="Jogos" icon={CalendarDays} active={pathname === "/jogos"} onNavigate={() => setOpen(false)} />
          <NavItem href="/categorias" label="Categorias" icon={Tags} active={pathname === "/categorias"} onNavigate={() => setOpen(false)} />
          {user?.role === "ADMIN" && (
            <NavItem href="/usuarios" label="Usuários" icon={Users} active={pathname === "/usuarios"} onNavigate={() => setOpen(false)} />
          )}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/[0.035] px-3 py-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-300/10 text-xs font-bold text-emerald-200">
              {user?.email?.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-200">{user?.email}</p>
              <p className="text-[0.67rem] uppercase tracking-wider text-emerald-300/80">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={() => void handleLogout()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-rose-400/10 hover:text-rose-200"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>

      {open && <button className="fixed inset-0 z-30 bg-black/65 md:hidden" aria-label="Fechar menu" onClick={() => setOpen(false)} />}

      <main className="relative min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.09),transparent_70%)]" />
        <div className="relative mx-auto w-full max-w-[1600px]">
          {children}
        </div>
      </main>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-300/25 bg-emerald-300/10 text-emerald-300">
        <ScrollText size={18} aria-hidden="true" />
      </span>
      {!compact && (
        <span>
          <span className="block text-sm font-bold tracking-[0.15em] text-white">MATCHDAY</span>
          <span className="block text-[0.6rem] font-bold tracking-[0.24em] text-emerald-300">LEDGER</span>
        </span>
      )}
    </div>
  );
}

const NavItem = ({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  onNavigate?: () => void;
}) => (
  <Link
    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
      active
        ? "bg-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/10"
        : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
    }`}
    href={href}
    onClick={onNavigate}
  >
    <Icon size={18} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
    {label}
  </Link>
);
