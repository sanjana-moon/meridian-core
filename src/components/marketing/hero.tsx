// src/components/marketing/hero.tsx
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

export function MarketingHero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 size-[600px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(197,164,109,0.18),_transparent_60%)] blur-2xl"
      />
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:px-8 lg:pt-32">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-medium text-gold">
              <ShieldCheck className="size-3.5" />
              Built for institutional trust
            </span>

            <h1 className="mt-6 font-display text-5xl leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              Banking, reimagined
              <br />
              <span className="text-teal">for the digital age.</span>
            </h1>

            <p className="mt-6 max-w-lg text-base text-muted-foreground">
              Meridian Core unifies secure transfers, instant loan workflows,
              and real-time analytics under a single trusted platform — the
              banking core your institution deserves.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-navy/90"
              >
                Open an account
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/#features"
                className="inline-flex h-11 items-center rounded-md border border-border px-6 text-sm font-medium text-foreground hover:bg-muted"
              >
                Explore features
              </Link>
            </div>

            <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-border pt-6">
              {/* your stats strip */}
            </dl>
          </div>

          {/* your premium card block */}
        </div>
      </div>
    </section>
  );
}