"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
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
import {
  TurnstileWidget,
  TurnstileWidgetHandle,
} from "../../components/auth/turnstile-widget";
import { LoginPitch } from "../../components/auth/login-pitch";

const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const emailId = useId();
  const passwordId = useId();
  const router = useRouter();
  const { user } = useAuth();
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
    (process.env.NODE_ENV !== "production" ? TURNSTILE_TEST_SITE_KEY : "");

  const validEmail = useMemo(() => /.+@.+\..+/.test(email.trim()), [email]);
  const emailError = email.trim() && !validEmail ? "Use um e-mail válido, como nome@time.com." : "";
  const passwordError =
    password.length > 0 && password.trim().length < 8
      ? "A senha deve ter pelo menos 8 caracteres."
      : "";
  const canSubmit =
    validEmail &&
    password.trim().length >= 8 &&
    Boolean(turnstileSiteKey) &&
    turnstileReady;

  const handleTurnstileError = useCallback(() => {
    setLoading(false);
    setFormError("Não foi possível carregar a verificação de segurança. Atualize a página e tente novamente.");
  }, []);

  const handleTurnstileExpired = useCallback(() => {
    setLoading(false);
    setFormError("A verificação de segurança expirou. Clique em Entrar para tentar novamente.");
  }, []);

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  const completeLogin = useCallback(async (turnstileToken: string) => {
    try {
      await login(email.trim(), password, turnstileToken);
      router.replace("/dashboard");
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Não foi possível validar suas credenciais.",
      );
      setFormError(message);
      setTurnstileResetKey((value) => value + 1);
    } finally {
      setLoading(false);
    }
  }, [email, password, router]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validEmail) {
      setFormError("Informe um e-mail válido para continuar.");
      return;
    }

    if (password.trim().length < 8) {
      setFormError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (!turnstileRef.current?.execute()) {
      setFormError("A verificação de segurança ainda está carregando. Tente novamente em instantes.");
      return;
    }

    setFormError("");
    setLoading(true);
  };

  if (user) return null;

  return (
    <main className="login-page relative isolate min-h-screen overflow-hidden bg-[#020817] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(16,185,129,0.2),transparent_26%),radial-gradient(circle_at_88%_80%,rgba(59,130,246,0.14),transparent_30%)]" />
      <div className="login-grid pointer-events-none absolute inset-0 opacity-40" />

      <section className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.12fr_0.88fr]">
        <LoginPitch />

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

                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-200">
                    Verificação de segurança
                  </p>
                  {turnstileSiteKey ? (
                    <TurnstileWidget
                      ref={turnstileRef}
                      siteKey={turnstileSiteKey}
                      resetKey={turnstileResetKey}
                      onSuccess={(token) => void completeLogin(token)}
                      onExpired={handleTurnstileExpired}
                      onError={handleTurnstileError}
                      onReady={() => setTurnstileReady(true)}
                    />
                  ) : (
                    <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                      A verificação de segurança não está configurada.
                    </div>
                  )}
                  <p className="mt-2 text-xs text-slate-500">
                    {turnstileReady
                      ? "A verificação será feita ao entrar para proteger o acesso contra tentativas automatizadas."
                      : "Preparando a verificação de segurança..."}
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
