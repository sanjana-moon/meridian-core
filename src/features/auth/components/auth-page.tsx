"use client";

import Link from "next/link";
import { getSession, signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { getApiErrorMessage } from "@/lib/api-error";
import { useRegisterCustomerMutation } from "@/store/api/auth.api";
import {
  useDisableTwoFactorMutation,
  useGetTwoFactorStatusQuery,
  useSetupTwoFactorMutation,
  useVerifyTwoFactorMutation,
} from "@/store/api/two-factor.api";

type AuthMode = "login" | "register" | "two-factor";

const roleHome = {
  admin: "/admin/dashboard",
  staff: "/staff/dashboard",
  customer: "/customer/dashboard",
} as const;

const PASSWORD_MIN_LENGTH = 12;
const PIN_MIN_LENGTH = 4;
const PIN_MAX_LENGTH = 8;

export function AuthPage({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [registerCustomer, registerState] = useRegisterCustomerMutation();
  const [getSetup, setupState] = useSetupTwoFactorMutation();
  const [verify, verifyState] = useVerifyTwoFactorMutation();
  const [disable, disableState] = useDisableTwoFactorMutation();
  const twoFactorStatus = useGetTwoFactorStatusQuery(undefined, {
    skip: mode !== "two-factor" || sessionStatus !== "authenticated",
  });
  const [code, setCode] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [registered, setRegistered] = useState(false);

  // Register form validation state
  const [pin, setPin] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [pinError, setPinError] = useState("");

  const pending =
    registerState.isLoading ||
    setupState.isLoading ||
    verifyState.isLoading ||
    disableState.isLoading;

  // Live PIN checks (used for helper checklist + submit validation)
  const pinIsDigitsOnly = /^\d*$/.test(pin);
  const pinLengthOk =
    pin.length >= PIN_MIN_LENGTH && pin.length <= PIN_MAX_LENGTH;

  const passwordLengthOk = password.length >= PASSWORD_MIN_LENGTH;

  function validateRegisterForm() {
    let ok = true;

    if (!passwordLengthOk) {
      setPasswordError(
        `Password must be at least ${PASSWORD_MIN_LENGTH} characters (you entered ${password.length}).`,
      );
      ok = false;
    } else {
      setPasswordError("");
    }

    if (!pinIsDigitsOnly) {
      setPinError("Transaction PIN must contain only numbers (0–9).");
      ok = false;
    } else if (!pinLengthOk) {
      setPinError(
        `Transaction PIN must be ${PIN_MIN_LENGTH}–${PIN_MAX_LENGTH} digits (you entered ${pin.length}).`,
      );
      ok = false;
    } else {
      setPinError("");
    }

    return ok;
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);

    try {
      if (mode === "login") {
        const result = await signIn("credentials", {
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
          redirect: false,
        });
        if (result?.error) {
          throw new Error("Email or password is incorrect.");
        }
        const currentSession = await getSession();
        const role = currentSession?.user?.role;
        if (!role || !(role in roleHome)) {
          throw new Error("Your account does not have a valid workspace role.");
        }
        router.replace(roleHome[role as keyof typeof roleHome]);
        router.refresh();
        return;
      }

      // Register: run custom validation before hitting the API
      if (!validateRegisterForm()) {
        return;
      }

      await registerCustomer({
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
        transactionPin: String(form.get("transactionPin") ?? ""),
        accountType: String(form.get("accountType") ?? "savings") as
          | "savings"
          | "current"
          | "business",
      }).unwrap();
      setRegistered(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  }

  async function startSetup() {
    setError("");
    try {
      const result = await getSetup().unwrap();
      setQrCode(result.qrCode);
      setNotice(
        "Scan the QR code, then enter the six-digit code to enable 2FA.",
      );
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const result = await verify({ code }).unwrap();
      setRecoveryCodes(result.recoveryCodes);
      setCode("");
      setNotice(
        "Two-factor authentication is enabled. Save your recovery codes.",
      );
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  }

  async function disableTwoFactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await disable({ code }).unwrap();
      setCode("");
      setQrCode("");
      setRecoveryCodes([]);
      setNotice("Two-factor authentication is disabled.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  }

  if (mode === "two-factor") {
    if (sessionStatus === "loading") {
      return (
        <main className="auth-shell">
          <p role="status">Loading security settings…</p>
        </main>
      );
    }
    if (sessionStatus !== "authenticated") {
      return (
        <main className="auth-shell">
          <section className="auth-card">
            <h1 className="text-2xl font-semibold">Sign in required</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in before managing two-factor authentication.
            </p>
            <Link className="dashboard-button mt-5" href="/login">
              Sign in
            </Link>
          </section>
        </main>
      );
    }

    const enabled = twoFactorStatus.data?.enabled ?? false;
    const settingsHref =
      session.user.role === "admin"
        ? "/admin/settings"
        : session.user.role === "staff"
          ? "/staff/dashboard"
          : "/customer/settings";
    return (
      <main className="auth-shell">
        <section aria-labelledby="auth-title" className="auth-card">
          <Link
            className="mb-8 inline-flex font-semibold text-primary"
            href="/"
          >
            Meridian Core
          </Link>
          <h1 className="text-2xl font-semibold" id="auth-title">
            Two-factor authentication
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Protect sensitive account actions with an authenticator app.
          </p>
          {error ? (
            <p className="dashboard-notice mt-5" role="alert">
              {error}
            </p>
          ) : null}
          {twoFactorStatus.error ? (
            <p className="dashboard-notice mt-5" role="alert">
              {getApiErrorMessage(twoFactorStatus.error)}
            </p>
          ) : null}
          {notice ? (
            <p className="dashboard-notice mt-5" role="status">
              {notice}
            </p>
          ) : null}
          {recoveryCodes.length ? (
            <div className="mt-4 rounded-lg border border-border bg-muted p-4">
              <p className="font-medium">Recovery codes (shown once)</p>
              <ul className="mt-2 grid grid-cols-2 gap-2 font-mono text-sm">
                {recoveryCodes.map((recoveryCode) => (
                  <li key={recoveryCode}>{recoveryCode}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {twoFactorStatus.isLoading ? (
            <p className="mt-5 text-sm text-muted-foreground" role="status">
              Loading security status…
            </p>
          ) : enabled ? (
            <form className="mt-5 grid gap-4" onSubmit={disableTwoFactor}>
              <label className="dashboard-field">
                Authenticator code
                <input
                  autoComplete="one-time-code"
                  className="dashboard-input"
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(event) => setCode(event.target.value)}
                  pattern="[0-9]{6}"
                  required
                  value={code}
                />
              </label>
              <button
                className="dashboard-button"
                disabled={pending}
                type="submit"
              >
                Disable two-factor authentication
              </button>
            </form>
          ) : qrCode ? (
            <>
              {/* This QR code is generated for the authenticated user's TOTP secret. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Authenticator setup QR code"
                className="mx-auto mt-5 size-48"
                src={qrCode}
              />
              <form className="mt-5 grid gap-4" onSubmit={verifyCode}>
                <label className="dashboard-field">
                  Authenticator code
                  <input
                    autoComplete="one-time-code"
                    className="dashboard-input"
                    inputMode="numeric"
                    maxLength={6}
                    onChange={(event) => setCode(event.target.value)}
                    pattern="[0-9]{6}"
                    required
                    value={code}
                  />
                </label>
                <button
                  className="dashboard-button"
                  disabled={pending}
                  type="submit"
                >
                  Verify and enable
                </button>
              </form>
            </>
          ) : (
            <button
              className="dashboard-button mt-5"
              disabled={pending}
              onClick={startSetup}
              type="button"
            >
              Set up two-factor authentication
            </button>
          )}
          <Link
            className="mt-5 inline-flex text-sm font-medium text-primary hover:underline"
            href={settingsHref}
          >
            Back to settings
          </Link>
        </section>
      </main>
    );
  }

  const isRegister = mode === "register";
  return (
    <main className="auth-shell">
      <section aria-labelledby="auth-title" className="auth-card">
        <Link className="mb-8 inline-flex font-semibold text-primary" href="/">
          Meridian Core
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight" id="auth-title">
          {isRegister ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isRegister
            ? "Register to get started with Meridian Core."
            : "Sign in to your Meridian Core workspace."}
        </p>
        {registered ? (
          <p className="dashboard-notice mt-5" role="status">
            Account created. Sign in to continue.
          </p>
        ) : null}
        {error ? (
          <p className="dashboard-notice mt-5" role="alert">
            {error}
          </p>
        ) : null}
        {registered ? (
          <Link className="dashboard-button mt-6" href="/login">
            Continue to sign in
          </Link>
        ) : (
          <form className="mt-6 grid gap-4" onSubmit={submitAuth} noValidate>
            {isRegister ? (
              <label className="dashboard-field">
                Full name
                <input
                  autoComplete="name"
                  className="dashboard-input"
                  maxLength={100}
                  minLength={2}
                  name="name"
                  required
                />
              </label>
            ) : null}

            <label className="dashboard-field">
              Email address
              <input
                autoComplete="email"
                className="dashboard-input"
                maxLength={254}
                name="email"
                required
                type="email"
              />
            </label>

            <label className="dashboard-field">
              Password
              <input
                autoComplete={isRegister ? "new-password" : "current-password"}
                aria-describedby={
                  isRegister ? "password-help password-error" : undefined
                }
                aria-invalid={isRegister && !!passwordError}
                className="dashboard-input"
                maxLength={128}
                minLength={isRegister ? PASSWORD_MIN_LENGTH : 1}
                name="password"
                onChange={
                  isRegister
                    ? (event) => setPassword(event.target.value)
                    : undefined
                }
                required
                title={
                  isRegister
                    ? `At least ${PASSWORD_MIN_LENGTH} characters.`
                    : undefined
                }
                type="password"
                value={isRegister ? password : undefined}
              />
              {isRegister ? (
                <span
                  id="password-help"
                  className="text-xs text-success"
                >
                  Must be at least {PASSWORD_MIN_LENGTH} characters.
                </span>
              ) : null}
              {isRegister && passwordError ? (
                <span
                  id="password-error"
                  className="text-xs text-destructive"
                  role="alert"
                >
                  {passwordError}
                </span>
              ) : null}
            </label>

            {isRegister ? (
              <>
                <label className="dashboard-field">
                  Transaction PIN
                  <input
                    autoComplete="off"
                    aria-describedby="pin-help pin-error"
                    aria-invalid={!!pinError}
                    className="dashboard-input"
                    inputMode="numeric"
                    maxLength={PIN_MAX_LENGTH}
                    name="transactionPin"
                    onChange={(event) => setPin(event.target.value)}
                    required
                    type="password"
                    value={pin}
                  />
                  <span id="pin-help" className="text-xs text-success">
                    {PIN_MIN_LENGTH}–{PIN_MAX_LENGTH} digits, numbers only.
                  </span>
                  {pinError ? (
                    <span
                      id="pin-error"
                      className="text-xs text-destructive"
                      role="alert"
                    >
                      {pinError}
                    </span>
                  ) : null}
                </label>

                <label className="dashboard-field">
                  Account type
                  <select
                    className="dashboard-input"
                    defaultValue="savings"
                    name="accountType"
                  >
                    <option value="savings">Savings</option>
                    <option value="current">Current</option>
                    <option value="business">Business</option>
                  </select>
                </label>
              </>
            ) : null}

            <button
              className="dashboard-button mt-2"
              disabled={pending}
              type="submit"
            >
              {pending
                ? "Please wait…"
                : isRegister
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>
        )}
        <div className="mt-6 flex flex-col gap-3 text-sm">
          <Link
            className="font-medium text-primary hover:underline"
            href={isRegister ? "/login" : "/register"}
          >
            {isRegister ? "Already registered? Sign in" : "Create an account"}
          </Link>
          {!isRegister ? (
            <Link
              className="font-medium text-primary hover:underline"
              href="/two-factor"
            >
              Manage two-factor authentication
            </Link>
          ) : null}
        </div>
        {session?.user?.name ? (
          <span className="sr-only">Signed in as {session.user.name}</span>
        ) : null}
      </section>
    </main>
  );
}
