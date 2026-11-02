import type { SubmitEvent } from "react";
import type { User } from "../../types";
import React, { useState } from "react";
import * as I from "../../icons";
import { Brand, RequiredMark } from "../../components/ui";
import { login } from "../../services/autenticacionServicio";

// Complete, static class names let Tailwind detect every state at build time.
const inputClasses =
  "tw:min-h-[52px] tw:min-[901px]:min-h-[62px] tw:min-w-0 tw:flex-1 tw:border-0 tw:rounded-none tw:bg-transparent tw:px-0 tw:py-[14px] tw:text-[14px] tw:text-[#304b65] tw:outline-none tw:placeholder:text-[#8191a8] tw:focus-visible:outline-none tw:min-[901px]:text-[17px]";
const fieldClasses =
  "tw:min-h-[54px] tw:min-[901px]:min-h-16 tw:flex tw:min-w-0 tw:items-center tw:gap-[13px] tw:rounded-[8px] tw:border tw:border-solid tw:border-nexa-border tw:bg-white tw:px-[15px] tw:text-[#70869e] tw:focus-within:outline-3 tw:focus-within:outline-solid tw:focus-within:outline-[#c9e9ff] tw:focus-within:border-[#6db7ed] tw:min-[901px]:gap-5 tw:min-[901px]:px-[23px]";

export function Login({
  onLogin,
  initialError = "",
}: {
  onLogin: (user: User) => void;
  initialError?: string;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const user = await login(username, password, remember);
      onLogin(user);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo iniciar sesión.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-v2 tw:grid tw:min-h-dvh tw:grid-cols-[minmax(0,1fr)] tw:bg-nexa-surface tw:text-nexa-petroleum tw:min-[651px]:grid-cols-[27.2%_minmax(0,1fr)]">
      <aside className="tw:flex tw:min-w-0 tw:flex-col tw:bg-nexa-surface tw:px-[25px] tw:pt-[25px] tw:pb-2 tw:[&>.image-brand]:p-0 tw:[&>.image-brand]:w-full tw:[&>.image-brand]:justify-center tw:[&_.logo-window]:mx-auto tw:[&_.logo-window]:w-[260px] tw:[&_.logo-window]:h-auto tw:[&_.logo-window]:aspect-[180/48] tw:[&_.logo-window]:max-w-full tw:min-[651px]:max-[900px]:[&_.logo-window]:w-[160px]  tw:min-[651px]:bg-nexa-petroleum tw:min-[651px]:px-[23px] tw:min-[651px]:py-[35px] tw:min-[901px]:px-8 tw:min-[901px]:py-[42px] tw:min-[1251px]:px-[52px] tw:min-[1251px]:pt-[54px] tw:min-[1251px]:pb-14 tw:min-[1700px]:p-[60px]">
        <Brand />
        <div className="tw:my-auto tw:hidden tw:py-[50px] tw:text-[clamp(26px,2.64vw,43px)] tw:leading-[1.18] tw:font-normal tw:tracking-[-1.1px] tw:whitespace-nowrap tw:text-white tw:min-[651px]:block">
          El control de
          <br />
          tu negocio
          <br />
          <span className="tw:text-nexa-cyan">empieza acá.</span>
        </div>
      </aside>

      <section className="tw:relative tw:flex tw:min-h-[calc(100dvh-77px)] tw:min-w-0 tw:flex-col tw:items-center tw:justify-center tw:px-[26px] tw:pt-[30px] tw:pb-6 tw:min-[651px]:min-h-dvh tw:min-[651px]:px-[35px] tw:min-[651px]:py-[70px] tw:min-[901px]:px-[55px] tw:min-[901px]:py-20 tw:min-[1251px]:px-[72px] tw:min-[1251px]:py-[90px]">
        <div className="tw:my-auto tw:w-full tw:max-w-[420px] tw:min-[651px]:my-0 tw:min-[651px]:max-w-[620px] tw:min-[651px]:py-5 tw:min-[901px]:translate-y-4">
          <h1 className="tw:text-[clamp(30px,3.62vw,52px)] tw:leading-[1.2] tw:font-bold tw:tracking-[-1.9px] tw:text-nexa-heading tw:min-[651px]:whitespace-nowrap">
            Bienvenido a NEXA.
          </h1>
          <p className="tw:mt-[9px] tw:mb-[33px] tw:text-[17px] tw:leading-[1.5] tw:text-nexa-muted tw:min-[651px]:mb-[39px] tw:min-[651px]:text-[clamp(18px,1.81vw,26px)] tw:min-[1251px]:mb-[46px]">
            Ingresá con tu cuenta.
          </p>

          <form onSubmit={handleSubmit} className="tw:grid tw:gap-6 tw:min-[901px]:gap-8">
            <label className="tw:flex tw:min-w-0 tw:flex-col tw:gap-[11px]">
              <span className="tw:text-[13px] tw:font-semibold tw:text-nexa-label tw:min-[901px]:text-base">
                Usuario <RequiredMark />
              </span>
              <span className={fieldClasses}>
                <I.Users size={23} aria-hidden="true" />
                <input
                  className={inputClasses}
                  type="text"
                  required
                  maxLength={100}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="Tu usuario"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </span>
            </label>
            <label className="tw:flex tw:min-w-0 tw:flex-col tw:gap-[11px]">
              <span className="tw:text-[13px] tw:font-semibold tw:text-nexa-label tw:min-[901px]:text-base">
                Contraseña <RequiredMark />
              </span>
              <span className={fieldClasses}>
                <I.Lock size={23} aria-hidden="true" />
                <input
                  className={inputClasses}
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  className="tw:-mr-[7px] tw:inline-flex tw:size-[33px] tw:shrink-0 tw:items-center tw:justify-center tw:rounded-md tw:border-0 tw:bg-transparent tw:p-0 tw:text-[#768ba0] tw:hover:bg-blue-50 tw:focus-visible:outline-3 tw:focus-visible:outline-offset-3 tw:focus-visible:outline-blue-300"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <I.Eye size={19} />
                </button>
              </span>
            </label>
            <label className="tw:-mt-1 tw:flex tw:items-center tw:gap-[13px] tw:text-xs tw:text-[#71869e] tw:min-[901px]:text-sm">
              <input
                className="tw:m-0 tw:size-[19px] tw:min-h-[19px] tw:appearance-auto tw:accent-nexa-blue tw:min-[901px]:size-[22px] tw:min-[901px]:min-h-[22px]"
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              Recordar mi sesión
            </label>
            {(error || initialError) && (
              <div
                className="tw:rounded-[7px] tw:border tw:border-solid tw:border-[#ffd4d9] tw:bg-[#fff0f1] tw:p-3 tw:text-[13px] tw:text-[#bd3649]"
                role="alert"
              >
                {error || initialError}
              </div>
            )}
            <button
              className="tw:relative tw:mt-[2px] tw:flex tw:h-[55px] tw:w-full tw:items-center tw:justify-center tw:rounded-[8px] tw:border-0 tw:bg-nexa-blue tw:px-[22px] tw:py-0 tw:text-[15px] tw:font-semibold tw:text-white tw:hover:bg-nexa-blue-hover tw:focus-visible:outline-3 tw:focus-visible:outline-offset-3 tw:focus-visible:outline-blue-300 tw:disabled:cursor-wait tw:disabled:opacity-70 tw:min-[901px]:h-[62px] tw:min-[901px]:text-lg"
              type="submit"
              disabled={busy}
            >
              <span>{busy ? "Ingresando…" : "Ingresar al sistema"}</span>
              <I.ArrowRight size={23} className="tw:absolute tw:right-[23px]" />
            </button>
          </form>
        </div>
        <p className="tw:mt-[38px] tw:self-start tw:text-[11px] tw:text-[#8395ac] tw:min-[651px]:absolute tw:min-[651px]:bottom-[30px] tw:min-[651px]:left-[35px] tw:min-[651px]:mt-0 tw:min-[901px]:left-[55px] tw:min-[1251px]:bottom-12 tw:min-[1251px]:left-[72px] tw:min-[1251px]:text-[13px]">
          © 2026 NEXA.
        </p>
      </section>
    </div>
  );
}
