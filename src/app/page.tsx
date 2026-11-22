import Link from "next/link";
import { ArrowRight, Landmark, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <header className="dashboard-topbar">
        <Link className="dashboard-brand mb-0 text-foreground" href="/">
          <span className="dashboard-brand-mark">
            <Landmark aria-hidden="true" size={21} />
          </span>
          Meridian Core
        </Link>
        <Link className="dashboard-button-secondary" href="/login">
          Sign in
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </header>

      <section className="mx-auto grid min-h-[70vh] max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2">
        <div className="max-w-2xl">
          <span className="dashboard-badge badge-success">
            <ShieldCheck aria-hidden="true" className="mr-1.5" size={14} />
            Built for clear, controlled banking
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-6xl">
            Banking operations, brought into focus.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
            Meridian Core brings customer accounts, transaction review, and
            lending workflows together in one workspace.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="dashboard-button" href="/login">
              Access your workspace
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
        </div>

        <div className="dashboard-panel p-6 sm:p-8">
          <p className="text-sm font-medium text-muted-foreground">
            One platform, clear oversight
          </p>
          <div className="mt-5 grid gap-4">
            {[
              ["Accounts", "Manage account details and status."],
              ["Transactions", "Review activity and payment requests."],
              ["Lending", "Track applications and repayment progress."],
            ].map(([title, description]) => (
              <div
                className="flex items-start gap-4 rounded-xl border border-border bg-background p-4"
                key={title}
              >
                <span className="dashboard-brand-mark">
                  <ShieldCheck aria-hidden="true" size={18} />
                </span>
                <div>
                  <h2 className="font-semibold">{title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="dashboard-notice mt-5">
            Preview only: authentication and banking APIs are not connected.
          </p>
        </div>
      </section>
    </main>
  );
}
