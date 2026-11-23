import { marketingFeatures } from "@/lib/config/features";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link className="font-semibold tracking-tight" href="/">
            Meridian Core
          </Link>
          <nav aria-label="Feature navigation" className="flex flex-wrap gap-x-5 gap-y-2">
            {marketingFeatures.map((feature) => (
              <Link
                className="text-sm text-muted-foreground hover:text-foreground"
                href={`/features/${feature.slug}`}
                key={feature.slug}
              >
                {feature.title}
              </Link>
            ))}
          </nav>
        </div>
        <p className="text-xs text-muted-foreground">
          Banking tools for clear, controlled financial operations.
        </p>
      </div>
    </footer>
  );
}
