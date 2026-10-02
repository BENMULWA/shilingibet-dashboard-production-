import { useState } from "react";

import { useLogin } from "../../hooks/useLogin";
import { LoaderIcon } from "react-hot-toast";

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

  async function handleSubmit() {
    if (challenge?.verificationRequired) {
      if (!/^\d{6}$/.test(verificationCode)) return;
      verifyCodeFn({ challengeId: challenge.challengeId, code: verificationCode });
      return;
    }
    if (!phone.trim() || !password) return;

    const data = { phone, password };

    logInFn(data);
  }

  return (
    <div
      className="min-h-screen flex"
      style={{
        backgroundImage: "url('/bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Left Message Section */}
      <div className="hidden md:flex w-1/2 items-center justify-center text-white px-12">
        <div>
          <img src="/shilingibet.png" className="h-32" />
          <p className="mt-4 text-lg text-white max-w-md backdrop-blur-sm bg-black/5 p-4 rounded-md">
            Step into the future of iGaming — where every bet is smarter, every
            win is bigger, and the experience is crafted for champions. This is
            more than a platform — it’s where passion, precision, and technology
            come together to elevate your game.
          </p>
        </div>
      </div>

      {/* Right Login Form Section */}
      <div className="flex w-full md:w-1/2 items-center justify-center bg-opacity-95 p-6 sm:p-12">
        <div className="w-full max-w-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
            className="relative max-w-md mx-auto mt-8 md:mt-16"
          >
            {" "}
            <div className="overflow-hidden bg-white dark:bg-slate-800 rounded-md shadow-md pt-10">
              <h2 className="text-3xl font-bold text-gray-800 text-center mb-1">
                {challenge?.verificationRequired ? "Check your phone" : "Welcome Back!"}
              </h2>
              <p className="text-center text-gray-500 mb-6">
                {challenge?.verificationRequired
                  ? `Enter the 6-digit code sent to ${challenge.maskedPhone}`
                  : "Login to your account"}
              </p>
              <div className="px-4 py-6 sm:px-8 sm:py-7">
                <div>
                  <div className="space-y-5">
                    {challenge?.verificationRequired ? (
                      <>
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="5" width="18" height="14" rx="2" />
                            <path d="m3 7 9 6 9-6" />
                          </svg>
                        </div>
                        <div>
                          <label htmlFor="staff-code" className="text-base font-medium text-gray-900">
                            Verification code
                          </label>
                          <input
                            id="staff-code"
                            value={verificationCode}
                            onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            autoFocus
                            placeholder="000000"
                            className="mt-2.5 block w-full rounded-md border border-gray-200 bg-white dark:bg-slate-800 px-4 py-4 text-center text-2xl font-semibold tracking-[0.55em] text-black placeholder-gray-400 focus:border-blue-600 focus:outline-none"
                          />
                          <p className="mt-2 text-center text-xs text-gray-400">
                            Code expires in {Math.round((challenge.expiresInSeconds || 600) / 60)} minutes. Five attempts allowed.
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                    <div>
                      <label
                        for=""
                        className="text-base font-medium text-gray-900"
                      >
                        {" "}
                        Phone Number
                      </label>
                      <div className="mt-2.5 relative text-gray-400 focus-within:text-gray-600">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <svg
                            className="w-5 h-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                            />
                          </svg>
                        </div>

                        <input
                          onChange={(e) => setPhone(e.target.value)}
                          type="phone"
                          name=""
                          id=""
                          placeholder="Enter phone number to get started"
                          className="block w-full py-4 pl-10 pr-4 text-black placeholder-gray-500 transition-all duration-200 bg-white dark:bg-slate-800 border border-gray-200 rounded-md focus:outline-none focus:border-blue-600 caret-blue-600"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <label
                          for=""
                          className="text-base font-medium text-gray-900"
                        >
                          {" "}
                          Password{" "}
                        </label>
                      </div>
                      <div className="mt-2.5 relative text-gray-400 focus-within:text-gray-600">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <svg
                            className="w-5 h-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                            />
                          </svg>
                        </div>

                        <input
                          onChange={(e) => setPassword(e.target.value)}
                          type={showPassword ? "text" : "password"}
                          name=""
                          id=""
                          placeholder="Enter your password"
                          className="block w-full py-4 pl-10 pr-12 text-black placeholder-gray-500 transition-all duration-200 bg-white dark:bg-slate-800 border border-gray-200 rounded-md focus:outline-none focus:border-blue-600 caret-blue-600"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((visible) => !visible)}
                          className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 hover:text-gray-700 focus:outline-none focus:text-gray-700"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          aria-pressed={showPassword}
                        >
                          {showPassword ? (
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 4.2A10.7 10.7 0 0112 4c5.5 0 9 5 9 8a12.7 12.7 0 01-2.1 3.5M6.6 6.6C4.4 8 3 10.2 3 12c0 3 3.5 8 9 8 1.5 0 2.8-.4 4-.9" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12S6 5 12 5s9.5 7 9.5 7S18 19 12 19s-9.5-7-9.5-7z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                      </>
                    )}

                    <div>
                      <button
                        type="submit"
                        style={{
                          backgroundColor: "#f9ce36",
                          marginTop: "12px",
                        }}
                        className="inline-flex bg-[#f9ce36] items-center outline-none justify-center w-full px-4 py-4 text-base font-semibold text-black transition-all duration-200  border border-transparent rounded-md focus:outline-none hover:bg-blue-700 focus:bg-blue-700"
                      >
                        {isLoading || isVerifying
                          ? <LoaderIcon />
                          : challenge?.verificationRequired ? "Verify and sign in" : "Log in"}
                      </button>
                    </div>
                    {challenge?.verificationRequired && (
                      <div className="space-y-3 text-center">
                        <button
                          type="button"
                          disabled={isResending}
                          onClick={() => resendCodeFn(challenge.challengeId)}
                          className="text-sm font-medium text-amber-700 disabled:opacity-50"
                        >
                          {isResending ? "Sending…" : "Resend code"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            resetLogin();
                            setVerificationCode("");
                            setPassword("");
                          }}
                          className="block w-full rounded-md bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          Use a different account
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
export default Login;
