"use client";
import Link from "next/link";
import { useAuth } from "../../lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, LogOut } from "lucide-react";
import { logout } from "../../lib/auth";

export function ProtectedPage({ children }: { children: React.ReactNode }) {
  const { user, hydrated } = useAuth();
  const router = useRouter();
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
    return null; // evita mismatch e setState durante render
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 flex-col md:flex-row">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between md:hidden px-4 py-3 border-b border-slate-800 bg-slate-950">
        <button
          aria-label="Abrir menu"
          onClick={() => setOpen((v) => !v)}
          className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-100"
        >
          <Menu size={20} />
        </button>
        <span className="text-base font-semibold">Matchday</span>
      </div>

      {/* Sidebar */}
      <aside
        className={`bg-slate-950 w-64 md:w-60 border-r border-slate-800 p-4 space-y-4 fixed md:static inset-y-0 left-0 transform transition-transform duration-200 ease-out z-40 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <h2 className="text-lg font-bold hidden md:block">Matchday</h2>
        <div className="grid grid-cols-1 gap-1">
          <NavItem href="/dashboard" label="Dashboard" onNavigate={() => setOpen(false)} />
          <NavItem href="/diretores" label="Diretores" onNavigate={() => setOpen(false)} />
          <NavItem href="/jogos" label="Jogos" onNavigate={() => setOpen(false)} />
          <NavItem href="/categorias" label="Categorias" onNavigate={() => setOpen(false)} />
          <NavItem href="/lancamentos" label="Lançamentos" onNavigate={() => setOpen(false)} />
          <NavItem href="/relatorios" label="Relatórios" onNavigate={() => setOpen(false)} />
        </div>
        <div className="pt-2 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2 rounded px-3 py-2 text-slate-200 hover:bg-slate-800 hover:text-white font-medium"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>

      {/* Backdrop mobile */}
      {open && <div className="fixed inset-0 bg-black/50 md:hidden z-30" onClick={() => setOpen(false)} />}

      <main className="flex-1 p-4 md:p-6 w-full overflow-x-hidden md:ml-0 md:pl-6 mt-0 md:mt-0 md:pt-6 md:pb-6">
        {children}
      </main>
    </div>
  );
}

const NavItem = ({
  href,
  label,
  onNavigate,
}: {
  href: string;
  label: string;
  onNavigate?: () => void;
}) => (
  <Link
    className="block rounded px-3 py-2 text-slate-200 hover:bg-slate-800 hover:text-white font-medium"
    href={href}
    onClick={onNavigate}
  >
    {label}
  </Link>
);
