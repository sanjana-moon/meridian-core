export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">
        {eyebrow}
      </p>
      <h2 className="dashboard-heading-title mt-2">{title}</h2>
      <p className="dashboard-heading-copy max-w-2xl">{description}</p>
    </div>
  );
}
