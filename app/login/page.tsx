"use client";

import { FormEvent, useEffect, useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { login, useAuth } from "../../lib/auth";
import { getApiErrorMessage } from "../../lib/api-types";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const emailId = useId();
  const passwordId = useId();
  const router = useRouter();
  const { user } = useAuth();

  const validEmail = useMemo(() => /.+@.+\..+/.test(email.trim()), [email]);
  const emailError = email.trim() && !validEmail ? "Use um e-mail válido, como nome@time.com." : "";
  const passwordError =
    password.length > 0 && password.trim().length < 8
      ? "A senha deve ter pelo menos 8 caracteres."
      : "";
  const canSubmit = validEmail && password.trim().length >= 8;

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validEmail) {
      setFormError("Informe um e-mail válido para continuar.");
      return;
    }

    if (password.trim().length < 8) {
      setFormError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    try {
      setLoading(true);
      setFormError("");
      await login(email.trim(), password);
      router.replace("/dashboard");
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Não foi possível validar suas credenciais.",
      );
      setFormError(message);
    } finally {
      setLoading(false);
    }
  };

  if (user) return null;

  return (
    <main className="login-page relative isolate min-h-screen overflow-hidden bg-[#020817] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(16,185,129,0.2),transparent_26%),radial-gradient(circle_at_88%_80%,rgba(59,130,246,0.14),transparent_30%)]" />
      <div className="login-grid pointer-events-none absolute inset-0 opacity-40" />

      <section className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.12fr_0.88fr]">
        <div className="relative hidden overflow-hidden border-r border-white/10 px-12 py-12 lg:flex lg:flex-col">
          <div className="flex items-center gap-3 text-sm font-semibold tracking-[0.2em] text-emerald-300">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/30 bg-emerald-300/10">
              <Sparkles size={19} aria-hidden="true" />
            </span>
            MATCHDAY LEDGER
          </div>

          <div className="relative z-10 my-auto max-w-xl py-16">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">
              O caixa também joga junto
            </p>
            <h1 className="login-display text-6xl leading-[0.94] text-white xl:text-7xl">
              Controle o jogo
              <span className="block text-emerald-300">
                fora das quatro linhas.
              </span>
            </h1>
            <p className="mt-7 max-w-md text-lg leading-8 text-slate-300">
              Entradas, saídas e prestação de contas em uma única visão para o
              seu time.
            </p>

            <div className="mt-10 flex flex-wrap gap-3 text-sm text-slate-200">
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                Caixa por jogo
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                Relatórios claros
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                Acesso protegido
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-3 text-sm text-slate-400">
            <ShieldCheck
              className="text-emerald-300"
              size={20}
              aria-hidden="true"
            />
            Dados financeiros protegidos e centralizados.
          </div>

          <div className="login-pitch pointer-events-none absolute -bottom-32 -right-24 h-[32rem] w-[32rem] rounded-full border border-emerald-200/20" />
          <div className="login-pitch pointer-events-none absolute -bottom-8 -right-4 h-72 w-72 rounded-full border border-emerald-200/15" />
          <div className="pointer-events-none absolute bottom-0 right-[8.8rem] h-56 w-px bg-emerald-200/20" />
          <div className="pointer-events-none absolute bottom-28 right-0 h-px w-80 bg-emerald-200/20" />
        </div>

        <div className="relative flex items-center px-5 py-8 sm:px-10 lg:px-14">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-9 flex items-center gap-3 lg:hidden">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-300/30 bg-emerald-300/10 text-emerald-300">
                <Sparkles size={20} aria-hidden="true" />
              </span>
              <span className="text-sm font-bold tracking-[0.18em] text-emerald-200">
                MATCHDAY LEDGER
              </span>
            </div>

            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
                Área do time
              </p>
              <h2 className="login-display mt-3 text-4xl text-white sm:text-5xl">
                Bem-vindo de volta.
              </h2>
              <p className="mt-3 text-base leading-7 text-slate-400">
                Entre para acompanhar o financeiro do seu time.
              </p>
            </div>

            <form
              onSubmit={(event) => void submit(event)}
              className="rounded-[1.75rem] border border-white/10 bg-slate-900/70 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-7"
              noValidate
            >
              <div className="space-y-5">
                <div>
                  <label
                    htmlFor={emailId}
                    className="mb-2 block text-sm font-semibold text-slate-200"
                  >
                    E-mail
                  </label>
                  <div className="group relative">
                    <Mail
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-emerald-300"
                      size={18}
                      aria-hidden="true"
                    />
                    <input
                      id={emailId}
                      type="email"
                      autoComplete="email"
                      className={`w-full rounded-xl border bg-slate-950/60 py-3 pl-11 pr-4 text-slate-100 outline-none transition placeholder:text-slate-600 focus:ring-4 ${
                        emailError
                          ? "border-rose-400/70 focus:border-rose-300 focus:ring-rose-300/10"
                          : "border-slate-700 focus:border-emerald-300 focus:ring-emerald-300/10"
                      }`}
                      placeholder="nome@time.com"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setFormError("");
                      }}
                      aria-describedby={emailError ? `${emailId}-error` : undefined}
                      aria-invalid={Boolean(emailError)}
                      disabled={loading}
                    />
                  </div>
                  <p
                    id={`${emailId}-error`}
                    className={`mt-2 min-h-5 text-xs ${emailError ? "text-rose-300" : "text-slate-500"}`}
                    aria-live="polite"
                  >
                    {emailError || "Use o e-mail cadastrado para acessar o sistema."}
                  </p>
                </div>

                <div>
                  <label
                    htmlFor={passwordId}
                    className="mb-2 block text-sm font-semibold text-slate-200"
                  >
                    Senha
                  </label>
                  <div className="group relative">
                    <LockKeyhole
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-emerald-300"
                      size={18}
                      aria-hidden="true"
                    />
                    <input
                      id={passwordId}
                      type={showPass ? "text" : "password"}
                      autoComplete="current-password"
                      className={`w-full rounded-xl border bg-slate-950/60 py-3 pl-11 pr-12 text-slate-100 outline-none transition placeholder:text-slate-600 focus:ring-4 ${
                        passwordError
                          ? "border-rose-400/70 focus:border-rose-300 focus:ring-rose-300/10"
                          : "border-slate-700 focus:border-emerald-300 focus:ring-emerald-300/10"
                      }`}
                      placeholder="Sua senha"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setFormError("");
                      }}
                      aria-describedby={passwordError ? `${passwordId}-error` : undefined}
                      aria-invalid={Boolean(passwordError)}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((value) => !value)}
                      className="absolute inset-y-0 right-1 flex w-11 items-center justify-center rounded-lg text-slate-400 transition hover:text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                      disabled={loading}
                    >
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p
                    id={`${passwordId}-error`}
                    className={`mt-2 min-h-5 text-xs ${passwordError ? "text-rose-300" : "text-slate-500"}`}
                    aria-live="polite"
                  >
                    {passwordError || "A senha de acesso deve ter pelo menos 8 caracteres."}
                  </p>
                </div>
              </div>

              <div className="mt-5 min-h-5" aria-live="polite">
                {formError && (
                  <div
                    className="flex items-start gap-3 rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100 shadow-sm shadow-rose-950/30"
                    role="alert"
                  >
                    <AlertCircle
                      className="mt-0.5 shrink-0 text-rose-300"
                      size={18}
                      aria-hidden="true"
                    />
                    <div>
                      <p className="font-semibold text-rose-200">
                        Não foi possível entrar
                      </p>
                      <p className="mt-0.5 leading-5 text-rose-100/80">
                        {formError}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-3.5 font-bold text-slate-950 transition hover:bg-emerald-200 focus:outline-none focus:ring-4 focus:ring-emerald-300/30 disabled:cursor-not-allowed disabled:bg-emerald-300/40"
                disabled={!canSubmit || loading}
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
                    Verificando acesso...
                  </>
                ) : (
                  <>
                    Entrar no Matchday
                    <ArrowRight size={18} aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 flex items-center gap-2 text-sm text-slate-500">
              <ShieldCheck
                size={16}
                className="text-emerald-400"
                aria-hidden="true"
              />
              Acesso exclusivo para usuários autorizados.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
