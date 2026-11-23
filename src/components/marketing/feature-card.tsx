import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Feature } from "@/lib/config/features";

export function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;

  return (
    <Link
      className="dashboard-panel group transition-colors hover:border-primary"
      href={`/features/${feature.slug}`}
    >
      <div className="dashboard-panel-body">
        <span className="dashboard-brand-mark">
          <Icon aria-hidden="true" size={20} />
        </span>
        <h2 className="dashboard-panel-title mt-4">{feature.title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {feature.summary}
        </p>
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
          Learn more
          <ArrowRight
            aria-hidden="true"
            className="transition-transform group-hover:translate-x-1"
            size={16}
          />
        </span>
      </div>
    </Link>
  );
}
