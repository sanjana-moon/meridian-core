import Link from "next/link";

type AuthMode = "login" | "register" | "two-factor";

const authContent: Record<
  AuthMode,
  { title: string; description: string; submitLabel: string; fields: string[] }
> = {
  login: {
    title: "Welcome back",
    description: "Sign in to your Meridian Core workspace.",
    submitLabel: "Sign in",
    fields: ["Email address", "Password"],
  },
  register: {
    title: "Create your account",
    description: "Register to get started with Meridian Core.",
    submitLabel: "Create account",
    fields: ["Full name", "Email address", "Password"],
  },
  "two-factor": {
    title: "Two-factor verification",
    description: "Enter the verification code from your authenticator.",
    submitLabel: "Verify code",
    fields: ["Verification code"],
  },
};

const authLinks: Record<AuthMode, { label: string; href: string }[]> = {
  login: [{ label: "Create an account", href: "/register" }],
  register: [{ label: "Already registered? Sign in", href: "/login" }],
  "two-factor": [{ label: "Return to sign in", href: "/login" }],
};

export function AuthPage({ mode }: { mode: AuthMode }) {
  const content = authContent[mode];

  return (
    <main className="auth-shell">
      <section aria-labelledby="auth-title" className="auth-card">
        <Link className="mb-8 inline-flex font-semibold text-primary" href="/">
          Meridian Core
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight" id="auth-title">
          {content.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {content.description}
        </p>

        {/* TODO(API): Connect Auth.js and validate credentials, sessions, and MFA on the server. */}
        <form className="mt-6 grid gap-4">
          {content.fields.map((field) => {
            const isPassword = field === "Password";
            const isEmail = field === "Email address";

            return (
              <label className="dashboard-field" key={field}>
                {field}
                <input
                  autoComplete={
                    isPassword
                      ? mode === "register"
                        ? "new-password"
                        : "current-password"
                      : isEmail
                        ? "email"
                        : "one-time-code"
                  }
                  className="dashboard-input"
                  disabled
                  inputMode={mode === "two-factor" ? "numeric" : undefined}
                  placeholder="Authentication API not connected"
                  type={isPassword ? "password" : isEmail ? "email" : "text"}
                />
              </label>
            );
          })}
          <button className="dashboard-button mt-2" disabled type="button">
            {content.submitLabel}
          </button>
        </form>

        <p className="dashboard-notice mt-5">
          Authentication is not connected. These controls are preview-only.
        </p>
        <div className="mt-6 flex flex-col gap-3 text-sm">
          {authLinks[mode].map(({ href, label }) => (
            <Link className="font-medium text-primary hover:underline" href={href} key={href}>
              {label}
            </Link>
          ))}
          {mode === "login" ? (
            <Link
              className="font-medium text-primary hover:underline"
              href="/two-factor"
            >
              Continue to two-factor verification
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  );
}
