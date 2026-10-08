import { useState } from "react";
import { LoaderIcon } from "react-hot-toast";
import {
  FiActivity,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiPhone,
  FiShield,
  FiUsers,
} from "react-icons/fi";

import { useLogin } from "../../hooks/useLogin";

const HIGHLIGHTS = [
  { icon: FiActivity, label: "Live deposits, bets and payouts" },
  { icon: FiUsers, label: "Player accounts and support" },
  { icon: FiShield, label: "Every staff action is audited" },
];

const inputClass =
  "block w-full rounded-xl border border-white/10 bg-white/[0.06] py-3.5 pl-11 pr-4 text-[15px] text-white placeholder-white/35 outline-none transition focus:border-brand focus:bg-white/[0.09] focus:ring-2 focus:ring-brand/30";

function Login() {
  const {
    logInFn,
    verifyCodeFn,
    resendCodeFn,
    resetLogin,
    challenge,
    isLoading,
    isVerifying,
    isResending,
  } = useLogin();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  const sessionExpired =
    new URLSearchParams(window.location.search).get("reason") === "expired";
  const isCodeStep = Boolean(challenge?.verificationRequired);
  const isBusy = isLoading || isVerifying;
  const canSubmit = isCodeStep
    ? /^\d{6}$/.test(verificationCode)
    : phone.trim().length >= 9 && password.length > 0;

  function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit || isBusy) return;

    if (isCodeStep) {
      verifyCodeFn({ challengeId: challenge.challengeId, code: verificationCode });
      return;
    }
    logInFn({ phone: phone.trim(), password });
  }

  function startOver() {
    resetLogin();
    setVerificationCode("");
    setPassword("");
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#050a07] font-sans text-white">
      {/* Stadium backdrop: the brand artwork, darkened so the form stays readable */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center opacity-35"
        style={{ backgroundImage: "url('/bg.png')" }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,200,83,0.22),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(249,206,54,0.16),transparent_50%),linear-gradient(180deg,rgba(5,10,7,0.55),rgba(5,10,7,0.92))]"
      />

      <div className="relative mx-auto grid min-h-dvh w-full max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        {/* Brand panel */}
        <section className="hidden lg:block">
          <img src="/shilingibet.png" alt="ShilingiBet" className="h-14 w-auto" />
          <h1 className="mt-8 font-display text-4xl font-extrabold leading-tight tracking-tight text-white xl:text-5xl">
            Back Office
            <span className="block text-brand">Control Room</span>
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/70">
            Monitor the platform in real time, look after players and keep every
            shilling accounted for.
          </p>
          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item.label} className="flex items-center gap-3 text-sm text-white/80">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand/30 bg-brand/10 text-brand">
                  <item.icon size={17} aria-hidden="true" />
                </span>
                {item.label}
              </li>
            ))}
          </ul>
        </section>

        {/* Form card */}
        <section className="mx-auto w-full max-w-md">
          <img src="/shilingibet.png" alt="ShilingiBet" className="mx-auto mb-8 h-11 w-auto lg:hidden" />

          <div className="rounded-2xl border border-white/10 bg-[#0d1712]/90 p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-8">
            <div className="mb-7">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-pitch/30 bg-pitch/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-pitch">
                <FiLock size={11} aria-hidden="true" /> Staff only
              </span>
              <h2 className="mt-4 text-2xl font-bold text-white">
                {isCodeStep ? "Check your phone" : "Sign in"}
              </h2>
              <p className="mt-1.5 text-sm text-white/60">
                {isCodeStep
                  ? `We sent a 6-digit code to ${challenge.maskedPhone}.`
                  : "Use the phone number and password on your staff account."}
              </p>
            </div>

            {sessionExpired && !isCodeStep && (
              <p role="status" className="mb-5 rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm text-brand">
                Your session ended for security. Please sign in again.
              </p>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {isCodeStep ? (
                <div>
                  <label htmlFor="staff-code" className="mb-2 block text-sm font-medium text-white/85">
                    Verification code
                  </label>
                  <div className="relative">
                    <FiMail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} aria-hidden="true" />
                    <input
                      id="staff-code"
                      value={verificationCode}
                      onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      autoFocus
                      placeholder="000000"
                      aria-describedby="staff-code-help"
                      className={`${inputClass} text-center text-2xl font-semibold tracking-[0.5em] tabular`}
                    />
                  </div>
                  <p id="staff-code-help" className="mt-2 text-xs text-white/45">
                    Expires in {Math.round((challenge.expiresInSeconds || 600) / 60)} minutes · 5 attempts allowed
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="staff-phone" className="mb-2 block text-sm font-medium text-white/85">
                      Phone number
                    </label>
                    <div className="relative">
                      <FiPhone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} aria-hidden="true" />
                      <input
                        id="staff-phone"
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="username"
                        autoFocus
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder="07XX XXX XXX"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="staff-password" className="mb-2 block text-sm font-medium text-white/85">
                      Password
                    </label>
                    <div className="relative">
                      <FiLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} aria-hidden="true" />
                      <input
                        id="staff-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Enter your password"
                        className={`${inputClass} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((visible) => !visible)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        aria-pressed={showPassword}
                        className="absolute inset-y-0 right-0 flex items-center px-4 text-white/45 transition hover:text-white"
                      >
                        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={!canSubmit || isBusy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3.5 text-[15px] font-bold text-black shadow-[0_10px_30px_-8px_rgba(249,206,54,0.6)] transition hover:bg-brand-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                {isBusy ? <LoaderIcon /> : isCodeStep ? "Verify and sign in" : "Continue"}
              </button>

              {isCodeStep ? (
                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    disabled={isResending}
                    onClick={() => resendCodeFn(challenge.challengeId)}
                    className="font-medium text-brand hover:underline disabled:opacity-50"
                  >
                    {isResending ? "Sending…" : "Resend code"}
                  </button>
                  <button type="button" onClick={startOver} className="text-white/60 hover:text-white">
                    Use a different account
                  </button>
                </div>
              ) : (
                <p className="text-center text-xs text-white/45">
                  Forgot your password? Ask a super admin to send you a reset link.
                </p>
              )}
            </form>
          </div>

          <p className="mt-6 text-center text-[11px] text-white/35">
            Authorised ShilingiBet staff only. Sign-ins and actions are recorded.
          </p>
        </section>
      </div>
    </div>
  );
}

export default Login;
