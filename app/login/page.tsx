"use client";
import { useState, useMemo, useEffect } from "react";
import { login, useAuth } from "../../lib/auth";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const validEmail = useMemo(() => /.+@.+\..+/.test(email.trim()), [email]);
  const canSubmit = validEmail && password.trim().length >= 1;

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  const submit = async (e: any) => {
    e.preventDefault();
    if (!validEmail) {
      toast.error("Informe um e-mail válido");
      return;
    }
    if (!password.trim()) {
      toast.error("Informe a senha");
      return;
    }
    try {
      await login(email.trim(), password);
      router.replace("/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Credenciais inválidas";
      toast.error(msg);
    }
  };

  if (user) return null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl bg-slate-900/70 p-6 shadow-xl">
        <h1 className="text-2xl font-semibold text-white">Entrar</h1>
        <input
          className="w-full rounded bg-slate-800 px-3 py-2"
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />
        <div className="relative">
          <input
            type={showPass ? "text" : "password"}
            className="w-full rounded bg-slate-800 px-3 py-2 pr-10"
            placeholder="Senha"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            className="absolute inset-y-0 right-2 flex items-center text-slate-300"
            aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <button
          className="w-full rounded bg-emerald-500 py-2 font-semibold text-slate-900 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!canSubmit}
        >
          Entrar
        </button>
      </form>
    </main>
  );
}
