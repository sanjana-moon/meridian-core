import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FeatureCard } from "@/components/marketing/feature-card";
import { SectionHeading } from "@/components/marketing/section-heading";
import {
  getFeatureBySlug,
  marketingFeatures,
} from "@/lib/config/features";

type FeaturePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return marketingFeatures.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: FeaturePageProps): Promise<Metadata> {
  const { slug } = await params;
  const feature = getFeatureBySlug(slug);

  if (!feature) {
    return {};
  }

  return {
    title: feature.title,
    description: feature.shortDescription,
  };
}

export default async function FeaturePage({ params }: FeaturePageProps) {
  const { slug } = await params;
  const feature = getFeatureBySlug(slug);

  if (!feature) {
    notFound();
  }

  const relatedFeatures = marketingFeatures
    .filter((item) => item.slug !== feature.slug)
    .slice(0, 3);
  const Icon = feature.icon;

  return (
    <div className="dashboard-content">
      <section className="dashboard-panel gradient-premium overflow-hidden">
        <div className="dashboard-panel-body grid gap-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-8">
          <div>
            <span className="dashboard-badge badge-success">
              Meridian Core feature
            </span>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              {feature.title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
              {feature.longDescription}
            </p>
            <a className="dashboard-button mt-6" href="/register">
              Get started
            </a>
          </div>
          <span className="dashboard-brand-mark hidden size-20 sm:flex">
            <Icon aria-hidden="true" size={34} />
          </span>
        </div>
      </section>

      <section aria-label="Feature details">
        <SectionHeading
          description={feature.shortDescription}
          eyebrow="Designed for clarity"
          title="What's included"
        />
        <ul className="dashboard-metrics mt-6">
          {feature.highlights.map((highlight) => (
            <li className="dashboard-panel dashboard-panel-body" key={highlight}>
              <span className="dashboard-badge badge-success">Included</span>
              <p className="mt-3 font-medium">{highlight}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Related features">
        <SectionHeading
          description="Explore more of the tools available in Meridian Core."
          eyebrow="Explore more"
          title="More banking features"
        />
        <div className="dashboard-chart-grid mt-6">
          {relatedFeatures.map((item) => (
            <FeatureCard feature={item} key={item.slug} />
          ))}
        </div>
      </section>
    </div>
  );
}
