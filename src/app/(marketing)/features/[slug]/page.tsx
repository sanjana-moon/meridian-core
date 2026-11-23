import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FeatureCard } from "@/components/marketing/feature-card";
import { MarketingHero } from "@/components/marketing/hero";
import { SectionHeading } from "@/components/marketing/section-heading";
// import { features } from "@/lib/config/features";

type FeaturePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return features.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: FeaturePageProps): Promise<Metadata> {
  const { slug } = await params;
  const feature = features.find((item) => item.slug === slug);

  if (!feature) {
    return {};
  }

  return {
    title: feature.title,
    description: feature.summary,
  };
}

export default async function FeaturePage({ params }: FeaturePageProps) {
  const { slug } = await params;
  const feature = features.find((item) => item.slug === slug);

  if (!feature) {
    notFound();
  }

  const relatedFeatures = features
    .filter((item) => item.slug !== feature.slug)
    .slice(0, 3);

  return (
    <div className="dashboard-content">
      <MarketingHero
        actionHref="/register"
        actionLabel="Get started"
        description={feature.description}
        eyebrow="Meridian Core features"
        icon={feature.icon}
        title={feature.title}
      />

      <section aria-label="Feature details">
        <SectionHeading
          description={feature.details}
          eyebrow="Designed for clarity"
          title="Built around the way you bank"
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
