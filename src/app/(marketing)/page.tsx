import { MarketingHero } from "@/components/marketing/hero";
import { SectionHeading } from "@/components/marketing/section-heading";
import { FeatureCard } from "@/components/marketing/feature-card";
import { marketingFeatures } from "@/lib/config/features";

export default function MarketingHomePage() {
  return (
    <>
      <MarketingHero />

      <section
        id="features"
        className="border-t border-border bg-background"
      >
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Platform capabilities"
            title="Everything your institution needs"
            description="Six core facilities, engineered for security and scale — each one a fully realized workflow, not a placeholder."
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {marketingFeatures.map((feature) => (
              <FeatureCard key={feature.slug} feature={feature} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Built for trust"
            title="Security is not a feature — it's the foundation"
            description="Every workflow in Meridian Core is designed around server-side validation, atomic transactions, and role-based access control."
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                stat: "AES-256",
                label: "Encryption at rest",
                note: "Sensitive secrets encrypted before storage",
              },
              {
                stat: "Atomic",
                label: "Dual-ledger transfers",
                note: "Debit and credit commit together or not at all",
              },
              {
                stat: "RBAC",
                label: "Role-based access",
                note: "Every API call verified server-side",
              },
              {
                stat: "2FA",
                label: "TOTP security",
                note: "Optional two-factor on sensitive actions",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-border bg-card p-6"
              >
                <p className="font-mono text-2xl font-semibold tabular text-primary">
                  {item.stat}
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {item.label}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="rounded-2xl gradient-premium p-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-gold">
              Get started today
            </p>
            <h2 className="mt-3 font-display text-4xl tracking-tight text-white">
              Ready to modernize your banking?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/70">
              Open an account in minutes. No credit card required. All
              transactions are simulated for demonstration purposes.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/register"
                className="inline-flex h-11 items-center rounded-md bg-white px-6 text-sm font-medium text-primary transition-colors hover:bg-white/90"
              >
                Open an account
              </a>
              <a
                href="/login"
                className="inline-flex h-11 items-center rounded-md border border-white/30 px-6 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                Sign in
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}